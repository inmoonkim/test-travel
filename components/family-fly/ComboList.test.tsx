import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ComboList } from "./ComboList";
import type { ComboOffer } from "@/types/search";

const makeCombo = (
  flightPrice: number,
  hotelRate: number,
  suffix: string
): ComboOffer => ({
  flight: {
    id: `f-${suffix}`,
    airline: "KE",
    flightNumber: `KE${suffix}`,
    departureTime: "10:00",
    arrivalTime: "12:00",
    price: flightPrice,
    bookingUrl: `https://air.example.com/${suffix}`,
  },
  hotel: {
    id: `h-${suffix}`,
    hotelId: `h-${suffix}`,
    hotelName: `Hotel ${suffix}`,
    nightlyRate: hotelRate,
    bookingUrl: `https://hotel.example.com/${suffix}`,
  },
  combinedPrice: flightPrice + hotelRate,
});

const COMBOS: ComboOffer[] = [
  makeCombo(200000, 150000, "C"),  // combined 350000
  makeCombo(100000, 200000, "A"),  // combined 300000
  makeCombo(180000, 100000, "B"),  // combined 280000
];

describe("ComboList", () => {
  it("renders N cards for N combos", () => {
    render(<ComboList combos={COMBOS} date="2026-06-15" />);
    expect(screen.getAllByRole("article").length).toBe(3);
  });

  it("renders no card when combos is empty", () => {
    const { container } = render(<ComboList combos={[]} date="2026-06-15" />);
    expect(container.firstChild).toBeNull();
  });

  it("shows flight number, flight price, hotel name, hotel price, combined price per card", () => {
    render(<ComboList combos={[COMBOS[0]]} date="2026-06-15" />);
    expect(screen.getByText("KEC")).toBeInTheDocument(); // flightNumber
    expect(screen.getByText("₩200,000")).toBeInTheDocument(); // flight price
    expect(screen.getByText("Hotel C")).toBeInTheDocument(); // hotel name
    expect(screen.getByText("₩150,000/박")).toBeInTheDocument(); // hotel rate
    expect(screen.getByText("합산 ₩350,000")).toBeInTheDocument(); // combined
  });

  it("default sort is combined price ascending", () => {
    render(<ComboList combos={COMBOS} date="2026-06-15" />);
    const cards = screen.getAllByRole("article");
    // B(280000), A(300000), C(350000) = KEB, KEA, KEC
    expect(cards[0]).toHaveTextContent("KEB");
    expect(cards[1]).toHaveTextContent("KEA");
    expect(cards[2]).toHaveTextContent("KEC");
  });

  it("sorts by flight price when '항공가' is clicked", () => {
    render(<ComboList combos={COMBOS} date="2026-06-15" />);
    fireEvent.click(screen.getByRole("button", { name: "항공가" }));
    const cards = screen.getAllByRole("article");
    // A(100000), B(180000), C(200000)
    expect(cards[0]).toHaveTextContent("KEA");
    expect(cards[1]).toHaveTextContent("KEB");
    expect(cards[2]).toHaveTextContent("KEC");
  });

  it("sorts by hotel rate when '호텔가' is clicked", () => {
    render(<ComboList combos={COMBOS} date="2026-06-15" />);
    fireEvent.click(screen.getByRole("button", { name: "호텔가" }));
    const cards = screen.getAllByRole("article");
    // B(100000), C(150000), A(200000)
    expect(cards[0]).toHaveTextContent("KEB");
    expect(cards[1]).toHaveTextContent("KEC");
    expect(cards[2]).toHaveTextContent("KEA");
  });

  it("'항공 예약' link opens in new tab with noopener", () => {
    render(<ComboList combos={[COMBOS[0]]} date="2026-06-15" />);
    const link = screen.getByText("항공 예약") as HTMLAnchorElement;
    expect(link.target).toBe("_blank");
    expect(link.rel).toContain("noopener");
  });

  it("'호텔 예약' link opens in new tab with noopener", () => {
    render(<ComboList combos={[COMBOS[0]]} date="2026-06-15" />);
    const link = screen.getByText("호텔 예약") as HTMLAnchorElement;
    expect(link.target).toBe("_blank");
    expect(link.rel).toContain("noopener");
  });
});
