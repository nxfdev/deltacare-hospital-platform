import React from "react";
import Link from "next/link";
import { ShieldCheck, Calendar, CheckCircle2, PhoneCall } from "lucide-react";
import { getHospitalConfig, getPublishedServices } from "@/server/services/publicQueryService";

export const dynamic = "force-dynamic";

export default function PatientServicesPage() {
  const hospital = getHospitalConfig();
  const services = getPublishedServices();

  return (
    <div className="bg-[#f2f2f2] min-h-screen py-12">
      <div className="mc-container space-y-10">
        <div className="bg-[#012d61] text-white rounded-3xl p-8 md:p-12 space-y-3">
          <p className="text-xs font-bold uppercase tracking-widest text-[#c5e2f9]">
            Care at DeltaCare • Patient & Visitor Guide
          </p>
          <h1 className="mc-serif text-3xl md:text-5xl text-white">
            Patient-Centered Care & Services / রোগী ও দর্শনার্থী সেবা
          </h1>
          <p className="text-base text-[#e8f0f9] max-w-3xl">
            Transparent consultation fees, accountable appointment scheduling,
            preparation instructions, and visitor support across all DeltaCare
            campuses.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-2xl border border-[#d6d6d6] p-6 space-y-3">
            <ShieldCheck className="w-8 h-8 text-[#0057b8]" />
            <h2 className="mc-serif text-xl text-[#080808]">
              Honest Appointment Workflow
            </h2>
            <p className="text-sm text-[#424242]">
              {hospital.cancellationPolicyEn}
            </p>
            <p className="text-xs text-[#686868]">
              {hospital.cancellationPolicyBn}
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-[#d6d6d6] p-6 space-y-3">
            <CheckCircle2 className="w-8 h-8 text-[#0057b8]" />
            <h2 className="mc-serif text-xl text-[#080808]">
              Effective-Dated Fee Governance
            </h2>
            <p className="text-sm text-[#424242]">
              Every consultation fee and diagnostic charge published on
              DeltaCare carries an explicit effective date and administrative
              sign-off so patients never face unverified website estimates.
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-[#d6d6d6] p-6 space-y-3">
            <PhoneCall className="w-8 h-8 text-[#0057b8]" />
            <h2 className="mc-serif text-xl text-[#080808]">
              24/7 Helpline & Callback Desk
            </h2>
            <p className="text-sm text-[#424242]">
              Reach our central Patient Desk at{" "}
              <strong>{hospital.helplinePhone}</strong> ({hospital.emergencyPhone})
              or request a callback online.
            </p>
            <Link href="/contact" className="mc-btn-secondary text-xs !py-2 !px-4">
              Contact & Callback Desk
            </Link>
          </div>
        </div>

        <section className="bg-white rounded-2xl border border-[#d6d6d6] p-6 md:p-8 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <h2 className="mc-serif text-2xl text-[#080808]">
              Published Diagnostic & Clinical Service Fees
            </h2>
            <Link href="/appointments" className="mc-btn-primary text-xs !py-2 !px-4">
              <Calendar className="w-4 h-4" />
              <span>Request Appointment</span>
            </Link>
          </div>
          <div className="divide-y divide-[#d6d6d6]">
            {services.map((srv) => (
              <div
                key={srv.id}
                className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div>
                  <h3 className="font-bold text-base text-[#080808]">
                    {srv.nameEn} ({srv.nameBn})
                  </h3>
                  <p className="text-sm text-[#424242]">{srv.descriptionEn}</p>
                </div>
                <div className="text-right shrink-0">
                  <span className="font-bold text-lg text-[#004181] block">
                    {srv.feeLabelEn}
                  </span>
                  <span className="text-xs text-[#686868]">
                    Effective {srv.effectiveFrom}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

