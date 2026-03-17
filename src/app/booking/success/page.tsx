"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useState, useEffect } from "react";
import liff from "@line/liff";

const LIFF_ID = process.env.NEXT_PUBLIC_LIFF_ID!;

function SuccessContent() {
  const searchParams = useSearchParams();
  const bookingId = searchParams.get("id");
  const [countdown, setCountdown] = useState(3);

  useEffect(() => {
    // Initialize LIFF first, then start countdown
    liff.init({ liffId: LIFF_ID }).catch(() => {});

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
  }, []);

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
      <p className="text-sm text-[var(--color-text-secondary)] mt-4">
        คุณจะได้รับข้อความยืนยันผ่าน LINE ค่ะ
      </p>
      <p className="text-sm text-gray-400 mt-6">
        ปิดหน้าต่างอัตโนมัติใน {countdown} วินาที...
      </p>
    </div>
  );
}

export default function BookingSuccessPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <SuccessContent />
    </Suspense>
  );
}
