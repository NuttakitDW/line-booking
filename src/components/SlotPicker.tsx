"use client";

import { useState, useEffect, useCallback } from "react";
import { MonthCalendar } from "./MonthCalendar";
import { TimeSlotList } from "./TimeSlotList";

interface SelectedSlot {
  date: string;
  startTime: string;
  endTime: string;
}

interface Props {
  serviceId: string;
  onSelect: (slot: SelectedSlot) => void;
}

export function SlotPicker({ serviceId: _serviceId, onSelect }: Props) {
  const [availableDates, setAvailableDates] = useState<Set<string>>(new Set());
  const [maxDate, setMaxDate] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [slots, setSlots] = useState<{ startTime: string; endTime: string }[]>(
    []
  );
  const [loadingCalendar, setLoadingCalendar] = useState(true);
  const [loadingSlots, setLoadingSlots] = useState(false);

  const fetchMonth = useCallback((year: number, month: number) => {
    setLoadingCalendar(true);
    fetch(`/api/slots/calendar?year=${year}&month=${month}`)
      .then((res) => res.json())
      .then((data: { dates: string[]; maxDate: string }) => {
        setAvailableDates(new Set(data.dates));
        setMaxDate(data.maxDate);
      })
      .finally(() => setLoadingCalendar(false));
  }, []);

  // Initial load
  useEffect(() => {
    const now = new Date(
      new Date().toLocaleString("en-US", { timeZone: "Asia/Bangkok" })
    );
    fetchMonth(now.getFullYear(), now.getMonth() + 1);
  }, [fetchMonth]);

  function handleDateSelect(date: string) {
    setSelectedDate(date);
    setLoadingSlots(true);
    setSlots([]);
    fetch(`/api/slots/date?date=${date}`)
      .then((res) => res.json())
      .then((data) => setSlots(data))
      .finally(() => setLoadingSlots(false));
  }

  function handleSlotSelect(slot: { startTime: string; endTime: string }) {
    if (!selectedDate) return;
    onSelect({ date: selectedDate, startTime: slot.startTime, endTime: slot.endTime });
  }

  if (loadingCalendar && availableDates.size === 0) {
    return (
      <div className="space-y-3">
        <div className="skeleton h-8 w-48 mx-auto rounded" />
        <div className="skeleton h-64 w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row gap-6">
      {/* Calendar - left side on desktop */}
      <div className="flex-1 min-w-0">
        <MonthCalendar
          selectedDate={selectedDate}
          availableDates={availableDates}
          maxDate={maxDate}
          onDateSelect={handleDateSelect}
          onMonthChange={fetchMonth}
        />
      </div>

      {/* Time slots - right side on desktop, below on mobile */}
      {selectedDate && (
        <div className="flex-1 min-w-0 md:border-l md:pl-6 md:border-gray-200">
          <TimeSlotList
            date={selectedDate}
            slots={slots}
            loading={loadingSlots}
            onSelect={handleSlotSelect}
          />
        </div>
      )}
    </div>
  );
}
