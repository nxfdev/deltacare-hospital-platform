import { getDbState, recordAuditEvent, runInTransaction } from "@/server/db/store";
import {
  Appointment,
  AppointmentStatus,
  RoleCode,
  ScheduleException,
} from "@/types/domain";
import { AppointmentRequestInput } from "@/lib/validation/schemas";
import { isRecordCurrentlyValid } from "./publicQueryService";

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

  // Check if date has a full-day ScheduleException (FR-APT-11 / US-S03)
  const activeException = dbAssignment.scheduleExceptions.find(
    (ex) => ex.dateStr === dateStr
  );
  if (activeException) {
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

  if (validRules.length === 0) {
    // No chamber offered on this weekday
    return [];
  }

  const rule = validRules[0];
  const rawSlots = generateSlotsBetween(
    rule.startTime,
    rule.endTime,
    rule.slotMinutes
  );

  // Active bookings that consume capacity
  const activeStatuses: AppointmentStatus[] = [
    "REQUESTED",
    "PENDING_CONFIRMATION",
    "CONFIRMED",
    "RESCHEDULE_REQUESTED",
  ];

  return rawSlots.map((time) => {
    const bookedCount = db.appointments.filter(
      (apt) =>
        apt.doctorBranchId === dbAssignment.id &&
        apt.preferredDate === dateStr &&
        apt.preferredTimeSlot === time &&
        activeStatuses.includes(apt.status)
    ).length;

    const remainingCapacity = Math.max(0, rule.capacityPerSlot - bookedCount);
    return {
      time,
      capacity: rule.capacityPerSlot,
      bookedCount,
      remainingCapacity,
      isAvailable: remainingCapacity > 0,
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

    // Check schedule exception
    const hasException = dbAssign.scheduleExceptions.some(
      (ex) => ex.dateStr === input.preferredDate
    );
    if (hasException) {
      return {
        ok: false,
        error:
          "Doctor chamber is blocked/unavailable on the selected date. Please choose another date.",
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

    if (validRules.length === 0) {
      return {
        ok: false,
        error: "Selected specialist does not have an active chamber on this day of the week. Please choose an available clinic day.",
      };
    }

    const rule = validRules[0];
    const allowedSlots = generateSlotsBetween(rule.startTime, rule.endTime, rule.slotMinutes);
    if (!allowedSlots.includes(input.preferredTimeSlot)) {
      return {
        ok: false,
        error: `Selected time slot ${input.preferredTimeSlot} is not offered for this chamber (Offered: ${rule.startTime} - ${rule.endTime}).`,
      };
    }

    // Prevent duplicate active request by same phone for same doctor/date/slot (US-P04)
    const activeStatuses: AppointmentStatus[] = [
      "REQUESTED",
      "PENDING_CONFIRMATION",
      "CONFIRMED",
    ];
    const duplicate = state.appointments.find(
      (a) =>
        a.doctorBranchId === dbAssign.id &&
        a.preferredDate === input.preferredDate &&
        a.preferredTimeSlot === input.preferredTimeSlot &&
        a.patientPhone === input.patientPhone &&
        activeStatuses.includes(a.status)
    );
    if (duplicate) {
      return {
        ok: false,
        error: `A request for this slot already exists under reference ${duplicate.reference}.`,
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
      patientPhone: input.patientPhone,
      patientEmail: input.patientEmail || undefined,
      preferredDate: input.preferredDate,
      preferredTimeSlot: input.preferredTimeSlot,
      visitType: input.visitType,
      reasonNote: input.reasonNote || undefined,
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

    // Enqueue Notification record (FR-APT-09)
    state.notifications.unshift({
      id: `notif-${Date.now()}`,
      channel: "SMS",
      recipient: input.patientPhone,
      templateCode: "APT_REQUEST_RECEIVED",
      subject: `DeltaCare Request Received (${reference})`,
      bodyPreview: `DeltaCare: Appointment request ${reference} for ${doc.nameEn} on ${input.preferredDate} at ${input.preferredTimeSlot} is RECEIVED (Pending Staff Confirmation).`,
      status: "SENT",
      relatedEntityType: "APPOINTMENT",
      relatedEntityId: newAppointment.id,
      providerMessageId: `SIM-SMS-${seq}`,
      sentAt: nowIso,
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

export async function transitionAppointmentStatus(params: {
  appointmentId: string;
  toStatus: AppointmentStatus;
  actorUserId: string;
  actorName: string;
  actorRole: RoleCode;
  reason: string;
  newDate?: string;
  newTimeSlot?: string;
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

    // Re-check weekday, exceptions, and capacity when confirming or rescheduling
    if (params.toStatus === "CONFIRMED" || params.newDate || params.newTimeSlot) {
      const doc = state.doctors.find((d) => d.id === apt.doctorId);
      const dbAssign = doc?.branches.find((b) => b.id === apt.doctorBranchId);
      if (!dbAssign) {
        return { ok: false, error: "Doctor branch assignment not found." };
      }

      // Check schedule exception
      const hasException = dbAssign.scheduleExceptions.some((ex) => ex.dateStr === targetDate);
      if (hasException) {
        return { ok: false, error: `Doctor chamber is blocked/unavailable on ${targetDate}.` };
      }

      // Weekday schedule validation
      const targetWeekday = getCalendarWeekday(targetDate, state.hospital.timezone || "Asia/Dhaka");
      const validRules = dbAssign.scheduleRules.filter((sr) => {
        if (!isRecordCurrentlyValid(sr.publicationState, sr.effectiveFrom, sr.effectiveTo)) return false;
        return sr.weekday === targetWeekday;
      });

      if (validRules.length === 0) {
        return {
          ok: false,
          error: `Specialist does not have an active chamber on ${targetDate}.`,
        };
      }

      const rule = validRules[0];
      const capacity = rule.capacityPerSlot ?? 2;

      const otherBookings = state.appointments.filter(
        (a) =>
          a.id !== apt.id &&
          a.doctorBranchId === apt.doctorBranchId &&
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
    apt.updatedAt = nowIso;
    apt.staffNotes = params.reason;

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

    // Send status update notification via adapter
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

