import React from "react";
import { getHospitalConfig } from "@/server/services/publicQueryService";

export default function TermsPage() {
  const hospital = getHospitalConfig();
  return (
    <div className="bg-[#f2f2f2] min-h-screen py-12">
      <div className="mc-container max-w-4xl bg-white rounded-3xl border border-[#d6d6d6] p-8 md:p-12 space-y-6">
        <p className="text-xs font-bold uppercase tracking-wider text-[#0057b8]">
          DeltaCare Governance • Terms & Clinical Disclaimer
        </p>
        <h1 className="mc-serif text-3xl md:text-4xl text-[#080808]">
          Terms and Conditions / ব্যবহারের শর্তাবলী
        </h1>
        <div className="space-y-4 text-sm text-[#424242] leading-relaxed">
          <h2 className="font-bold text-lg text-[#080808]">
            1. No Online Medical Diagnosis or Emergency Triage
          </h2>
          <p>
            Content published on the DeltaCare Hospital Platform—including the
            Diseases & Conditions directory, Tests & Procedures guides, and the
            automated DeltaCare Assistant—is provided strictly for educational
            and administrative purposes. It does not constitute medical advice,
            clinical diagnosis, or treatment prescription. For medical
            emergencies, call <strong>{hospital.helplinePhone}</strong> (
            {hospital.emergencyPhone}) immediately.
          </p>
          <h2 className="font-bold text-lg text-[#080808]">
            2. Appointment Request Policy
          </h2>
          <p>{hospital.cancellationPolicyEn}</p>
          <p>{hospital.cancellationPolicyBn}</p>
          <h2 className="font-bold text-lg text-[#080808]">
            3. Fee & Schedule Governance
          </h2>
          <p>
            Published consultation fees and diagnostic charges reflect
            effective-dated hospital records approved by DeltaCare
            administration.
          </p>
        </div>
      </div>
    </div>
  );
}

