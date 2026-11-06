import React from "react";
import Link from "next/link";
import { ShieldCheck, Lock, Users, CheckCircle2, ArrowRight } from "lucide-react";

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Full-bleed Stretched Blue Hero Header */}
      <div className="w-full bg-[#012d61] text-white py-14 md:py-20 border-b border-[#001f44]">
        <div className="mc-container max-w-7xl mx-auto px-6 sm:px-10 lg:px-12 space-y-4">
          <p className="text-xs sm:text-sm font-bold uppercase tracking-widest text-[#93c5fd]">
            Care at DeltaCare • Institutional Governance &amp; Quality
          </p>
          <h1 className="mc-serif text-3xl sm:text-5xl lg:text-[54px] font-bold text-white tracking-tight leading-tight">
            About DeltaCare Hospital Platform
          </h1>
          <p className="text-xl text-[#c5e2f9] font-medium">
            ডেল্টাকেয়ার পরিচিতি ও ক্লিনিক্যাল নীতিমালা
          </p>
          <p className="text-base sm:text-lg text-[#e8f0f9] max-w-3xl leading-relaxed">
            DeltaCare is built around a single principle: every piece of medical
            and operational information presented to a patient—doctor credentials,
            chamber schedules, consultation fees, and appointment status—must be
            verified, effective-dated, and governed by human clinical operations.
          </p>
        </div>
      </div>

      {/* Main Body - Unboxed Editorial Composition */}
      <div className="w-full py-12 md:py-16">
        <div className="mc-container max-w-7xl mx-auto px-6 sm:px-10 lg:px-12 space-y-16">
          {/* 3 Pillars - Clean Editorial Grid without Boxes */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12 pb-14 border-b border-[#e5e7eb]">
            <div className="space-y-3">
              <ShieldCheck className="w-8 h-8 text-[#0057b8]" />
              <h2 className="mc-serif text-2xl text-[#080808]">
                Human-in-the-Loop Publishing
              </h2>
              <p className="text-base text-[#424242] leading-relaxed">
                Changes to doctor credentials, consultation fees, and chamber
                schedules follow a Draft &rarr; Pending Approval &rarr; Published workflow
                with immutable audit history.
              </p>
            </div>

            <div className="space-y-3">
              <Lock className="w-8 h-8 text-[#0057b8]" />
              <h2 className="mc-serif text-2xl text-[#080808]">
                Safe AI Patient Guidance
              </h2>
              <p className="text-base text-[#424242] leading-relaxed">
                The DeltaCare Assistant answers strictly from published hospital
                records, abstains when data is unverified, and refuses clinical
                diagnosis or medication prescriptions.
              </p>
            </div>

            <div className="space-y-3">
              <Users className="w-8 h-8 text-[#0057b8]" />
              <h2 className="mc-serif text-2xl text-[#080808]" id="careers">
                Clinical Training &amp; Careers
              </h2>
              <p className="text-base text-[#424242] leading-relaxed">
                DeltaCare supports multidisciplinary clinical governance across 5
                campuses in Dhaka, Chattogram, and Sylhet. Contact our HR &amp;
                Medical Affairs desk for consultant fellowships.
              </p>
            </div>
          </div>

          {/* Synthetic Disclosure Section - Clean Horizontal Strip */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 py-8 border-b border-[#e5e7eb]">
            <div className="space-y-2 max-w-2xl">
              <h2 className="mc-serif text-2xl text-[#080808] flex items-center gap-2">
                <CheckCircle2 className="w-6 h-6 text-[#0057b8]" />
                <span>Synthetic Development Data Disclosure</span>
              </h2>
              <p className="text-base text-[#424242] leading-relaxed">
                All doctors, BMDC numbers, schedules, and appointments seeded in
                this environment are synthetic records created for end-to-end
                engineering verification.
              </p>
            </div>
            <div className="flex flex-wrap gap-4 shrink-0">
              <Link href="/doctors" className="mc-btn-primary text-sm !py-2.5 !px-5 inline-flex items-center gap-2">
                <span>Explore Specialists</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link href="/admin" className="mc-btn-secondary text-sm !py-2.5 !px-5">
                DeltaCare Admin Portal
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
