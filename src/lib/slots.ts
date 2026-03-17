import { prisma } from "./prisma";

function getBangkokNow(): Date {
  return new Date(
    new Date().toLocaleString("en-US", { timeZone: "Asia/Bangkok" })
  );
}

function toDateString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function generateTimeSlots(
  startTime: string,
  endTime: string,
  durationMin: number
): { startTime: string; endTime: string }[] {
  const slots: { startTime: string; endTime: string }[] = [];
  const [startH, startM] = startTime.split(":").map(Number);
  const [endH, endM] = endTime.split(":").map(Number);
  const startMinutes = startH * 60 + startM;
  const endMinutes = endH * 60 + endM;

  for (let m = startMinutes; m + durationMin <= endMinutes; m += durationMin) {
    const sh = String(Math.floor(m / 60)).padStart(2, "0");
    const sm = String(m % 60).padStart(2, "0");
    const eh = String(Math.floor((m + durationMin) / 60)).padStart(2, "0");
    const em = String((m + durationMin) % 60).padStart(2, "0");
    slots.push({ startTime: `${sh}:${sm}`, endTime: `${eh}:${em}` });
  }

  return slots;
}

async function getMaxAdvanceDays(): Promise<number> {
  const setting = await prisma.setting.findUnique({
    where: { key: "maxAdvanceBookingDays" },
  });
  return setting ? parseInt(setting.value, 10) : 60;
}

export async function getAvailableDatesForMonth(
  year: number,
  month: number
): Promise<{ dates: string[]; maxDate: string }> {
  const schedules = await prisma.schedule.findMany({
    where: { active: true },
  });

  const scheduleMap = new Map(schedules.map((s) => [s.dayOfWeek, s]));

  const firstDay = new Date(year, month - 1, 1);
  const lastDay = new Date(year, month, 0);

  const maxAdvanceDays = await getMaxAdvanceDays();
  const now = getBangkokNow();
  const maxDate = new Date(now);
  maxDate.setDate(maxDate.getDate() + maxAdvanceDays);

  // Fetch blocked dates for this month
  const blockedDates = await prisma.blockedDate.findMany({
    where: {
      date: { gte: firstDay, lte: lastDay },
    },
  });
  const blockedSet = new Set(blockedDates.map((b) => toDateString(b.date)));

  // Fetch bookings for this month to check slot availability
  const bookings = await prisma.booking.findMany({
    where: {
      status: { in: ["PENDING", "CONFIRMED"] },
      timeSlot: {
        date: { gte: firstDay, lte: lastDay },
      },
    },
    include: { timeSlot: true },
  });

  // Count booked slots per date
  const bookedPerDate = new Map<string, Set<string>>();
  for (const b of bookings) {
    const dateStr = toDateString(b.timeSlot.date);
    if (!bookedPerDate.has(dateStr)) bookedPerDate.set(dateStr, new Set());
    bookedPerDate.get(dateStr)!.add(b.timeSlot.startTime);
  }

  const today = toDateString(now);
  const maxDateStr = toDateString(maxDate);
  const availableDates: string[] = [];

  for (let d = new Date(firstDay); d <= lastDay; d.setDate(d.getDate() + 1)) {
    const dateStr = toDateString(d);

    // Skip past dates
    if (dateStr < today) continue;
    // Skip dates beyond max advance
    if (dateStr > maxDateStr) continue;
    // Skip blocked dates
    if (blockedSet.has(dateStr)) continue;

    const schedule = scheduleMap.get(d.getDay());
    if (!schedule) continue;

    // Check if at least one slot is available
    const allSlots = generateTimeSlots(
      schedule.startTime,
      schedule.endTime,
      schedule.slotDuration
    );
    const bookedSlots = bookedPerDate.get(dateStr) ?? new Set();

    // For today, filter out past time slots
    const nowTime =
      dateStr === today
        ? `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`
        : "00:00";

    const hasAvailable = allSlots.some(
      (slot) => slot.startTime > nowTime && !bookedSlots.has(slot.startTime)
    );

    if (hasAvailable) {
      availableDates.push(dateStr);
    }
  }

  return { dates: availableDates, maxDate: maxDateStr };
}

export async function getAvailableSlotsForDate(
  dateStr: string
): Promise<{ startTime: string; endTime: string }[]> {
  const date = new Date(dateStr + "T00:00:00");
  const dayOfWeek = date.getDay();

  const schedule = await prisma.schedule.findUnique({
    where: { dayOfWeek },
  });

  if (!schedule || !schedule.active) return [];

  // Check if date is blocked
  const blocked = await prisma.blockedDate.findUnique({
    where: { date },
  });
  if (blocked) return [];

  // Check max advance days
  const maxAdvanceDays = await getMaxAdvanceDays();
  const now = getBangkokNow();
  const maxDate = new Date(now);
  maxDate.setDate(maxDate.getDate() + maxAdvanceDays);
  if (date > maxDate) return [];

  const today = toDateString(now);
  if (dateStr < today) return [];

  // Get all booked slots for this date
  const bookings = await prisma.booking.findMany({
    where: {
      status: { in: ["PENDING", "CONFIRMED"] },
      timeSlot: { date },
    },
    include: { timeSlot: true },
  });
  const bookedTimes = new Set(bookings.map((b) => b.timeSlot.startTime));

  const allSlots = generateTimeSlots(
    schedule.startTime,
    schedule.endTime,
    schedule.slotDuration
  );

  // For today, filter out past time slots
  const nowTime =
    dateStr === today
      ? `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`
      : "00:00";

  return allSlots.filter(
    (slot) => slot.startTime > nowTime && !bookedTimes.has(slot.startTime)
  );
}
