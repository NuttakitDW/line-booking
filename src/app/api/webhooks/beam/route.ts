import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendBookingReceipt } from "@/lib/line";

export async function POST(request: NextRequest) {
  const body = await request.json();

  const { orderId, status } = body;

  if (!orderId) {
    return NextResponse.json({ error: "Missing orderId" }, { status: 400 });
  }

  try {
    if (status === "completed" || status === "success") {
      // Update booking to CONFIRMED
      const booking = await prisma.booking.update({
        where: { id: orderId },
        data: { status: "CONFIRMED" },
        include: {
          user: true,
          service: true,
          timeSlot: true,
        },
      });

      // Send LINE Flex Message receipt
      const date = new Date(booking.timeSlot.date).toLocaleDateString("th-TH", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      });

      await sendBookingReceipt(booking.user.lineUserId, {
        serviceName: booking.service.name,
        date,
        startTime: booking.timeSlot.startTime,
        endTime: booking.timeSlot.endTime,
        totalPrice: booking.totalPrice,
        bookingId: booking.id,
      });
    } else if (status === "failed" || status === "expired") {
      // Cancel the booking to free the slot
      await prisma.booking.update({
        where: { id: orderId },
        data: { status: "CANCELLED" },
      });
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("Beam webhook error:", err);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}
