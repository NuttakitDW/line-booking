"use client";

import { useState, useEffect } from "react";

export default function SettingsPage() {
  const [maxDays, setMaxDays] = useState("60");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch("/api/admin/settings")
      .then((r) => r.json())
      .then((data: Record<string, string>) => {
        if (data.maxAdvanceBookingDays) {
          setMaxDays(data.maxAdvanceBookingDays);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  async function handleSave() {
    setSaving(true);
    await fetch("/api/admin/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ maxAdvanceBookingDays: maxDays }),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="skeleton h-8 w-48 rounded" />
        <div className="skeleton h-32 rounded-xl" />
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-xl font-bold text-gray-800 mb-6">ตั้งค่า</h2>

      <div className="bg-white rounded-xl shadow-sm p-6 max-w-lg">
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-600 mb-2">
            จำนวนวันที่เปิดให้จองล่วงหน้า
          </label>
          <div className="flex items-center gap-3">
            <input
              type="number"
              value={maxDays}
              onChange={(e) => {
                setMaxDays(e.target.value);
                setSaved(false);
              }}
              min="1"
              max="365"
              className="w-24 border border-gray-200 rounded-lg px-3 py-2 text-sm"
            />
            <span className="text-sm text-gray-400">วัน</span>
          </div>
          <p className="text-xs text-gray-400 mt-2">
            ลูกค้าจะสามารถจองล่วงหน้าได้ไม่เกินจำนวนวันที่กำหนด
          </p>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-blue-600 text-white px-6 py-2 rounded-xl text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {saving ? "กำลังบันทึก..." : saved ? "บันทึกแล้ว" : "บันทึก"}
        </button>
      </div>
    </div>
  );
}
