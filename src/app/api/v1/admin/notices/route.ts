import { NextRequest, NextResponse } from "next/server";
import { getCurrentSession, hasRolePermission } from "@/server/auth/session";
import { getDbState } from "@/server/db/store";
import { toggleNoticeStatus, upsertHospitalNotice } from "@/server/services/cmsService";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getCurrentSession();
  if (
    !session ||
    !hasRolePermission(session, [
      "SUPER_ADMIN",
      "HOSPITAL_ADMIN",
      "CONTENT_EDITOR",
      "DEPT_MANAGER",
    ])
  ) {
    return NextResponse.json(
      { ok: false, error: "Forbidden: Content editor or admin access required." },
      { status: 403 }
    );
  }

  const db = getDbState();
  return NextResponse.json({
    ok: true,
    notices: db.hospitalNotices || [],
  });
}

export async function POST(request: NextRequest) {
  const session = await getCurrentSession();
  if (
    !session ||
    !hasRolePermission(session, [
      "SUPER_ADMIN",
      "HOSPITAL_ADMIN",
      "CONTENT_EDITOR",
      "DEPT_MANAGER",
    ])
  ) {
    return NextResponse.json({ ok: false, error: "Forbidden." }, { status: 403 });
  }

  try {
    const body = await request.json();

    if (body.action === "TOGGLE_STATUS" && body.noticeId) {
      const res = await toggleNoticeStatus(session, body.noticeId);
      if (!res.ok) {
        return NextResponse.json({ ok: false, error: res.error }, { status: 400 });
      }
      return NextResponse.json({ ok: true, notice: res.notice });
    }

    if (!body.titleEn || !body.titleBn || !body.slug) {
      return NextResponse.json(
        { ok: false, error: "titleEn, titleBn, and slug are required." },
        { status: 400 }
      );
    }

    const res = await upsertHospitalNotice(session, {
      id: body.id,
      slug: body.slug,
      titleEn: body.titleEn,
      titleBn: body.titleBn,
      summaryEn: body.summaryEn || "",
      summaryBn: body.summaryBn || "",
      bodyEn: body.bodyEn || "",
      bodyBn: body.bodyBn || "",
      category: body.category,
      branchId: body.branchId,
      isPinned: body.isPinned,
      isActive: body.isActive,
    });

    if (!res.ok) {
      return NextResponse.json({ ok: false, error: res.error }, { status: 400 });
    }

    return NextResponse.json({ ok: true, notice: res.notice });
  } catch {
    return NextResponse.json(
      { ok: false, error: "Failed to save hospital notice." },
      { status: 500 }
    );
  }
}

