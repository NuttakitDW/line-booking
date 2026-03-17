import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  const { bookingId, phone } = await request.json();

  if (!bookingId || !phone) {
    return NextResponse.json(
      { error: "bookingId and phone are required" },
      { status: 400 }
    );
  }

  // Validate Thai phone number format
  const cleaned = phone.replace(/\D/g, "");
  if (!/^0\d{9}$/.test(cleaned)) {
    return NextResponse.json(
      { error: "กรุณากรอกเบอร์โทรให้ถูกต้อง (0xx-xxx-xxxx)" },
      { status: 400 }
    );
  }

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
  });

  if (!booking) {
    return NextResponse.json(
      { error: "ไม่พบรายการจอง" },
      { status: 404 }
    );
  }

  // Save phone to user
  await prisma.user.update({
    where: { id: booking.userId },
    data: { phone: cleaned },
  });

  return NextResponse.json({ success: true });
}
