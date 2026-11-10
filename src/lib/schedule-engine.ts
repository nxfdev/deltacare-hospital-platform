import { formatInTimeZone, toZonedTime } from "date-fns-tz";
import { getDay } from "date-fns";
import { prisma } from "@/lib/prisma";
import { getDbState } from "@/server/db/store";
import { DoctorChamberSchedule, DoctorScheduleOverride } from "@/types/domain";

// ============================================================================
// Evercare Deterministic Multi-Branch Fixed-Slot Schedule Engine
// Timezone: Asia/Dhaka (UTC+6)
// ============================================================================

export const DHAKA_TIMEZONE = "Asia/Dhaka";

export type FixedSlotStatus = "AVAILABLE" | "BOOKED" | "BLOCKED";

export interface FixedChamberSlot {
  time24: string; // e.g. "17:15"
  labelEn: string; // e.g. "5:15 PM"
  labelBn: string; // e.g. "বিকাল ৫:১৫"
  status: FixedSlotStatus;
  chamberRoom: string;
}

export interface DoctorDaySlotResult {
  doctorId: string;
  branchId: string;
  date: string; // YYYY-MM-DD
  dayOfWeek: number; // 0=Sun..6=Sat in Asia/Dhaka
  isAvailableDay: boolean;
  reason?: string | null;
  reasonBn?: string | null;
  chamberRoom: string | null;
  slotDurationMinutes: number;
  slots: FixedChamberSlot[];
}

const BN_DIGITS = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];

export function toBanglaDigits(str: string | number): string {
  return String(str).replace(/[0-9]/g, (d) => BN_DIGITS[Number(d)] ?? d);
}

/**
 * Resolves the exact day of week (0 = Sunday .. 6 = Saturday) for a YYYY-MM-DD
 * calendar date in Asia/Dhaka timezone (UTC+6).
 */
export function resolveDhakaWeekday(dateStr: string): number {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateStr.trim());
  if (!m) {
    const nowDhaka = toZonedTime(new Date(), DHAKA_TIMEZONE);
    return getDay(nowDhaka);
  }
  // Construct noon Asia/Dhaka ISO timestamp so DST/UTC boundary shifts can never cross midnight
  const dhakaIso = `${m[1]}-${m[2]}-${m[3]}T12:00:00+06:00`;
  const zoned = toZonedTime(new Date(dhakaIso), DHAKA_TIMEZONE);
  const isoDay = Number(formatInTimeZone(zoned, DHAKA_TIMEZONE, "i")); // 1=Mon..7=Sun
  return isoDay === 7 ? 0 : isoDay;
}

export function parseTimeToMinutes(hhmm: string): number {
  const [hStr, mStr] = hhmm.split(":");
  const h = Number(hStr ?? 0);
  const m = Number(mStr ?? 0);
  return h * 60 + m;
}

export function formatMinutesTo24(totalMinutes: number): string {
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export function formatSlotLabels(time24: string): { labelEn: string; labelBn: string } {
  const [hStr, mStr] = time24.split(":");
  const h24 = Number(hStr ?? 0);
  const m = Number(mStr ?? 0);
  const periodEn = h24 >= 12 ? "PM" : "AM";
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  const minPadded = String(m).padStart(2, "0");

  let periodBn = "সকাল";
  if (h24 >= 12 && h24 < 15) periodBn = "দুপুর";
  else if (h24 >= 15 && h24 < 18) periodBn = "বিকাল";
  else if (h24 >= 18 && h24 < 20) periodBn = "সন্ধ্যা";
  else if (h24 >= 20 || h24 < 4) periodBn = "রাত";

  return {
    labelEn: `${h12}:${minPadded} ${periodEn}`,
    labelBn: `${periodBn} ${toBanglaDigits(h12)}:${toBanglaDigits(minPadded)}`,
  };
}

function buildSlotsFromSchedulesAndOverride(params: {
  doctorId: string;
  branchId: string;
  date: string;
  dayOfWeek: number;
  schedules: DoctorChamberSchedule[];
  override: DoctorScheduleOverride | null;
  bookedSlotCounts: Map<string, number>;
  capacityPerSlotMap: Map<string, number>;
}): DoctorDaySlotResult {
  const {
    doctorId,
    branchId,
    date,
    dayOfWeek,
    schedules,
    override,
    bookedSlotCounts,
    capacityPerSlotMap,
  } = params;

  // 1. Check FULL_DAY_LEAVE override first
  if (override && override.overrideType === "FULL_DAY_LEAVE") {
    return {
      doctorId,
      branchId,
      date,
      dayOfWeek,
      isAvailableDay: false,
      reason: override.reasonEn ?? "Doctor is on full-day leave for this chamber.",
      reasonBn: override.reasonBn ?? "এই তারিখে চিকিৎসকের চেম্বার বন্ধ থাকবে।",
      chamberRoom: schedules[0]?.chamberRoom ?? null,
      slotDurationMinutes: schedules[0]?.slotDurationMinutes ?? 15,
      slots: [],
    };
  }

  // 2. Determine effective schedule rules (supporting CUSTOM_HOURS even on non-regular days)
  let effectiveRules: Array<{
    startTime: string;
    endTime: string;
    breakStartTime?: string | null;
    breakEndTime?: string | null;
    slotDurationMinutes: number;
    chamberRoom: string;
  }> = [];

  if (
    override &&
    override.overrideType === "CUSTOM_HOURS" &&
    override.customStartTime &&
    override.customEndTime
  ) {
    const fallbackRoom = schedules[0]?.chamberRoom ?? "Main Consultation Chamber";
    const fallbackDuration = schedules[0]?.slotDurationMinutes ?? 15;
    effectiveRules = [
      {
        startTime: override.customStartTime,
        endTime: override.customEndTime,
        breakStartTime: schedules[0]?.breakStartTime ?? null,
        breakEndTime: schedules[0]?.breakEndTime ?? null,
        slotDurationMinutes: fallbackDuration,
        chamberRoom: fallbackRoom,
      },
    ];
  } else {
    effectiveRules = schedules.map((s) => ({
      startTime: s.startTime,
      endTime: s.endTime,
      breakStartTime: s.breakStartTime,
      breakEndTime: s.breakEndTime,
      slotDurationMinutes: s.slotDurationMinutes || 15,
      chamberRoom: s.chamberRoom,
    }));
  }

  if (effectiveRules.length === 0) {
    return {
      doctorId,
      branchId,
      date,
      dayOfWeek,
      isAvailableDay: false,
      reason: "No regular chamber scheduled on this weekday.",
      reasonBn: "সপ্তাহের এই দিনে নিয়মিত চেম্বার নেই।",
      chamberRoom: null,
      slotDurationMinutes: 15,
      slots: [],
    };
  }

  const blockedSet = new Set<string>(override?.blockedSlots ?? []);
  const slots: FixedChamberSlot[] = [];
  const seenTimes = new Set<string>();

  for (const rule of effectiveRules) {
    const startMin = parseTimeToMinutes(rule.startTime);
    const endMin = parseTimeToMinutes(rule.endTime);
    const step = Math.max(5, rule.slotDurationMinutes || 15);
    const breakStart =
      rule.breakStartTime ? parseTimeToMinutes(rule.breakStartTime) : null;
    const breakEnd =
      rule.breakEndTime ? parseTimeToMinutes(rule.breakEndTime) : null;

    for (let cursor = startMin; cursor + step <= endMin; cursor += step) {
      // Exclude break window
      if (breakStart !== null && breakEnd !== null) {
        if (cursor >= breakStart && cursor < breakEnd) {
          continue;
        }
      }

      const time24 = formatMinutesTo24(cursor);
      if (seenTimes.has(time24)) continue;
      seenTimes.add(time24);

      const { labelEn, labelBn } = formatSlotLabels(time24);
      const bookedCount = bookedSlotCounts.get(time24) ?? 0;
      const maxCap = capacityPerSlotMap.get(time24) ?? 1;

      let status: FixedSlotStatus = "AVAILABLE";
      if (blockedSet.has(time24)) {
        status = "BLOCKED";
      } else if (bookedCount >= maxCap) {
        status = "BOOKED";
      }

      slots.push({
        time24,
        labelEn,
        labelBn,
        status,
        chamberRoom: rule.chamberRoom,
      });
    }
  }

  return {
    doctorId,
    branchId,
    date,
    dayOfWeek,
    isAvailableDay: true,
    reason: override?.reasonEn ?? null,
    reasonBn: override?.reasonBn ?? null,
    chamberRoom: effectiveRules[0]?.chamberRoom ?? null,
    slotDurationMinutes: effectiveRules[0]?.slotDurationMinutes ?? 15,
    slots,
  };
}

/**
 * Deterministic Multi-Branch Fixed-Slot Engine (Async Prisma version)
 */
export async function getAvailableSlotsForDoctor(params: {
  doctorId: string;
  branchId: string;
  date: string; // YYYY-MM-DD
}): Promise<DoctorDaySlotResult> {
  const { doctorId, branchId, date } = params;
  const dayOfWeek = resolveDhakaWeekday(date);

  const [schedules, allBranchSchedules, override, activeAppointments] =
    await Promise.all([
      prisma.doctorChamberSchedule.findMany({
        where: {
          doctorId,
          branchId,
          dayOfWeek,
          isActive: true,
        },
      }),
      prisma.doctorChamberSchedule.findMany({
        where: {
          doctorId,
          branchId,
          isActive: true,
        },
      }),
      prisma.doctorScheduleOverride.findFirst({
        where: {
          doctorId,
          branchId,
          date,
        },
      }),
      prisma.appointment.findMany({
        where: {
          doctorId,
          branchId,
          preferredDate: date,
          status: {
            in: ["PENDING", "REQUESTED", "PENDING_CONFIRMATION", "CONFIRMED"],
          },
        },
      }),
    ]);

  // Also check doctor branch scheduleRules for custom slot capacities when present
  const state = getDbState();
  const doc = state.doctors.find((d) => d.id === doctorId);
  const brAssign = doc?.branches.find(
    (b) => b.branchId === branchId && b.status === "ACTIVE"
  );
  const capacityPerSlotMap = new Map<string, number>();
  if (brAssign) {
    for (const rule of brAssign.scheduleRules) {
      if (rule.weekday === dayOfWeek && rule.capacityPerSlot > 1) {
        const startMin = parseTimeToMinutes(rule.startTime);
        const endMin = parseTimeToMinutes(rule.endTime);
        const step = Math.max(5, rule.slotMinutes || 15);
        for (let c = startMin; c + step <= endMin; c += step) {
          capacityPerSlotMap.set(formatMinutesTo24(c), rule.capacityPerSlot);
        }
      }
    }
  }

  const bookedSlotCounts = new Map<string, number>();
  for (const apt of activeAppointments) {
    const slotKey =
      (apt as { slotTime?: string; preferredTimeSlot?: string }).slotTime ??
      (apt as { preferredTimeSlot?: string }).preferredTimeSlot ??
      "";
    if (slotKey) {
      bookedSlotCounts.set(slotKey, (bookedSlotCounts.get(slotKey) ?? 0) + 1);
    }
  }

  // If override is CUSTOM_HOURS on a non-regular day, pass fallback chamber room/duration from any active schedule at that branch
  const effectiveSchedules =
    schedules.length > 0
      ? schedules
      : override?.overrideType === "CUSTOM_HOURS"
        ? allBranchSchedules.slice(0, 1)
        : [];

  return buildSlotsFromSchedulesAndOverride({
    doctorId,
    branchId,
    date,
    dayOfWeek,
    schedules: effectiveSchedules,
    override,
    bookedSlotCounts,
    capacityPerSlotMap,
  });
}

