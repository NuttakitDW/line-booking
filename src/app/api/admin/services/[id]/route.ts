import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const data = await request.json();

  const service = await prisma.service.update({
    where: { id },
    data: {
      name: data.name,
      description: data.description,
      durationMin: data.durationMin,
      price: data.price,
      active: data.active,
    },
  });

  return NextResponse.json(service);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  // Soft-delete by deactivating
  const service = await prisma.service.update({
    where: { id },
    data: { active: false },
  });

  return NextResponse.json(service);
}
