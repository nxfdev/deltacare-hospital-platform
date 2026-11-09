import { NextResponse } from "next/server";
import { getPublishedHospitalNotices } from "@/server/services/publicQueryService";

export async function GET() {
  const notices = getPublishedHospitalNotices();
  return NextResponse.json({
    ok: true,
    count: notices.length,
    notices,
  });
}

