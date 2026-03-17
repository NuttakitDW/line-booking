"use client";

import { useState, useEffect } from "react";

interface Booking {
  id: string;
  status: string;
  totalPrice: number;
  createdAt: string;
  user: { displayName: string; lineUserId: string };
  service: { name: string; durationMin: number };
  timeSlot: { date: string; startTime: string; endTime: string };
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  PENDING: { label: "รอชำระ", color: "bg-amber-100 text-amber-700" },
  CONFIRMED: { label: "ยืนยันแล้ว", color: "bg-green-100 text-green-700" },
  CANCELLED: { label: "ยกเลิก", color: "bg-red-100 text-red-700" },
  COMPLETED: { label: "เสร็จสิ้น", color: "bg-blue-100 text-blue-700" },
};

function formatPrice(satang: number): string {
  return `฿${(satang / 100).toLocaleString()}`;
}

export default function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");

  useEffect(() => {
    const params = new URLSearchParams();
    if (statusFilter) params.set("status", statusFilter);

    fetch(`/api/admin/bookings?${params}`)
      .then((r) => r.json())
      .then((data) => setBookings(data))
      .finally(() => setLoading(false));
  }, [statusFilter]);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="skeleton h-8 w-48 rounded" />
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="skeleton h-16 rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-800">รายการจอง</h2>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm"
        >
          <option value="">ทั้งหมด</option>
          <option value="PENDING">รอชำระ</option>
          <option value="CONFIRMED">ยืนยันแล้ว</option>
          <option value="CANCELLED">ยกเลิก</option>
          <option value="COMPLETED">เสร็จสิ้น</option>
        </select>
      </div>

      {bookings.length === 0 ? (
        <p className="text-gray-400 text-sm">ไม่มีรายการจอง</p>
      ) : (
        <div className="bg-white rounded-xl shadow-sm divide-y">
          {bookings.map((b) => {
            const status = STATUS_LABELS[b.status] || {
              label: b.status,
              color: "bg-gray-100 text-gray-600",
            };
            return (
              <div key={b.id} className="p-4">
                <div className="flex items-center justify-between mb-1">
                  <p className="font-medium text-sm">{b.user.displayName}</p>
                  <span
                    className={`text-xs px-2 py-1 rounded-full ${status.color}`}
                  >
                    {status.label}
                  </span>
                </div>
                <p className="text-xs text-gray-400">
                  {b.service.name} |{" "}
                  {new Date(b.timeSlot.date).toLocaleDateString("th-TH", {
                    day: "numeric",
                    month: "short",
                  })}{" "}
                  {b.timeSlot.startTime} - {b.timeSlot.endTime} |{" "}
                  {formatPrice(b.totalPrice)}
                </p>
                <p className="text-xs text-gray-300 mt-0.5">
                  ID: {b.id.slice(0, 8)}
                </p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
