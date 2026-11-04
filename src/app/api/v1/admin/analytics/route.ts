import { NextRequest, NextResponse } from "next/server";
import { getCurrentSession, hasRolePermission, STAFF_ROLES } from "@/server/auth/session";
import {
  generateAppointmentsCsv,
  getOperationalAnalytics,
} from "@/server/services/communicationAndAnalyticsService";

export async function GET(request: NextRequest) {
  const session = await getCurrentSession();
  if (
    !session ||
    !hasRolePermission(session, ["SUPER_ADMIN", "HOSPITAL_ADMIN", "DEPT_MANAGER"])
  ) {
    return NextResponse.json(
      { ok: false, error: "Forbidden: Management or Administrator role required for analytics." },
      { status: 403 }
    );
  }

  const { searchParams } = new URL(request.url);
  if (searchParams.get("format") === "csv") {
    const csv = generateAppointmentsCsv();
    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": 'attachment; filename="deltacare-appointments-report.csv"',
      },
    });
  }

  const report = getOperationalAnalytics();
  return NextResponse.json({
    ok: true,
    report,
  });
}

