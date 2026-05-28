import { NextRequest, NextResponse } from "next/server";
import { createAlert } from "@/services/alerts";
import type { CreateAlertInput } from "@/types/alert";

export async function POST(request: NextRequest) {
  let body: Partial<CreateAlertInput>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  if (!body.email) {
    return NextResponse.json({ error: "email is required" }, { status: 400 });
  }

  const hasFlight = body.flight_target_price != null && body.flight_target_price > 0;
  const hasHotel = body.hotel_target_price != null && body.hotel_target_price > 0;
  if (!hasFlight && !hasHotel) {
    return NextResponse.json(
      { error: "at least one target price required" },
      { status: 400 }
    );
  }

  const required = ["origin", "destination", "depart_from", "depart_to", "return_from", "return_to"] as const;
  for (const key of required) {
    if (!body[key]) {
      return NextResponse.json({ error: `${key} is required` }, { status: 400 });
    }
  }

  try {
    const { id, cancelToken } = createAlert({
      email: body.email!,
      origin: body.origin!,
      destination: body.destination!,
      depart_from: body.depart_from!,
      depart_to: body.depart_to!,
      return_from: body.return_from!,
      return_to: body.return_to!,
      adults: body.adults ?? 2,
      children: body.children ?? 0,
      flight_target_price: body.flight_target_price ?? null,
      hotel_target_price: body.hotel_target_price ?? null,
    });

    return NextResponse.json({ id, cancelToken }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "internal error" }, { status: 500 });
  }
}
