import { NextRequest, NextResponse } from "next/server";
import {
  hasRolePermission,
  resolveStaffSession,
  STAFF_ROLES,
} from "@/server/auth/session";
import { getDbState } from "@/server/db/store";
import {
  createFrontDeskAppointment,
  transitionAppointmentStatus,
} from "@/server/services/appointmentService";
import {
  getSmsLogsForAppointment,
  recordAndDispatchAppointmentSms,
} from "@/lib/sms/sms-service";
import { AppointmentStatus, RoleCode } from "@/types/domain";

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

    if (action === "QUICK_BOOK") {
      const {
        doctorId,
        branchId,
        preferredDate,
        preferredTimeSlot,
        patientName,
        patientPhone,
        patientAge,
        patientGender,
        visitType,
        bookingSource,
        symptomsNote,
      } = body;

      if (!doctorId || !branchId || !preferredDate || !preferredTimeSlot || !patientName || !patientPhone) {
        return NextResponse.json(
          {
            ok: false,
            error:
              "doctorId, branchId, preferredDate, preferredTimeSlot, patientName, and patientPhone are required.",
          },
          { status: 400 }
        );
      }

      const result = await createFrontDeskAppointment({
        doctorId,
        branchId,
        appointmentDate: preferredDate,
        slotTime: preferredTimeSlot,
        patientName,
        patientPhone,
        patientAge: patientAge ? Number(patientAge) : undefined,
        patientGender,
        visitType: visitType ?? "NEW_VISIT",
        bookingSource: bookingSource ?? "FRONT_DESK_PHONE",
        symptomsNote,
        actorUserId,
        actorName,
        actorRole,
      });

      if (!result.ok) {
        return NextResponse.json({ ok: false, error: result.error }, { status: 409 });
      }

      return NextResponse.json(
        {
          ok: true,
          appointment: result.appointment,
          smsLogs: getSmsLogsForAppointment(result.appointment.id),
        },
        { status: 201 }
      );
    }

    if (action === "TRANSITION_STATUS") {
      const {
        appointmentId,
        nextStatus,
        note,
        newDate,
        newTimeSlot,
        newBranchId,
      } = body;

      if (!appointmentId || !nextStatus) {
        return NextResponse.json(
          { ok: false, error: "appointmentId and nextStatus are required." },
          { status: 400 }
        );
      }

      const result = await transitionAppointmentStatus({
        appointmentId,
        toStatus: nextStatus as AppointmentStatus,
        reason: note || `Updated to ${nextStatus} by Front Desk`,
        actorUserId,
        actorName,
        actorRole,
        newDate,
        newTimeSlot,
        newBranchId,
      });

      if (!result.ok) {
        return NextResponse.json({ ok: false, error: result.error }, { status: 400 });
      }

      return NextResponse.json({
        ok: true,
        appointment: result.appointment,
        smsLogs: getSmsLogsForAppointment(result.appointment.id),
      });
    }

    if (action === "RESEND_SMS") {
      const { appointmentId, eventType } = body;
      if (!appointmentId) {
        return NextResponse.json(
          { ok: false, error: "appointmentId is required." },
          { status: 400 }
        );
      }

      const db = getDbState();
      const appointment = db.appointments.find((a) => a.id === appointmentId);
      if (!appointment) {
        return NextResponse.json(
          { ok: false, error: "Appointment not found." },
          { status: 404 }
        );
      }

      const doc = db.doctors.find((d) => d.id === appointment.doctorId);
      const branch = db.branches.find((b) => b.id === appointment.branchId);
      const chamberSched = (db.chamberSchedules ?? []).find(
        (s) => s.doctorId === appointment.doctorId && s.branchId === appointment.branchId && s.isActive
      );

      const resolvedEventType =
        eventType ??
        (appointment.status === "CONFIRMED"
          ? "CONFIRMED"
          : appointment.status === "CANCELLED"
            ? "CANCELLED"
            : appointment.status === "RESCHEDULE_REQUESTED"
              ? "RESCHEDULED"
              : "REQUEST_RECEIVED");

      const smsLog = recordAndDispatchAppointmentSms({
        appointmentId: appointment.id,
        referenceCode: appointment.reference,
        recipientPhone: appointment.patientPhone,
        patientName: appointment.patientName,
        doctorNameEn: doc?.nameEn ?? appointment.doctorId,
        doctorNameBn: doc?.nameBn,
        branchNameEn: branch?.nameEn ?? appointment.branchId,
        chamberRoom: chamberSched?.chamberRoom ?? "Room #402, 3rd Floor",
        appointmentDate: appointment.preferredDate,
        slotTime: appointment.preferredTimeSlot,
        eventType: resolvedEventType,
      });

      return NextResponse.json({
        ok: true,
        smsLog,
        smsLogs: getSmsLogsForAppointment(appointment.id),
      });
    }

    return NextResponse.json(
      { ok: false, error: `Unsupported appointment action: ${action}` },
      { status: 400 }
    );
  } catch {
    return NextResponse.json(
      { ok: false, error: "Unable to process staff appointment action." },
      { status: 500 }
    );
  }
}
