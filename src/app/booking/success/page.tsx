"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function SuccessContent() {
  const searchParams = useSearchParams();
  const bookingId = searchParams.get("id");

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
      <div className="text-6xl mb-6">✅</div>
      <h1 className="text-2xl font-bold mb-2">จองสำเร็จ!</h1>
      <p className="text-[var(--color-text-secondary)] mb-2">
        ขอบคุณที่จองคิวกับพี่แกงส้มค่ะ
      </p>
      {bookingId && (
        <p className="text-sm text-[var(--color-text-secondary)]">
          รหัสการจอง: {bookingId}
        </p>
      )}
      <p className="text-sm text-[var(--color-text-secondary)] mt-4">
        คุณจะได้รับข้อความยืนยันผ่าน LINE ค่ะ
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
