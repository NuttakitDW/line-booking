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

type PaymentMethod = "promptpay" | "card";
type Step = "confirm" | "payment" | "processing" | "phone" | "done";

export function ConfirmBooking({ profile, service, slot, onClose }: Props) {
  const [step, setStep] = useState<Step>("confirm");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bookingId, setBookingId] = useState<string | null>(null);
  const [phone, setPhone] = useState("");
  const [phoneSaved, setPhoneSaved] = useState(false);
  const [phoneError, setPhoneError] = useState("");
  const [savingPhone, setSavingPhone] = useState(false);
  const [countdown, setCountdown] = useState(3);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("promptpay");
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvc, setCardCvc] = useState("");
  const [cardName, setCardName] = useState("");
  const [processingProgress, setProcessingProgress] = useState(0);
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

  // Fake processing animation
  useEffect(() => {
    if (step !== "processing") return;

    let progress = 0;
    const timer = setInterval(() => {
      progress += Math.random() * 15 + 5;
      if (progress >= 100) {
        progress = 100;
        clearInterval(timer);
        setTimeout(() => setStep("phone"), 500);
      }
      setProcessingProgress(Math.min(progress, 100));
    }, 300);

    return () => clearInterval(timer);
  }, [step]);

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

      setBookingId(data.bookingId);
      setStep("payment");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "เกิดข้อผิดพลาด กรุณาลองใหม่"
      );
    } finally {
      setSubmitting(false);
    }
  }

  function handleMockPayment() {
    if (paymentMethod === "card") {
      const digits = cardNumber.replace(/\s/g, "");
      if (digits.length < 16) return;
      if (cardExpiry.length < 5) return;
      if (cardCvc.length < 3) return;
      if (!cardName.trim()) return;
    }
    setStep("processing");
  }

  function formatCardNumber(value: string): string {
    const digits = value.replace(/\D/g, "").slice(0, 16);
    return digits.replace(/(.{4})/g, "$1 ").trim();
  }

  function formatExpiry(value: string): string {
    const digits = value.replace(/\D/g, "").slice(0, 4);
    if (digits.length <= 2) return digits;
    return `${digits.slice(0, 2)}/${digits.slice(2)}`;
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

  // Payment processing animation
  if (step === "processing") {
    return (
      <>
        <div className="fixed inset-0 bg-black/40 z-40" />
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
          <div className="bg-white rounded-3xl px-8 py-10 w-full max-w-sm text-center shadow-xl animate-[fadeIn_0.2s_ease-out]">
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 rounded-full border-4 border-gray-200 border-t-primary animate-spin" />
            </div>
            <h2 className="text-lg font-bold mb-2">กำลังดำเนินการชำระเงิน</h2>
            <p className="text-text-secondary text-sm mb-6">กรุณารอสักครู่...</p>
            <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all duration-300 ease-out"
                style={{ width: `${processingProgress}%` }}
              />
            </div>
            <p className="text-xs text-gray-400 mt-3">
              {processingProgress < 50
                ? "กำลังตรวจสอบข้อมูล..."
                : processingProgress < 90
                  ? "กำลังดำเนินการชำระเงิน..."
                  : "เสร็จสิ้น!"}
            </p>
          </div>
        </div>
      </>
    );
  }

  // Phone collection after payment
  if (step === "phone" || step === "done") {
    return (
      <>
        <div className="fixed inset-0 bg-black/40 z-40 animate-[fadeIn_0.2s_ease-out]" />
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 animate-[fadeIn_0.3s_ease-out]">
          <div className="bg-white rounded-3xl px-6 py-8 w-full max-w-sm text-center shadow-xl">
            <div className="flex justify-center mb-5">
              <RedCheckmark />
            </div>
            <h2 className="text-2xl font-bold mb-2">ชำระเงินสำเร็จ!</h2>
            <p className="text-text-secondary text-sm mb-1">
              ขอบคุณที่จองคิวกับโค้ชแกงส้มค่ะ
            </p>
            {bookingId && (
              <p className="text-xs text-gray-400 mb-4">
                รหัสการจอง: {bookingId.slice(-6).toUpperCase()}
              </p>
            )}

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

  // Mock payment screen
  if (step === "payment") {
    return (
      <>
        <div className="fixed inset-0 bg-black/40 z-40 animate-[fadeIn_0.2s_ease-out]" />
        <div className="fixed bottom-0 left-0 right-0 z-50 animate-[slideUp_0.3s_ease-out]">
          <div className="bg-white rounded-t-3xl px-6 pt-4 pb-[calc(1.5rem+var(--safe-area-bottom))] max-h-[90vh] overflow-y-auto">
            <div className="flex justify-center mb-3">
              <div className="w-10 h-1 bg-gray-300 rounded-full" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
                    <line x1="1" y1="10" x2="23" y2="10" />
                  </svg>
                </div>
                <span className="font-bold text-sm">ชำระเงิน</span>
              </div>
              <div className="flex items-center gap-1">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0110 0v4" />
                </svg>
                <span className="text-xs text-green-600 font-medium">Secured</span>
              </div>
            </div>

            {/* Amount summary */}
            <div className="bg-gray-50 rounded-2xl p-4 mb-5">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-xs text-text-secondary">ยอดชำระ</p>
                  <p className="text-2xl font-bold text-primary">{formatPrice(service.price)}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-text-secondary">{service.name}</p>
                  <p className="text-xs text-gray-400">{slot.startTime} - {slot.endTime}</p>
                </div>
              </div>
            </div>

            {/* Payment method tabs */}
            <div className="flex gap-2 mb-5">
              <button
                onClick={() => setPaymentMethod("promptpay")}
                className={`flex-1 py-3 rounded-xl text-sm font-medium transition-all ${
                  paymentMethod === "promptpay"
                    ? "bg-primary text-white shadow-sm"
                    : "bg-gray-100 text-gray-600"
                }`}
              >
                <span className="block text-base mb-0.5">📱</span>
                PromptPay
              </button>
              <button
                onClick={() => setPaymentMethod("card")}
                className={`flex-1 py-3 rounded-xl text-sm font-medium transition-all ${
                  paymentMethod === "card"
                    ? "bg-primary text-white shadow-sm"
                    : "bg-gray-100 text-gray-600"
                }`}
              >
                <span className="block text-base mb-0.5">💳</span>
                บัตรเครดิต/เดบิต
              </button>
            </div>

            {/* PromptPay QR */}
            {paymentMethod === "promptpay" && (
              <div className="text-center animate-[fadeIn_0.2s_ease-out]">
                <div className="bg-white border-2 border-gray-100 rounded-2xl p-6 mb-4 inline-block">
                  {/* Mock QR code pattern */}
                  <div className="w-48 h-48 mx-auto relative">
                    <svg viewBox="0 0 200 200" className="w-full h-full">
                      {/* QR border */}
                      <rect x="0" y="0" width="200" height="200" fill="white" />
                      {/* Corner patterns */}
                      <rect x="10" y="10" width="50" height="50" rx="4" fill="#1a1a1b" />
                      <rect x="16" y="16" width="38" height="38" rx="2" fill="white" />
                      <rect x="22" y="22" width="26" height="26" rx="2" fill="#1a1a1b" />
                      <rect x="140" y="10" width="50" height="50" rx="4" fill="#1a1a1b" />
                      <rect x="146" y="16" width="38" height="38" rx="2" fill="white" />
                      <rect x="152" y="22" width="26" height="26" rx="2" fill="#1a1a1b" />
                      <rect x="10" y="140" width="50" height="50" rx="4" fill="#1a1a1b" />
                      <rect x="16" y="146" width="38" height="38" rx="2" fill="white" />
                      <rect x="22" y="152" width="26" height="26" rx="2" fill="#1a1a1b" />
                      {/* Center data pattern */}
                      {Array.from({ length: 8 }).map((_, row) =>
                        Array.from({ length: 8 }).map((_, col) => {
                          const show = (row * 8 + col + row) % 3 !== 0;
                          return show ? (
                            <rect
                              key={`${row}-${col}`}
                              x={70 + col * 8}
                              y={70 + row * 8}
                              width="6"
                              height="6"
                              rx="1"
                              fill="#1a1a1b"
                            />
                          ) : null;
                        })
                      )}
                      {/* Scattered data blocks */}
                      {[
                        [70, 15], [80, 20], [90, 10], [100, 25], [110, 15], [120, 30],
                        [15, 70], [25, 80], [15, 90], [30, 100], [20, 110], [15, 120],
                        [70, 150], [85, 155], [95, 145], [105, 160], [115, 150], [125, 155],
                        [150, 70], [160, 80], [155, 95], [145, 105], [160, 115], [150, 125],
                      ].map(([x, y], i) => (
                        <rect key={`d-${i}`} x={x} y={y} width="6" height="6" rx="1" fill="#1a1a1b" />
                      ))}
                      {/* PromptPay logo center */}
                      <rect x="85" y="85" width="30" height="30" rx="6" fill="#CC0000" />
                      <text x="100" y="105" textAnchor="middle" fill="white" fontSize="14" fontWeight="bold">P</text>
                    </svg>
                  </div>
                </div>
                <p className="text-sm text-text-secondary mb-1">
                  สแกน QR Code เพื่อชำระเงิน
                </p>
                <p className="text-xs text-gray-400 mb-5">
                  รองรับทุกแอปธนาคาร
                </p>
                <button
                  onClick={handleMockPayment}
                  className="w-full bg-primary text-white py-4 rounded-2xl font-semibold text-sm hover:bg-primary-dark transition-colors active:scale-[0.98]"
                >
                  ชำระเงินแล้ว
                </button>
              </div>
            )}

            {/* Credit/Debit card form */}
            {paymentMethod === "card" && (
              <div className="space-y-4 animate-[fadeIn_0.2s_ease-out]">
                <div>
                  <label className="block text-xs text-text-secondary mb-1.5 ml-1">หมายเลขบัตร</label>
                  <div className="relative">
                    <input
                      type="text"
                      inputMode="numeric"
                      value={formatCardNumber(cardNumber)}
                      onChange={(e) => setCardNumber(e.target.value.replace(/\D/g, "").slice(0, 16))}
                      placeholder="0000 0000 0000 0000"
                      className="w-full border border-gray-200 rounded-xl px-4 py-3.5 text-sm tracking-wider focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent pr-16"
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 flex gap-1">
                      <div className="w-8 h-5 bg-blue-600 rounded-sm flex items-center justify-center">
                        <span className="text-white text-[7px] font-bold">VISA</span>
                      </div>
                      <div className="w-8 h-5 bg-red-500 rounded-sm flex items-center justify-center">
                        <div className="flex -space-x-1">
                          <div className="w-2.5 h-2.5 rounded-full bg-red-400 opacity-80" />
                          <div className="w-2.5 h-2.5 rounded-full bg-yellow-400 opacity-80" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="flex-1">
                    <label className="block text-xs text-text-secondary mb-1.5 ml-1">วันหมดอายุ</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={formatExpiry(cardExpiry)}
                      onChange={(e) => setCardExpiry(e.target.value.replace(/\D/g, "").slice(0, 4))}
                      placeholder="MM/YY"
                      className="w-full border border-gray-200 rounded-xl px-4 py-3.5 text-sm tracking-wider focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                  </div>
                  <div className="w-28">
                    <label className="block text-xs text-text-secondary mb-1.5 ml-1">CVC</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={cardCvc}
                      onChange={(e) => setCardCvc(e.target.value.replace(/\D/g, "").slice(0, 3))}
                      placeholder="123"
                      maxLength={3}
                      className="w-full border border-gray-200 rounded-xl px-4 py-3.5 text-sm tracking-wider focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-text-secondary mb-1.5 ml-1">ชื่อบนบัตร</label>
                  <input
                    type="text"
                    value={cardName}
                    onChange={(e) => setCardName(e.target.value)}
                    placeholder="SOMCHAI JAIDEE"
                    className="w-full border border-gray-200 rounded-xl px-4 py-3.5 text-sm uppercase tracking-wider focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>

                <button
                  onClick={handleMockPayment}
                  disabled={
                    cardNumber.replace(/\s/g, "").length < 16 ||
                    cardExpiry.length < 4 ||
                    cardCvc.length < 3 ||
                    !cardName.trim()
                  }
                  className="w-full bg-primary text-white py-4 rounded-2xl font-semibold text-sm hover:bg-primary-dark transition-colors disabled:opacity-40 active:scale-[0.98] mt-2"
                >
                  ชำระเงิน {formatPrice(service.price)}
                </button>
              </div>
            )}

            {/* Security badges */}
            <div className="flex items-center justify-center gap-4 mt-5 pt-4 border-t border-gray-100">
              <div className="flex items-center gap-1 text-gray-400">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
                <span className="text-[10px]">SSL Encrypted</span>
              </div>
              <div className="flex items-center gap-1 text-gray-400">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
                <span className="text-[10px]">PCI DSS Compliant</span>
              </div>
            </div>
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
