"use client";

import { useState, useEffect } from "react";

interface Booking {
  id: string;
  status: string;
  totalPrice: number;
  user: { displayName: string };
  service: { name: string };
  timeSlot: { date: string; startTime: string; endTime: string };
}

export default function AdminDashboardPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/bookings")
      .then((r) => r.json())
      .then((data) => setBookings(data))
      .finally(() => setLoading(false));
  }, []);

  const today = new Date().toISOString().split("T")[0];
  const todayBookings = bookings.filter(
    (b) =>
      b.timeSlot.date.startsWith(today) &&
      ["PENDING", "AWAITING_CONFIRM", "CONFIRMED"].includes(b.status)
  );
  const confirmedCount = bookings.filter(
    (b) => b.status === "CONFIRMED"
  ).length;
  const awaitingCount = bookings.filter(
    (b) => b.status === "AWAITING_CONFIRM"
  ).length;

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="skeleton h-8 w-48 rounded" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="skeleton h-24 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-xl font-bold text-gray-800 mb-6">แดชบอร์ด</h2>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-xl p-5 shadow-sm">
          <p className="text-sm text-gray-400">คิววันนี้</p>
          <p className="text-3xl font-bold text-gray-800 mt-1">
            {todayBookings.length}
          </p>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm">
          <p className="text-sm text-gray-400">ยืนยันแล้ว</p>
          <p className="text-3xl font-bold text-green-600 mt-1">
            {confirmedCount}
          </p>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm">
          <p className="text-sm text-gray-400">รอยืนยัน</p>
          <p className="text-3xl font-bold text-blue-500 mt-1">
            {awaitingCount}
          </p>
        </div>
      </div>

      {/* Today's bookings */}
      <h3 className="font-semibold text-gray-700 mb-3">คิววันนี้</h3>
      {todayBookings.length === 0 ? (
        <p className="text-gray-400 text-sm">ไม่มีคิววันนี้</p>
      ) : (
        <div className="bg-white rounded-xl shadow-sm divide-y">
          {todayBookings.map((b) => (
            <div key={b.id} className="p-4 flex justify-between items-center">
              <div>
                <p className="font-medium text-sm">{b.user.displayName}</p>
                <p className="text-xs text-gray-400">
                  {b.service.name} | {b.timeSlot.startTime} -{" "}
                  {b.timeSlot.endTime}
                </p>
              </div>
              <span
                className={`text-xs px-2 py-1 rounded-full ${
                  b.status === "CONFIRMED"
                    ? "bg-green-100 text-green-700"
                    : b.status === "AWAITING_CONFIRM"
                      ? "bg-blue-100 text-blue-700"
                      : "bg-amber-100 text-amber-700"
                }`}
              >
                {b.status === "CONFIRMED" ? "ยืนยันแล้ว" : b.status === "AWAITING_CONFIRM" ? "รอยืนยัน" : "รอชำระ"}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
