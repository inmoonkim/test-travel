import { describe, it, expect, vi, beforeEach } from "vitest";
import { fetchHotelDayPrices } from "./hotels";

vi.mock("@/lib/serpapi", () => ({
  serpApiGet: vi.fn(),
}));

import { serpApiGet } from "@/lib/serpapi";

const mockProperties = [
  {
    name: "Hotel Paris Central",
    property_token: "token-001",
    link: "https://www.ritzcarlton.com/paris",
    rate_per_night: { extracted_lowest: 104000 },
  },
  {
    name: "Hotel Paris West",
    property_token: "token-002",
    link: "https://www.marriott.com/paris",
    rate_per_night: { extracted_lowest: 130000 },
  },
];

describe("fetchHotelDayPrices", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(serpApiGet).mockResolvedValue({ properties: mockProperties });
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

  it("uses SerpAPI rate_per_night.extracted_lowest directly as KRW", async () => {
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

    const central = result["2026-06-15"].find((h) => h.hotelId === "token-001");
    expect(central?.nightlyRate).toBe(104000);
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

  it("returns empty array for date when no properties returned", async () => {
    vi.mocked(serpApiGet).mockResolvedValue({ properties: [] });

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

    expect(result["2026-06-15"]).toEqual([]);
  });
});
