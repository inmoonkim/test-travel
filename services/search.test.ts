import { describe, it, expect, vi, beforeEach } from "vitest";
import { fetchFlightDayPrices } from "./search";

vi.mock("@/lib/serpapi", () => ({
  serpApiGet: vi.fn(),
}));

import { serpApiGet } from "@/lib/serpapi";

const mockSerpFlight = (flightNumber: string, price: number) => ({
  flights: [
    {
      departure_airport: { id: "ICN", time: "2026-06-15 10:00" },
      arrival_airport: { id: "NRT", time: "2026-06-15 12:00" },
      airline: "Korean Air",
      flight_number: flightNumber,
    },
  ],
  price,
});

describe("fetchFlightDayPrices", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(serpApiGet).mockResolvedValue({
      best_flights: [mockSerpFlight("KE 123", 195000)],
    });
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
      airline: "Korean Air",
      flightNumber: "KE 123",
    });
  });

  it("uses SerpAPI price directly in KRW", async () => {
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

    expect(result["2026-06-15"][0].price).toBe(195000);
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
