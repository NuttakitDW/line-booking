"use client";

import { useState } from "react";

interface Profile {
  userId: string;
  displayName: string;
  pictureUrl?: string;
}

interface Service {
  id: string;
  name: string;
  durationMin: number;
  price: number;
}

interface TimeSlot {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
}

interface Props {
  profile: Profile;
  service: Service;
  slot: TimeSlot;
}

function formatPrice(satang: number): string {
  return `฿${(satang / 100).toLocaleString()}`;
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("th-TH", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function ConfirmBooking({ profile, service, slot }: Props) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleConfirm() {
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lineUserId: profile.userId,
          displayName: profile.displayName,
          pictureUrl: profile.pictureUrl,
          serviceId: service.id,
          timeSlotId: slot.id,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "การจองไม่สำเร็จ");
      }

      // If there's a payment URL, redirect to Beam
      if (data.paymentUrl) {
        window.location.href = data.paymentUrl;
      } else {
        // Booking confirmed directly (free service or test mode)
        window.location.href = `/booking/success?id=${data.bookingId}`;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "เกิดข้อผิดพลาด กรุณาลองใหม่");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Summary card */}
      <div className="bg-white rounded-2xl p-6 shadow-sm">
        <h2 className="font-bold text-lg mb-4">ยืนยันการจอง</h2>

        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-[var(--color-text-secondary)]">บริการ</span>
            <span className="font-medium">{service.name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[var(--color-text-secondary)]">วันที่</span>
            <span className="font-medium">{formatDate(slot.date)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[var(--color-text-secondary)]">เวลา</span>
            <span className="font-medium">
              {slot.startTime} - {slot.endTime}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-[var(--color-text-secondary)]">ระยะเวลา</span>
            <span className="font-medium">{service.durationMin} นาที</span>
          </div>
          <hr className="my-2" />
          <div className="flex justify-between">
            <span className="font-semibold">รวมทั้งหมด</span>
            <span className="font-bold text-xl text-[var(--color-primary)]">
              {formatPrice(service.price)}
            </span>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 rounded-xl p-4 text-sm text-center">
          {error}
        </div>
      )}

      {/* Confirm button */}
      <div className="pb-[var(--safe-area-bottom)]">
        <button
          onClick={handleConfirm}
          disabled={submitting}
          className="w-full bg-[var(--color-primary)] text-white py-4 rounded-2xl font-semibold text-lg hover:bg-[var(--color-primary-dark)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
        >
          {submitting ? "กำลังดำเนินการ..." : `จองและชำระ ${formatPrice(service.price)}`}
        </button>
      </div>
    </div>
  );
}
