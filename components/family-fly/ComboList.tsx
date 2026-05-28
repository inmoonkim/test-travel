"use client";

import { useState } from "react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { ComboOffer } from "@/types/search";

type SortKey = "combined" | "flight" | "hotel";

const SORT_LABELS: Record<SortKey, string> = {
  combined: "합산가 낮은 순",
  flight: "항공가",
  hotel: "호텔가",
};

function formatKRW(amount: number): string {
  return `₩${amount.toLocaleString("ko-KR")}`;
}

interface ComboListProps {
  combos: ComboOffer[];
  date: string;
}

export function ComboList({ combos, date }: ComboListProps) {
  const [sortKey, setSortKey] = useState<SortKey>("combined");

  if (combos.length === 0) return null;

  const sorted = [...combos].sort((a, b) => {
    if (sortKey === "combined") return a.combinedPrice - b.combinedPrice;
    if (sortKey === "flight") return a.flight.price - b.flight.price;
    return a.hotel.nightlyRate - b.hotel.nightlyRate;
  });

  return (
    <div aria-label="항공+호텔 조합 리스트">
      <div className="mb-3 flex items-center gap-2">
        <span className="text-sm text-muted-foreground">{date} 출발 정렬:</span>
        {(Object.keys(SORT_LABELS) as SortKey[]).map((key) => (
          <Button
            key={key}
            variant={sortKey === key ? "default" : "outline"}
            size="sm"
            onClick={() => setSortKey(key)}
          >
            {SORT_LABELS[key]}
          </Button>
        ))}
      </div>

      <div className="flex flex-col gap-4">
        {sorted.map((combo, idx) => (
          <Card key={`${combo.flight.id}-${combo.hotel.hotelId}-${idx}`} role="article">
            <CardHeader>
              <CardTitle>
                {combo.flight.flightNumber} + {combo.hotel.hotelName}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-xs text-muted-foreground">항공편</div>
                  <div className="font-medium">{combo.flight.flightNumber}</div>
                  <div className="text-sm">{formatKRW(combo.flight.price)}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">호텔</div>
                  <div className="font-medium">{combo.hotel.hotelName}</div>
                  <div className="text-sm">{`${formatKRW(combo.hotel.nightlyRate)}/박`}</div>
                </div>
              </div>
              <div className="mt-3 text-base font-bold">
                합산 {formatKRW(combo.combinedPrice)}
              </div>
            </CardContent>
            <CardFooter className="gap-2">
              <a
                href={combo.flight.bookingUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm underline"
              >
                항공 예약
              </a>
              <a
                href={combo.hotel.bookingUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm underline"
              >
                호텔 예약
              </a>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
