import { NextRequest, NextResponse } from "next/server";
import { getAvailableSlotsForDate } from "@/lib/slots";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const date = searchParams.get("date");

  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json(
      { error: "date is required (YYYY-MM-DD)" },
      { status: 400 }
    );
  }

  const slots = await getAvailableSlotsForDate(date);
  return NextResponse.json(slots);
}
