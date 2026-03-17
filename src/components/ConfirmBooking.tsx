"use client";

import { useState, useEffect, useRef } from "react";
import liff from "@line/liff";

const LIFF_ID = process.env.NEXT_PUBLIC_LIFF_ID!;

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
  if (satang === 0) return "ติดต่อสอบถาม";
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

function RedCheckmark() {
  return (
    <svg
      width="80"
      height="80"
      viewBox="0 0 80 80"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="40" cy="40" r="40" fill="#CC0000" />
      <path
        d="M24 40L35 51L56 30"
        stroke="white"
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function ConfirmBooking({ profile, service, slot, onClose }: Props) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bookingId, setBookingId] = useState<string | null>(null);
  const [phone, setPhone] = useState("");
  const [phoneSaved, setPhoneSaved] = useState(false);
  const [phoneError, setPhoneError] = useState("");
  const [savingPhone, setSavingPhone] = useState(false);
  const [countdown, setCountdown] = useState(3);
  const inputRef = useRef<HTMLInputElement>(null);

  // Initialize LIFF for closeWindow
  useEffect(() => {
    liff.init({ liffId: LIFF_ID }).catch(() => {});
  }, []);

  // Countdown after phone saved
  useEffect(() => {
    if (!phoneSaved) return;

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          if (liff.isInClient()) {
            liff.closeWindow();
          } else {
            window.close();
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [phoneSaved]);

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
        setBookingId(data.bookingId);
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "เกิดข้อผิดพลาด กรุณาลองใหม่"
      );
    } finally {
      setSubmitting(false);
    }
  }

  function formatPhoneDisplay(value: string): string {
    const digits = value.replace(/\D/g, "").slice(0, 10);
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
    return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
  }

  function handlePhoneChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value.replace(/\D/g, "").slice(0, 10);
    setPhone(raw);
    setPhoneError("");
  }

  async function handleSubmitPhone() {
    if (phone.length !== 10 || !phone.startsWith("0")) {
      setPhoneError("กรุณากรอกเบอร์โทร 10 หลัก (0xx-xxx-xxxx)");
      inputRef.current?.focus();
      return;
    }

    setSavingPhone(true);
    try {
      const res = await fetch("/api/bookings/phone", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId, phone }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error);
      }

      setPhoneSaved(true);
    } catch (err) {
      setPhoneError(
        err instanceof Error ? err.message : "เกิดข้อผิดพลาด กรุณาลองใหม่"
      );
    } finally {
      setSavingPhone(false);
    }
  }

  // Success state — show as popup
  if (bookingId) {
    return (
      <>
        <div className="fixed inset-0 bg-black/40 z-40 animate-[fadeIn_0.2s_ease-out]" />
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 animate-[fadeIn_0.3s_ease-out]">
          <div className="bg-white rounded-3xl px-6 py-8 w-full max-w-sm text-center shadow-xl">
            <div className="flex justify-center mb-5">
              <RedCheckmark />
            </div>
            <h2 className="text-2xl font-bold mb-2">จองสำเร็จ!</h2>
            <p className="text-text-secondary text-sm mb-1">
              ขอบคุณที่จองคิวกับโค้ชแกงส้มค่ะ
            </p>
            <p className="text-xs text-gray-400 mb-4">
              รหัสการจอง: {bookingId.slice(-6).toUpperCase()}
            </p>

            {!phoneSaved ? (
              <div className="mt-2">
                <p className="text-sm text-text-secondary mb-3">
                  กรุณากรอกเบอร์โทรเพื่อให้ติดต่อกลับ
                </p>
                <input
                  ref={inputRef}
                  type="tel"
                  inputMode="numeric"
                  value={formatPhoneDisplay(phone)}
                  onChange={handlePhoneChange}
                  placeholder="0xx-xxx-xxxx"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-center text-lg tracking-wider focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
                {phoneError && (
                  <p className="text-red-500 text-xs mt-2">{phoneError}</p>
                )}
                <button
                  onClick={handleSubmitPhone}
                  disabled={savingPhone || phone.length < 10}
                  className="w-full mt-3 bg-primary text-white py-3 rounded-xl font-semibold text-sm hover:bg-primary-dark transition-colors disabled:opacity-50 active:scale-[0.98]"
                >
                  {savingPhone ? "กำลังบันทึก..." : "ยืนยัน"}
                </button>
              </div>
            ) : (
              <div className="mt-2">
                <p className="text-sm text-text-secondary">
                  คุณจะได้รับข้อความยืนยันผ่าน LINE ค่ะ
                </p>
                <p className="text-sm text-gray-400 mt-4">
                  ปิดหน้าต่างอัตโนมัติใน {countdown} วินาที...
                </p>
              </div>
            )}
          </div>
        </div>
      </>
    );
  }

  // Confirm state — bottom sheet
  return (
    <>
      <div
        className="fixed inset-0 bg-black/40 z-40 animate-[fadeIn_0.2s_ease-out]"
        onClick={onClose}
      />
      <div className="fixed bottom-0 left-0 right-0 z-50 animate-[slideUp_0.3s_ease-out]">
        <div className="bg-white rounded-t-3xl px-6 pt-4 pb-[calc(1.5rem+var(--safe-area-bottom))] max-h-[85vh] overflow-y-auto">
          <div className="flex justify-center mb-4">
            <div className="w-10 h-1 bg-gray-300 rounded-full" />
          </div>

          <h2 className="font-bold text-lg mb-4">ยืนยันการจอง</h2>

          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-text-secondary">บริการ</span>
              <span className="font-medium">{service.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-secondary">วันที่</span>
              <span className="font-medium">{formatDate(slot.date)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-secondary">เวลา</span>
              <span className="font-medium">
                {slot.startTime} - {slot.endTime}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-secondary">ระยะเวลา</span>
              <span className="font-medium">{service.durationMin} นาที</span>
            </div>
            <hr className="my-2" />
            <div className="flex justify-between">
              <span className="font-semibold">รวมทั้งหมด</span>
              <span className="font-bold text-xl text-primary">
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
              className="flex-[2] bg-primary text-white py-4 rounded-2xl font-semibold text-sm hover:bg-primary-dark transition-colors disabled:opacity-50 active:scale-[0.98]"
            >
              {submitting
                ? "กำลังดำเนินการ..."
                : service.price > 0
                  ? `จองและชำระ ${formatPrice(service.price)}`
                  : "ยืนยันการจอง"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
