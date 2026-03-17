"use client";

import { useState, useEffect, useCallback } from "react";
import { MonthCalendar } from "@/components/MonthCalendar";

interface BlockedDate {
  id: string;
  date: string;
  reason: string | null;
}

export default function BlockedDatesPage() {
  const [blockedDates, setBlockedDates] = useState<Set<string>>(new Set());
  const [blockedReasons, setBlockedReasons] = useState<Map<string, string>>(
    new Map()
  );
  const [viewYear, setViewYear] = useState(new Date().getFullYear());
  const [viewMonth, setViewMonth] = useState(new Date().getMonth() + 1);
  const [saving, setSaving] = useState(false);

  const fetchBlocked = useCallback(
    (year: number, month: number) => {
      fetch(`/api/admin/blocked-dates?year=${year}&month=${month}`)
        .then((r) => r.json())
        .then((data: BlockedDate[]) => {
          const dates = new Set<string>();
          const reasons = new Map<string, string>();
          for (const b of data) {
            const dateStr = b.date.split("T")[0];
            dates.add(dateStr);
            if (b.reason) reasons.set(dateStr, b.reason);
          }
          setBlockedDates(dates);
          setBlockedReasons(reasons);
        });
    },
    []
  );

  useEffect(() => {
    fetchBlocked(viewYear, viewMonth);
  }, [viewYear, viewMonth, fetchBlocked]);

  async function toggleDate(dateStr: string) {
    setSaving(true);
    if (blockedDates.has(dateStr)) {
      await fetch("/api/admin/blocked-dates", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: dateStr }),
      });
    } else {
      const reason = prompt("เหตุผล (ไม่จำเป็น):");
      await fetch("/api/admin/blocked-dates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: dateStr, reason }),
      });
    }
    setSaving(false);
    fetchBlocked(viewYear, viewMonth);
  }

  // For blocked dates calendar, all non-past dates are "available" (clickable)
  const today = new Date().toISOString().split("T")[0];
  const daysInMonth = new Date(viewYear, viewMonth, 0).getDate();
  const allDates = new Set<string>();
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${viewYear}-${String(viewMonth).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    if (dateStr >= today) allDates.add(dateStr);
  }

  return (
    <div>
      <h2 className="text-xl font-bold text-gray-800 mb-6">วันหยุด</h2>
      <p className="text-sm text-gray-400 mb-4">
        คลิกวันที่เพื่อเพิ่มหรือลบวันหยุด (วันที่มีจุดแดงคือวันหยุด)
      </p>

      <div className="bg-white rounded-xl shadow-sm p-6 max-w-md">
        <MonthCalendar
          selectedDate={null}
          availableDates={allDates}
          onDateSelect={(date) => !saving && toggleDate(date)}
          onMonthChange={(y, m) => {
            setViewYear(y);
            setViewMonth(m);
          }}
        />

        {/* Blocked dates overlay indicators */}
        {blockedDates.size > 0 && (
          <div className="mt-4 space-y-1">
            <p className="text-sm font-medium text-gray-600">วันหยุดที่ตั้งไว้:</p>
            {Array.from(blockedDates)
              .sort()
              .map((dateStr) => (
                <div
                  key={dateStr}
                  className="flex items-center justify-between text-sm py-1"
                >
                  <span className="text-red-600">
                    {new Date(dateStr).toLocaleDateString("th-TH", {
                      weekday: "short",
                      day: "numeric",
                      month: "short",
                    })}
                    {blockedReasons.get(dateStr) && (
                      <span className="text-gray-400 ml-2">
                        ({blockedReasons.get(dateStr)})
                      </span>
                    )}
                  </span>
                  <button
                    onClick={() => toggleDate(dateStr)}
                    className="text-xs text-red-400 hover:text-red-600"
                  >
                    ลบ
                  </button>
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  );
}
