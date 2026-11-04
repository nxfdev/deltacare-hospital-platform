import { NextRequest, NextResponse } from "next/server";
import {
  APPROVER_ROLES,
  getCurrentSession,
  hasRolePermission,
  STAFF_ROLES,
} from "@/server/auth/session";
import { getDbState, recordAuditEvent, runInTransaction } from "@/server/db/store";
import { aiStaffUpdateSchema } from "@/lib/validation/schemas";
import { createStaffAIUpdateDraft } from "@/server/services/assistantService";

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
      { ok: false, error: "Forbidden: AI Update Assistant access restricted to editorial and admin staff." },
      { status: 403 }
    );
  }
  const db = getDbState();
  return NextResponse.json({
    ok: true,
    aiUpdateDrafts: db.aiUpdateDrafts,
  });
}

export async function POST(request: NextRequest) {
  const session = await getCurrentSession();
  if (!session || !hasRolePermission(session, STAFF_ROLES)) {
    return NextResponse.json({ ok: false, error: "Forbidden." }, { status: 403 });
  }

  try {
    const body = await request.json();

    // If action is APPROVE or REJECT an existing AI update draft
    if (body.action === "APPROVE" || body.action === "REJECT") {
      if (!hasRolePermission(session, APPROVER_ROLES)) {
        return NextResponse.json(
          {
            ok: false,
            error: "Forbidden: Human Approver role required to publish AI update drafts.",
          },
          { status: 403 }
        );
      }

      const updated = await runInTransaction((state) => {
        const draft = state.aiUpdateDrafts.find((d) => d.id === body.draftId);
        if (!draft) return null;
        const nowIso = new Date().toISOString();
        draft.approvalStatus = body.action === "APPROVE" ? "PUBLISHED" : "ARCHIVED";
        draft.reviewedByName = session.fullName;
        draft.reviewNote = body.reviewNote || "Reviewed by human approver";
        if (body.action === "APPROVE") {
          draft.publishedAt = nowIso;
        }

        recordAuditEvent(state, {
          actorUserId: session.userId,
          actorName: session.fullName,
          actorRole: session.role,
          action: `AI_UPDATE_${body.action}D`,
          entityType: "AIUpdateDraft",
          entityId: draft.id,
          summary: `${body.action}D AI update draft ${draft.id}: ${draft.reviewNote}`,
        });
        return draft;
      });

      if (!updated) {
        return NextResponse.json({ ok: false, error: "Draft not found." }, { status: 404 });
      }
      return NextResponse.json({ ok: true, draft: updated });
    }

    const parsed = aiStaffUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          ok: false,
          error: parsed.error.issues[0]?.message ?? "Invalid AI update note.",
        },
        { status: 400 }
      );
    }

    const draft = await createStaffAIUpdateDraft(session, parsed.data);
    return NextResponse.json({ ok: true, draft }, { status: 201 });
  } catch {
    return NextResponse.json(
      { ok: false, error: "Failed to process AI update assistant request." },
      { status: 500 }
    );
  }
}

