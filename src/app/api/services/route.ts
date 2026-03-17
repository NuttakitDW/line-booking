import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const services = await prisma.service.findMany({
      where: { active: true },
      orderBy: { name: "asc" },
    });
    const res = NextResponse.json(services);
    res.headers.set("Cache-Control", "public, s-maxage=60, stale-while-revalidate=300");
    return res;
  } catch (error) {
    console.error("Failed to fetch services:", error);
    return NextResponse.json([], { status: 500 });
  }
}
