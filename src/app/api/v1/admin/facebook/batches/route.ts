import { NextRequest, NextResponse } from "next/server";
import { getCurrentSession, hasRolePermission } from "@/server/auth/session";
import { facebookPublisher } from "@/server/services/facebookPublishingService";
import { FacebookPostBatch } from "@/types/domain";

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
      { ok: false, error: "Forbidden: Staff credentials required." },
      { status: 403 }
    );
  }

  const batches = facebookPublisher.getBatches();
  const config = facebookPublisher.getConfig();

  return NextResponse.json({
    ok: true,
    config,
    batches,
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
    return NextResponse.json(
      { ok: false, error: "Forbidden: CMS Editor or Administrator credentials required." },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    if (!body.targetDate || !body.items || !Array.isArray(body.items)) {
      return NextResponse.json(
        { ok: false, error: "Invalid batch payload. targetDate and items are required." },
        { status: 400 }
      );
    }

    const nowIso = new Date().toISOString();
    const batch: FacebookPostBatch = {
      id: body.id || `fb-batch-${Date.now()}`,
      targetDate: body.targetDate,
      caption: body.caption || "",
      status: body.status || "READY",
      items: body.items,
      generatedAt: body.generatedAt || nowIso,
      revalidatedAt: nowIso,
      generatedByUserId: session.userId,
      generatedByUserName: session.fullName,
    };

    const saved = await facebookPublisher.saveBatch(batch);
    return NextResponse.json({ ok: true, batch: saved });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: error?.message || "Failed to save Facebook promotional batch." },
      { status: 500 }
    );
  }
}

