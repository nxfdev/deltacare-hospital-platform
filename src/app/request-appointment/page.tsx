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
    <div className="min-h-screen bg-[#ebf3fb] text-[#080808] flex flex-col justify-between">
      {/* Top Left Corner Logo Bar */}
      <header className="w-full px-6 sm:px-12 lg:px-20 pt-8 sm:pt-10 shrink-0">
        <Link
          href="/"
          className="inline-block focus:outline-none focus:ring-2 focus:ring-[#0057b8] rounded-lg"
          aria-label="Back to DeltaCare Home"
        >
          <img
            src="/images/deltacare-logo.svg"
            alt="DeltaCare"
            className="h-11 sm:h-12 lg:h-14 w-auto"
          />
        </Link>
      </header>

      {/* Main Content Area - Optimized Composition */}
      <main className="w-full max-w-5xl lg:max-w-6xl mx-auto px-6 sm:px-12 lg:px-20 py-8 sm:py-12 flex-1 flex flex-col justify-center">
        {/* Heading & Subtitle */}
        <div className="mb-8 sm:mb-10">
          <h1 className="mc-serif text-4xl sm:text-5xl lg:text-[56px] text-[#080808] font-bold tracking-tight leading-[1.14] mb-3 sm:mb-4">
            Start your appointment request here.
          </h1>
          <p className="text-xl sm:text-2xl text-[#374151] font-normal">
            The easiest way to reach us
          </p>
        </div>

        {/* If user is already logged in, show direct proceed prompt */}
        {session && (
          <div className="mb-8 p-5 sm:p-6 rounded-2xl bg-white/90 border border-[#b8cde3] shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-[#0057b8]" />
                <span className="text-xs sm:text-sm font-bold uppercase tracking-wider text-[#0057b8]">
                  Signed in as {session.fullName}
                </span>
              </div>
              <p className="text-sm sm:text-base text-[#4b5563] mt-1">
                {session.email}
              </p>
            </div>

            <Link
              href="/request-appointment/form"
              className="py-2.5 px-5 rounded-xl bg-[#0057b8] hover:bg-[#004694] text-white font-semibold text-sm sm:text-base inline-flex items-center gap-2 transition-colors shadow-sm shrink-0"
            >
              <span>Continue to Form</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        )}

        {/* Mayo Clinic Matching Patient Rows */}
        <div className="border-t border-[#b8cde3]">
          {/* Row 1: New Patients */}
          <Link
            href="/register?redirect=/request-appointment/form"
            className="group flex items-center justify-between py-7 sm:py-9 border-b border-[#b8cde3] focus:outline-none focus:ring-2 focus:ring-[#0057b8] transition-colors"
          >
            <div className="space-y-1.5 pr-6">
              <h2 className="text-2xl sm:text-3xl font-semibold text-[#0057b8] group-hover:text-[#00428a] group-hover:underline transition-colors">
                New patients
              </h2>
              <p className="text-base sm:text-lg text-[#374151]">
                Provide your info and set a follow-up time.
              </p>
            </div>
            <ChevronRight className="w-6 h-6 sm:w-7 sm:h-7 text-[#0057b8] shrink-0 transition-transform group-hover:translate-x-1.5" />
          </Link>

          {/* Row 2: Returning Patients */}
          <Link
            href="/login?redirect=/request-appointment/form"
            className="group flex items-center justify-between py-7 sm:py-9 border-b border-[#b8cde3] focus:outline-none focus:ring-2 focus:ring-[#0057b8] transition-colors"
          >
            <div className="space-y-1.5 pr-6">
              <h2 className="text-2xl sm:text-3xl font-semibold text-[#0057b8] group-hover:text-[#00428a] group-hover:underline transition-colors">
                Returning patients
              </h2>
              <p className="text-base sm:text-lg text-[#374151]">
                Request using your patient info.
              </p>
            </div>
            <ChevronRight className="w-6 h-6 sm:w-7 sm:h-7 text-[#0057b8] shrink-0 transition-transform group-hover:translate-x-1.5" />
          </Link>
        </div>
      </main>

      {/* Bottom spacer for clean viewport breathing room */}
      <footer className="w-full py-6 shrink-0" />
    </div>
  );
}
