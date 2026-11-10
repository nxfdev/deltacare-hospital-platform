import { getDbState, recordAuditEvent, runInTransaction } from "@/server/db/store";
import {
  Appointment,
  AppointmentStatus,
  DoctorChamberSchedule,
  DoctorScheduleOverride,
  RoleCode,
  ScheduleException,
} from "@/types/domain";
import { AppointmentRequestInput } from "@/lib/validation/schemas";
import { isRecordCurrentlyValid } from "./publicQueryService";
import {
  normalizeBangladeshPhone,
  recordAndDispatchAppointmentSms,
} from "@/lib/sms/sms-service";

// ============================================================================
// DeltaCare Appointment Scheduling & Concurrency Service
// Enforces FR-APT-01..12: Slot calculation, transactional capacity check,
// status history, unconfirmed request honesty, and exception blocking.
// ============================================================================

export interface ComputedTimeSlot {
  time: string;
  capacity: number;
  bookedCount: number;
  remainingCapacity: number;
  isAvailable: boolean;
  blockedReason?: string;
}

/**
 * Calculates calendar weekday (0 = Sunday .. 6 = Saturday) for YYYY-MM-DD
 * in the specified hospital timezone (default "Asia/Dhaka").
 * Avoids JavaScript UTC date parsing timezone-shift bugs (Task 3).
 */
export function getCalendarWeekday(dateStr: string, timeZone: string = "Asia/Dhaka"): number {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateStr.trim());
  if (!match) return -1;
  const year = parseInt(match[1], 10);
  const month = parseInt(match[2], 10) - 1;
  const day = parseInt(match[3], 10);

  // UTC midday (12:00:00) ensures zero calendar date shifting regardless of local offset
  const dt = new Date(Date.UTC(year, month, day, 12, 0, 0));
  const weekdayStr = new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    timeZone,
  }).format(dt);

  const map: Record<string, number> = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
  };
  return map[weekdayStr] ?? -1;
}

function generateSlotsBetween(
  startTime: string,
  endTime: string,
  slotMinutes: number
): string[] {
  const [sh, sm] = startTime.split(":").map(Number);
  const [eh, em] = endTime.split(":").map(Number);
  const startTotal = sh * 60 + sm;
  const endTotal = eh * 60 + em;
  const slots: string[] = [];
  for (let t = startTotal; t + slotMinutes <= endTotal; t += slotMinutes) {
    const hh = String(Math.floor(t / 60)).padStart(2, "0");
    const mm = String(t % 60).padStart(2, "0");
    slots.push(`${hh}:${mm}`);
  }
  return slots;
}

export function getDoctorBranchAvailability(
  doctorId: string,
  branchId: string,
  dateStr: string
): ComputedTimeSlot[] {
  const db = getDbState();
  const doc = db.doctors.find(
    (d) => d.id === doctorId && d.publicationState === "PUBLISHED"
  );
  if (!doc) return [];

  const dbAssignment = doc.branches.find(
    (b) => b.branchId === branchId && b.status === "ACTIVE"
  );
  if (!dbAssignment) return [];

  // Check if date has a full-day ScheduleException (FR-APT-11 / US-S03) or DoctorScheduleOverride
  const activeException = dbAssignment.scheduleExceptions.find(
    (ex) => ex.dateStr === dateStr
  );
  if (activeException) {
    return [];
  }

  const override = (db.scheduleOverrides || []).find(
    (o) => o.doctorId === doctorId && o.branchId === branchId && o.date === dateStr
  );
  if (override && override.overrideType === "FULL_DAY_LEAVE") {
    return [];
  }

  // Weekday-specific schedule rule validation (Release 1.1 / Task 3)
  const targetWeekday = getCalendarWeekday(dateStr, db.hospital.timezone || "Asia/Dhaka");
  if (targetWeekday < 0) return [];

  const validRules = dbAssignment.scheduleRules.filter((sr) => {
    if (!isRecordCurrentlyValid(sr.publicationState, sr.effectiveFrom, sr.effectiveTo)) {
      return false;
    }
    return sr.weekday === targetWeekday;
  });

  if (
    validRules.length === 0 &&
    !(override && override.overrideType === "CUSTOM_HOURS" && override.customStartTime && override.customEndTime)
  ) {
    // No chamber offered on this weekday
    return [];
  }

  const rule = validRules[0] ?? dbAssignment.scheduleRules[0];
  if (!rule) return [];

  const effectiveStart =
    override?.overrideType === "CUSTOM_HOURS" && override.customStartTime
      ? override.customStartTime
      : rule.startTime;
  const effectiveEnd =
    override?.overrideType === "CUSTOM_HOURS" && override.customEndTime
      ? override.customEndTime
      : rule.endTime;

  const rawSlots = generateSlotsBetween(
    effectiveStart,
    effectiveEnd,
    rule.slotMinutes
  );

  const blockedSet = new Set<string>(override?.blockedSlots ?? []);

  // Active bookings that consume capacity
  const activeStatuses: AppointmentStatus[] = [
    "REQUESTED",
    "PENDING_CONFIRMATION",
    "CONFIRMED",
    "RESCHEDULE_REQUESTED",
  ];

  return rawSlots.map((time) => {
    const isBlockedByOverride = blockedSet.has(time);
    const bookedCount = db.appointments.filter(
      (apt) =>
        apt.doctorBranchId === dbAssignment.id &&
        apt.preferredDate === dateStr &&
        apt.preferredTimeSlot === time &&
        activeStatuses.includes(apt.status)
    ).length;

    const remainingCapacity = isBlockedByOverride
      ? 0
      : Math.max(0, rule.capacityPerSlot - bookedCount);
    return {
      time,
      capacity: rule.capacityPerSlot,
      bookedCount,
      remainingCapacity,
      isAvailable: remainingCapacity > 0 && !isBlockedByOverride,
      blockedReason: isBlockedByOverride ? (override?.reasonEn ?? "Blocked") : undefined,
    };
  });
}

export async function createAppointmentRequest(
  input: AppointmentRequestInput,
  patientUserId?: string
): Promise<{ ok: true; appointment: Appointment } | { ok: false; error: string }> {
  return runInTransaction((state) => {
    const doc = state.doctors.find(
      (d) => d.id === input.doctorId && d.publicationState === "PUBLISHED"
    );
    if (!doc) {
      return { ok: false, error: "Selected specialist is not available for public booking." };
    }

    const dbAssign = doc.branches.find(
      (b) => b.branchId === input.branchId && b.status === "ACTIVE"
    );
    if (!dbAssign) {
      return {
        ok: false,
        error: "Selected specialist does not have an active chamber at this branch.",
      };
    }

    // Check schedule exception or override
    const hasException = dbAssign.scheduleExceptions.some(
      (ex) => ex.dateStr === input.preferredDate
    );
    const override = (state.scheduleOverrides || []).find(
      (o) =>
        o.doctorId === input.doctorId &&
        o.branchId === input.branchId &&
        o.date === input.preferredDate
    );
    if (hasException || override?.overrideType === "FULL_DAY_LEAVE") {
      return {
        ok: false,
        error:
          override?.reasonEn ||
          "Doctor chamber is blocked/unavailable on the selected date. Please choose another date.",
      };
    }

    if (override?.blockedSlots?.includes(input.preferredTimeSlot)) {
      return {
        ok: false,
        error: `Selected time slot ${input.preferredTimeSlot} is blocked (${override.reasonEn || "Unavailable"}). Please choose another slot.`,
      };
    }

    // Weekday-specific schedule rule validation (Release 1.1 / Task 3)
    const targetWeekday = getCalendarWeekday(input.preferredDate, state.hospital.timezone || "Asia/Dhaka");
    if (targetWeekday < 0) {
      return { ok: false, error: "Invalid date format. Expected YYYY-MM-DD." };
    }

    const validRules = dbAssign.scheduleRules.filter((sr) => {
      if (!isRecordCurrentlyValid(sr.publicationState, sr.effectiveFrom, sr.effectiveTo)) {
        return false;
      }
      return sr.weekday === targetWeekday;
    });

    const isCustomHours =
      override?.overrideType === "CUSTOM_HOURS" &&
      Boolean(override.customStartTime && override.customEndTime);

    if (validRules.length === 0 && !isCustomHours) {
      return {
        ok: false,
        error: "Selected specialist does not have an active chamber on this day of the week. Please choose an available clinic day.",
      };
    }

    const rule = validRules[0] ?? dbAssign.scheduleRules[0];
    const effectiveStart =
      isCustomHours && override?.customStartTime ? override.customStartTime : rule.startTime;
    const effectiveEnd =
      isCustomHours && override?.customEndTime ? override.customEndTime : rule.endTime;

    const allowedSlots = generateSlotsBetween(effectiveStart, effectiveEnd, rule.slotMinutes);
    if (!allowedSlots.includes(input.preferredTimeSlot)) {
      return {
        ok: false,
        error: `Selected time slot ${input.preferredTimeSlot} is not offered for this chamber (Offered: ${effectiveStart} - ${effectiveEnd}).`,
      };
    }

    // Prevent duplicate active request by same phone for same doctor/date/slot (US-P04)
    const activeStatuses: AppointmentStatus[] = [
      "REQUESTED",
      "PENDING_CONFIRMATION",
      "CONFIRMED",
    ];
    const normalizedPhone = normalizeBangladeshPhone(input.patientPhone);
    const duplicate = state.appointments.find(
      (a) =>
        a.doctorBranchId === dbAssign.id &&
        a.preferredDate === input.preferredDate &&
        a.preferredTimeSlot === input.preferredTimeSlot &&
        normalizeBangladeshPhone(a.patientPhone) === normalizedPhone &&
        activeStatuses.includes(a.status)
    );
    if (duplicate) {
      return {
        ok: false,
        error: `A request for this slot already exists under reference ${duplicate.reference}.`,
      };
    }

    // Prevent public slot hoarding: max 3 active bookings per phone number per day
    const activeSameDayCount = state.appointments.filter(
      (a) =>
        normalizeBangladeshPhone(a.patientPhone) === normalizedPhone &&
        a.preferredDate === input.preferredDate &&
        activeStatuses.includes(a.status)
    ).length;

    if (activeSameDayCount >= 3) {
      return {
        ok: false,
        error:
          "Maximum of 3 active appointment bookings per phone number per day reached. Please call 10666 for assistance.",
      };
    }

    // Transactional slot capacity verification (FR-APT-07 / T-APT-02)
    const capacity = rule.capacityPerSlot ?? 2;
    const currentCount = state.appointments.filter(
      (a) =>
        a.doctorBranchId === dbAssign.id &&
        a.preferredDate === input.preferredDate &&
        a.preferredTimeSlot === input.preferredTimeSlot &&
        activeStatuses.includes(a.status)
    ).length;

    if (currentCount >= capacity) {
      return {
        ok: false,
        error:
          "Selected time slot has reached maximum capacity. Please choose another available time slot.",
      };
    }

    const seq = 1040 + state.appointments.length + 1;
    const reference = `DC-2026-${seq}`;
    const nowIso = new Date().toISOString();
    const branchObj = state.branches.find((b) => b.id === input.branchId);

    // FR-APT-10: Never label a request CONFIRMED upon submission; starts as REQUESTED
    const newAppointment: Appointment = {
      id: `apt-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      reference,
      doctorBranchId: dbAssign.id,
      departmentId: input.departmentId,
      doctorId: input.doctorId,
      branchId: input.branchId,
      patientUserId,
      patientName: input.patientName,
      patientPhone: normalizedPhone,
      patientEmail: input.patientEmail || undefined,
      patientAge: input.patientAge,
      patientGender: input.patientGender || undefined,
      preferredDate: input.preferredDate,
      preferredTimeSlot: input.preferredTimeSlot,
      visitType: input.visitType,
      bookingSource: input.bookingSource ?? "ONLINE_WEBSITE",
      reasonNote: input.reasonNote || input.symptomsNote || undefined,
      symptomsNote: input.symptomsNote || input.reasonNote || undefined,
      consentAccepted: true,
      status: "REQUESTED",
      source: "WEBSITE",
      createdAt: nowIso,
      updatedAt: nowIso,
      events: [
        {
          id: `ev-${Date.now()}`,
          appointmentId: reference,
          fromStatus: null,
          toStatus: "REQUESTED",
          actorUserId: patientUserId,
          actorName: `${input.patientName} (Visitor/Patient)`,
          reason: "Online appointment request submitted (Pending Front-Desk Confirmation)",
          createdAt: nowIso,
        },
      ],
    };

    state.appointments.unshift(newAppointment);

    // Trigger SMS via pluggable Bangladesh SMS service (Task 2.3)
    recordAndDispatchAppointmentSms({
      appointmentId: newAppointment.id,
      referenceCode: reference,
      recipientPhone: normalizedPhone,
      patientName: input.patientName,
      doctorNameEn: doc.nameEn,
      doctorNameBn: doc.nameBn,
      branchNameEn: branchObj?.nameEn ?? input.branchId,
      chamberRoom: dbAssign.roomNumber,
      appointmentDate: input.preferredDate,
      slotTime: input.preferredTimeSlot,
      eventType: "REQUEST_RECEIVED",
    });

    recordAuditEvent(state, {
      actorUserId: patientUserId ?? "visitor",
      actorName: input.patientName,
      actorRole: patientUserId ? "PATIENT" : "VISITOR",
      action: "APPOINTMENT_REQUEST_CREATED",
      entityType: "Appointment",
      entityId: newAppointment.id,
      summary: `Created appointment request ${reference} (${input.preferredDate} ${input.preferredTimeSlot}) in REQUESTED state.`,
    });

    return { ok: true, appointment: newAppointment };
  });
}

export const createPublicAppointment = createAppointmentRequest;

export async function transitionAppointmentStatus(params: {
  appointmentId: string;
  toStatus: AppointmentStatus;
  actorUserId: string;
  actorName: string;
  actorRole: RoleCode;
  reason: string;
  newDate?: string;
  newTimeSlot?: string;
  newBranchId?: string;
}): Promise<{ ok: true; appointment: Appointment } | { ok: false; error: string }> {
  return runInTransaction((state) => {
    const apt = state.appointments.find(
      (a) => a.id === params.appointmentId || a.reference === params.appointmentId
    );
    if (!apt) {
      return { ok: false, error: "Appointment record not found." };
    }

    const fromStatus = apt.status;
    const targetDate = params.newDate ?? apt.preferredDate;
    const targetSlot = params.newTimeSlot ?? apt.preferredTimeSlot;
    const targetBranchId = params.newBranchId ?? apt.branchId;
    const isSlotMoved =
      targetDate !== apt.preferredDate ||
      targetSlot !== apt.preferredTimeSlot ||
      targetBranchId !== apt.branchId;

    const doc = state.doctors.find((d) => d.id === apt.doctorId);
    const dbAssign =
      doc?.branches.find((b) => b.branchId === targetBranchId && b.status === "ACTIVE") ??
      doc?.branches.find((b) => b.id === apt.doctorBranchId);

    // Re-check weekday, exceptions, overrides, and capacity when confirming or rescheduling
    if (
      params.toStatus === "CONFIRMED" ||
      params.newDate ||
      params.newTimeSlot ||
      params.newBranchId
    ) {
      if (!dbAssign) {
        return { ok: false, error: "Doctor branch assignment not found." };
      }

      // Check schedule exception or override
      const hasException = dbAssign.scheduleExceptions.some((ex) => ex.dateStr === targetDate);
      const override = (state.scheduleOverrides || []).find(
        (o) =>
          o.doctorId === apt.doctorId &&
          o.branchId === dbAssign.branchId &&
          o.date === targetDate
      );
      if (hasException || override?.overrideType === "FULL_DAY_LEAVE") {
        return {
          ok: false,
          error: override?.reasonEn || `Doctor chamber is blocked/unavailable on ${targetDate}.`,
        };
      }

      if (override?.blockedSlots?.includes(targetSlot)) {
        return {
          ok: false,
          error: `Slot ${targetSlot} on ${targetDate} is blocked (${override.reasonEn || "Unavailable"}).`,
        };
      }

      // Weekday schedule validation
      const targetWeekday = getCalendarWeekday(targetDate, state.hospital.timezone || "Asia/Dhaka");
      const validRules = dbAssign.scheduleRules.filter((sr) => {
        if (!isRecordCurrentlyValid(sr.publicationState, sr.effectiveFrom, sr.effectiveTo)) return false;
        return sr.weekday === targetWeekday;
      });

      const isCustomHours =
        override?.overrideType === "CUSTOM_HOURS" &&
        Boolean(override.customStartTime && override.customEndTime);

      if (validRules.length === 0 && !isCustomHours) {
        return {
          ok: false,
          error: `Specialist does not have an active chamber on ${targetDate}.`,
        };
      }

      const rule = validRules[0] ?? dbAssign.scheduleRules[0];
      const capacity = rule?.capacityPerSlot ?? 2;

      const otherBookings = state.appointments.filter(
        (a) =>
          a.id !== apt.id &&
          a.doctorBranchId === dbAssign.id &&
          a.preferredDate === targetDate &&
          a.preferredTimeSlot === targetSlot &&
          (a.status === "CONFIRMED" || a.status === "REQUESTED" || a.status === "PENDING_CONFIRMATION")
      ).length;

      if (otherBookings >= capacity) {
        return {
          ok: false,
          error: `Slot ${targetDate} ${targetSlot} is already at full capacity (${capacity}).`,
        };
      }
    }

    const nowIso = new Date().toISOString();
    apt.status = params.toStatus;
    apt.preferredDate = targetDate;
    apt.preferredTimeSlot = targetSlot;
    if (dbAssign) {
      apt.branchId = dbAssign.branchId;
      apt.doctorBranchId = dbAssign.id;
    }
    apt.updatedAt = nowIso;
    apt.staffNotes = params.reason;
    if (params.toStatus === "CANCELLED") {
      apt.cancelReason = params.reason;
    }

    if (params.toStatus === "CONFIRMED") {
      apt.confirmedByUserId = params.actorUserId;
      apt.confirmedAt = nowIso;
    }

    apt.events.push({
      id: `ev-${Date.now()}`,
      appointmentId: apt.id,
      fromStatus,
      toStatus: params.toStatus,
      actorUserId: params.actorUserId,
      actorName: params.actorName,
      reason: params.reason,
      createdAt: nowIso,
    });

    const branchObj = state.branches.find((b) => b.id === apt.branchId);
    const smsEventType =
      params.toStatus === "CANCELLED"
        ? "CANCELLED"
        : isSlotMoved || params.toStatus === "RESCHEDULE_REQUESTED"
          ? "RESCHEDULED"
          : params.toStatus === "CONFIRMED"
            ? "CONFIRMED"
            : null;

    if (smsEventType) {
      recordAndDispatchAppointmentSms({
        appointmentId: apt.id,
        referenceCode: apt.reference,
        recipientPhone: apt.patientPhone,
        patientName: apt.patientName,
        doctorNameEn: doc?.nameEn ?? apt.doctorId,
        doctorNameBn: doc?.nameBn,
        branchNameEn: branchObj?.nameEn ?? apt.branchId,
        chamberRoom: dbAssign?.roomNumber ?? "Consultation Chamber",
        appointmentDate: apt.preferredDate,
        slotTime: apt.preferredTimeSlot,
        eventType: smsEventType,
        reason: params.reason,
      });
    } else {
      state.notifications.unshift({
        id: `notif-${Date.now()}`,
        channel: "SMS",
        recipient: apt.patientPhone,
        templateCode: `APT_STATUS_${params.toStatus}`,
        subject: `DeltaCare Appointment ${params.toStatus} (${apt.reference})`,
        bodyPreview: `DeltaCare: Appointment ${apt.reference} status updated to ${params.toStatus} for ${apt.preferredDate} at ${apt.preferredTimeSlot}. Note: ${params.reason}`,
        status: "DELIVERED",
        relatedEntityType: "APPOINTMENT",
        relatedEntityId: apt.id,
        providerMessageId: `SIM-UPD-${Date.now()}`,
        sentAt: nowIso,
      });
    }

    recordAuditEvent(state, {
      actorUserId: params.actorUserId,
      actorName: params.actorName,
      actorRole: params.actorRole,
      action: `APPOINTMENT_${params.toStatus}`,
      entityType: "Appointment",
      entityId: apt.id,
      summary: `Transitioned appointment ${apt.reference} from ${fromStatus} to ${params.toStatus}. Reason: ${params.reason}`,
    });

    return { ok: true, appointment: apt };
  });
}

/**
 * 15-Second Phone Hotline & Walk-In Quick Booking (Task 2.1 #4)
 * Books directly as CONFIRMED and dispatches the Confirmation SMS in one atomic step.
 */
export async function createFrontDeskAppointment(params: {
  doctorId: string;
  branchId: string;
  appointmentDate: string; // YYYY-MM-DD
  slotTime: string; // HH:mm
  patientName: string;
  patientPhone: string;
  patientAge?: number;
  patientGender?: "MALE" | "FEMALE" | "OTHER" | string;
  visitType: "NEW_VISIT" | "FOLLOW_UP" | "REPORT_SHOW" | "NEW_CONSULTATION";
  bookingSource: "FRONT_DESK_PHONE" | "WALK_IN_DESK";
  symptomsNote?: string;
  actorUserId: string;
  actorName: string;
  actorRole: RoleCode;
}): Promise<{ ok: true; appointment: Appointment } | { ok: false; error: string }> {
  return runInTransaction((state) => {
    const doc = state.doctors.find((d) => d.id === params.doctorId);
    if (!doc) {
      return { ok: false, error: "Selected specialist not found." };
    }
    const dbAssign = doc.branches.find(
      (b) => b.branchId === params.branchId && b.status === "ACTIVE"
    );
    if (!dbAssign) {
      return {
        ok: false,
        error: "Selected specialist does not have an active chamber at this branch.",
      };
    }

    const override = (state.scheduleOverrides || []).find(
      (o) =>
        o.doctorId === params.doctorId &&
        o.branchId === params.branchId &&
        o.date === params.appointmentDate
    );
    if (override?.overrideType === "FULL_DAY_LEAVE") {
      return {
        ok: false,
        error: override.reasonEn || "Doctor is on full-day leave on this date.",
      };
    }
    if (override?.blockedSlots?.includes(params.slotTime)) {
      return {
        ok: false,
        error: `Slot ${params.slotTime} is blocked on ${params.appointmentDate}.`,
      };
    }

    const targetWeekday = getCalendarWeekday(
      params.appointmentDate,
      state.hospital.timezone || "Asia/Dhaka"
    );
    const validRules = dbAssign.scheduleRules.filter(
      (sr) =>
        isRecordCurrentlyValid(sr.publicationState, sr.effectiveFrom, sr.effectiveTo) &&
        sr.weekday === targetWeekday
    );
    const isCustomHours =
      override?.overrideType === "CUSTOM_HOURS" &&
      Boolean(override.customStartTime && override.customEndTime);

    if (validRules.length === 0 && !isCustomHours) {
      return {
        ok: false,
        error: "Doctor does not have a scheduled chamber on this date.",
      };
    }

    const rule = validRules[0] ?? dbAssign.scheduleRules[0];
    const capacity = rule?.capacityPerSlot ?? 1;

    const activeStatuses: AppointmentStatus[] = [
      "REQUESTED",
      "PENDING_CONFIRMATION",
      "CONFIRMED",
    ];
    const currentCount = state.appointments.filter(
      (a) =>
        a.doctorBranchId === dbAssign.id &&
        a.preferredDate === params.appointmentDate &&
        a.preferredTimeSlot === params.slotTime &&
        activeStatuses.includes(a.status)
    ).length;

    if (currentCount >= capacity) {
      return {
        ok: false,
        error: `Slot ${params.slotTime} on ${params.appointmentDate} is already booked.`,
      };
    }

    const seq = 1040 + state.appointments.length + 1;
    const reference = `DC-2026-${seq}`;
    const nowIso = new Date().toISOString();
    const normalizedPhone = normalizeBangladeshPhone(params.patientPhone);
    const branchObj = state.branches.find((b) => b.id === params.branchId);

    const newAppointment: Appointment = {
      id: `apt-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      reference,
      doctorBranchId: dbAssign.id,
      departmentId: doc.departmentId,
      doctorId: doc.id,
      branchId: params.branchId,
      patientName: params.patientName.trim(),
      patientPhone: normalizedPhone,
      patientAge: params.patientAge,
      patientGender: params.patientGender,
      preferredDate: params.appointmentDate,
      preferredTimeSlot: params.slotTime,
      visitType: params.visitType,
      bookingSource: params.bookingSource,
      reasonNote: params.symptomsNote,
      symptomsNote: params.symptomsNote,
      consentAccepted: true,
      status: "CONFIRMED",
      source: params.bookingSource === "FRONT_DESK_PHONE" ? "PHONE" : "FRONT_DESK",
      staffNotes: `Booked via ${params.bookingSource} by ${params.actorName}`,
      confirmedByUserId: params.actorUserId,
      confirmedAt: nowIso,
      createdAt: nowIso,
      updatedAt: nowIso,
      events: [
        {
          id: `ev-${Date.now()}`,
          appointmentId: reference,
          fromStatus: null,
          toStatus: "CONFIRMED",
          actorUserId: params.actorUserId,
          actorName: params.actorName,
          reason: `Direct ${params.bookingSource} booking confirmed at reception`,
          createdAt: nowIso,
        },
      ],
    };

    state.appointments.unshift(newAppointment);

    recordAndDispatchAppointmentSms({
      appointmentId: newAppointment.id,
      referenceCode: reference,
      recipientPhone: normalizedPhone,
      patientName: newAppointment.patientName,
      doctorNameEn: doc.nameEn,
      doctorNameBn: doc.nameBn,
      branchNameEn: branchObj?.nameEn ?? params.branchId,
      chamberRoom: dbAssign.roomNumber,
      appointmentDate: params.appointmentDate,
      slotTime: params.slotTime,
      eventType: "CONFIRMED",
    });

    recordAuditEvent(state, {
      actorUserId: params.actorUserId,
      actorName: params.actorName,
      actorRole: params.actorRole,
      action: "FRONT_DESK_APPOINTMENT_CONFIRMED",
      entityType: "Appointment",
      entityId: newAppointment.id,
      summary: `Booked & confirmed ${reference} (${params.bookingSource}) for ${newAppointment.patientName} on ${params.appointmentDate} ${params.slotTime}.`,
    });

    return { ok: true, appointment: newAppointment };
  });
}

/**
 * Doctor Assistant & Front Desk Schedule Override Manager (Task 2.1 #2)
 * Handles CUSTOM_HOURS, BLOCKED_SLOTS, FULL_DAY_LEAVE, and conflict detection.
 */
export async function upsertDoctorScheduleOverride(params: {
  doctorId: string;
  branchId: string;
  date: string; // YYYY-MM-DD
  overrideType: "FULL_DAY_LEAVE" | "CUSTOM_HOURS" | "BLOCKED_SLOTS" | "CLEAR";
  customStartTime?: string | null;
  customEndTime?: string | null;
  blockedSlots?: string[];
  reasonEn?: string | null;
  reasonBn?: string | null;
  actorUserId: string;
  actorName: string;
  actorRole: RoleCode;
}): Promise<
  | {
      ok: true;
      override: DoctorScheduleOverride | null;
      affectedAppointments: Appointment[];
    }
  | { ok: false; error: string }
> {
  return runInTransaction((state) => {
    const doc = state.doctors.find((d) => d.id === params.doctorId);
    if (!doc) {
      return { ok: false, error: "Doctor not found." };
    }
    const dbAssign = doc.branches.find((b) => b.branchId === params.branchId);
    if (!dbAssign) {
      return { ok: false, error: "Doctor branch assignment not found." };
    }

    const nowIso = new Date().toISOString();

    if (params.overrideType === "CLEAR") {
      state.scheduleOverrides = (state.scheduleOverrides || []).filter(
        (o) =>
          !(
            o.doctorId === params.doctorId &&
            o.branchId === params.branchId &&
            o.date === params.date
          )
      );
      dbAssign.scheduleExceptions = dbAssign.scheduleExceptions.filter(
        (ex) => ex.dateStr !== params.date
      );
      doc.scheduleOverrides = state.scheduleOverrides.filter(
        (o) => o.doctorId === doc.id
      );
      return { ok: true, override: null, affectedAppointments: [] };
    }

    let existing = (state.scheduleOverrides || []).find(
      (o) =>
        o.doctorId === params.doctorId &&
        o.branchId === params.branchId &&
        o.date === params.date
    );

    if (existing) {
      existing.overrideType = params.overrideType;
      if (params.customStartTime !== undefined) {
        existing.customStartTime = params.customStartTime;
      }
      if (params.customEndTime !== undefined) {
        existing.customEndTime = params.customEndTime;
      }
      if (params.blockedSlots !== undefined) {
        existing.blockedSlots = params.blockedSlots;
      }
      if (params.reasonEn !== undefined) {
        existing.reasonEn = params.reasonEn;
      }
      if (params.reasonBn !== undefined) {
        existing.reasonBn = params.reasonBn;
      }
    } else {
      existing = {
        id: `ovr-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        doctorId: params.doctorId,
        branchId: params.branchId,
        date: params.date,
        overrideType: params.overrideType,
        customStartTime: params.customStartTime ?? null,
        customEndTime: params.customEndTime ?? null,
        blockedSlots: params.blockedSlots ?? [],
        reasonEn: params.reasonEn ?? null,
        reasonBn: params.reasonBn ?? null,
        createdByUserId: params.actorUserId,
        createdAt: nowIso,
      };
      state.scheduleOverrides.push(existing);
    }

    doc.scheduleOverrides = state.scheduleOverrides.filter(
      (o) => o.doctorId === doc.id
    );

    // Detect overlapping active appointments and flag them for reschedule
    const blockedSet = new Set(existing.blockedSlots ?? []);
    const affectedAppointments = state.appointments.filter((a) => {
      if (
        a.doctorId !== params.doctorId ||
        a.branchId !== params.branchId ||
        a.preferredDate !== params.date
      ) {
        return false;
      }
      if (
        a.status !== "REQUESTED" &&
        a.status !== "PENDING_CONFIRMATION" &&
        a.status !== "CONFIRMED"
      ) {
        return false;
      }
      if (params.overrideType === "FULL_DAY_LEAVE") {
        return true;
      }
      if (blockedSet.has(a.preferredTimeSlot)) {
        return true;
      }
      return false;
    });

    for (const apt of affectedAppointments) {
      const prev = apt.status;
      apt.status = "RESCHEDULE_REQUESTED";
      apt.updatedAt = nowIso;
      apt.events.push({
        id: `ev-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
        appointmentId: apt.id,
        fromStatus: prev,
        toStatus: "RESCHEDULE_REQUESTED",
        actorUserId: params.actorUserId,
        actorName: params.actorName,
        reason: `Schedule override (${params.overrideType}: ${params.reasonEn || "Slot blocked"}); flagged for reschedule.`,
        createdAt: nowIso,
      });
    }

    recordAuditEvent(state, {
      actorUserId: params.actorUserId,
      actorName: params.actorName,
      actorRole: params.actorRole,
      action: `SCHEDULE_OVERRIDE_${params.overrideType}`,
      entityType: "DoctorScheduleOverride",
      entityId: existing.id,
      summary: `Updated schedule override (${params.overrideType}) for ${doc.nameEn} on ${params.date}. Affected bookings: ${affectedAppointments.length}`,
    });

    return { ok: true, override: existing, affectedAppointments };
  });
}

/**
 * Recurring Weekly Chamber Schedule Rule Editor (Task 2.1 #2)
 */
export async function upsertDoctorChamberScheduleRule(params: {
  doctorId: string;
  branchId: string;
  dayOfWeek: number; // 0..6
  chamberRoom: string;
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  breakStartTime?: string | null;
  breakEndTime?: string | null;
  slotDurationMinutes: number; // 10, 15, 20, 30
  isActive: boolean;
  actorUserId: string;
  actorName: string;
  actorRole: RoleCode;
}): Promise<{ ok: true; schedule: DoctorChamberSchedule } | { ok: false; error: string }> {
  return runInTransaction((state) => {
    const doc = state.doctors.find((d) => d.id === params.doctorId);
    if (!doc) {
      return { ok: false, error: "Doctor not found." };
    }

    const weekdayNamesEn = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const weekdayNamesBn = ["রবিবার", "সোমবার", "মঙ্গলবার", "বুধবার", "বৃহস্পতিবার", "শুক্রবার", "শনিবার"];

    let dbAssign = doc.branches.find((b) => b.branchId === params.branchId);
    if (!dbAssign) {
      dbAssign = {
        id: `db-${doc.id}-${params.branchId}`,
        doctorId: doc.id,
        branchId: params.branchId,
        roomNumber: params.chamberRoom,
        status: "ACTIVE",
        scheduleRules: [],
        scheduleExceptions: [],
      };
      doc.branches.push(dbAssign);
    } else {
      dbAssign.roomNumber = params.chamberRoom;
      dbAssign.status = "ACTIVE";
    }

    const nowIso = new Date().toISOString();
    const existingRule = dbAssign.scheduleRules.find((r) => r.weekday === params.dayOfWeek);
    if (existingRule) {
      existingRule.startTime = params.startTime;
      existingRule.endTime = params.endTime;
      existingRule.slotMinutes = params.slotDurationMinutes;
      existingRule.publicationState = params.isActive ? "PUBLISHED" : "ARCHIVED";
      existingRule.updatedAt = nowIso;
    } else if (params.isActive) {
      dbAssign.scheduleRules.push({
        id: `sr-${doc.id}-${params.branchId}-${params.dayOfWeek}`,
        doctorBranchId: dbAssign.id,
        weekday: params.dayOfWeek,
        weekdayLabelEn: weekdayNamesEn[params.dayOfWeek] ?? "Chamber Day",
        weekdayLabelBn: weekdayNamesBn[params.dayOfWeek] ?? "চেম্বার",
        startTime: params.startTime,
        endTime: params.endTime,
        slotMinutes: params.slotDurationMinutes,
        capacityPerSlot: 1,
        effectiveFrom: "2026-01-01T00:00:00.000Z",
        effectiveTo: null,
        publicationState: "PUBLISHED",
        updatedAt: nowIso,
      });
    }

    let cs = state.chamberSchedules.find(
      (c) =>
        c.doctorId === params.doctorId &&
        c.branchId === params.branchId &&
        c.dayOfWeek === params.dayOfWeek
    );
    if (cs) {
      cs.chamberRoom = params.chamberRoom;
      cs.startTime = params.startTime;
      cs.endTime = params.endTime;
      cs.breakStartTime = params.breakStartTime ?? null;
      cs.breakEndTime = params.breakEndTime ?? null;
      cs.slotDurationMinutes = params.slotDurationMinutes;
      cs.isActive = params.isActive;
    } else {
      cs = {
        id: `cs-${doc.id}-${params.branchId}-${params.dayOfWeek}`,
        doctorId: params.doctorId,
        branchId: params.branchId,
        chamberRoom: params.chamberRoom,
        dayOfWeek: params.dayOfWeek,
        startTime: params.startTime,
        endTime: params.endTime,
        breakStartTime: params.breakStartTime ?? null,
        breakEndTime: params.breakEndTime ?? null,
        slotDurationMinutes: params.slotDurationMinutes,
        isActive: params.isActive,
      };
      state.chamberSchedules.push(cs);
    }

    doc.chamberSchedules = state.chamberSchedules.filter((c) => c.doctorId === doc.id);

    recordAuditEvent(state, {
      actorUserId: params.actorUserId,
      actorName: params.actorName,
      actorRole: params.actorRole,
      action: "CHAMBER_SCHEDULE_UPDATED",
      entityType: "DoctorChamberSchedule",
      entityId: cs.id,
      summary: `Updated recurring chamber schedule for ${doc.nameEn} on weekday ${params.dayOfWeek} (${params.startTime}-${params.endTime}, ${params.slotDurationMinutes}m slots).`,
    });

    return { ok: true, schedule: cs };
  });
}

export async function blockDoctorChamberDate(params: {
  doctorBranchId: string;
  dateStr: string;
  exceptionType: "BLOCKED" | "LEAVE" | "RESCHEDULED";
  reasonEn: string;
  reasonBn: string;
  actorUserId: string;
  actorName: string;
  actorRole: RoleCode;
}): Promise<{
  ok: true;
  exception: ScheduleException;
  affectedAppointments: Appointment[];
} | { ok: false; error: string }> {
  return runInTransaction((state) => {
    let targetAssignment = null;
    for (const doc of state.doctors) {
      const found = doc.branches.find((b) => b.id === params.doctorBranchId);
      if (found) {
        targetAssignment = found;
        break;
      }
    }
    if (!targetAssignment) {
      return { ok: false, error: "Doctor branch assignment not found." };
    }

    const nowIso = new Date().toISOString();
    const ex: ScheduleException = {
      id: `ex-${Date.now()}`,
      doctorBranchId: params.doctorBranchId,
      dateStr: params.dateStr,
      startsAt: `${params.dateStr}T00:00:00.000Z`,
      endsAt: `${params.dateStr}T23:59:59.000Z`,
      exceptionType: params.exceptionType,
      reasonEn: params.reasonEn,
      reasonBn: params.reasonBn,
      createdByUserId: params.actorUserId,
      createdAt: nowIso,
    };

    targetAssignment.scheduleExceptions.push(ex);

    // Surface affected bookings for staff review (FR-APT-11 / US-S03 / T-APT-04)
    const affectedAppointments = state.appointments.filter(
      (a) =>
        a.doctorBranchId === params.doctorBranchId &&
        a.preferredDate === params.dateStr &&
        a.status !== "CANCELLED" &&
        a.status !== "COMPLETED"
    );

    for (const apt of affectedAppointments) {
      const prev = apt.status;
      apt.status = "RESCHEDULE_REQUESTED";
      apt.updatedAt = nowIso;
      apt.events.push({
        id: `ev-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
        appointmentId: apt.id,
        fromStatus: prev,
        toStatus: "RESCHEDULE_REQUESTED",
        actorUserId: params.actorUserId,
        actorName: params.actorName,
        reason: `Doctor chamber blocked (${params.reasonEn}); flagged for front-desk rescheduling.`,
        createdAt: nowIso,
      });
    }

    recordAuditEvent(state, {
      actorUserId: params.actorUserId,
      actorName: params.actorName,
      actorRole: params.actorRole,
      action: "SCHEDULE_EXCEPTION_ADDED",
      entityType: "ScheduleException",
      entityId: ex.id,
      summary: `Blocked ${params.doctorBranchId} on ${params.dateStr} (${params.reasonEn}). Affected bookings: ${affectedAppointments.length}`,
    });

    return { ok: true, exception: ex, affectedAppointments };
  });
}

