import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createBeamPayment } from "@/lib/beam";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { lineUserId, displayName, pictureUrl, serviceId, date, startTime, endTime } = body;

  if (!lineUserId || !displayName || !serviceId || !date || !startTime || !endTime) {
    return NextResponse.json(
      { error: "Missing required fields" },
      { status: 400 }
    );
  }

  try {
    const slotDate = new Date(date + "T00:00:00");

    // Atomic transaction to prevent double-booking
    const result = await prisma.$transaction(async (tx) => {
      // Upsert user by LINE userId
      const user = await tx.user.upsert({
        where: { lineUserId },
        update: { displayName, pictureUrl },
        create: { lineUserId, displayName, pictureUrl },
      });

      // Upsert the time slot (dynamic slots don't pre-exist in DB)
      const slot = await tx.timeSlot.upsert({
        where: { date_startTime: { date: slotDate, startTime } },
        update: {},
        create: {
          date: slotDate,
          startTime,
          endTime,
          available: true,
        },
        include: {
          bookings: {
            where: { status: { in: ["PENDING", "AWAITING_CONFIRM", "CONFIRMED"] } },
          },
        },
      });

      if (!slot.available || slot.bookings.length > 0) {
        throw new Error("คิวนี้ถูกจองแล้ว กรุณาเลือกคิวอื่น");
      }

      // Get service for price
      const service = await tx.service.findUnique({
        where: { id: serviceId },
      });

      if (!service || !service.active) {
        throw new Error("ไม่พบบริการนี้");
      }

      // Create booking
      const booking = await tx.booking.create({
        data: {
          userId: user.id,
          serviceId: service.id,
          timeSlotId: slot.id,
          totalPrice: service.price,
          status: "PENDING",
        },
      });

      return { booking, service, slot };
    });

    const { booking, service } = result;

    // Generate Beam payment link
    const { paymentUrl, paymentRef } = await createBeamPayment({
      bookingId: booking.id,
      amount: booking.totalPrice,
      description: `จองคิว ${service.name} - พี่แกงส้ม`,
    });

    if (paymentRef) {
      // Store payment reference
      await prisma.booking.update({
        where: { id: booking.id },
        data: { paymentRef },
      });
    } else if (!paymentUrl) {
      // No payment gateway — skip payment, go straight to awaiting confirmation
      await prisma.booking.update({
        where: { id: booking.id },
        data: { status: "AWAITING_CONFIRM" },
      });
    }

    return NextResponse.json({
      bookingId: booking.id,
      status: paymentUrl ? "PENDING" : "AWAITING_CONFIRM",
      paymentUrl: paymentUrl || undefined,
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "เกิดข้อผิดพลาด กรุณาลองใหม่";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
