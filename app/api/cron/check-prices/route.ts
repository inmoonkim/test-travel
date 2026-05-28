import { NextRequest, NextResponse } from "next/server";
import { getActiveAlerts, recordNotification } from "@/services/alerts";
import { fetchFlightDayPrices } from "@/services/search";
import { fetchHotelDayPrices } from "@/services/hotels";
import { sendPriceDropAlert } from "@/services/email";
import type { PriceAlert } from "@/types/alert";

function authorised(request: NextRequest): boolean {
  const authHeader = request.headers.get("authorization");
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  return authHeader === `Bearer ${secret}`;
}

async function checkAlert(alert: PriceAlert): Promise<number> {
  const params = {
    origin: alert.origin,
    destination: alert.destination,
    departFrom: alert.depart_from,
    departTo: alert.depart_to,
    returnFrom: alert.return_from,
    returnTo: alert.return_to,
    adults: alert.adults,
    children: alert.children,
  };

  const [flights, hotels] = await Promise.all([
    fetchFlightDayPrices(params),
    fetchHotelDayPrices(params),
  ]);

  let sent = 0;

  // Check flight price
  if (alert.flight_target_price != null) {
    for (const [date, offers] of Object.entries(flights)) {
      const min = offers.reduce<number | null>(
        (acc, o) => (acc === null || o.price < acc ? o.price : acc),
        null
      );
      if (min !== null && min <= alert.flight_target_price) {
        const best = offers.find((o) => o.price === min)!;
        await sendPriceDropAlert(alert, {
          type: "flight",
          currentPrice: min,
          previousPrice: alert.flight_target_price,
          bookingUrl: best.bookingUrl,
          itemName: `${best.flightNumber} (${date})`,
        });
        await recordNotification(alert.id);
        sent++;
        break;
      }
    }
  }

  // Check hotel price
  if (alert.hotel_target_price != null && sent === 0) {
    for (const [date, offers] of Object.entries(hotels)) {
      const min = offers.reduce<number | null>(
        (acc, o) => (acc === null || o.nightlyRate < acc ? o.nightlyRate : acc),
        null
      );
      if (min !== null && min <= alert.hotel_target_price) {
        const best = offers.find((o) => o.nightlyRate === min)!;
        await sendPriceDropAlert(alert, {
          type: "hotel",
          currentPrice: min,
          previousPrice: alert.hotel_target_price,
          bookingUrl: best.bookingUrl,
          itemName: `${best.hotelName} (${date})`,
        });
        await recordNotification(alert.id);
        sent++;
        break;
      }
    }
  }

  return sent;
}

export async function GET(request: NextRequest) {
  if (!authorised(request)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const alerts = getActiveAlerts();
  let totalSent = 0;

  for (const alert of alerts) {
    try {
      totalSent += await checkAlert(alert);
    } catch {
      // Continue processing other alerts even if one fails
    }
  }

  return NextResponse.json({ processed: alerts.length, sent: totalSent });
}
