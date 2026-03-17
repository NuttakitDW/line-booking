import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const year = parseInt(searchParams.get("year") || "", 10);
  const month = parseInt(searchParams.get("month") || "", 10);

  const where =
    year && month
      ? {
          date: {
            gte: new Date(year, month - 1, 1),
            lte: new Date(year, month, 0),
          },
        }
      : {};

  const blockedDates = await prisma.blockedDate.findMany({
    where,
    orderBy: { date: "asc" },
  });

  return NextResponse.json(blockedDates);
}

export async function POST(request: NextRequest) {
  const { date, reason } = await request.json();

  if (!date) {
    return NextResponse.json({ error: "date is required" }, { status: 400 });
  }

  const blocked = await prisma.blockedDate.upsert({
    where: { date: new Date(date) },
    update: { reason },
    create: { date: new Date(date), reason },
  });

  return NextResponse.json(blocked, { status: 201 });
}

export async function DELETE(request: NextRequest) {
  const { date } = await request.json();

  if (!date) {
    return NextResponse.json({ error: "date is required" }, { status: 400 });
  }

  await prisma.blockedDate.delete({
    where: { date: new Date(date) },
  });

  return NextResponse.json({ success: true });
}
