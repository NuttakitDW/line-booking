"use client";

import { useState, useEffect } from "react";

interface Service {
  id: string;
  name: string;
  description: string | null;
  durationMin: number;
  price: number;
  active: boolean;
}

function formatPrice(satang: number): string {
  return `฿${(satang / 100).toLocaleString()}`;
}

export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);

  const [form, setForm] = useState({
    name: "",
    description: "",
    durationMin: 60,
    price: 0,
    active: true,
  });

  useEffect(() => {
    fetchServices();
  }, []);

  function fetchServices() {
    fetch("/api/admin/services")
      .then((r) => r.json())
      .then((data) => setServices(data))
      .finally(() => setLoading(false));
  }

  function startEdit(s: Service) {
    setEditing(s.id);
    setForm({
      name: s.name,
      description: s.description || "",
      durationMin: s.durationMin,
      price: s.price / 100,
      active: s.active,
    });
  }

  function startAdd() {
    setShowAdd(true);
    setEditing(null);
    setForm({ name: "", description: "", durationMin: 60, price: 0, active: true });
  }

  async function handleSave() {
    const payload = {
      ...form,
      price: Math.round(form.price * 100),
    };

    if (editing) {
      await fetch(`/api/admin/services/${editing}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    } else {
      await fetch("/api/admin/services", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    }

    setEditing(null);
    setShowAdd(false);
    fetchServices();
  }

  async function handleToggleActive(s: Service) {
    await fetch(`/api/admin/services/${s.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...s, active: !s.active }),
    });
    fetchServices();
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
        <h2 className="text-xl font-bold text-gray-800">บริการ</h2>
        <button
          onClick={startAdd}
          className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          + เพิ่มบริการ
        </button>
      </div>

      {/* Add/Edit form */}
      {(showAdd || editing) && (
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <h3 className="font-semibold text-gray-700 mb-4">
            {editing ? "แก้ไขบริการ" : "เพิ่มบริการใหม่"}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-500 mb-1">
                ชื่อบริการ
              </label>
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-500 mb-1">
                รายละเอียด
              </label>
              <input
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-500 mb-1">
                ระยะเวลา (นาที)
              </label>
              <input
                type="number"
                value={form.durationMin}
                onChange={(e) =>
                  setForm({ ...form, durationMin: parseInt(e.target.value) })
                }
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-500 mb-1">
                ราคา (บาท)
              </label>
              <input
                type="number"
                value={form.price}
                onChange={(e) =>
                  setForm({ ...form, price: parseFloat(e.target.value) })
                }
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
              />
            </div>
          </div>
          <div className="flex gap-3 mt-4">
            <button
              onClick={handleSave}
              className="bg-blue-600 text-white px-6 py-2 rounded-xl text-sm font-medium hover:bg-blue-700"
            >
              บันทึก
            </button>
            <button
              onClick={() => {
                setEditing(null);
                setShowAdd(false);
              }}
              className="px-6 py-2 rounded-xl text-sm text-gray-500 hover:bg-gray-100"
            >
              ยกเลิก
            </button>
          </div>
        </div>
      )}

      {/* Service list */}
      <div className="bg-white rounded-xl shadow-sm divide-y">
        {services.map((s) => (
          <div
            key={s.id}
            className={`p-4 flex items-center justify-between ${!s.active ? "opacity-50" : ""}`}
          >
            <div>
              <p className="font-medium text-sm">{s.name}</p>
              <p className="text-xs text-gray-400">
                {s.durationMin} นาที | {formatPrice(s.price)}
              </p>
              {s.description && (
                <p className="text-xs text-gray-400 mt-0.5">{s.description}</p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => startEdit(s)}
                className="text-xs text-blue-600 hover:underline"
              >
                แก้ไข
              </button>
              <button
                onClick={() => handleToggleActive(s)}
                className={`text-xs px-2 py-1 rounded-full ${
                  s.active
                    ? "bg-green-100 text-green-700"
                    : "bg-gray-100 text-gray-500"
                }`}
              >
                {s.active ? "เปิดใช้งาน" : "ปิดใช้งาน"}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
