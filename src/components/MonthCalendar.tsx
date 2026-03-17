"use client";

import { useState } from "react";

const DAY_LABELS = ["อา", "จ", "อ", "พ", "พฤ", "ศ", "ส"];
const MONTH_NAMES = [
  "มกราคม",
  "กุมภาพันธ์",
  "มีนาคม",
  "เมษายน",
  "พฤษภาคม",
  "มิถุนายน",
  "กรกฎาคม",
  "สิงหาคม",
  "กันยายน",
  "ตุลาคม",
  "พฤศจิกายน",
  "ธันวาคม",
];

interface Props {
  selectedDate: string | null;
  availableDates: Set<string>;
  maxDate?: string;
  onDateSelect: (date: string) => void;
  onMonthChange: (year: number, month: number) => void;
}

function toDateString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function getBangkokToday(): string {
  const now = new Date(
    new Date().toLocaleString("en-US", { timeZone: "Asia/Bangkok" })
  );
  return toDateString(now);
}

export function MonthCalendar({
  selectedDate,
  availableDates,
  maxDate,
  onDateSelect,
  onMonthChange,
}: Props) {
  const today = getBangkokToday();
  const [year, month] = (() => {
    const now = new Date(
      new Date().toLocaleString("en-US", { timeZone: "Asia/Bangkok" })
    );
    return [now.getFullYear(), now.getMonth() + 1];
  })();

  const [viewYear, setViewYear] = useState(year);
  const [viewMonth, setViewMonth] = useState(month);

  const firstDayOfMonth = new Date(viewYear, viewMonth - 1, 1);
  const daysInMonth = new Date(viewYear, viewMonth, 0).getDate();
  const startingDay = firstDayOfMonth.getDay(); // 0=Sun

  const canGoPrev = viewYear > year || (viewYear === year && viewMonth > month);

  const canGoNext = (() => {
    if (!maxDate) return true;
    const nextMonthFirst = new Date(viewYear, viewMonth, 1);
    return toDateString(nextMonthFirst) <= maxDate;
  })();

  function navigateMonth(delta: number) {
    let newMonth = viewMonth + delta;
    let newYear = viewYear;
    if (newMonth > 12) {
      newMonth = 1;
      newYear++;
    } else if (newMonth < 1) {
      newMonth = 12;
      newYear--;
    }
    setViewYear(newYear);
    setViewMonth(newMonth);
    onMonthChange(newYear, newMonth);
  }

  const cells: (number | null)[] = [];
  for (let i = 0; i < startingDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  // Buddhist year for display
  const buddhistYear = viewYear + 543;

  return (
    <div className="w-full">
      {/* Month header */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => navigateMonth(-1)}
          disabled={!canGoPrev}
          className="w-10 h-10 rounded-full flex items-center justify-center text-lg hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          ‹
        </button>
        <h3 className="font-semibold text-lg">
          {MONTH_NAMES[viewMonth - 1]} {buddhistYear}
        </h3>
        <button
          onClick={() => navigateMonth(1)}
          disabled={!canGoNext}
          className="w-10 h-10 rounded-full flex items-center justify-center text-lg hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          ›
        </button>
      </div>

      {/* Day labels */}
      <div className="grid grid-cols-7 mb-2">
        {DAY_LABELS.map((label) => (
          <div
            key={label}
            className="text-center text-xs font-medium text-gray-500 py-1"
          >
            {label}
          </div>
        ))}
      </div>

      {/* Day cells */}
      <div className="grid grid-cols-7 gap-1">
        {cells.map((day, i) => {
          if (day === null) {
            return <div key={`empty-${i}`} />;
          }

          const dateStr = `${viewYear}-${String(viewMonth).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
          const isToday = dateStr === today;
          const isSelected = dateStr === selectedDate;
          const isAvailable = availableDates.has(dateStr);
          const isPast = dateStr < today;

          return (
            <button
              key={dateStr}
              disabled={!isAvailable}
              onClick={() => onDateSelect(dateStr)}
              className={`
                relative w-full aspect-square flex flex-col items-center justify-center rounded-full text-sm transition-all
                ${isSelected ? "bg-[var(--color-primary)] text-white font-semibold" : ""}
                ${!isSelected && isToday ? "ring-2 ring-[var(--color-primary)] ring-inset" : ""}
                ${!isSelected && isAvailable ? "hover:bg-[var(--color-primary)]/10 cursor-pointer font-medium" : ""}
                ${isPast || !isAvailable ? "text-gray-300 cursor-not-allowed" : ""}
                ${!isPast && !isSelected && isAvailable ? "text-gray-800" : ""}
              `}
            >
              {day}
              {isAvailable && !isSelected && (
                <span className="absolute bottom-1 w-1 h-1 rounded-full bg-[var(--color-primary)]" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
