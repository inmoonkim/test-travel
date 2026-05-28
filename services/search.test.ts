import { describe, it, expect, vi, beforeEach } from "vitest";
import { fetchFlightDayPrices } from "./search";

vi.mock("@/lib/amadeus", () => ({
  getAmadeusClient: vi.fn(),
}));

import { getAmadeusClient } from "@/lib/amadeus";

const mockFlightOffer = (id: string, grandTotal: string) => ({
  id,
  validatingAirlineCodes: ["KE"],
  itineraries: [
    {
      segments: [
        {
          carrierCode: "KE",
          number: "123",
          departure: { at: "2026-06-15T10:00:00" },
          arrival: { at: "2026-06-15T12:00:00" },
        },
      ],
    },
  ],
  price: { grandTotal },
});

describe("fetchFlightDayPrices", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    const mockGet = vi.fn().mockResolvedValue({
      data: [mockFlightOffer("offer-1", "150.00")],
    });
    vi.mocked(getAmadeusClient).mockReturnValue({
      shopping: {
        flightOffersSearch: { get: mockGet },
      },
    } as unknown as ReturnType<typeof getAmadeusClient>);
  });

  it("returns FlightOffers keyed by departure date", async () => {
    const result = await fetchFlightDayPrices({
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
    expect(result["2026-06-15"]).toHaveLength(1);
    expect(result["2026-06-15"][0]).toMatchObject({
      id: "offer-1",
      airline: "KE",
      flightNumber: "KE123",
    });
  });

  it("maps price grandTotal from USD to KRW (x1300 approx)", async () => {
    const result = await fetchFlightDayPrices({
      origin: "ICN",
      destination: "NRT",
      departFrom: "2026-06-15",
      departTo: "2026-06-15",
      returnFrom: "2026-06-20",
      returnTo: "2026-06-20",
      adults: 2,
      children: 0,
    });

    expect(result["2026-06-15"][0].price).toBe(Math.round(150.0 * 1300));
  });

  it("generates one key per date in the range", async () => {
    const result = await fetchFlightDayPrices({
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
});
