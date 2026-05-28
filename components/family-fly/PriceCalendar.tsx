"use client";

import type { DayPrice } from "@/types/search";

const DAY_LABELS = ["일", "월", "화", "수", "목", "금", "토"];

function formatKRW(amount: number): string {
  return `₩${amount.toLocaleString("ko-KR")}`;
}

function toLocalDateStr(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

interface PriceCalendarProps {
  dayPrices: Record<string, DayPrice>;
  departFrom: string;
  departTo: string;
  isLoading: boolean;
  onDateSelect: (date: string) => void;
}

export function PriceCalendar({
  dayPrices,
  departFrom,
  departTo,
  isLoading,
  onDateSelect,
}: PriceCalendarProps) {
  const isEmpty =
    !isLoading && Object.keys(dayPrices).length === 0;

  if (isEmpty) {
    return (
      <div className="p-6 text-center text-muted-foreground" role="status">
        입력하신 조건에 맞는 항공+호텔 조합을 찾을 수 없습니다. 날짜 범위나
        목적지를 조정해 보세요.
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="grid grid-cols-7 gap-1 p-4" aria-label="로딩 중">
        {Array.from({ length: 35 }).map((_, i) => (
          <div
            key={i}
            className="h-12 animate-pulse rounded bg-muted"
            data-testid="skeleton"
          />
        ))}
      </div>
    );
  }

  // Build calendar grid
  const from = new Date(departFrom + "T00:00:00");
  const to = new Date(departTo + "T00:00:00");

  // Start from the Sunday before (or on) `from`
  const startDay = new Date(from);
  startDay.setDate(startDay.getDate() - startDay.getDay());

  // End at the Saturday after (or on) `to`
  const endDay = new Date(to);
  const remaining = 6 - endDay.getDay();
  endDay.setDate(endDay.getDate() + remaining);

  const cells: Date[] = [];
  const cur = new Date(startDay);
  while (cur <= endDay) {
    cells.push(new Date(cur));
    cur.setDate(cur.getDate() + 1);
  }

  return (
    <div aria-label="가격 달력">
      <div className="grid grid-cols-7 border-b pb-1 text-center text-xs text-muted-foreground">
        {DAY_LABELS.map((d) => (
          <div key={d} className="py-1">
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {cells.map((date) => {
          const dateStr = toLocalDateStr(date);
          const inRange = date >= from && date <= to;
          const dayData = inRange ? dayPrices[dateStr] : undefined;
          const hasPrice = inRange && dayData && dayData.minPrice !== null;

          return (
            <div
              key={dateStr}
              className={`flex h-14 flex-col items-center justify-start border p-1 text-sm ${
                inRange
                  ? "cursor-pointer bg-white hover:bg-muted"
                  : "bg-muted/30 opacity-40"
              } ${hasPrice ? "cursor-pointer" : "cursor-default"}`}
              {...(hasPrice
                ? { onClick: () => onDateSelect(dateStr), role: "button" }
                : {})}
            >
              <span className="font-medium">{date.getDate()}</span>
              {inRange && (
                <span className="text-xs">
                  {dayData?.minPrice != null
                    ? formatKRW(dayData.minPrice)
                    : "−"}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
