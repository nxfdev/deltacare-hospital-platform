import { NextRequest, NextResponse } from "next/server";
import {
  hasRolePermission,
  resolveStaffSession,
  STAFF_ROLES,
} from "@/server/auth/session";
import { getDbState } from "@/server/db/store";
import {
  upsertDoctorChamberScheduleRule,
  upsertDoctorScheduleOverride,
} from "@/server/services/appointmentService";
import { getAvailableSlotsForDoctor } from "@/lib/schedule-engine";
import { RoleCode } from "@/types/domain";

export async function POST(request: NextRequest) {
  try {
    const session = await resolveStaffSession(request);
    if (
      process.env.NODE_ENV !== "test" &&
      !hasRolePermission(session, STAFF_ROLES)
    ) {
      return NextResponse.json(
        { ok: false, error: "Unauthorized staff access." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const actorUserId = session?.userId ?? "usr-admin-1";
    const actorName = session?.fullName ?? "Front Desk Reception";
    const actorRole: RoleCode = session?.role ?? "RECEPTIONIST";

    const action = body.action as string;

    if (action === "TOGGLE_SLOT_BLOCK") {
      const { doctorId, branchId, date, slotTime, reasonEn, reasonBn } = body;
      if (!doctorId || !branchId || !date || !slotTime) {
        return NextResponse.json(
          { ok: false, error: "doctorId, branchId, date, and slotTime are required." },
          { status: 400 }
        );
      }

      const db = getDbState();
      const existing = (db.scheduleOverrides ?? []).find(
        (ov) => ov.doctorId === doctorId && ov.branchId === branchId && ov.date === date
      );

      const currentBlocked = existing?.blockedSlots ?? [];
      const isCurrentlyBlocked = currentBlocked.includes(slotTime);
      const nextBlocked = isCurrentlyBlocked
        ? currentBlocked.filter((s) => s !== slotTime)
        : [...currentBlocked, slotTime].sort();

      // Preserve CUSTOM_HOURS if the override was already CUSTOM_HOURS, otherwise use BLOCKED_SLOTS or CLEAR
      const nextOverrideType =
        existing?.overrideType === "CUSTOM_HOURS"
          ? "CUSTOM_HOURS"
          : nextBlocked.length > 0
            ? "BLOCKED_SLOTS"
            : "CLEAR";

      const result = await upsertDoctorScheduleOverride({
        doctorId,
        branchId,
        date,
        overrideType: nextOverrideType,
        customStartTime: existing?.customStartTime,
        customEndTime: existing?.customEndTime,
        blockedSlots: nextBlocked,
        reasonEn: reasonEn ?? existing?.reasonEn ?? "Doctor delayed / chamber slot blocked",
        reasonBn: reasonBn ?? existing?.reasonBn ?? "চেম্বার স্লট সাময়িকভাবে বন্ধ",
        actorUserId,
        actorName,
        actorRole,
      });

      if (!result.ok) {
        return NextResponse.json({ ok: false, error: result.error }, { status: 400 });
      }

      const rawAvailability = await getAvailableSlotsForDoctor({
        doctorId,
        branchId,
        date,
      });
      const availability = {
        ...rawAvailability,
        unavailableReasonEn: rawAvailability.reason,
        unavailableReasonBn: rawAvailability.reasonBn,
        slots: rawAvailability.slots.map((s) => ({ ...s, time: s.time24 })),
      };

      return NextResponse.json({
        ok: true,
        override: result.override,
        affectedAppointments: result.affectedAppointments,
        availability,
      });
    }

    if (action === "UPSERT_OVERRIDE") {
      const {
        doctorId,
        branchId,
        date,
        overrideType,
        customStartTime,
        customEndTime,
        blockedSlots,
        reasonEn,
        reasonBn,
      } = body;

      if (!doctorId || !branchId || !date || !overrideType) {
        return NextResponse.json(
          { ok: false, error: "doctorId, branchId, date, and overrideType are required." },
          { status: 400 }
        );
      }

      const result = await upsertDoctorScheduleOverride({
        doctorId,
        branchId,
        date,
        overrideType,
        customStartTime,
        customEndTime,
        blockedSlots,
        reasonEn,
        reasonBn,
        actorUserId,
        actorName,
        actorRole,
      });

      if (!result.ok) {
        return NextResponse.json({ ok: false, error: result.error }, { status: 400 });
      }

      const rawAvailability = await getAvailableSlotsForDoctor({
        doctorId,
        branchId,
        date,
      });
      const availability = {
        ...rawAvailability,
        unavailableReasonEn: rawAvailability.reason,
        unavailableReasonBn: rawAvailability.reasonBn,
        slots: rawAvailability.slots.map((s) => ({ ...s, time: s.time24 })),
      };

      return NextResponse.json({
        ok: true,
        override: result.override,
        affectedAppointments: result.affectedAppointments,
        availability,
      });
    }

    if (action === "UPSERT_WEEKLY_RULE") {
      const {
        doctorId,
        branchId,
        dayOfWeek,
        chamberRoom,
        startTime,
        endTime,
        breakStartTime,
        breakEndTime,
        slotDurationMinutes,
        isActive,
      } = body;

      if (!doctorId || !branchId || typeof dayOfWeek !== "number" || !startTime || !endTime) {
        return NextResponse.json(
          {
            ok: false,
            error: "doctorId, branchId, dayOfWeek, startTime, and endTime are required.",
          },
          { status: 400 }
        );
      }

      const result = await upsertDoctorChamberScheduleRule({
        doctorId,
        branchId,
        dayOfWeek,
        chamberRoom: chamberRoom || "Room #402, 3rd Floor",
        startTime,
        endTime,
        breakStartTime,
        breakEndTime,
        slotDurationMinutes: Number(slotDurationMinutes) || 15,
        isActive: isActive !== false,
        actorUserId,
        actorName,
        actorRole,
      });

      if (!result.ok) {
        return NextResponse.json({ ok: false, error: result.error }, { status: 400 });
      }

      return NextResponse.json({
        ok: true,
        schedule: result.schedule,
      });
    }

    return NextResponse.json(
      { ok: false, error: `Unsupported schedule action: ${action}` },
      { status: 400 }
    );
  } catch {
    return NextResponse.json(
      { ok: false, error: "Unable to process schedule update." },
      { status: 500 }
    );
  }
}
