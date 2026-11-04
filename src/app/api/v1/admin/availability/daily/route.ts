import { NextRequest, NextResponse } from "next/server";
import { getCurrentSession, hasRolePermission } from "@/server/auth/session";
import {
  calculateDailyDoctorAvailability,
  checkStaleness,
} from "@/server/services/availabilityGeneratorService";

export async function GET(request: NextRequest) {
  const session = await getCurrentSession();
  if (
    !session ||
    !hasRolePermission(session, [
      "SUPER_ADMIN",
      "HOSPITAL_ADMIN",
      "DEPT_MANAGER",
      "CONTENT_EDITOR",
      "RECEPTIONIST",
    ])
  ) {
    return NextResponse.json(
      { ok: false, error: "Forbidden: Staff credentials required." },
      { status: 403 }
    );
  }

  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date") || undefined;
  const baselineIds = searchParams.get("baselineIds");

  try {
    const availability = calculateDailyDoctorAvailability(date);

    let staleness = null;
    if (baselineIds) {
      const ids = baselineIds.split(",").filter(Boolean);
      staleness = checkStaleness(availability.date, ids);
    }

    return NextResponse.json({
      ok: true,
      availability,
      staleness,
    });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: error?.message || "Failed to calculate daily doctor availability." },
      { status: 500 }
    );
  }
}

