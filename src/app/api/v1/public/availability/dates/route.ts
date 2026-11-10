import { NextRequest, NextResponse } from "next/server";
import { getAvailableSlotsForDoctor } from "@/lib/schedule-engine";

export const dynamic = "force-dynamic";

function addDaysIso(iso: string, days: number): string {
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + days));
  return dt.toISOString().slice(0, 10);
}

/**
 * Returns the dates (YYYY-MM-DD) in the next N days on which the doctor has a
 * chamber at the branch with at least one bookable slot. Drives the calendar.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const doctorId = searchParams.get("doctorId");
  const branchId = searchParams.get("branchId");
  const days = Math.min(Math.max(Number(searchParams.get("days")) || 60, 1), 90);

  if (!doctorId || !branchId) {
    return NextResponse.json({ ok: false, error: "doctorId and branchId are required." }, { status: 400 });
  }

  const today = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Dhaka",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());

  const candidates = Array.from({ length: days }, (_, i) => addDaysIso(today, i));
  const results = await Promise.all(
    candidates.map(async (date) => {
      const r = await getAvailableSlotsForDoctor({ doctorId, branchId, date });
      return r.isAvailableDay && r.slots.some((s) => s.status === "AVAILABLE") ? date : null;
    })
  );

  return NextResponse.json({ ok: true, dates: results.filter(Boolean) });
}
