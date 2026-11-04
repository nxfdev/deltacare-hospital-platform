import React from "react";
import Link from "next/link";
import { ArrowRight, UserPlus, LogIn, Calendar, Search, ShieldCheck, PhoneCall } from "lucide-react";
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
    <div className="min-h-screen bg-[#edf5fd] text-[#080808] flex flex-col justify-between">
      {/* Top Brand Bar */}
      <div className="w-full max-w-5xl mx-auto px-6 sm:px-8 pt-8 pb-4">
        <Link
          href="/"
          className="inline-flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-[#0057b8] rounded-lg"
          aria-label="Back to DeltaCare Home"
        >
          <img
            src="/images/deltacare-logo.svg"
            alt="DeltaCare"
            className="h-10 sm:h-12 w-auto"
          />
        </Link>
      </div>

      {/* Main Landing Content Area */}
      <main className="w-full max-w-3xl mx-auto px-6 sm:px-8 py-10 sm:py-16 flex-1 flex flex-col justify-center">
        <div className="space-y-4 mb-10 text-center sm:text-left">
          <h1 className="mc-serif text-3xl sm:text-4xl md:text-5xl text-[#080808] font-normal tracking-tight leading-tight">
            Start your appointment request here.
          </h1>
          <p className="text-base sm:text-lg text-[#4b5563] font-normal">
            This is the easiest way to reach us.
          </p>
        </div>

        {/* If user is already logged in, show direct proceed card */}
        {session && (
          <div className="mb-6 p-5 sm:p-6 rounded-2xl bg-[#0057b8] text-white shadow-lg space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#bfdbfe]">
                  Signed In
                </span>
                <h2 className="text-lg sm:text-xl font-bold mt-0.5">
                  Welcome back, {session.fullName}
                </h2>
                <p className="text-xs sm:text-sm text-[#e0f2fe] mt-1">
                  {session.email}
                </p>
              </div>
              <Calendar className="w-8 h-8 text-[#93c5fd] shrink-0" />
            </div>

            <Link
              href="/request-appointment/form"
              className="w-full py-3.5 px-6 rounded-xl bg-white text-[#0057b8] hover:bg-[#f0f9ff] font-bold text-sm sm:text-base flex items-center justify-center gap-2 transition-all shadow"
            >
              <span>Continue to Appointment Form</span>
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        )}

        {/* Patient Selection Rows (Mayo Clinic Page 4 Reference UX) */}
        <div className="space-y-4">
          {/* Row 1: New Patients */}
          <Link
            href="/register?redirect=/request-appointment/form"
            className="group block w-full bg-white rounded-2xl border border-[#d1d5db] p-6 sm:p-8 hover:border-[#0057b8] hover:shadow-lg transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-[#0057b8]/20"
          >
            <div className="flex items-center justify-between gap-4">
              <div className="space-y-1.5 pr-2">
                <div className="flex items-center gap-2.5">
                  <span className="w-7 h-7 rounded-full bg-[#e8f0f9] text-[#0057b8] flex items-center justify-center shrink-0">
                    <UserPlus className="w-4 h-4" />
                  </span>
                  <h3 className="text-xl sm:text-2xl font-bold text-[#111827] group-hover:text-[#0057b8] transition-colors">
                    New Patients
                  </h3>
                </div>
                <p className="text-sm sm:text-base text-[#4b5563] pl-9.5 leading-relaxed">
                  Create an account and provide your information to request an appointment.
                </p>
              </div>
              <div className="w-10 h-10 rounded-full bg-[#f3f4f6] group-hover:bg-[#0057b8] text-[#4b5563] group-hover:text-white flex items-center justify-center shrink-0 transition-colors">
                <ArrowRight className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </div>
          </Link>

          {/* Row 2: Returning Patients */}
          <Link
            href="/login?redirect=/request-appointment/form"
            className="group block w-full bg-white rounded-2xl border border-[#d1d5db] p-6 sm:p-8 hover:border-[#0057b8] hover:shadow-lg transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-[#0057b8]/20"
          >
            <div className="flex items-center justify-between gap-4">
              <div className="space-y-1.5 pr-2">
                <div className="flex items-center gap-2.5">
                  <span className="w-7 h-7 rounded-full bg-[#e8f0f9] text-[#0057b8] flex items-center justify-center shrink-0">
                    <LogIn className="w-4 h-4" />
                  </span>
                  <h3 className="text-xl sm:text-2xl font-bold text-[#111827] group-hover:text-[#0057b8] transition-colors">
                    Returning Patients
                  </h3>
                </div>
                <p className="text-sm sm:text-base text-[#4b5563] pl-9.5 leading-relaxed">
                  Log in to your account to request an appointment.
                </p>
              </div>
              <div className="w-10 h-10 rounded-full bg-[#f3f4f6] group-hover:bg-[#0057b8] text-[#4b5563] group-hover:text-white flex items-center justify-center shrink-0 transition-colors">
                <ArrowRight className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </div>
          </Link>
        </div>

        {/* Track Existing & Helpline Utilities */}
        <div className="mt-10 pt-6 border-t border-[#d1d5db]/60 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs sm:text-sm text-[#4b5563]">
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

      {/* Bottom Footer Note */}
      <footer className="w-full max-w-5xl mx-auto px-6 sm:px-8 py-6 text-center text-xs text-[#6b7280]">
        <p>
          DeltaCare Hospital Platform • BMDC-Registered Specialist Consultations • Coordinated Care Across Bangladesh
        </p>
      </footer>
    </div>
  );
}
