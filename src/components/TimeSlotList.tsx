"use client";

interface Slot {
  startTime: string;
  endTime: string;
}

interface Props {
  date: string;
  slots: Slot[];
  loading: boolean;
  onSelect: (slot: Slot) => void;
}

function formatDateThai(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("th-TH", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

export function TimeSlotList({ date, slots, loading, onSelect }: Props) {
  if (loading) {
    return (
      <div className="space-y-3">
        <div className="skeleton h-5 w-40 rounded" />
        <div className="grid grid-cols-2 gap-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="skeleton h-12 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (slots.length === 0) {
    return (
      <div className="text-center py-8 text-gray-400">
        <p className="text-2xl mb-2">😔</p>
        <p className="text-sm">ไม่มีคิวว่างในวันนี้</p>
      </div>
    );
  }

  return (
    <div>
      <h4 className="font-semibold text-sm text-gray-500 mb-3">
        {formatDateThai(date)}
      </h4>
      <div className="grid grid-cols-2 gap-2">
        {slots.map((slot) => (
          <button
            key={slot.startTime}
            onClick={() => onSelect(slot)}
            className="bg-white rounded-xl py-3 px-4 text-center shadow-sm border-2 border-transparent hover:border-primary hover:shadow-md transition-all active:scale-[0.96]"
          >
            <p className="font-semibold text-sm">{slot.startTime}</p>
            <p className="text-xs text-gray-400">- {slot.endTime}</p>
          </button>
        ))}
      </div>
    </div>
  );
}
