"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

interface CancelPageProps {
  params: Promise<{ token: string }>;
}

// This must be a server component to read params, so we use a client wrapper
import { use } from "react";

export default function CancelPage({ params }: CancelPageProps) {
  const { token } = use(params);
  const [status, setStatus] = useState<"idle" | "success" | "already" | "error">("idle");

  const handleCancel = async () => {
    try {
      const res = await fetch("/api/alerts/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const data = await res.json();
      setStatus(data.cancelled ? "success" : "already");
    } catch {
      setStatus("error");
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center">
      <div className="max-w-sm rounded-xl border p-8 text-center">
        <h1 className="mb-4 text-xl font-semibold">가격 알림 취소</h1>

        {status === "idle" && (
          <>
            <p className="mb-6 text-sm text-muted-foreground">
              알림을 취소하시겠습니까? 이후 해당 조건으로 가격 알림이 발송되지 않습니다.
            </p>
            <Button onClick={handleCancel}>알림 취소 확인</Button>
          </>
        )}

        {status === "success" && (
          <p className="text-sm text-green-700" role="status">
            알림이 취소되었습니다
          </p>
        )}

        {status === "already" && (
          <p className="text-sm text-muted-foreground" role="status">
            이미 취소된 알림입니다
          </p>
        )}

        {status === "error" && (
          <p className="text-sm text-destructive" role="alert">
            오류가 발생했습니다. 다시 시도해 주세요.
          </p>
        )}

        <a href="/" className="mt-4 inline-block text-sm underline">
          홈으로 돌아가기
        </a>
      </div>
    </main>
  );
}
