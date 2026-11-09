import { NextRequest, NextResponse } from "next/server";
import { getDoctorBranchAvailability } from "@/server/services/appointmentService";
import { getAvailableSlotsForDoctor } from "@/lib/schedule-engine";

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

  const engineResult = await getAvailableSlotsForDoctor({
    doctorId,
    branchId,
    date: dateStr,
  });
  const legacySlots = getDoctorBranchAvailability(doctorId, branchId, dateStr);

  // Merge rich fixed-slot fields into slots array for both web UI and APK consumers
  const mergedSlots = engineResult.slots.map((s) => {
    const legacy = legacySlots.find((l) => l.time === s.time24);
    return {
      ...s,
      time: s.time24,
      label: s.labelEn,
      capacity: legacy?.capacity ?? 1,
      bookedCount: legacy?.bookedCount ?? (s.status === "BOOKED" ? 1 : 0),
      remainingCapacity:
        s.status === "AVAILABLE" ? (legacy?.remainingCapacity ?? 1) : 0,
      isAvailable: s.status === "AVAILABLE",
    };
  });

  return NextResponse.json({
    ok: true,
    doctorId,
    branchId,
    date: dateStr,
    dayOfWeek: engineResult.dayOfWeek,
    isAvailableDay: engineResult.isAvailableDay,
    reason: engineResult.reason ?? null,
    reasonBn: engineResult.reasonBn ?? null,
    unavailableReasonEn: engineResult.reason ?? null,
    unavailableReasonBn: engineResult.reasonBn ?? null,
    chamberRoom: engineResult.chamberRoom,
    slotDurationMinutes: engineResult.slotDurationMinutes,
    slots: mergedSlots,
  });
}
