import React, { Suspense } from "react";
import {
  getPublishedBranches,
  getPublishedDepartments,
  getPublishedDoctors,
} from "@/server/services/publicQueryService";
import { PublicThreeStepBookingClient } from "@/components/appointments/PublicThreeStepBookingClient";

export const dynamic = "force-dynamic";


export default function AppointmentsPage() {
  const branches = getPublishedBranches();
  const departments = getPublishedDepartments();
  const doctors = getPublishedDoctors();

  return (
    <Suspense fallback={null}>
      <PublicThreeStepBookingClient
        branches={branches}
        departments={departments}
        doctors={doctors}
      />
    </Suspense>
  );
}
