"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FieldGroup, FieldError, FieldTitle } from "@/components/ui/field";

interface AlertFormProps {
  searchContext?: {
    origin: string;
    destination: string;
    departFrom: string;
    departTo: string;
    returnFrom: string;
    returnTo: string;
    adults: number;
    children: number;
  };
  onClose?: () => void;
}

type FormStatus = "idle" | "submitting" | "success" | "error";

interface FormErrors {
  email?: string;
  targetPrice?: string;
}

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export function AlertForm({ searchContext, onClose }: AlertFormProps) {
  const [email, setEmail] = useState("");
  const [flightTargetPrice, setFlightTargetPrice] = useState("");
  const [hotelTargetPrice, setHotelTargetPrice] = useState("");
  const [errors, setErrors] = useState<FormErrors>({});
  const [formStatus, setFormStatus] = useState<FormStatus>("idle");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: FormErrors = {};

    if (!isValidEmail(email)) {
      newErrors.email = "올바른 이메일 주소를 입력하세요";
    }

    const hasFlight = flightTargetPrice.trim() !== "" && Number(flightTargetPrice) > 0;
    const hasHotel = hotelTargetPrice.trim() !== "" && Number(hotelTargetPrice) > 0;
    if (!hasFlight && !hasHotel) {
      newErrors.targetPrice = "항공 또는 호텔 목표 가격 중 하나 이상을 입력하세요";
    }

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    setFormStatus("submitting");

    try {
      const body = {
        email,
        origin: searchContext?.origin ?? "",
        destination: searchContext?.destination ?? "",
        depart_from: searchContext?.departFrom ?? "",
        depart_to: searchContext?.departTo ?? "",
        return_from: searchContext?.returnFrom ?? "",
        return_to: searchContext?.returnTo ?? "",
        adults: searchContext?.adults ?? 2,
        children: searchContext?.children ?? 0,
        flight_target_price: hasFlight ? Number(flightTargetPrice) : null,
        hotel_target_price: hasHotel ? Number(hotelTargetPrice) : null,
      };

      const res = await fetch("/api/alerts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "unknown error");
      }

      setFormStatus("success");
    } catch {
      setFormStatus("error");
    }
  };

  if (formStatus === "success") {
    return (
      <div role="status" aria-live="polite" className="rounded border p-4">
        <p className="text-sm font-medium text-green-700">
          알림이 설정되었습니다. 입력하신 이메일로 가격이 목표가 이하로 떨어지면 알림을 보내
          드립니다.
        </p>
        {onClose && (
          <Button variant="outline" size="sm" className="mt-2" onClick={onClose}>
            닫기
          </Button>
        )}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} aria-label="가격 알림 설정 폼" className="rounded border p-4">
      <h3 className="mb-4 font-semibold">가격 알림 설정</h3>
      <FieldGroup>
        <Field data-invalid={errors.email ? "true" : undefined}>
          <FieldTitle>이메일</FieldTitle>
          <Input
            type="text"
            inputMode="email"
            aria-label="이메일 주소"
            placeholder="user@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          {errors.email && <FieldError>{errors.email}</FieldError>}
        </Field>

        <Field>
          <FieldTitle>항공 목표가 (원화, 선택)</FieldTitle>
          <Input
            type="number"
            aria-label="항공 목표가"
            placeholder="예: 200000"
            value={flightTargetPrice}
            onChange={(e) => setFlightTargetPrice(e.target.value)}
          />
        </Field>

        <Field>
          <FieldTitle>호텔 목표가 (원화/박, 선택)</FieldTitle>
          <Input
            type="number"
            aria-label="호텔 목표가"
            placeholder="예: 100000"
            value={hotelTargetPrice}
            onChange={(e) => setHotelTargetPrice(e.target.value)}
          />
        </Field>

        {errors.targetPrice && (
          <FieldError>{errors.targetPrice}</FieldError>
        )}
      </FieldGroup>

      {formStatus === "error" && (
        <p className="mt-2 text-sm text-destructive" role="alert">
          알림 저장 중 오류가 발생했습니다. 다시 시도해주세요.
        </p>
      )}

      <div className="mt-4 flex gap-2">
        <Button type="submit" disabled={formStatus === "submitting"}>
          알림 저장
        </Button>
        {onClose && (
          <Button type="button" variant="outline" onClick={onClose}>
            취소
          </Button>
        )}
      </div>
    </form>
  );
}
