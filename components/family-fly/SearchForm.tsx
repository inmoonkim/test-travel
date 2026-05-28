"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Field,
  FieldGroup,
  FieldError,
  FieldTitle,
} from "@/components/ui/field";
import {
  Combobox,
  ComboboxInput,
  ComboboxContent,
  ComboboxList,
  ComboboxItem,
  ComboboxEmpty,
} from "@/components/ui/combobox";
import type { SearchParams } from "@/types/search";

const AIRPORTS = [
  { code: "ICN", label: "인천국제공항 (ICN)" },
  { code: "GMP", label: "김포국제공항 (GMP)" },
  { code: "NRT", label: "도쿄 나리타 (NRT)" },
  { code: "HND", label: "도쿄 하네다 (HND)" },
  { code: "CDG", label: "파리 샤를드골 (CDG)" },
  { code: "LHR", label: "런던 히스로 (LHR)" },
  { code: "JFK", label: "뉴욕 JFK (JFK)" },
  { code: "LAX", label: "로스앤젤레스 (LAX)" },
  { code: "SIN", label: "싱가포르 창이 (SIN)" },
  { code: "BKK", label: "방콕 수완나품 (BKK)" },
  { code: "HKG", label: "홍콩국제공항 (HKG)" },
  { code: "DPS", label: "발리 응우라라이 (DPS)" },
];

interface SearchFormProps {
  onSubmit: (params: SearchParams) => void;
}

interface FormErrors {
  origin?: string;
  destination?: string;
  departRange?: string;
  returnRange?: string;
  adults?: string;
}

export function SearchForm({ onSubmit }: SearchFormProps) {
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [departFrom, setDepartFrom] = useState("");
  const [departTo, setDepartTo] = useState("");
  const [returnFrom, setReturnFrom] = useState("");
  const [returnTo, setReturnTo] = useState("");
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);
  const [errors, setErrors] = useState<FormErrors>({});

  const hasDateOrderError = !!(returnTo && departFrom && returnTo < departFrom);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: FormErrors = {};
    if (!origin) newErrors.origin = "출발지를 입력하세요";
    if (!destination) newErrors.destination = "목적지를 입력하세요";
    if (!departFrom || !departTo) newErrors.departRange = "출발일 범위를 선택하세요";
    if (!returnFrom || !returnTo) newErrors.returnRange = "귀환일 범위를 선택하세요";
    if (adults < 1) newErrors.adults = "성인은 최소 1명 이상이어야 합니다";
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0 || hasDateOrderError) return;
    onSubmit({ origin, destination, departFrom, departTo, returnFrom, returnTo, adults, children });
  };

  return (
    <form onSubmit={handleSubmit} aria-label="항공+호텔 검색 폼">
      <FieldGroup>
        <Field data-invalid={errors.origin ? "true" : undefined}>
          <FieldTitle>출발지</FieldTitle>
          <Combobox value={origin} onValueChange={(v) => setOrigin(v ?? "")}>
            <ComboboxInput aria-label="출발지 공항" placeholder="공항 선택" showClear />
            <ComboboxContent>
              <ComboboxList>
                {AIRPORTS.map((a) => (
                  <ComboboxItem key={a.code} value={a.code}>
                    {a.label}
                  </ComboboxItem>
                ))}
                <ComboboxEmpty>검색 결과 없음</ComboboxEmpty>
              </ComboboxList>
            </ComboboxContent>
          </Combobox>
          {errors.origin && <FieldError>{errors.origin}</FieldError>}
        </Field>

        <Field data-invalid={errors.destination ? "true" : undefined}>
          <FieldTitle>목적지</FieldTitle>
          <Combobox value={destination} onValueChange={(v) => setDestination(v ?? "")}>
            <ComboboxInput aria-label="목적지 공항" placeholder="공항 선택" showClear />
            <ComboboxContent>
              <ComboboxList>
                {AIRPORTS.map((a) => (
                  <ComboboxItem key={a.code} value={a.code}>
                    {a.label}
                  </ComboboxItem>
                ))}
                <ComboboxEmpty>검색 결과 없음</ComboboxEmpty>
              </ComboboxList>
            </ComboboxContent>
          </Combobox>
          {errors.destination && <FieldError>{errors.destination}</FieldError>}
        </Field>

        <Field data-invalid={errors.departRange ? "true" : undefined}>
          <FieldTitle>출발일 범위</FieldTitle>
          <div className="flex gap-2 items-center">
            <Input
              type="date"
              aria-label="출발일 시작"
              value={departFrom}
              onChange={(e) => setDepartFrom(e.target.value)}
            />
            <span>~</span>
            <Input
              type="date"
              aria-label="출발일 종료"
              value={departTo}
              onChange={(e) => setDepartTo(e.target.value)}
            />
          </div>
          {errors.departRange && <FieldError>{errors.departRange}</FieldError>}
        </Field>

        <Field data-invalid={(errors.returnRange || hasDateOrderError) ? "true" : undefined}>
          <FieldTitle>귀환일 범위</FieldTitle>
          <div className="flex gap-2 items-center">
            <Input
              type="date"
              aria-label="귀환일 시작"
              value={returnFrom}
              onChange={(e) => setReturnFrom(e.target.value)}
            />
            <span>~</span>
            <Input
              type="date"
              aria-label="귀환일 종료"
              value={returnTo}
              onChange={(e) => setReturnTo(e.target.value)}
            />
          </div>
          {errors.returnRange && <FieldError>{errors.returnRange}</FieldError>}
          {hasDateOrderError && (
            <FieldError>귀환일은 출발일보다 늦어야 합니다</FieldError>
          )}
        </Field>

        <div className="flex gap-6">
          <Field>
            <FieldTitle>성인</FieldTitle>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                aria-label="성인 감소"
                onClick={() => setAdults((v) => Math.max(0, v - 1))}
              >
                −
              </Button>
              <span aria-label="성인 수">{adults}</span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                aria-label="성인 증가"
                onClick={() => setAdults((v) => v + 1)}
              >
                ＋
              </Button>
            </div>
            {errors.adults && <FieldError>{errors.adults}</FieldError>}
          </Field>

          <Field>
            <FieldTitle>소아</FieldTitle>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                aria-label="소아 감소"
                onClick={() => setChildren((v) => Math.max(0, v - 1))}
              >
                −
              </Button>
              <span aria-label="소아 수">{children}</span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                aria-label="소아 증가"
                onClick={() => setChildren((v) => v + 1)}
              >
                ＋
              </Button>
            </div>
          </Field>
        </div>
      </FieldGroup>

      <Button type="submit" disabled={hasDateOrderError} className="mt-4 w-full">
        검색
      </Button>
    </form>
  );
}
