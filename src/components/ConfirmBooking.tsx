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
  date: string;
  startTime: string;
  endTime: string;
}

interface Props {
  profile: Profile;
  service: Service;
  slot: TimeSlot;
  onClose: () => void;
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

export function ConfirmBooking({ profile, service, slot, onClose }: Props) {
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
          date: slot.date,
          startTime: slot.startTime,
          endTime: slot.endTime,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "การจองไม่สำเร็จ");
      }

      if (data.paymentUrl) {
        window.location.href = data.paymentUrl;
      } else {
        window.location.href = `/booking/success?id=${data.bookingId}`;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "เกิดข้อผิดพลาด กรุณาลองใหม่");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 z-40 animate-[fadeIn_0.2s_ease-out]"
        onClick={onClose}
      />

      {/* Bottom sheet */}
      <div className="fixed bottom-0 left-0 right-0 z-50 animate-[slideUp_0.3s_ease-out]">
        <div className="bg-white rounded-t-3xl px-6 pt-4 pb-[calc(1.5rem+var(--safe-area-bottom))] max-h-[85vh] overflow-y-auto">
          {/* Handle bar */}
          <div className="flex justify-center mb-4">
            <div className="w-10 h-1 bg-gray-300 rounded-full" />
          </div>

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

          {error && (
            <div className="bg-red-50 text-red-600 rounded-xl p-4 text-sm text-center mt-4">
              {error}
            </div>
          )}

          <div className="flex gap-3 mt-6">
            <button
              onClick={onClose}
              disabled={submitting}
              className="flex-1 py-4 rounded-2xl font-semibold text-sm border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              ยกเลิก
            </button>
            <button
              onClick={handleConfirm}
              disabled={submitting}
              className="flex-[2] bg-[var(--color-primary)] text-white py-4 rounded-2xl font-semibold text-sm hover:bg-[var(--color-primary-dark)] transition-colors disabled:opacity-50 active:scale-[0.98]"
            >
              {submitting ? "กำลังดำเนินการ..." : `จองและชำระ ${formatPrice(service.price)}`}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
