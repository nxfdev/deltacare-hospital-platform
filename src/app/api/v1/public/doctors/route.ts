import { NextRequest, NextResponse } from "next/server";
import { getPublishedDoctors } from "@/server/services/publicQueryService";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q") ?? undefined;
  const departmentId = searchParams.get("departmentId") ?? undefined;
  const branchId = searchParams.get("branchId") ?? undefined;
  const specialtyId = searchParams.get("specialtyId") ?? undefined;
  const language = searchParams.get("language") ?? undefined;

  const doctors = getPublishedDoctors({
    query,
    departmentId,
    branchId,
    specialtyId,
    language,
  });

  return NextResponse.json({
    ok: true,
    count: doctors.length,
    doctors,
  });
}

