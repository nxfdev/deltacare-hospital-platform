import { NextRequest, NextResponse } from "next/server";
import {
  APPROVER_ROLES,
  getCurrentSession,
  hasRolePermission,
  STAFF_ROLES,
} from "@/server/auth/session";
import { getDbState } from "@/server/db/store";
import { reviewApprovalRequest } from "@/server/services/cmsService";

export async function GET() {
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
      { ok: false, error: "Forbidden: Approver or Content Editor role required." },
      { status: 403 }
    );
  }
  const db = getDbState();
  return NextResponse.json({
    ok: true,
    approvalRequests: db.approvalRequests,
  });
}

export async function POST(request: NextRequest) {
  const session = await getCurrentSession();
  if (!session || !hasRolePermission(session, APPROVER_ROLES)) {
    return NextResponse.json(
      {
        ok: false,
        error: "Forbidden: Only Hospital Admin or Department Manager can approve/reject changes.",
      },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    if (!body.approvalId || !body.decision || !body.reviewNote) {
      return NextResponse.json(
        {
          ok: false,
          error: "approvalId, decision ('APPROVED_AND_PUBLISHED' | 'REJECTED'), and reviewNote are required.",
        },
        { status: 400 }
      );
    }

    const result = await reviewApprovalRequest(session, {
      approvalId: body.approvalId,
      decision: body.decision,
      reviewNote: body.reviewNote,
    });

    if (!result.ok) {
      return NextResponse.json({ ok: false, error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      ok: true,
      approval: result.approval,
    });
  } catch {
    return NextResponse.json(
      { ok: false, error: "Failed to process approval decision." },
      { status: 500 }
    );
  }
}

