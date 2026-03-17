import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const serviceId = searchParams.get("serviceId");

  if (!serviceId) {
    return NextResponse.json({ error: "serviceId is required" }, { status: 400 });
  }

  // Get today's date in Bangkok timezone
  const now = new Date();
  const bangkokNow = new Date(
    now.toLocaleString("en-US", { timeZone: "Asia/Bangkok" })
  );
  bangkokNow.setHours(0, 0, 0, 0);

  const slots = await prisma.timeSlot.findMany({
    where: {
      available: true,
      date: { gte: bangkokNow },
      bookings: {
        none: {
          status: { in: ["PENDING", "AWAITING_CONFIRM", "CONFIRMED"] },
        },
      },
    },
    orderBy: [{ date: "asc" }, { startTime: "asc" }],
    take: 30,
  });

  return NextResponse.json(slots);
}
