import { getDbState } from "@/server/db/store";
import {
  getCalendarWeekday,
  getDoctorBranchAvailability,
} from "@/server/services/appointmentService";
import { Doctor } from "@/types/domain";

export interface AvailableDoctorCardData {
  doctorId: string;
  doctorSlug: string;
  nameEn: string;
  nameBn: string;
  designationEn: string;
  qualificationsEn: string;
  bmdcRegistrationNo: string;
  departmentId: string;
  departmentNameEn: string;
  departmentNameBn: string;
  primarySpecialtyEn: string;
  primarySpecialtyBn: string;
  branchId: string;
  branchNameEn: string;
  branchNameBn: string;
  roomNumber: string;
  consultationDate: string; // YYYY-MM-DD
  consultationDateFormatted: string; // e.g. "Wednesday, 18 Nov 2026"
  consultationDateBangla: string; // e.g. "বুধবার, ১৮ নভেম্বর ২০২৬"
  consultationHours: string; // e.g. "04:00 PM – 08:00 PM"
  startTime: string;
  endTime: string;
  photoUrl: string;
  imagePosition?: string;
  imageCrop?: {
    zoom: number;
    x: number;
    y: number;
  };
  totalAvailableSlots: number;
  totalChamberCapacity: number;
  consultationFeeBdt: number;
}

export interface DailyAvailabilityResult {
  date: string;
  weekday: number;
  weekdayName: string;
  timezone: string;
  generatedAt: string;
  eligibleDoctors: AvailableDoctorCardData[];
  excludedCount: number;
  conflicts: Array<{
    doctorId: string;
    doctorName: string;
    reason: string;
  }>;
}

const WEEKDAY_NAMES_EN = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

const WEEKDAY_NAMES_BN = [
  "রবিবার",
  "সোমবার",
  "মঙ্গলবার",
  "বুধবার",
  "বৃহস্পতিবার",
  "শুক্রবার",
  "শনিবার",
];

const MONTH_NAMES_EN = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

const MONTH_NAMES_BN = [
  "জানুয়ারি",
  "ফেব্রুয়ারি",
  "মার্চ",
  "এপ্রিল",
  "মে",
  "জুন",
  "জুলাই",
  "আগস্ট",
  "সেপ্টেম্বর",
  "অক্টোবর",
  "নভেম্বর",
  "ডিসেম্বর",
];

export function formatTime24to12(time24: string): string {
  const [hStr, mStr] = time24.split(":");
  let h = parseInt(hStr, 10);
  const m = mStr || "00";
  const ampm = h >= 12 ? "PM" : "AM";
  h = h % 12;
  h = h ? h : 12;
  const hDisplay = h < 10 ? `0${h}` : `${h}`;
  return `${hDisplay}:${m} ${ampm}`;
}

export function formatDhakaDate(dateStr: string): {
  formattedEn: string;
  formattedBn: string;
} {
  const [year, month, day] = dateStr.split("-").map((v) => parseInt(v, 10));
  const weekday = getCalendarWeekday(dateStr, "Asia/Dhaka");
  const weekdayEn = WEEKDAY_NAMES_EN[weekday] || "Today";
  const weekdayBn = WEEKDAY_NAMES_BN[weekday] || "আজ";
  const monthEn = MONTH_NAMES_EN[month - 1] || "";
  const monthBn = MONTH_NAMES_BN[month - 1] || "";

  return {
    formattedEn: `${weekdayEn}, ${day} ${monthEn} ${year}`,
    formattedBn: `${weekdayBn}, ${day} ${monthBn} ${year}`,
  };
}

export function getTodayInDhaka(): string {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Dhaka",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return formatter.format(now); // outputs YYYY-MM-DD
}

export function calculateDailyDoctorAvailability(
  targetDateInput?: string
): DailyAvailabilityResult {
  const targetDate = targetDateInput?.trim() || getTodayInDhaka();
  const db = getDbState();
  const timezone = db.hospital.timezone || "Asia/Dhaka";
  const weekday = getCalendarWeekday(targetDate, timezone);

  const { formattedEn, formattedBn } = formatDhakaDate(targetDate);
  const eligibleDoctors: AvailableDoctorCardData[] = [];
  const conflicts: Array<{ doctorId: string; doctorName: string; reason: string }> = [];
  let excludedCount = 0;

  for (const doc of db.doctors) {
    // 1. Status Check: Must be actively published
    if (doc.publicationState !== "PUBLISHED") {
      excludedCount++;
      continue;
    }

    const activeBranches = (doc.branches || []).filter((b) => b.status === "ACTIVE");
    if (activeBranches.length === 0) {
      conflicts.push({
        doctorId: doc.id,
        doctorName: doc.nameEn,
        reason: "Doctor has no active branch chambers assigned.",
      });
      excludedCount++;
      continue;
    }

    let foundAvailableChamber = false;

    for (const bAssignment of activeBranches) {
      // Check schedule rules
      const rules = bAssignment.scheduleRules || [];
      const hasTodayRule = rules.some((r) => r.weekday === weekday);
      if (!hasTodayRule) {
        // Not practicing on this weekday at this branch
        continue;
      }

      // Check exception (leave/blocked)
      const exception = (bAssignment.scheduleExceptions || []).find(
        (ex) => ex.dateStr === targetDate
      );
      if (exception) {
        conflicts.push({
          doctorId: doc.id,
          doctorName: doc.nameEn,
          reason: `Doctor is on ${exception.exceptionType} at branch ${bAssignment.branchId} (${exception.reasonEn}).`,
        });
        continue;
      }

      // Calculate slot availability using validated operational engine
      const slots = getDoctorBranchAvailability(doc.id, bAssignment.branchId, targetDate);
      if (slots.length === 0) {
        continue;
      }

      const totalAvailableSlots = slots.reduce((acc, s) => acc + s.remainingCapacity, 0);
      const totalChamberCapacity = slots.reduce((acc, s) => acc + s.capacity, 0);

      if (totalAvailableSlots <= 0) {
        // Fully booked on this date
        conflicts.push({
          doctorId: doc.id,
          doctorName: doc.nameEn,
          reason: `Chamber at ${bAssignment.branchId} is 100% booked for ${targetDate}.`,
        });
        continue;
      }

      // Found a valid, open chamber!
      const matchingRule = rules.find((r) => r.weekday === weekday)!;
      const branchRecord = db.branches.find((b) => b.id === bAssignment.branchId);
      const deptRecord = db.departments.find((d) => d.id === doc.departmentId);
      const primarySpecialty = db.specialties.find((s) => doc.specialtyIds.includes(s.id));

      const startTimeFormatted = formatTime24to12(matchingRule.startTime);
      const endTimeFormatted = formatTime24to12(matchingRule.endTime);

      eligibleDoctors.push({
        doctorId: doc.id,
        doctorSlug: doc.slug,
        nameEn: doc.nameEn,
        nameBn: doc.nameBn,
        designationEn: doc.designationEn,
        qualificationsEn: doc.qualificationsEn,
        bmdcRegistrationNo: doc.bmdcRegistrationNo,
        departmentId: doc.departmentId,
        departmentNameEn: deptRecord?.nameEn || "Specialized Care",
        departmentNameBn: deptRecord?.nameBn || "বিশেষায়িত কেয়ার",
        primarySpecialtyEn: primarySpecialty?.nameEn || deptRecord?.nameEn || "Clinical Care",
        primarySpecialtyBn: primarySpecialty?.nameBn || deptRecord?.nameBn || "চিকিৎসা সেবা",
        branchId: bAssignment.branchId,
        branchNameEn: branchRecord?.nameEn || "DeltaCare Hospital",
        branchNameBn: branchRecord?.nameBn || "ডেল্টাকেয়ার হসপিটাল",
        roomNumber: bAssignment.roomNumber || "Chamber Desk",
        consultationDate: targetDate,
        consultationDateFormatted: formattedEn,
        consultationDateBangla: formattedBn,
        consultationHours: `${startTimeFormatted} – ${endTimeFormatted}`,
        startTime: matchingRule.startTime,
        endTime: matchingRule.endTime,
        photoUrl: doc.imageUrl || "/images/doctors/doc-1.svg",
        imagePosition: doc.imagePosition || "center",
        imageCrop: doc.imageCrop,
        totalAvailableSlots,
        totalChamberCapacity,
        consultationFeeBdt: doc.consultationFeeBdt,
      });

      foundAvailableChamber = true;
      break; // One primary chamber card per doctor
    }

    if (!foundAvailableChamber) {
      excludedCount++;
    }
  }

  return {
    date: targetDate,
    weekday,
    weekdayName: WEEKDAY_NAMES_EN[weekday] || "",
    timezone,
    generatedAt: new Date().toISOString(),
    eligibleDoctors,
    excludedCount,
    conflicts,
  };
}

export function checkStaleness(
  targetDate: string,
  baselineDoctorIds: string[]
): {
  isStale: boolean;
  currentAvailableCount: number;
  baselineCount: number;
  reason?: string;
} {
  const current = calculateDailyDoctorAvailability(targetDate);
  const currentIds = new Set(current.eligibleDoctors.map((d) => d.doctorId));
  const baselineSet = new Set(baselineDoctorIds);

  let isStale = false;
  let reason: string | undefined;

  if (currentIds.size !== baselineSet.size) {
    isStale = true;
    reason = `Doctor availability count changed: previously ${baselineSet.size}, now ${currentIds.size}.`;
  } else {
    for (const id of baselineSet) {
      if (!currentIds.has(id)) {
        isStale = true;
        reason = `One or more doctors are no longer available on ${targetDate}.`;
        break;
      }
    }
  }

  return {
    isStale,
    currentAvailableCount: currentIds.size,
    baselineCount: baselineSet.size,
    reason,
  };
}

