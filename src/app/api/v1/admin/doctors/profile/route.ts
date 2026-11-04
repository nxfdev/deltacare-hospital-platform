import { NextRequest, NextResponse } from "next/server";
import { getCurrentSession, hasRolePermission } from "@/server/auth/session";
import { updateDoctorProfilePresentation } from "@/server/services/cmsService";

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
      { ok: false, error: "Forbidden: CMS Editor or Administrator role required." },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    if (!body.doctorId || typeof body.doctorId !== "string") {
      return NextResponse.json(
        { ok: false, error: "doctorId is required." },
        { status: 400 }
      );
    }

    const result = await updateDoctorProfilePresentation(session, {
      doctorId: body.doctorId,
      imageUrl: body.imageUrl,
      imagePosition: body.imagePosition,
      imageCrop: body.imageCrop,
      bioEn: body.bioEn,
      bioBn: body.bioBn,
      publicTaglineEn: body.publicTaglineEn,
      publicTaglineBn: body.publicTaglineBn,
      clinicalInterestsEn: body.clinicalInterestsEn,
      clinicalInterestsBn: body.clinicalInterestsBn,
    });

    if (!result.ok) {
      return NextResponse.json({ ok: false, error: result.error }, { status: 400 });
    }

    return NextResponse.json({ ok: true, doctor: result.doctor });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: "Failed to update doctor profile presentation." },
      { status: 500 }
    );
  }
}

