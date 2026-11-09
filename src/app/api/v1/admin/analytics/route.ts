import { NextRequest, NextResponse } from "next/server";
import { getCurrentSession, hasRolePermission } from "@/server/auth/session";
import {
  computeHealthcareAnalytics,
  generateDoctorPopularityCsv,
  generatePatientFeedbackCsv,
} from "@/server/services/analyticsService";
import { generateAppointmentsCsv } from "@/server/services/communicationAndAnalyticsService";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const session = await getCurrentSession();
  if (
    !session ||
    !hasRolePermission(session, [
      "SUPER_ADMIN",
      "HOSPITAL_ADMIN",
      "DEPT_MANAGER",
      "RECEPTIONIST",
      "CONTENT_EDITOR",
    ])
  ) {
    return NextResponse.json(
      { ok: false, error: "Forbidden: Management or Administrator role required for analytics." },
      { status: 403 }
    );
  }

  const { searchParams } = new URL(request.url);
  const range = (searchParams.get("range") || "30d") as "today" | "7d" | "30d" | "all";
  const branchId = searchParams.get("branchId");
  const departmentId = searchParams.get("departmentId");
  const exportType = searchParams.get("exportType") || searchParams.get("format");

  const analytics = computeHealthcareAnalytics({
    range,
    branchId: branchId && branchId !== "ALL" ? branchId : null,
    departmentId: departmentId && departmentId !== "ALL" ? departmentId : null,
  });

  if (exportType === "doctor_popularity") {
    const csv = generateDoctorPopularityCsv(analytics);
    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="deltacare-doctor-popularity-${range}.csv"`,
      },
    });
  }

  if (exportType === "patient_feedback") {
    const csv = generatePatientFeedbackCsv();
    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": 'attachment; filename="deltacare-patient-feedback-sentiment.csv"',
      },
    });
  }

  if (exportType === "appointment_register" || exportType === "csv") {
    const csv = generateAppointmentsCsv();
    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": 'attachment; filename="deltacare-appointments-report.csv"',
      },
    });
  }

  return NextResponse.json({
    ok: true,
    analytics,
  });
}
