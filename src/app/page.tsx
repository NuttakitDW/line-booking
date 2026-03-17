"use client";

import { LiffProvider, useLiff } from "@/components/LiffProvider";
import { LoadingSkeleton } from "@/components/LoadingSkeleton";
import { BookingFlow } from "@/components/BookingFlow";

function HomePage() {
  const { profile, loading, error } = useLiff();

  if (loading) return <LoadingSkeleton />;

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
        <div className="text-5xl mb-4">😅</div>
        <h1 className="text-xl font-bold mb-2">เปิดผ่าน LINE นะคะ</h1>
        <p className="text-text-secondary mb-6">
          กรุณาเปิดลิงก์นี้ผ่านแอป LINE
        </p>
        <a
          href={`https://liff.line.me/${process.env.NEXT_PUBLIC_LIFF_ID}`}
          className="bg-primary text-white px-8 py-3 rounded-full font-semibold text-lg hover:bg-primary-dark transition-colors"
        >
          เปิดใน LINE
        </a>
      </div>
    );
  }

  if (!profile) return <LoadingSkeleton />;

  return <BookingFlow profile={profile} />;
}

export default function Page() {
  return (
    <LiffProvider>
      <HomePage />
    </LiffProvider>
  );
}
