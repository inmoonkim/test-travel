import { serpApiGet } from "@/lib/serpapi";
import type { SearchParams, HotelOffer } from "@/types/search";

const CITY_NAME_MAP: Record<string, string> = {
  ICN: "Seoul",
  GMP: "Seoul",
  NRT: "Tokyo",
  HND: "Tokyo",
  CDG: "Paris",
  LHR: "London",
  JFK: "New York",
  LAX: "Los Angeles",
  SIN: "Singapore",
  BKK: "Bangkok",
  HKG: "Hong Kong",
  DPS: "Bali",
};

interface SerpHotelProperty {
  name: string;
  link?: string;
  property_token?: string;
  rate_per_night?: { extracted_lowest?: number };
}

interface SerpHotelsResponse {
  properties?: SerpHotelProperty[];
}

function toLocalDateStr(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export async function fetchHotelDayPrices(
  params: SearchParams
): Promise<Record<string, HotelOffer[]>> {
  const cityName =
    CITY_NAME_MAP[params.destination.toUpperCase()] ?? params.destination;

  const cur = new Date(params.departFrom + "T00:00:00");
  const end = new Date(params.departTo + "T00:00:00");
  const dates: string[] = [];
  while (cur <= end) {
    dates.push(toLocalDateStr(cur));
    cur.setDate(cur.getDate() + 1);
  }

  const result: Record<string, HotelOffer[]> = {};

  await Promise.all(
    dates.map(async (checkIn) => {
      const nextDay = new Date(checkIn + "T00:00:00");
      nextDay.setDate(nextDay.getDate() + 1);
      const checkOut = toLocalDateStr(nextDay);

      try {
        const data = (await serpApiGet({
          engine: "google_hotels",
          q: `Hotels in ${cityName}`,
          check_in_date: checkIn,
          check_out_date: checkOut,
          adults: params.adults,
          currency: "KRW",
        })) as SerpHotelsResponse;

        const offers: HotelOffer[] = (data.properties ?? [])
          .slice(0, 10)
          .map((h, i) => ({
            id: h.property_token ?? `hotel-${checkIn}-${i}`,
            hotelId: h.property_token ?? `hotel-${checkIn}-${i}`,
            hotelName: h.name,
            nightlyRate: h.rate_per_night?.extracted_lowest ?? 0,
            bookingUrl: h.link ?? "https://www.google.com/travel/hotels",
          }))
          .filter((o) => o.nightlyRate > 0);

        result[checkIn] = offers;
      } catch {
        result[checkIn] = [];
      }
    })
  );

  return result;
}
