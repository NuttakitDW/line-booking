import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const status = searchParams.get("status");
  const date = searchParams.get("date");

  const where: Record<string, unknown> = {};

  if (status) {
    where.status = status;
  }

  if (date) {
    where.timeSlot = { date: new Date(date) };
  }

  const bookings = await prisma.booking.findMany({
    where,
    include: {
      user: { select: { displayName: true, lineUserId: true } },
      service: { select: { name: true, durationMin: true } },
      timeSlot: { select: { date: true, startTime: true, endTime: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return NextResponse.json(bookings);
}
