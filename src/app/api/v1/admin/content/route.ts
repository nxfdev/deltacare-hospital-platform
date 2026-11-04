import { NextRequest, NextResponse } from "next/server";
import { getCurrentSession, hasRolePermission, STAFF_ROLES } from "@/server/auth/session";
import { getDbState } from "@/server/db/store";
import { upsertConditionRecord } from "@/server/services/cmsService";

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
      { ok: false, error: "Forbidden: Content Editor or Administrator role required." },
      { status: 403 }
    );
  }
  const db = getDbState();
  return NextResponse.json({
    ok: true,
    conditions: db.conditions,
    procedures: db.procedures,
    services: db.services,
  });
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
    return NextResponse.json({ ok: false, error: "Forbidden." }, { status: 403 });
  }

  try {
    const body = await request.json();
    if (!body.nameEn || !body.nameBn || !body.slug || !body.departmentId) {
      return NextResponse.json(
        { ok: false, error: "nameEn, nameBn, slug, and departmentId are required." },
        { status: 400 }
      );
    }

    const result = await upsertConditionRecord(session, {
      id: body.id,
      departmentId: body.departmentId,
      slug: body.slug,
      nameEn: body.nameEn,
      nameBn: body.nameBn,
      summaryEn: body.summaryEn || "",
      summaryBn: body.summaryBn || "",
      symptomsEn: Array.isArray(body.symptomsEn)
        ? body.symptomsEn
        : String(body.symptomsEn || "")
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean),
      symptomsBn: Array.isArray(body.symptomsBn)
        ? body.symptomsBn
        : String(body.symptomsBn || "")
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean),
      causesEn: body.causesEn || "",
      causesBn: body.causesBn || "",
      diagnosisOverviewEn: body.diagnosisOverviewEn || "",
      diagnosisOverviewBn: body.diagnosisOverviewBn || "",
      careAtDeltaCareEn: body.careAtDeltaCareEn || "",
      careAtDeltaCareBn: body.careAtDeltaCareBn || "",
      isFeaturedCareArea: Boolean(body.isFeaturedCareArea),
      reviewedByEn: body.reviewedByEn || session.fullName,
      reviewedByBn: body.reviewedByBn || session.fullName,
      publicationState: body.publicationState || "DRAFT",
    });

    return NextResponse.json({ ok: true, condition: result.condition });
  } catch {
    return NextResponse.json(
      { ok: false, error: "Failed to save disease/condition record." },
      { status: 500 }
    );
  }
}

