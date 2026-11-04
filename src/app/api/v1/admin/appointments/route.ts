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

  // Enforce branch isolation for receptionist if scoped
  if (session.role === "RECEPTIONIST" && session.scopedBranchId) {
    list = list.filter((a) => a.branchId === session.scopedBranchId);
  } else if (branchId) {
    list = list.filter((a) => a.branchId === branchId);
  }

  if (status) list = list.filter((a) => a.status === status);
  if (departmentId) list = list.filter((a) => a.departmentId === departmentId);
  if (doctorId) list = list.filter((a) => a.doctorId === doctorId);

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

