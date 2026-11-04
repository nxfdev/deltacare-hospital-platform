import React from "react";
import Link from "next/link";
import { ShieldCheck, Lock, Users, CheckCircle2 } from "lucide-react";

export default function AboutPage() {
  return (
    <div className="bg-[#f2f2f2] min-h-screen py-12">
      <div className="mc-container space-y-10">
        <div className="bg-[#012d61] text-white rounded-3xl p-8 md:p-12 space-y-3">
          <p className="text-xs font-bold uppercase tracking-widest text-[#c5e2f9]">
            Care at DeltaCare • Institutional Governance & Quality
          </p>
          <h1 className="mc-serif text-3xl md:text-5xl text-white">
            About DeltaCare Hospital Platform / ডেল্টাকেয়ার সম্পর্কে
          </h1>
          <p className="text-base text-[#e8f0f9] max-w-3xl leading-relaxed">
            DeltaCare is built around a single principle: every piece of medical
            and operational information presented to a patient—doctor credentials,
            chamber schedules, consultation fees, and appointment status—must be
            verified, effective-dated, and governed by human clinical operations.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-2xl border border-[#d6d6d6] p-6 space-y-3">
            <ShieldCheck className="w-8 h-8 text-[#0057b8]" />
            <h2 className="mc-serif text-xl text-[#080808]">
              Human-in-the-Loop Publishing
            </h2>
            <p className="text-sm text-[#424242]">
              Changes to doctor credentials, consultation fees, and chamber
              schedules follow a Draft → Pending Approval → Published workflow
              with immutable audit history.
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-[#d6d6d6] p-6 space-y-3">
            <Lock className="w-8 h-8 text-[#0057b8]" />
            <h2 className="mc-serif text-xl text-[#080808]">
              Safe AI Patient Guidance
            </h2>
            <p className="text-sm text-[#424242]">
              The DeltaCare Assistant answers strictly from published hospital
              records, abstains when data is unverified, and refuses clinical
              diagnosis or medication prescriptions.
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-[#d6d6d6] p-6 space-y-3">
            <Users className="w-8 h-8 text-[#0057b8]" />
            <h2 className="mc-serif text-xl text-[#080808]" id="careers">
              Clinical Training & Careers
            </h2>
            <p className="text-sm text-[#424242]">
              DeltaCare supports multidisciplinary clinical governance across 5
              campuses in Dhaka, Chattogram, and Sylhet. Contact our HR &
              Medical Affairs desk for consultant fellowships.
            </p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-[#d6d6d6] p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <h2 className="mc-serif text-2xl text-[#080808] flex items-center gap-2">
              <CheckCircle2 className="w-6 h-6 text-[#0057b8]" />
              <span>Synthetic Development Data Disclosure</span>
            </h2>
            <p className="text-sm text-[#424242]">
              All doctors, BMDC numbers, schedules, and appointments seeded in
              this environment are synthetic records created for end-to-end
              engineering verification.
            </p>
          </div>
          <div className="flex flex-wrap gap-3 shrink-0">
            <Link href="/doctors" className="mc-btn-primary">
              Explore Specialists
            </Link>
            <Link href="/admin" className="mc-btn-secondary">
              DeltaCare Admin Portal
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

