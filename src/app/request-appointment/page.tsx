import React from "react";
import Link from "next/link";
import { ArrowRight, UserPlus, LogIn, Calendar, Search, PhoneCall } from "lucide-react";
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
    <div className="h-screen max-h-screen overflow-hidden bg-[#edf5fd] text-[#080808] flex flex-col justify-between">
      {/* Top Brand Bar */}
      <header className="w-full max-w-5xl mx-auto px-6 sm:px-8 pt-6 pb-2 shrink-0">
        <Link
          href="/"
          className="inline-flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-[#0057b8] rounded-lg"
          aria-label="Back to DeltaCare Home"
        >
          <img
            src="/images/deltacare-logo.svg"
            alt="DeltaCare"
            className="h-9 sm:h-10 w-auto"
          />
        </Link>
      </header>

      {/* Main Landing Content Area */}
      <main className="w-full max-w-2xl mx-auto px-6 py-2 flex-1 flex flex-col justify-center">
        <div className="space-y-2 mb-6 sm:mb-8 text-center sm:text-left">
          <h1 className="mc-serif text-3xl sm:text-4xl text-[#080808] font-normal tracking-tight leading-tight">
            Start your appointment request here.
          </h1>
          <p className="text-base text-[#4b5563] font-normal">
            This is the easiest way to reach us.
          </p>
        </div>

        {/* If user is already logged in, show direct proceed card */}
        {session && (
          <div className="mb-5 p-4 sm:p-5 rounded-2xl bg-[#0057b8] text-white shadow-lg space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#bfdbfe]">
                  Signed In
                </span>
                <h2 className="text-base sm:text-lg font-bold mt-0.5">
                  Welcome back, {session.fullName}
                </h2>
                <p className="text-xs text-[#e0f2fe] mt-0.5">
                  {session.email}
                </p>
              </div>
              <Calendar className="w-7 h-7 text-[#93c5fd] shrink-0" />
            </div>

            <Link
              href="/request-appointment/form"
              className="w-full py-2.5 px-5 rounded-xl bg-white text-[#0057b8] hover:bg-[#f0f9ff] font-bold text-sm flex items-center justify-center gap-2 transition-all shadow"
            >
              <span>Continue to Appointment Form</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        )}

        {/* Patient Selection Rows (Mayo Clinic Reference UX) */}
        <div className="space-y-4">
          {/* Row 1: New Patients */}
          <Link
            href="/register?redirect=/request-appointment/form"
            className="group block w-full bg-white rounded-2xl border border-[#d1d5db] p-5 sm:p-6 hover:border-[#0057b8] hover:shadow-lg transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-[#0057b8]/20"
          >
            <div className="flex items-center justify-between gap-4">
              <div className="space-y-1 pr-2">
                <div className="flex items-center gap-2.5">
                  <span className="w-7 h-7 rounded-full bg-[#e8f0f9] text-[#0057b8] flex items-center justify-center shrink-0">
                    <UserPlus className="w-4 h-4" />
                  </span>
                  <h2 className="text-lg sm:text-xl font-bold text-[#111827] group-hover:text-[#0057b8] transition-colors">
                    New Patients
                  </h2>
                </div>
                <p className="text-xs sm:text-sm text-[#4b5563] pl-9.5 leading-normal">
                  Create an account and provide your information to request an appointment.
                </p>
              </div>
              <div className="w-9 h-9 rounded-full bg-[#f3f4f6] group-hover:bg-[#0057b8] text-[#4b5563] group-hover:text-white flex items-center justify-center shrink-0 transition-colors">
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </div>
          </Link>

          {/* Row 2: Returning Patients */}
          <Link
            href="/login?redirect=/request-appointment/form"
            className="group block w-full bg-white rounded-2xl border border-[#d1d5db] p-5 sm:p-6 hover:border-[#0057b8] hover:shadow-lg transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-[#0057b8]/20"
          >
            <div className="flex items-center justify-between gap-4">
              <div className="space-y-1 pr-2">
                <div className="flex items-center gap-2.5">
                  <span className="w-7 h-7 rounded-full bg-[#e8f0f9] text-[#0057b8] flex items-center justify-center shrink-0">
                    <LogIn className="w-4 h-4" />
                  </span>
                  <h2 className="text-lg sm:text-xl font-bold text-[#111827] group-hover:text-[#0057b8] transition-colors">
                    Returning Patients
                  </h2>
                </div>
                <p className="text-xs sm:text-sm text-[#4b5563] pl-9.5 leading-normal">
                  Log in to your account to request an appointment.
                </p>
              </div>
              <div className="w-9 h-9 rounded-full bg-[#f3f4f6] group-hover:bg-[#0057b8] text-[#4b5563] group-hover:text-white flex items-center justify-center shrink-0 transition-colors">
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </div>
          </Link>
        </div>

        {/* Track Existing & Helpline Utilities */}
        <div className="mt-8 pt-5 border-t border-[#d1d5db]/60 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs sm:text-sm text-[#4b5563]">
          <Link
            href="/track-appointment"
            className="inline-flex items-center gap-1.5 font-semibold text-[#0057b8] hover:underline"
          >
            <Search className="w-4 h-4" />
            <span>Already have a reference code? Track appointment</span>
          </Link>
          <div className="inline-flex items-center gap-1.5 text-[#6b7280]">
            <PhoneCall className="w-4 h-4 text-[#0057b8]" />
            <span>24/7 Helpline: <strong>10678</strong></span>
          </div>
        </div>
      </main>

      {/* Subtle bottom spacing */}
      <div className="pb-6 shrink-0" />
    </div>
  );
}
