import React from "react";
import Link from "next/link";
import { ShieldCheck, Calendar, CheckCircle2, PhoneCall, ArrowRight } from "lucide-react";
import { getHospitalConfig, getPublishedServices } from "@/server/services/publicQueryService";

export const dynamic = "force-dynamic";

export default function PatientServicesPage() {
  const hospital = getHospitalConfig();
  const services = getPublishedServices();

  return (
    <div className="min-h-screen bg-white">
      {/* Full-bleed Stretched Blue Hero Header */}
      <div className="w-full bg-[#012d61] text-white py-14 md:py-20 border-b border-[#001f44]">
        <div className="mc-container max-w-7xl mx-auto px-6 sm:px-10 lg:px-12 space-y-4">
          <p className="text-xs sm:text-sm font-bold uppercase tracking-widest text-[#93c5fd]">
            Care at DeltaCare • Patient &amp; Visitor Guide
          </p>
          <h1 className="mc-serif text-3xl sm:text-5xl lg:text-[54px] font-bold text-white tracking-tight leading-tight">
            Patient-Centered Care &amp; Services
          </h1>
          <p className="text-xl text-[#c5e2f9] font-medium">
            রোগী ও দর্শনার্থী সেবা নির্দেশিকা
          </p>
          <p className="text-base sm:text-lg text-[#e8f0f9] max-w-3xl leading-relaxed">
            Transparent consultation fees, accountable appointment scheduling,
            preparation instructions, and visitor support across all DeltaCare
            campuses.
          </p>
        </div>
      </div>

      {/* Main Body Content - Unboxed & Spread Out */}
      <div className="w-full py-12 md:py-16">
        <div className="mc-container max-w-7xl mx-auto px-6 sm:px-10 lg:px-12 space-y-16">
          {/* 3-Column Editorial Pillars (No Boxes) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12 pb-14 border-b border-[#e5e7eb]">
            <div className="space-y-3">
              <ShieldCheck className="w-8 h-8 text-[#0057b8]" />
              <h2 className="mc-serif text-2xl text-[#080808]">
                Honest Appointment Workflow
              </h2>
              <p className="text-base text-[#424242] leading-relaxed">
                {hospital.cancellationPolicyEn}
              </p>
              <p className="text-sm text-[#686868] leading-relaxed">
                {hospital.cancellationPolicyBn}
              </p>
            </div>

            <div className="space-y-3">
              <CheckCircle2 className="w-8 h-8 text-[#0057b8]" />
              <h2 className="mc-serif text-2xl text-[#080808]">
                Effective-Dated Fee Governance
              </h2>
              <p className="text-base text-[#424242] leading-relaxed">
                Every consultation fee and diagnostic charge published on
                DeltaCare carries an explicit effective date and administrative
                sign-off so patients never face unverified website estimates.
              </p>
            </div>

            <div className="space-y-3">
              <PhoneCall className="w-8 h-8 text-[#0057b8]" />
              <h2 className="mc-serif text-2xl text-[#080808]">
                24/7 Helpline &amp; Callback Desk
              </h2>
              <p className="text-base text-[#424242] leading-relaxed">
                Reach our central Patient Desk at{" "}
                <strong className="text-[#080808]">{hospital.helplinePhone}</strong> ({hospital.emergencyPhone})
                or request a callback online.
              </p>
              <div className="pt-2">
                <Link
                  href="/contact"
                  className="inline-flex items-center gap-2 text-sm font-bold text-[#0057b8] hover:underline"
                >
                  <span>Contact &amp; Callback Desk</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>

          {/* Published Fees Directory (Unboxed Divided Rows) */}
          <section className="space-y-6">
            <div className="flex flex-wrap items-end justify-between gap-4 pb-4 border-b-2 border-[#080808]">
              <div>
                <p className="text-xs sm:text-sm font-bold uppercase tracking-widest text-[#0057b8] mb-1">
                  Official Fee Schedule
                </p>
                <h2 className="mc-serif text-3xl sm:text-4xl text-[#080808]">
                  Published Diagnostic &amp; Clinical Service Fees
                </h2>
              </div>
              <Link
                href="/request-appointment"
                className="mc-btn-primary text-sm !py-2.5 !px-5 inline-flex items-center gap-2"
              >
                <Calendar className="w-4 h-4" />
                <span>Request Appointment</span>
              </Link>
            </div>

            <div className="divide-y divide-[#e5e7eb]">
              {services.map((srv) => (
                <div
                  key={srv.id}
                  className="py-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-[#fbfbfb] px-2 transition-colors"
                >
                  <div className="space-y-1">
                    <h3 className="font-bold text-lg text-[#080808]">
                      {srv.nameEn}{" "}
                      <span className="font-normal text-sm text-[#4b5563]">
                        ({srv.nameBn})
                      </span>
                    </h3>
                    <p className="text-base text-[#4b5563]">{srv.descriptionEn}</p>
                  </div>
                  <div className="sm:text-right shrink-0">
                    <span className="font-bold text-xl text-[#004181] block">
                      {srv.feeLabelEn}
                    </span>
                    <span className="text-xs font-semibold text-[#6b7280]">
                      Effective {srv.effectiveFrom}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
