import { NextRequest, NextResponse } from "next/server";
import { fetchFlightDayPrices } from "@/services/search";
import type { SearchParams } from "@/types/search";

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
    const flightsByDate = await fetchFlightDayPrices(params);

    const dates: Record<string, { minFlightPrice: number | null }> = {};
    for (const [date, offers] of Object.entries(flightsByDate)) {
      const prices = offers.map((o) => o.price);
      dates[date] = {
        minFlightPrice: prices.length > 0 ? Math.min(...prices) : null,
      };
    }

    return NextResponse.json({ dates });
  } catch {
    return NextResponse.json({ error: "upstream error" }, { status: 502 });
  }
}
