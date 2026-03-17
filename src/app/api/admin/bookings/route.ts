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

export async function PUT(request: NextRequest) {
  const { id, status } = await request.json();

  if (!id || !status) {
    return NextResponse.json(
      { error: "id and status are required" },
      { status: 400 }
    );
  }

  const validStatuses = ["PENDING", "AWAITING_CONFIRM", "CONFIRMED", "CANCELLED", "COMPLETED"];
  if (!validStatuses.includes(status)) {
    return NextResponse.json(
      { error: "Invalid status" },
      { status: 400 }
    );
  }

  const booking = await prisma.booking.update({
    where: { id },
    data: { status },
  });

  return NextResponse.json(booking);
}
