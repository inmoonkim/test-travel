import { describe, it, expect, vi, beforeEach } from "vitest";
import { fetchHotelDayPrices } from "./hotels";

vi.mock("@/lib/amadeus", () => ({
  getAmadeusClient: vi.fn(),
}));

import { getAmadeusClient } from "@/lib/amadeus";

const mockHotelData = [
  {
    type: "hotel-offers",
    hotel: { hotelId: "HTPAR001", name: "Hotel Paris Central" },
    offers: [{ price: { total: "80.00" } }],
  },
  {
    type: "hotel-offers",
    hotel: { hotelId: "HTPAR002", name: "Hotel Paris West" },
    offers: [{ price: { total: "100.00" } }],
  },
];

describe("fetchHotelDayPrices", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    const mockByCityGet = vi.fn().mockResolvedValue({
      data: [{ hotelId: "HTPAR001" }, { hotelId: "HTPAR002" }],
    });
    const mockHotelOffersGet = vi.fn().mockResolvedValue({ data: mockHotelData });
    vi.mocked(getAmadeusClient).mockReturnValue({
      referenceData: {
        locations: {
          hotels: {
            byCity: { get: mockByCityGet },
          },
        },
      },
      shopping: {
        hotelOffersSearch: { get: mockHotelOffersGet },
      },
    } as unknown as ReturnType<typeof getAmadeusClient>);
  });

  it("returns HotelOffers keyed by check-in date", async () => {
    const result = await fetchHotelDayPrices({
      origin: "ICN",
      destination: "NRT",
      departFrom: "2026-06-15",
      departTo: "2026-06-15",
      returnFrom: "2026-06-20",
      returnTo: "2026-06-20",
      adults: 2,
      children: 0,
    });

    expect(result["2026-06-15"]).toBeDefined();
    expect(result["2026-06-15"]).toHaveLength(2);
  });

  it("maps hotel price from USD to KRW (x1300)", async () => {
    const result = await fetchHotelDayPrices({
      origin: "ICN",
      destination: "NRT",
      departFrom: "2026-06-15",
      departTo: "2026-06-15",
      returnFrom: "2026-06-20",
      returnTo: "2026-06-20",
      adults: 2,
      children: 0,
    });

    const paris = result["2026-06-15"].find((h) => h.hotelId === "HTPAR001");
    expect(paris?.nightlyRate).toBe(Math.round(80 * 1300));
  });

  it("generates one key per date in the range", async () => {
    const result = await fetchHotelDayPrices({
      origin: "ICN",
      destination: "NRT",
      departFrom: "2026-06-15",
      departTo: "2026-06-17",
      returnFrom: "2026-06-20",
      returnTo: "2026-06-20",
      adults: 2,
      children: 0,
    });

    expect(Object.keys(result).sort()).toEqual([
      "2026-06-15",
      "2026-06-16",
      "2026-06-17",
    ]);
  });

  it("returns empty object when no hotels found in city", async () => {
    const mockGet = vi.fn().mockResolvedValue({ data: [] });
    vi.mocked(getAmadeusClient).mockReturnValue({
      referenceData: {
        locations: { hotels: { byCity: { get: mockGet } } },
      },
      shopping: { hotelOffersSearch: { get: vi.fn() } },
    } as unknown as ReturnType<typeof getAmadeusClient>);

    const result = await fetchHotelDayPrices({
      origin: "ICN",
      destination: "NRT",
      departFrom: "2026-06-15",
      departTo: "2026-06-15",
      returnFrom: "2026-06-20",
      returnTo: "2026-06-20",
      adults: 2,
      children: 0,
    });

    expect(result).toEqual({});
  });
});
