import { NextResponse } from "next/server";
import { getDbState } from "@/server/db/store";

export async function GET() {
  const db = getDbState();
  return NextResponse.json({
    ok: true,
    platform: "DeltaCare Hospital Platform",
    status: db.hospital.status,
    timestamp: new Date().toISOString(),
    metrics: {
      publishedBranches: db.branches.filter((b) => b.publicationState === "PUBLISHED").length,
      publishedDoctors: db.doctors.filter((d) => d.publicationState === "PUBLISHED").length,
      publishedConditions: db.conditions.filter((c) => c.publicationState === "PUBLISHED").length,
    },
  });
}

