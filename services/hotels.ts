import { getAmadeusClient } from "@/lib/amadeus";
import type { SearchParams, HotelOffer } from "@/types/search";

const CITY_CODE_MAP: Record<string, string> = {
  ICN: "SEL",
  GMP: "SEL",
  NRT: "TYO",
  HND: "TYO",
  CDG: "PAR",
  LHR: "LON",
  JFK: "NYC",
  LAX: "LAX",
  SIN: "SIN",
  BKK: "BKK",
  HKG: "HKG",
  DPS: "DPS",
};

function toCityCode(iataCode: string): string {
  return CITY_CODE_MAP[iataCode.toUpperCase()] ?? iataCode;
}

async function getHotelIdsByCity(cityCode: string): Promise<string[]> {
  const amadeus = getAmadeusClient();
  const response = await amadeus.referenceData.locations.hotels.byCity.get({
    cityCode,
    radius: 20,
    radiusUnit: "KM",
  });
  return (response.data as { hotelId: string }[])
    .slice(0, 20)
    .map((h) => h.hotelId);
}

export async function fetchHotelDayPrices(
  params: SearchParams
): Promise<Record<string, HotelOffer[]>> {
  const amadeus = getAmadeusClient();
  const cityCode = toCityCode(params.destination);
  const hotelIds = await getHotelIdsByCity(cityCode);

  if (hotelIds.length === 0) return {};

  const result: Record<string, HotelOffer[]> = {};

  function toLocalDateStr(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }

  // Determine unique check-in dates from departFrom..departTo range
  const cur = new Date(params.departFrom + "T00:00:00");
  const end = new Date(params.departTo + "T00:00:00");
  const dates: string[] = [];
  while (cur <= end) {
    dates.push(toLocalDateStr(cur));
    cur.setDate(cur.getDate() + 1);
  }

  await Promise.all(
    dates.map(async (checkIn) => {
      const checkOut = new Date(checkIn + "T00:00:00");
      checkOut.setDate(checkOut.getDate() + 1);
      const checkOutStr = toLocalDateStr(checkOut);

      try {
        const response = await amadeus.shopping.hotelOffersSearch.get({
          hotelIds: hotelIds.join(","),
          checkInDate: checkIn,
          checkOutDate: checkOutStr,
          adults: params.adults,
          roomQuantity: 1,
        });

        const offers: HotelOffer[] = (response.data as unknown[]).map((raw: unknown) => {
          const item = raw as Record<string, unknown>;
          const hotel = item.hotel as Record<string, unknown>;
          const offerArr = item.offers as Record<string, unknown>[];
          const offer = offerArr?.[0];
          const priceObj = offer?.price as Record<string, unknown> | undefined;
          const total = parseFloat((priceObj?.total as string) ?? "0");

          return {
            id: String(item.type ?? "") + String(hotel?.hotelId ?? ""),
            hotelId: String(hotel?.hotelId ?? ""),
            hotelName: String(hotel?.name ?? "Unknown Hotel"),
            nightlyRate: Math.round(total * 1300),
            bookingUrl: `https://www.booking.com/`,
          };
        });

        result[checkIn] = offers.filter((o) => o.nightlyRate > 0);
      } catch {
        result[checkIn] = [];
      }
    })
  );

  return result;
}
