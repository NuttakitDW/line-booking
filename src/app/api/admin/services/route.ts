import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const services = await prisma.service.findMany({
    orderBy: { name: "asc" },
  });
  return NextResponse.json(services);
}

export async function POST(request: NextRequest) {
  const { name, description, durationMin, price, active } =
    await request.json();

  if (!name || !durationMin || price == null) {
    return NextResponse.json(
      { error: "name, durationMin, and price are required" },
      { status: 400 }
    );
  }

  const service = await prisma.service.create({
    data: {
      name,
      description: description || null,
      durationMin,
      price,
      active: active ?? true,
    },
  });

  return NextResponse.json(service, { status: 201 });
}
