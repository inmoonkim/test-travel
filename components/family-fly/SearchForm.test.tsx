import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SearchForm } from "./SearchForm";

function fillValidDates() {
  fireEvent.change(screen.getByLabelText("출발일 시작"), { target: { value: "2026-06-15" } });
  fireEvent.change(screen.getByLabelText("출발일 종료"), { target: { value: "2026-06-20" } });
  fireEvent.change(screen.getByLabelText("귀환일 시작"), { target: { value: "2026-06-25" } });
  fireEvent.change(screen.getByLabelText("귀환일 종료"), { target: { value: "2026-06-30" } });
}

describe("SearchForm — validation", () => {
  it("shows 출발지 error when origin is empty on submit", async () => {
    render(<SearchForm onSubmit={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: "검색" }));
    expect(await screen.findByText("출발지를 입력하세요")).toBeInTheDocument();
  });

  it("does not call onSubmit when origin is empty", async () => {
    const onSubmit = vi.fn();
    render(<SearchForm onSubmit={onSubmit} />);
    fireEvent.click(screen.getByRole("button", { name: "검색" }));
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("shows 목적지 error when destination is empty on submit", async () => {
    render(<SearchForm onSubmit={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: "검색" }));
    expect(await screen.findByText("목적지를 입력하세요")).toBeInTheDocument();
  });

  it("shows 출발일 error when depart range is empty on submit", async () => {
    render(<SearchForm onSubmit={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: "검색" }));
    expect(await screen.findByText("출발일 범위를 선택하세요")).toBeInTheDocument();
  });

  it("shows 귀환일 error when return range is empty on submit", async () => {
    render(<SearchForm onSubmit={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: "검색" }));
    expect(await screen.findByText("귀환일 범위를 선택하세요")).toBeInTheDocument();
  });

  it("shows date order error and disables submit when returnTo < departFrom", async () => {
    render(<SearchForm onSubmit={vi.fn()} />);
    fireEvent.change(screen.getByLabelText("출발일 시작"), { target: { value: "2026-06-20" } });
    fireEvent.change(screen.getByLabelText("귀환일 종료"), { target: { value: "2026-06-15" } });

    expect(await screen.findByText("귀환일은 출발일보다 늦어야 합니다")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "검색" })).toBeDisabled();
  });

  it("shows 성인 error when adults is 0 on submit", async () => {
    render(<SearchForm onSubmit={vi.fn()} />);
    // Decrease adults from 2 to 0
    fireEvent.click(screen.getByLabelText("성인 감소"));
    fireEvent.click(screen.getByLabelText("성인 감소"));
    fireEvent.click(screen.getByRole("button", { name: "검색" }));
    expect(await screen.findByText("성인은 최소 1명 이상이어야 합니다")).toBeInTheDocument();
  });

  it("has default adults=2 and children=0", () => {
    render(<SearchForm onSubmit={vi.fn()} />);
    expect(screen.getByLabelText("성인 수").textContent).toBe("2");
    expect(screen.getByLabelText("소아 수").textContent).toBe("0");
  });

  it("calls onSubmit with params when all fields are valid", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<SearchForm onSubmit={onSubmit} />);

    // Select origin via combobox
    const originInput = screen.getByLabelText("출발지 공항");
    await user.click(originInput);
    const icnItem = await screen.findByText("인천국제공항 (ICN)");
    await user.click(icnItem);

    // Select destination via combobox
    const destInput = screen.getByLabelText("목적지 공항");
    await user.click(destInput);
    // Both comboboxes keep items in DOM; the closed one is aria-hidden="true"
    const nrtItems = await screen.findAllByText("도쿄 나리타 (NRT)");
    const visibleNrtItem = nrtItems.find((el) => el.getAttribute("aria-hidden") !== "true")!;
    await user.click(visibleNrtItem);

    fillValidDates();

    await user.click(screen.getByRole("button", { name: "검색" }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          origin: "ICN",
          destination: "NRT",
          departFrom: "2026-06-15",
          departTo: "2026-06-20",
          adults: 2,
          children: 0,
        })
      );
    });
  });
});
