import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const schedules = await prisma.schedule.findMany({
    orderBy: { dayOfWeek: "asc" },
  });
  return NextResponse.json(schedules);
}

export async function PUT(request: NextRequest) {
  const schedules: {
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    slotDuration: number;
    active: boolean;
  }[] = await request.json();

  const results = await Promise.all(
    schedules.map((s) =>
      prisma.schedule.upsert({
        where: { dayOfWeek: s.dayOfWeek },
        update: {
          startTime: s.startTime,
          endTime: s.endTime,
          slotDuration: s.slotDuration,
          active: s.active,
        },
        create: {
          dayOfWeek: s.dayOfWeek,
          startTime: s.startTime,
          endTime: s.endTime,
          slotDuration: s.slotDuration,
          active: s.active,
        },
      })
    )
  );

  return NextResponse.json(results);
}
