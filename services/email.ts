import { Resend } from "resend";
import type { PriceAlert } from "@/types/alert";

let resend: Resend | null = null;

function getResend(): Resend {
  if (!resend) {
    resend = new Resend(process.env.RESEND_API_KEY ?? "");
  }
  return resend;
}

const FROM_EMAIL = "FamilyFly <noreply@familyfly.app>";

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function safeUrl(url: string): string {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") return "#";
    return parsed.href;
  } catch {
    return "#";
  }
}

export interface PriceDropHit {
  type: "flight" | "hotel";
  currentPrice: number;
  previousPrice: number;
  bookingUrl: string;
  itemName: string;
}

export async function sendPriceDropAlert(
  alert: PriceAlert,
  hit: PriceDropHit
): Promise<void> {
  const cancelUrl = `${process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000"}/cancel/${alert.cancel_token}`;
  const drop = alert[`${hit.type}_target_price`]! - hit.currentPrice;

  const subject = `[FamilyFly] 가격 하락 알림 — ${hit.itemName}`;

  const html = `
    <h2>가격 하락 알림</h2>
    <p><strong>${escapeHtml(hit.itemName)}</strong></p>
    <p>현재 가격: <strong>₩${hit.currentPrice.toLocaleString("ko-KR")}</strong></p>
    <p>목표가 대비 하락: ₩${drop.toLocaleString("ko-KR")}</p>
    <p><a href="${safeUrl(hit.bookingUrl)}">예약하기</a></p>
    <hr/>
    <p style="font-size:12px;color:#999;"><a href="${safeUrl(cancelUrl)}">알림 취소</a></p>
  `;

  const client = getResend();
  await client.emails.send({
    from: FROM_EMAIL,
    to: alert.email,
    subject,
    html,
  });
}
