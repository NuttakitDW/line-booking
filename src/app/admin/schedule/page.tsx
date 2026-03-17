"use client";

import { useState, useEffect } from "react";

const DAY_NAMES = [
  "วันอาทิตย์",
  "วันจันทร์",
  "วันอังคาร",
  "วันพุธ",
  "วันพฤหัสบดี",
  "วันศุกร์",
  "วันเสาร์",
];

interface ScheduleRow {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  slotDuration: number;
  active: boolean;
}

const DEFAULT_ROWS: ScheduleRow[] = Array.from({ length: 7 }, (_, i) => ({
  dayOfWeek: i,
  startTime: "09:00",
  endTime: "18:00",
  slotDuration: 60,
  active: i !== 0, // Sun off by default
}));

export default function SchedulePage() {
  const [rows, setRows] = useState<ScheduleRow[]>(DEFAULT_ROWS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch("/api/admin/schedule")
      .then((r) => r.json())
      .then((data: ScheduleRow[]) => {
        if (data.length > 0) {
          const merged = DEFAULT_ROWS.map((def) => {
            const found = data.find((d) => d.dayOfWeek === def.dayOfWeek);
            return found
              ? {
                  dayOfWeek: found.dayOfWeek,
                  startTime: found.startTime,
                  endTime: found.endTime,
                  slotDuration: found.slotDuration,
                  active: found.active,
                }
              : def;
          });
          setRows(merged);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  function updateRow(dayOfWeek: number, field: string, value: unknown) {
    setRows((prev) =>
      prev.map((r) =>
        r.dayOfWeek === dayOfWeek ? { ...r, [field]: value } : r
      )
    );
    setSaved(false);
  }

  async function handleSave() {
    setSaving(true);
    await fetch("/api/admin/schedule", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(rows),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="skeleton h-8 w-48 rounded" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="skeleton h-16 rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-800">ตารางเวลา</h2>
        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-blue-600 text-white px-6 py-2 rounded-xl text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {saving ? "กำลังบันทึก..." : saved ? "บันทึกแล้ว" : "บันทึก"}
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm divide-y">
        {rows.map((row) => (
          <div
            key={row.dayOfWeek}
            className={`p-4 flex flex-col md:flex-row md:items-center gap-3 ${
              !row.active ? "opacity-50" : ""
            }`}
          >
            {/* Day name + toggle */}
            <div className="flex items-center gap-3 md:w-40">
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={row.active}
                  onChange={(e) =>
                    updateRow(row.dayOfWeek, "active", e.target.checked)
                  }
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-blue-600 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all" />
              </label>
              <span className="text-sm font-medium text-gray-700">
                {DAY_NAMES[row.dayOfWeek]}
              </span>
            </div>

            {/* Time inputs */}
            <div className="flex items-center gap-2 flex-1">
              <input
                type="time"
                value={row.startTime}
                onChange={(e) =>
                  updateRow(row.dayOfWeek, "startTime", e.target.value)
                }
                disabled={!row.active}
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm"
              />
              <span className="text-gray-400 text-sm">ถึง</span>
              <input
                type="time"
                value={row.endTime}
                onChange={(e) =>
                  updateRow(row.dayOfWeek, "endTime", e.target.value)
                }
                disabled={!row.active}
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm"
              />
            </div>

            {/* Slot duration */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400">ช่วงละ</span>
              <select
                value={row.slotDuration}
                onChange={(e) =>
                  updateRow(
                    row.dayOfWeek,
                    "slotDuration",
                    parseInt(e.target.value)
                  )
                }
                disabled={!row.active}
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm"
              >
                <option value={30}>30 นาที</option>
                <option value={60}>1 ชั่วโมง</option>
                <option value={90}>1.5 ชั่วโมง</option>
                <option value={120}>2 ชั่วโมง</option>
              </select>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
