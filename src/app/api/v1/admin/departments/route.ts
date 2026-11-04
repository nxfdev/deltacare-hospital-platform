import { NextRequest, NextResponse } from "next/server";
import { getCurrentSession, hasRolePermission, STAFF_ROLES } from "@/server/auth/session";
import { getDbState } from "@/server/db/store";
import { upsertDepartmentRecord } from "@/server/services/cmsService";

export async function GET() {
  const session = await getCurrentSession();
  if (!hasRolePermission(session, STAFF_ROLES)) {
    return NextResponse.json({ ok: false, error: "Unauthorized." }, { status: 403 });
  }
  const db = getDbState();
  return NextResponse.json({ ok: true, departments: db.departments });
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
    if (!body.nameEn || !body.nameBn || !body.slug || !body.branchId) {
      return NextResponse.json(
        { ok: false, error: "nameEn, nameBn, slug, and branchId are required." },
        { status: 400 }
      );
    }

    const result = await upsertDepartmentRecord(session, {
      id: body.id,
      branchId: body.branchId,
      slug: body.slug,
      nameEn: body.nameEn,
      nameBn: body.nameBn,
      shortDescriptionEn: body.shortDescriptionEn || body.nameEn,
      shortDescriptionBn: body.shortDescriptionBn || body.nameBn,
      overviewEn: body.overviewEn || body.shortDescriptionEn || body.nameEn,
      overviewBn: body.overviewBn || body.shortDescriptionBn || body.nameBn,
      isFeaturedCareArea: Boolean(body.isFeaturedCareArea),
      publicationState: body.publicationState || "DRAFT",
    });

    return NextResponse.json({ ok: true, department: result.department });
  } catch {
    return NextResponse.json(
      { ok: false, error: "Failed to save department." },
      { status: 500 }
    );
  }
}

