import { NextRequest, NextResponse } from "next/server";
import { getCurrentSession, hasRolePermission, STAFF_ROLES } from "@/server/auth/session";
import { getDbState } from "@/server/db/store";
import { updateUserRoleOrStatus } from "@/server/services/communicationAndAnalyticsService";

export async function GET() {
  const session = await getCurrentSession();
  if (!session || !hasRolePermission(session, ["SUPER_ADMIN", "HOSPITAL_ADMIN"])) {
    return NextResponse.json(
      { ok: false, error: "Forbidden: Administrator role required to view staff accounts." },
      { status: 403 }
    );
  }
  const db = getDbState();
  return NextResponse.json({
    ok: true,
    users: db.users.map((u) => ({
      id: u.id,
      email: u.email,
      fullName: u.fullName,
      phone: u.phone,
      role: u.role,
      scopedBranchId: u.scopedBranchId,
      scopedDepartmentId: u.scopedDepartmentId,
      isActive: u.isActive,
      mfaEnabled: u.mfaEnabled,
      updatedAt: u.updatedAt,
    })),
    auditEvents: db.auditEvents,
  });
}

export async function PATCH(request: NextRequest) {
  const session = await getCurrentSession();
  if (!session || !hasRolePermission(session, ["SUPER_ADMIN", "HOSPITAL_ADMIN"])) {
    return NextResponse.json(
      { ok: false, error: "Forbidden: Super Admin or Hospital Admin required." },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    if (!body.targetUserId) {
      return NextResponse.json(
        { ok: false, error: "targetUserId is required." },
        { status: 400 }
      );
    }

    const result = await updateUserRoleOrStatus(session, {
      targetUserId: body.targetUserId,
      role: body.role,
      isActive: body.isActive,
    });

    if (!result.ok) {
      return NextResponse.json({ ok: false, error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      ok: true,
      user: {
        id: result.user.id,
        email: result.user.email,
        fullName: result.user.fullName,
        role: result.user.role,
        isActive: result.user.isActive,
      },
    });
  } catch {
    return NextResponse.json(
      { ok: false, error: "Failed to update user role/status." },
      { status: 500 }
    );
  }
}

