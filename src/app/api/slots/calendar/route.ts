import { NextRequest, NextResponse } from "next/server";
import { getAvailableDatesForMonth } from "@/lib/slots";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const year = parseInt(searchParams.get("year") || "", 10);
  const month = parseInt(searchParams.get("month") || "", 10);

  if (!year || !month || month < 1 || month > 12) {
    return NextResponse.json(
      { error: "year and month (1-12) are required" },
      { status: 400 }
    );
  }

  try {
    const result = await getAvailableDatesForMonth(year, month);
    const res = NextResponse.json(result);
    res.headers.set("Cache-Control", "public, s-maxage=30, stale-while-revalidate=120");
    return res;
  } catch (err) {
    console.error("Calendar API error:", err);
    return NextResponse.json(
      { error: String(err) },
      { status: 500 }
    );
  }
}
