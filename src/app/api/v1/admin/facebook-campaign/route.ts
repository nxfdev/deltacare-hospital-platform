import { NextRequest, NextResponse } from "next/server";
import { getCurrentSession, hasRolePermission } from "@/server/auth/session";
import { generateDailyFacebookCampaign } from "@/server/services/facebookCampaignService";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const session = await getCurrentSession();
  if (
    !session ||
    !hasRolePermission(session, [
      "SUPER_ADMIN",
      "HOSPITAL_ADMIN",
      "CONTENT_EDITOR",
      "DEPT_MANAGER",
      "RECEPTIONIST",
    ])
  ) {
    return NextResponse.json(
      { ok: false, error: "Forbidden: Administrative or Content Editor credentials required." },
      { status: 403 }
    );
  }

  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date") || undefined;
  const branchId = searchParams.get("branchId") || undefined;
  const departmentId = searchParams.get("departmentId") || undefined;

  const result = await generateDailyFacebookCampaign({
    date,
    branchId: branchId && branchId !== "ALL" ? branchId : null,
    departmentId: departmentId && departmentId !== "ALL" ? departmentId : null,
  });

  return NextResponse.json(result);
}

