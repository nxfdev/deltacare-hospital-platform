import { NextRequest, NextResponse } from "next/server";
import { getCurrentSession, hasRolePermission } from "@/server/auth/session";
import { facebookPublisher } from "@/server/services/facebookPublishingService";

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
      { ok: false, error: "Forbidden: CMS Editor or Administrator credentials required." },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    if (!body.batchId) {
      return NextResponse.json(
        { ok: false, error: "batchId is required." },
        { status: 400 }
      );
    }

    const result = await facebookPublisher.publishBatch(body.batchId);
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: error?.message || "Failed to process publish request." },
      { status: 500 }
    );
  }
}

