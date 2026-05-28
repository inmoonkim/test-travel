import { serpApiGet } from "@/lib/serpapi";
import type { SearchParams, FlightOffer } from "@/types/search";

interface SerpFlight {
  departure_airport: { id: string; time: string };
  arrival_airport: { id: string; time: string };
  airline: string;
  flight_number: string;
}

interface SerpFlightOption {
  flights: SerpFlight[];
  price: number;
}

interface SerpFlightsResponse {
  best_flights?: SerpFlightOption[];
  other_flights?: SerpFlightOption[];
}

function toLocalDateStr(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function eachDate(from: string, to: string): string[] {
  const dates: string[] = [];
  const cur = new Date(from + "T00:00:00");
  const end = new Date(to + "T00:00:00");
  while (cur <= end) {
    dates.push(toLocalDateStr(cur));
    cur.setDate(cur.getDate() + 1);
  }
  return dates;
}

export async function fetchFlightDayPrices(
  params: SearchParams
): Promise<Record<string, FlightOffer[]>> {
  const dates = eachDate(params.departFrom, params.departTo);
  const result: Record<string, FlightOffer[]> = {};

  await Promise.all(
    dates.map(async (date) => {
      const serpParams: Record<string, string | number> = {
        engine: "google_flights",
        departure_id: params.origin,
        arrival_id: params.destination,
        outbound_date: date,
        adults: params.adults,
        currency: "KRW",
      };
      if (params.children > 0) serpParams.children = params.children;
      if (params.returnFrom) serpParams.return_date = params.returnFrom;

      try {
        const data = (await serpApiGet(serpParams)) as SerpFlightsResponse;
        const allOptions = [
          ...(data.best_flights ?? []),
          ...(data.other_flights ?? []),
        ];

        result[date] = allOptions.slice(0, 5).map((option, i) => {
          const first = option.flights[0];
          const last = option.flights[option.flights.length - 1];
          return {
            id: `${first.flight_number}-${date}-${i}`,
            airline: first.airline,
            flightNumber: first.flight_number,
            departureTime: first.departure_airport.time,
            arrivalTime: last.arrival_airport.time,
            price: option.price,
            bookingUrl: "https://www.google.com/travel/flights",
          };
        });
      } catch {
        result[date] = [];
      }
    })
  );

  return result;
}
