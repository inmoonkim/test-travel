import { NextRequest, NextResponse } from "next/server";
import { deactivateAlert } from "@/services/alerts";

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token");
  if (!token) {
    return NextResponse.json({ error: "token is required" }, { status: 400 });
  }

  const wasActive = deactivateAlert(token);
  return NextResponse.json({
    cancelled: wasActive,
    message: wasActive ? "알림이 취소되었습니다" : "이미 취소된 알림입니다",
  });
}
