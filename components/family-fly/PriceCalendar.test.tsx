import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { PriceCalendar } from "./PriceCalendar";
import type { DayPrice } from "@/types/search";

const BASE_PROPS = {
  departFrom: "2026-06-15",
  departTo: "2026-06-15",
  isLoading: false,
  onDateSelect: vi.fn(),
};

const dayPriceWithPrice: Record<string, DayPrice> = {
  "2026-06-15": {
    date: "2026-06-15",
    minPrice: 267000,
    combos: [],
  },
};

const dayPriceWithNull: Record<string, DayPrice> = {
  "2026-06-15": {
    date: "2026-06-15",
    minPrice: null,
    combos: [],
  },
};

describe("PriceCalendar", () => {
  it("shows Skeleton cells when isLoading=true", () => {
    render(
      <PriceCalendar {...BASE_PROPS} dayPrices={{}} isLoading={true} />
    );
    const skeletons = screen.getAllByTestId("skeleton");
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it("shows ₩267,000 for a date with minPrice 267000", () => {
    render(
      <PriceCalendar {...BASE_PROPS} dayPrices={dayPriceWithPrice} />
    );
    expect(screen.getByText("₩267,000")).toBeInTheDocument();
  });

  it("shows '−' for a date with minPrice null", () => {
    render(
      <PriceCalendar {...BASE_PROPS} dayPrices={dayPriceWithNull} />
    );
    expect(screen.getByText("−")).toBeInTheDocument();
  });

  it("date cell with minPrice null has no onClick", () => {
    render(
      <PriceCalendar {...BASE_PROPS} dayPrices={dayPriceWithNull} />
    );
    const minusCell = screen.getByText("−").parentElement!;
    expect(minusCell.getAttribute("role")).not.toBe("button");
  });

  it("shows empty message when dayPrices is empty and not loading", () => {
    render(<PriceCalendar {...BASE_PROPS} dayPrices={{}} />);
    expect(
      screen.getByText(/입력하신 조건에 맞는 항공\+호텔 조합을 찾을 수 없습니다/)
    ).toBeInTheDocument();
  });

  it("calls onDateSelect with the date when clicking a cell with price", () => {
    const onDateSelect = vi.fn();
    render(
      <PriceCalendar
        {...BASE_PROPS}
        dayPrices={dayPriceWithPrice}
        onDateSelect={onDateSelect}
      />
    );
    fireEvent.click(screen.getByText("₩267,000").parentElement!);
    expect(onDateSelect).toHaveBeenCalledWith("2026-06-15");
  });

  it("out-of-range date cells show no price", () => {
    render(
      <PriceCalendar
        {...BASE_PROPS}
        departFrom="2026-06-15"
        departTo="2026-06-15"
        dayPrices={dayPriceWithPrice}
      />
    );
    // The calendar renders surrounding days (out of range)
    // Out-of-range cells should not show any price text
    const allCells = screen.getAllByText(/₩/).length;
    expect(allCells).toBe(1); // only the in-range date has a price
  });
});
