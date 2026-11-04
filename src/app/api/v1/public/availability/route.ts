import { NextRequest, NextResponse } from "next/server";
import { getDoctorBranchAvailability } from "@/server/services/appointmentService";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const doctorId = searchParams.get("doctorId");
  const branchId = searchParams.get("branchId");
  const dateStr = searchParams.get("date");

  if (!doctorId || !branchId || !dateStr) {
    return NextResponse.json(
      {
        ok: false,
        error: "doctorId, branchId, and date (YYYY-MM-DD) query parameters are required.",
      },
      { status: 400 }
    );
  }

  const slots = getDoctorBranchAvailability(doctorId, branchId, dateStr);
  return NextResponse.json({
    ok: true,
    doctorId,
    branchId,
    date: dateStr,
    slots,
  });
}

