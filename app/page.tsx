"use client";

import { useSearch } from "@/hooks/useSearch";
import { SearchForm } from "@/components/family-fly/SearchForm";
import { PriceCalendar } from "@/components/family-fly/PriceCalendar";
import { ComboList } from "@/components/family-fly/ComboList";
import { Button } from "@/components/ui/button";
import { AlertForm } from "@/components/family-fly/AlertForm";

export default function Page() {
  const { state, lastParams, search, selectDate, backToCalendar, openAlertForm } = useSearch();
  const { status, dayPrices, selectedDate, showAlertForm } = state;

  const selectedCombos =
    selectedDate && dayPrices[selectedDate]?.combos
      ? dayPrices[selectedDate].combos
      : [];

  return (
    <main className="mx-auto max-w-3xl p-4">
      <h1 className="mb-6 text-2xl font-bold">FamilyFly</h1>
      <p className="mb-4 text-sm text-muted-foreground">가족 여행 항공+호텔 최저가 탐색기</p>

      {/* Search Form — always visible */}
      <SearchForm onSubmit={search} />

      {/* Loading */}
      {status === "loading" && (
        <div className="mt-6">
          <PriceCalendar
            dayPrices={{}}
            departFrom={lastParams?.departFrom ?? ""}
            departTo={lastParams?.departTo ?? ""}
            isLoading={true}
            onDateSelect={selectDate}
          />
        </div>
      )}

      {/* Error */}
      {status === "error" && (
        <div className="mt-4 rounded border border-destructive p-3 text-sm text-destructive" role="alert">
          {state.errorMessage}
        </div>
      )}

      {/* Results: Calendar or ComboList */}
      {status === "results" && !selectedDate && (
        <div className="mt-6">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold">날짜별 최저가</h2>
            <Button variant="outline" size="sm" onClick={openAlertForm}>
              가격 알림 설정
            </Button>
          </div>
          <PriceCalendar
            dayPrices={dayPrices}
            departFrom={lastParams?.departFrom ?? ""}
            departTo={lastParams?.departTo ?? ""}
            isLoading={false}
            onDateSelect={selectDate}
          />
        </div>
      )}

      {status === "results" && selectedDate && (
        <div className="mt-6">
          <div className="mb-3 flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={backToCalendar}>
              ← 달력
            </Button>
            <Button variant="outline" size="sm" onClick={openAlertForm}>
              알림
            </Button>
          </div>
          <ComboList combos={selectedCombos} date={selectedDate} />
        </div>
      )}

      {showAlertForm && lastParams && (
        <div className="mt-4" aria-label="알림 설정 영역">
          <AlertForm
            searchContext={{
              origin: lastParams.origin,
              destination: lastParams.destination,
              departFrom: lastParams.departFrom,
              departTo: lastParams.departTo,
              returnFrom: lastParams.returnFrom,
              returnTo: lastParams.returnTo,
              adults: lastParams.adults,
              children: lastParams.children,
            }}
          />
        </div>
      )}
    </main>
  );
}
