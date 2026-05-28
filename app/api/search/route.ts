import { NextRequest, NextResponse } from "next/server";
import { fetchFlightDayPrices } from "@/services/search";
import { fetchHotelDayPrices } from "@/services/hotels";
import type { SearchParams, DayPrice, ComboOffer } from "@/types/search";

const REQUIRED = ["origin", "destination", "departFrom", "departTo", "returnFrom", "returnTo", "adults"] as const;

export async function GET(request: NextRequest) {
  const sp = request.nextUrl.searchParams;

  for (const key of REQUIRED) {
    if (!sp.get(key)) {
      return NextResponse.json({ error: "missing required params" }, { status: 400 });
    }
  }

  const params: SearchParams = {
    origin: sp.get("origin")!,
    destination: sp.get("destination")!,
    departFrom: sp.get("departFrom")!,
    departTo: sp.get("departTo")!,
    returnFrom: sp.get("returnFrom")!,
    returnTo: sp.get("returnTo")!,
    adults: parseInt(sp.get("adults")!),
    children: parseInt(sp.get("children") ?? "0"),
  };

  try {
    const [flightsByDate, hotelsByDate] = await Promise.all([
      fetchFlightDayPrices(params),
      fetchHotelDayPrices(params),
    ]);

    const dates: Record<string, DayPrice> = {};

    for (const date of Object.keys(flightsByDate)) {
      const flights = flightsByDate[date] ?? [];
      const hotels = hotelsByDate[date] ?? [];

      const combos: ComboOffer[] = [];
      for (const flight of flights) {
        for (const hotel of hotels) {
          combos.push({
            flight,
            hotel,
            combinedPrice: flight.price + hotel.nightlyRate,
          });
        }
      }

      combos.sort((a, b) => a.combinedPrice - b.combinedPrice);

      const minPrice = combos.length > 0 ? combos[0].combinedPrice : null;

      dates[date] = { date, minPrice, combos };
    }

    return NextResponse.json({ dates });
  } catch {
    return NextResponse.json({ error: "upstream error" }, { status: 502 });
  }
}
