import { NextRequest, NextResponse } from "next/server";
import { getCurrentSession, hasRolePermission } from "@/server/auth/session";
import { scheduleExceptionSchema } from "@/lib/validation/schemas";
import { blockDoctorChamberDate } from "@/server/services/appointmentService";

export async function POST(request: NextRequest) {
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
      { ok: false, error: "Forbidden: Schedule management role required." },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const parsed = scheduleExceptionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          ok: false,
          error: parsed.error.issues[0]?.message ?? "Invalid schedule exception input.",
        },
        { status: 400 }
      );
    }

    const result = await blockDoctorChamberDate({
      ...parsed.data,
      actorUserId: session.userId,
      actorName: session.fullName,
      actorRole: session.role,
    });

    if (!result.ok) {
      return NextResponse.json({ ok: false, error: result.error }, { status: 404 });
    }

    return NextResponse.json(
      {
        ok: true,
        exception: result.exception,
        affectedAppointments: result.affectedAppointments,
      },
      { status: 201 }
    );
  } catch {
    return NextResponse.json(
      { ok: false, error: "Failed to create schedule exception." },
      { status: 500 }
    );
  }
}

