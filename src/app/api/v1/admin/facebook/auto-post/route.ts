import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentSession, hasRolePermission } from "@/server/auth/session";
import { publishPhotoSetToFacebook } from "@/server/services/facebookPublishingService";
import { recordAuditEvent, runInTransaction } from "@/server/db/store";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

const bodySchema = z.object({
  caption: z.string().trim().min(1).max(5000),
  images: z
    .array(
      z.object({
        doctorId: z.string().optional(),
        fileName: z.string().min(1).max(200),
        dataUrl: z.string().startsWith("data:image/"),
      })
    )
    .min(1)
    .max(30),
});

export async function POST(request: NextRequest) {
  const session = await getCurrentSession();
  if (!session || !hasRolePermission(session, ["SUPER_ADMIN", "HOSPITAL_ADMIN", "CONTENT_EDITOR"])) {
    return NextResponse.json({ ok: false, error: "Forbidden." }, { status: 403 });
  }

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "Invalid photocard payload." }, { status: 400 });
  }

  const result = await publishPhotoSetToFacebook(parsed.data.images, parsed.data.caption);

  await runInTransaction((state) => {
    recordAuditEvent(state, {
      actorUserId: session.userId,
      actorName: session.fullName || session.email,
      actorRole: session.role,
      action: result.ok ? "FACEBOOK_AUTO_POST_PUBLISHED" : "FACEBOOK_AUTO_POST_FAILED",
      entityType: "FacebookPost",
      entityId: result.postId ?? "none",
      summary: result.ok
        ? `Published ${result.uploaded} doctor photocards to Facebook (post ${result.postId}).`
        : `Facebook auto-post failed: ${result.error}`,
    });
  });

  return NextResponse.json(result, { status: result.ok ? 200 : 502 });
}
