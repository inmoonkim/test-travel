"use client";

import { useState, useCallback } from "react";
import type { SearchParams, DayPrice } from "@/types/search";

type SearchStatus = "idle" | "loading" | "results" | "error";

export interface SearchState {
  status: SearchStatus;
  dayPrices: Record<string, DayPrice>;
  selectedDate: string | null;
  showAlertForm: boolean;
  errorMessage: string | null;
}

export function useSearch() {
  const [state, setState] = useState<SearchState>({
    status: "idle",
    dayPrices: {},
    selectedDate: null,
    showAlertForm: false,
    errorMessage: null,
  });

  const [lastParams, setLastParams] = useState<SearchParams | null>(null);

  const search = useCallback(async (params: SearchParams) => {
    setLastParams(params);
    setState((s) => ({ ...s, status: "loading", selectedDate: null, showAlertForm: false, errorMessage: null }));

    const qs = new URLSearchParams({
      origin: params.origin,
      destination: params.destination,
      departFrom: params.departFrom,
      departTo: params.departTo,
      returnFrom: params.returnFrom,
      returnTo: params.returnTo,
      adults: String(params.adults),
      children: String(params.children),
    });

    try {
      const res = await fetch(`/api/search?${qs}`);
      if (!res.ok) throw new Error("search failed");
      const data: { dates: Record<string, DayPrice> } = await res.json();
      setState((s) => ({
        ...s,
        status: "results",
        dayPrices: data.dates ?? {},
      }));
    } catch {
      setState((s) => ({ ...s, status: "error", errorMessage: "검색 중 오류가 발생했습니다." }));
    }
  }, []);

  const selectDate = useCallback((date: string) => {
    setState((s) => ({ ...s, selectedDate: date, showAlertForm: false }));
  }, []);

  const backToCalendar = useCallback(() => {
    setState((s) => ({ ...s, selectedDate: null, showAlertForm: false }));
  }, []);

  const openAlertForm = useCallback(() => {
    setState((s) => ({ ...s, showAlertForm: true }));
  }, []);

  const closeAlertForm = useCallback(() => {
    setState((s) => ({ ...s, showAlertForm: false }));
  }, []);

  return { state, lastParams, search, selectDate, backToCalendar, openAlertForm, closeAlertForm };
}
