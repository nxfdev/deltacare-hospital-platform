import React from "react";
import { getHospitalConfig } from "@/server/services/publicQueryService";

export default function PrivacyPolicyPage() {
  const hospital = getHospitalConfig();
  return (
    <div className="bg-[#f2f2f2] min-h-screen py-12">
      <div className="mc-container max-w-4xl bg-white rounded-3xl border border-[#d6d6d6] p-8 md:p-12 space-y-6">
        <p className="text-xs font-bold uppercase tracking-wider text-[#0057b8]">
          DeltaCare Governance • Privacy & Data Protection
        </p>
        <h1 className="mc-serif text-3xl md:text-4xl text-[#080808]">
          Privacy Policy / গোপনীয়তা নীতি
        </h1>
        <p className="text-base text-[#080808] leading-relaxed">
          {hospital.privacyNoticeEn}
        </p>
        <p className="text-base text-[#424242] leading-relaxed">
          {hospital.privacyNoticeBn}
        </p>
        <div className="space-y-3 text-sm text-[#424242] pt-4 border-t border-[#d6d6d6]">
          <h2 className="font-bold text-lg text-[#080808]">
            1. Data Minimization & Purpose Limitation
          </h2>
          <p>
            Public appointment requests and callback forms collect only your
            name, phone number, optional email, preferred doctor/branch/slot,
            and a brief administrative note. Visitors are instructed not to
            upload sensitive clinical records or diagnostic images into public
            forms.
          </p>
          <h2 className="font-bold text-lg text-[#080808]">
            2. Private Feedback & Complaint Confidentiality
          </h2>
          <p>
            All feedback and complaint submissions are flagged{" "}
            <code>isPrivate: true</code> and are accessible solely to authorized
            DeltaCare Patient Relations and administrative personnel.
          </p>
          <h2 className="font-bold text-lg text-[#080808]">
            3. Audit Logging & Redaction
          </h2>
          <p>
            Administrative mutations and AI assistant sessions are logged for
            clinical governance, with clinical queries automatically redacted in
            analytics logs.
          </p>
        </div>
      </div>
    </div>
  );
}

