"use client";

import { useState, useEffect } from "react";

interface TimeSlot {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
}

interface Props {
  serviceId: string;
  onSelect: (slot: TimeSlot) => void;
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("th-TH", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

export function SlotPicker({ serviceId, onSelect }: Props) {
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/slots?serviceId=${serviceId}`)
      .then((res) => res.json())
      .then((data) => setSlots(data))
      .finally(() => setLoading(false));
  }, [serviceId]);

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="skeleton h-14 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  if (slots.length === 0) {
    return (
      <div className="text-center py-12 text-[var(--color-text-secondary)]">
        <p className="text-4xl mb-3">📅</p>
        <p>ไม่มีคิวว่างในขณะนี้</p>
        <p className="text-sm mt-1">กรุณาลองใหม่ภายหลัง</p>
      </div>
    );
  }

  // Group slots by date
  const grouped = slots.reduce<Record<string, TimeSlot[]>>((acc, slot) => {
    const key = slot.date;
    if (!acc[key]) acc[key] = [];
    acc[key].push(slot);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      {Object.entries(grouped).map(([date, dateSlots]) => (
        <div key={date}>
          <h3 className="font-semibold text-sm text-[var(--color-text-secondary)] mb-3">
            {formatDate(date)}
          </h3>
          <div className="grid grid-cols-3 gap-2">
            {dateSlots.map((slot) => (
              <button
                key={slot.id}
                onClick={() => onSelect(slot)}
                className="bg-white rounded-xl py-3 px-2 text-center shadow-sm hover:shadow-md hover:border-[var(--color-primary)] border-2 border-transparent transition-all active:scale-[0.96]"
              >
                <p className="font-semibold text-sm">{slot.startTime}</p>
                <p className="text-xs text-[var(--color-text-secondary)]">
                  - {slot.endTime}
                </p>
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
