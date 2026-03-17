"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useState, useEffect, useRef } from "react";
import liff from "@line/liff";

const LIFF_ID = process.env.NEXT_PUBLIC_LIFF_ID!;

function SuccessContent() {
  const searchParams = useSearchParams();
  const bookingId = searchParams.get("id");
  const [phone, setPhone] = useState("");
  const [phoneSaved, setPhoneSaved] = useState(false);
  const [phoneError, setPhoneError] = useState("");
  const [saving, setSaving] = useState(false);
  const [countdown, setCountdown] = useState(3);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    liff.init({ liffId: LIFF_ID }).catch(() => {});
  }, []);

  // Start countdown only after phone is saved
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

    setSaving(true);
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
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
      <div className="text-6xl mb-6">✅</div>
      <h1 className="text-2xl font-bold mb-2">จองสำเร็จ!</h1>
      <p className="text-[var(--color-text-secondary)] mb-2">
        ขอบคุณที่จองคิวกับพี่แกงส้มค่ะ
      </p>
      {bookingId && (
        <p className="text-sm text-[var(--color-text-secondary)]">
          รหัสการจอง: {bookingId.slice(-6).toUpperCase()}
        </p>
      )}

      {!phoneSaved ? (
        <div className="w-full max-w-xs mt-6">
          <p className="text-sm text-gray-600 mb-3">
            กรุณากรอกเบอร์โทรเพื่อให้ร้านติดต่อกลับ
          </p>
          <input
            ref={inputRef}
            type="tel"
            inputMode="numeric"
            value={formatPhoneDisplay(phone)}
            onChange={handlePhoneChange}
            placeholder="0xx-xxx-xxxx"
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-center text-lg tracking-wider focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent"
          />
          {phoneError && (
            <p className="text-red-500 text-xs mt-2">{phoneError}</p>
          )}
          <button
            onClick={handleSubmitPhone}
            disabled={saving || phone.length < 10}
            className="w-full mt-3 bg-[var(--color-primary)] text-white py-3 rounded-xl font-semibold text-sm hover:bg-[var(--color-primary-dark)] transition-colors disabled:opacity-50 active:scale-[0.98]"
          >
            {saving ? "กำลังบันทึก..." : "ยืนยัน"}
          </button>
        </div>
      ) : (
        <>
          <p className="text-sm text-[var(--color-text-secondary)] mt-4">
            คุณจะได้รับข้อความยืนยันผ่าน LINE ค่ะ
          </p>
          <p className="text-sm text-gray-400 mt-6">
            ปิดหน้าต่างอัตโนมัติใน {countdown} วินาที...
          </p>
        </>
      )}
    </div>
  );
}

export default function BookingSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          Loading...
        </div>
      }
    >
      <SuccessContent />
    </Suspense>
  );
}
