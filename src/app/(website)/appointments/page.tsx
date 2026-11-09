import React, { Suspense } from "react";
import type { Metadata } from "next";
import {
  getPublishedBranches,
  getPublishedDepartments,
  getPublishedDoctors,
} from "@/server/services/publicQueryService";
import { PublicThreeStepBookingClient } from "@/components/appointments/PublicThreeStepBookingClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Book Specialist Appointment Online | DeltaCare Hospital",
  description:
    "Interactive 3-step specialist appointment booking across DeltaCare Dhanmondi, Uttara, Mirpur, and nationwide branches with real-time fixed time slots and SMS confirmation.",
};

export default function AppointmentsPage() {
  const branches = getPublishedBranches();
  const departments = getPublishedDepartments();
  const doctors = getPublishedDoctors();

  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-white p-12 text-center text-slate-500">
          Loading real-time chamber schedule...
        </div>
      }
    >
      <PublicThreeStepBookingClient
        branches={branches}
        departments={departments}
        doctors={doctors}
      />
    </Suspense>
  );
}
