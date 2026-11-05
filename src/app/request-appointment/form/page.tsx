import React from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { getCurrentSession } from "@/server/auth/session";
import { getDbState } from "@/server/db/store";
import {
  getPublishedBranches,
  getPublishedDepartments,
  getPublishedDoctors,
} from "@/server/services/publicQueryService";
import { AuthenticatedAppointmentForm } from "@/components/appointments/AuthenticatedAppointmentForm";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Request Appointment Form | DeltaCare",
  description:
    "Complete your specialist appointment request with DeltaCare. Verified BMDC consultants and real-time slot scheduling.",
};

export default async function RequestAppointmentFormPage() {
  const session = await getCurrentSession();

  // If not authenticated, protect this form and redirect to landing page
  if (!session) {
    redirect("/login?redirect=/request-appointment/form");
  }

  const db = getDbState();
  const userRecord = db.users.find((u) => u.id === session.userId);

  const departments = getPublishedDepartments();
  const doctors = getPublishedDoctors();
  const branches = getPublishedBranches();

  return (
    <div className="min-h-screen bg-[#edf5fd] text-[#080808] py-8 sm:py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 space-y-8">
        {/* Top Navigation & Back Link */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-[#0057b8] rounded-lg"
          >
            <img
              src="/images/deltacare-logo.svg"
              alt="DeltaCare"
              className="h-10 sm:h-11 w-auto"
            />
          </Link>

          <Link
            href="/request-appointment"
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-[#0057b8] hover:underline"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Change Patient Type / Back to Options</span>
          </Link>
        </div>

        {/* Page Title Header */}
        <div className="space-y-2">
          <p className="text-xs font-bold uppercase tracking-widest text-[#0057b8]">
            Care at DeltaCare • Patient Scheduling
          </p>
          <h1 className="mc-serif text-3xl sm:text-4xl text-[#080808] font-bold">
            Specialist Appointment Request Form
          </h1>
          <p className="text-sm sm:text-base text-[#4b5563]">
            Select your preferred clinical department, consultant, campus branch, and available time slot.
          </p>
        </div>

        {/* Form Component */}
        <AuthenticatedAppointmentForm
          currentUser={{
            userId: session.userId,
            fullName: session.fullName,
            email: session.email,
            phone: userRecord?.phone,
          }}
          departments={departments}
          doctors={doctors}
          branches={branches}
        />
      </div>
    </div>
  );
}

