import { NextRequest, NextResponse } from "next/server";
import { getCurrentSession, hasRolePermission, STAFF_ROLES } from "@/server/auth/session";
import { getDbState } from "@/server/db/store";
import { doctorUpsertSchema } from "@/lib/validation/schemas";
import { toggleDoctorStatus, upsertDoctorRecord } from "@/server/services/cmsService";

export async function GET() {
  const session = await getCurrentSession();
  if (!hasRolePermission(session, STAFF_ROLES)) {
    return NextResponse.json({ ok: false, error: "Unauthorized." }, { status: 403 });
  }
  const db = getDbState();
  return NextResponse.json({ ok: true, doctors: db.doctors });
}

export async function POST(request: NextRequest) {
  const session = await getCurrentSession();
  if (
    !session ||
    !hasRolePermission(session, [
      "SUPER_ADMIN",
      "HOSPITAL_ADMIN",
      "DEPT_MANAGER",
      "CONTENT_EDITOR",
    ])
  ) {
    return NextResponse.json(
      { ok: false, error: "Forbidden: CMS Editor or Admin role required." },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const parsed = doctorUpsertSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          ok: false,
          error: parsed.error.issues[0]?.message ?? "Invalid doctor record input.",
          issues: parsed.error.issues,
        },
        { status: 400 }
      );
    }

    const result = await upsertDoctorRecord(session, parsed.data);
    if (!result.ok) {
      return NextResponse.json({ ok: false, error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      ok: true,
      doctor: result.doctor,
      approvalRequest: result.approvalRequest,
    });
  } catch {
    return NextResponse.json(
      { ok: false, error: "Failed to save doctor record." },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  const session = await getCurrentSession();
  if (
    !session ||
    !hasRolePermission(session, ["SUPER_ADMIN", "HOSPITAL_ADMIN", "DEPT_MANAGER"])
  ) {
    return NextResponse.json(
      {
        ok: false,
        error: "Forbidden: Administrator role required to update specialist status.",
      },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const { doctorId, action } = body;
    if (!doctorId || (action !== "DEACTIVATE" && action !== "ACTIVATE")) {
      return NextResponse.json(
        {
          ok: false,
          error: "doctorId and valid action ('DEACTIVATE' | 'ACTIVATE') are required.",
        },
        { status: 400 }
      );
    }

    const targetState = action === "DEACTIVATE" ? "ARCHIVED" : "PUBLISHED";
    const result = await toggleDoctorStatus(session, doctorId, targetState);
    if (!result.ok) {
      return NextResponse.json({ ok: false, error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      ok: true,
      doctor: result.doctor,
      action,
    });
  } catch {
    return NextResponse.json(
      { ok: false, error: "Failed to update specialist status." },
      { status: 500 }
    );
  }
}
