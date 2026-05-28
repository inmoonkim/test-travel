import { getAmadeusClient } from "@/lib/amadeus";
import type { SearchParams, FlightOffer } from "@/types/search";

function eachDate(from: string, to: string): string[] {
  const dates: string[] = [];
  const cur = new Date(from);
  const end = new Date(to);
  while (cur <= end) {
    dates.push(cur.toISOString().slice(0, 10));
    cur.setDate(cur.getDate() + 1);
  }
  return dates;
}

export async function fetchFlightDayPrices(
  params: SearchParams
): Promise<Record<string, FlightOffer[]>> {
  const amadeus = getAmadeusClient();
  const dates = eachDate(params.departFrom, params.departTo);
  const result: Record<string, FlightOffer[]> = {};

  await Promise.all(
    dates.map(async (date) => {
      const response = await amadeus.shopping.flightOffersSearch.get({
        originLocationCode: params.origin,
        destinationLocationCode: params.destination,
        departureDate: date,
        returnDate: params.returnFrom,
        adults: params.adults,
        children: params.children > 0 ? params.children : undefined,
        max: 5,
      });

      const offers: FlightOffer[] = (response.data ?? []).map((raw: unknown) => {
        const offer = raw as Record<string, unknown>;
        const itinerary = (offer.itineraries as Record<string, unknown>[])?.[0];
        const segment = (itinerary?.segments as Record<string, unknown>[])?.[0];
        const price = offer.price as Record<string, unknown>;
        const validatingCarrier = (offer.validatingAirlineCodes as string[])?.[0] ?? "";
        const flightNum = segment
          ? `${(segment.carrierCode as string) ?? ""}${(segment.number as string) ?? ""}`
          : "";

        return {
          id: offer.id as string,
          airline: validatingCarrier,
          flightNumber: flightNum,
          departureTime: (segment?.departure as Record<string, unknown>)?.at as string ?? "",
          arrivalTime: (segment?.arrival as Record<string, unknown>)?.at as string ?? "",
          price: Math.round(parseFloat((price?.grandTotal as string) ?? "0") * 1300),
          bookingUrl: `https://www.amadeus.com/`,
        };
      });

      result[date] = offers;
    })
  );

  return result;
}
