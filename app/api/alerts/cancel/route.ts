import { NextRequest, NextResponse } from "next/server";
import { deactivateAlert } from "@/services/alerts";

export async function POST(request: NextRequest) {
  let token: string | undefined;

  const contentType = request.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    const body = await request.json();
    token = body.token;
  } else {
    const form = await request.formData();
    token = form.get("token") as string | undefined;
  }

  if (!token) {
    return NextResponse.json({ error: "token is required" }, { status: 400 });
  }

  const wasActive = deactivateAlert(token);
  return NextResponse.json({
    cancelled: wasActive,
    message: wasActive ? "알림이 취소되었습니다" : "이미 취소된 알림입니다",
  });
}
