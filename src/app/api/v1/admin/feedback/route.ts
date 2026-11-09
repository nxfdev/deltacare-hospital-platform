import { NextRequest, NextResponse } from "next/server";
import { getCurrentSession, hasRolePermission } from "@/server/auth/session";
import { getDbState } from "@/server/db/store";
import {
  updateFeedbackStatus,
  updatePatientFeedback,
} from "@/server/services/communicationAndAnalyticsService";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getCurrentSession();
  if (
    !session ||
    !hasRolePermission(session, [
      "SUPER_ADMIN",
      "HOSPITAL_ADMIN",
      "DEPT_MANAGER",
      "RECEPTIONIST",
      "CONTENT_EDITOR",
    ])
  ) {
    return NextResponse.json(
      { ok: false, error: "Forbidden: Patient communications permission required." },
      { status: 403 }
    );
  }
  const db = getDbState();
  return NextResponse.json({
    ok: true,
    patientFeedbacks: db.patientFeedbacks || [],
    feedbacks: db.feedbacks,
    contactRequests: db.contactRequests,
    notifications: db.notifications,
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
    ])
  ) {
    return NextResponse.json(
      { ok: false, error: "Forbidden: Patient communications permission required." },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();

    // Support moderating patient reviews
    if (body.patientFeedbackId) {
      const res = await updatePatientFeedback(session, {
        feedbackId: body.patientFeedbackId,
        status: body.status,
        adminResponse: body.adminResponse,
      });
      if (!res.ok) {
        return NextResponse.json({ ok: false, error: res.error }, { status: 404 });
      }
      return NextResponse.json({ ok: true, feedback: res.feedback });
    }

    if (!body.feedbackId || !body.status) {
      return NextResponse.json(
        { ok: false, error: "feedbackId and status are required." },
        { status: 400 }
      );
    }

    const result = await updateFeedbackStatus(session, {
      feedbackId: body.feedbackId,
      status: body.status,
      routedDepartmentId: body.routedDepartmentId,
      assignedStaffName: body.assignedStaffName,
      internalNotes: body.internalNotes,
      resolutionSummary: body.resolutionSummary,
    });

    if (!result.ok) {
      return NextResponse.json({ ok: false, error: result.error }, { status: 404 });
    }

    return NextResponse.json({ ok: true, feedback: result.feedback });
  } catch {
    return NextResponse.json(
      { ok: false, error: "Failed to update feedback status." },
      { status: 500 }
    );
  }
}
