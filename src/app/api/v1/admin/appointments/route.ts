import { NextRequest, NextResponse } from "next/server";
import { getCurrentSession, hasRolePermission, STAFF_ROLES } from "@/server/auth/session";
import { getDbState } from "@/server/db/store";
import { appointmentStatusUpdateSchema } from "@/lib/validation/schemas";
import { transitionAppointmentStatus } from "@/server/services/appointmentService";

export async function GET(request: NextRequest) {
  const session = await getCurrentSession();
  if (
    !session ||
    !hasRolePermission(session, [
      "SUPER_ADMIN",
      "HOSPITAL_ADMIN",
      "DEPT_MANAGER",
      "RECEPTIONIST",
      "DOCTOR",
    ])
  ) {
    return NextResponse.json(
      { ok: false, error: "Forbidden: Operational scheduling role required." },
      { status: 403 }
    );
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const branchId = searchParams.get("branchId");
  const departmentId = searchParams.get("departmentId");
  const doctorId = searchParams.get("doctorId");

  const db = getDbState();
  let list = [...db.appointments];

  // Enforce doctor profile isolation: DOCTOR can ONLY see appointments for their own doctorProfileId
  if (session.role === "DOCTOR") {
    if (!session.doctorProfileId) {
      return NextResponse.json(
        { ok: false, error: "Forbidden: Doctor account is not associated with any doctor profile." },
        { status: 403 }
      );
    }
    list = list.filter((a) => a.doctorId === session.doctorProfileId);
  } else if (session.role === "RECEPTIONIST" && session.scopedBranchId) {
    list = list.filter((a) => a.branchId === session.scopedBranchId);
  } else if (branchId) {
    list = list.filter((a) => a.branchId === branchId);
  }

  if (session.role !== "DOCTOR" && doctorId) {
    list = list.filter((a) => a.doctorId === doctorId);
  }

  return NextResponse.json({
    ok: true,
    count: list.length,
    appointments: list,
  });
}

export async function PATCH(request: NextRequest) {
  const session = await getCurrentSession();
  if (
    !session ||
    !hasRolePermission(session, [
      "SUPER_ADMIN",
      "HOSPITAL_ADMIN",
      "DEPT_MANAGER",
      "RECEPTIONIST",
      "DOCTOR",
    ])
  ) {
    return NextResponse.json(
      { ok: false, error: "Forbidden: Staff scheduling role required." },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const { appointmentId, ...rest } = body;
    if (!appointmentId) {
      return NextResponse.json(
        { ok: false, error: "appointmentId is required." },
        { status: 400 }
      );
    }

    // Role-specific check: DOCTOR can only modify appointments assigned to their own profile
    if (session.role === "DOCTOR") {
      const db = getDbState();
      const targetApt = db.appointments.find(
        (a) => a.id === appointmentId || a.reference === appointmentId
      );
      if (!targetApt) {
        return NextResponse.json({ ok: false, error: "Appointment not found." }, { status: 404 });
      }
      if (targetApt.doctorId !== session.doctorProfileId) {
        return NextResponse.json(
          {
            ok: false,
            error: "Forbidden: Doctors can only manage appointments assigned to their own profile.",
          },
          { status: 403 }
        );
      }
    }

    const parsed = appointmentStatusUpdateSchema.safeParse(rest);
    if (!parsed.success) {
      return NextResponse.json(
        {
          ok: false,
          error: parsed.error.issues[0]?.message ?? "Invalid status update payload.",
        },
        { status: 400 }
      );
    }

    const result = await transitionAppointmentStatus({
      appointmentId,
      toStatus: parsed.data.toStatus,
      actorUserId: session.userId,
      actorName: session.fullName,
      actorRole: session.role,
      reason: parsed.data.reason,
      newDate: parsed.data.preferredDate,
      newTimeSlot: parsed.data.preferredTimeSlot,
    });

    if (!result.ok) {
      return NextResponse.json({ ok: false, error: result.error }, { status: 409 });
    }

    return NextResponse.json({
      ok: true,
      appointment: result.appointment,
    });
  } catch {
    return NextResponse.json(
      { ok: false, error: "Failed to update appointment." },
      { status: 500 }
    );
  }
}

