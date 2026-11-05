import React from "react";
import Link from "next/link";
import { ChevronRight, Calendar, ArrowRight } from "lucide-react";
import { getCurrentSession } from "@/server/auth/session";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Start Your Appointment Request | DeltaCare",
  description:
    "Start your appointment request with DeltaCare specialists. New and returning patients can schedule consultations across all campuses.",
};

export default async function AppointmentLandingPage() {
  const session = await getCurrentSession();

  return (
    <div className="min-h-screen bg-[#ebf3fb] text-[#080808]">
      <div className="w-full max-w-4xl mx-auto px-6 sm:px-10 pt-10 sm:pt-14 pb-16">
        {/* Top Brand Logo */}
        <header className="mb-12 sm:mb-16">
          <Link
            href="/"
            className="inline-block focus:outline-none focus:ring-2 focus:ring-[#0057b8] rounded"
            aria-label="Back to DeltaCare Home"
          >
            <img
              src="/images/deltacare-logo.svg"
              alt="DeltaCare"
              className="h-10 sm:h-11 w-auto"
            />
          </Link>
        </header>

        {/* Main Content Area */}
        <main>
          <h1 className="mc-serif text-3xl sm:text-4xl md:text-[42px] text-[#080808] font-bold tracking-tight leading-tight mb-4">
            Start your appointment request here.
          </h1>
          <p className="text-base sm:text-lg text-[#080808] mb-10">
            This is the easiest way to reach us.
          </p>

          {/* If user is already logged in, show direct proceed prompt */}
          {session && (
            <div className="mb-8 p-4 sm:p-5 rounded-xl bg-white/80 border border-[#c5d5e4] shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-[#0057b8]" />
                  <span className="text-xs font-bold uppercase tracking-wider text-[#0057b8]">
                    Signed in as {session.fullName}
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-[#4b5563] mt-0.5">
                  {session.email}
                </p>
              </div>

              <Link
                href="/request-appointment/form"
                className="py-2 px-4 rounded-lg bg-[#0057b8] hover:bg-[#004694] text-white font-medium text-sm inline-flex items-center gap-1.5 transition-colors shadow-sm"
              >
                <span>Continue to Form</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          )}

          {/* Mayo Clinic Matching Patient Rows */}
          <div className="border-t border-[#c5d5e4]">
            {/* Row 1: New Patients */}
            <Link
              href="/register?redirect=/request-appointment/form"
              className="group flex items-center justify-between py-6 sm:py-7 border-b border-[#c5d5e4] focus:outline-none focus:ring-2 focus:ring-[#0057b8] transition-colors"
            >
              <div className="space-y-1 pr-4">
                <h2 className="text-lg sm:text-xl font-semibold text-[#0057b8] group-hover:underline">
                  New patients
                </h2>
                <p className="text-sm sm:text-base text-[#333333]">
                  Provide your info and set a follow-up time.
                </p>
              </div>
              <ChevronRight className="w-5 h-5 text-[#0057b8] shrink-0 transition-transform group-hover:translate-x-1" />
            </Link>

            {/* Row 2: Returning Patients */}
            <Link
              href="/login?redirect=/request-appointment/form"
              className="group flex items-center justify-between py-6 sm:py-7 border-b border-[#c5d5e4] focus:outline-none focus:ring-2 focus:ring-[#0057b8] transition-colors"
            >
              <div className="space-y-1 pr-4">
                <h2 className="text-lg sm:text-xl font-semibold text-[#0057b8] group-hover:underline">
                  Returning patients
                </h2>
                <p className="text-sm sm:text-base text-[#333333]">
                  Request using your patient info.
                </p>
              </div>
              <ChevronRight className="w-5 h-5 text-[#0057b8] shrink-0 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </main>
      </div>
    </div>
  );
}
