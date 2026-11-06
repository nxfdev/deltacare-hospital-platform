import React from "react";
import Link from "next/link";
import { ArrowRight, ShieldCheck, Calendar } from "lucide-react";
import {
  getPublishedDepartments,
  getPublishedProcedures,
  getPublishedServices,
} from "@/server/services/publicQueryService";

export const dynamic = "force-dynamic";

export default function TestsProceduresPage() {
  const procedures = getPublishedProcedures();
  const services = getPublishedServices();
  const departments = getPublishedDepartments();

  return (
    <div className="min-h-screen bg-white">
      {/* Full-bleed Stretched Dark Blue Hero Header */}
      <div className="w-full bg-[#012d61] text-white py-14 md:py-20 border-b border-[#001f44]">
        <div className="mc-container max-w-7xl mx-auto px-6 sm:px-10 lg:px-12 space-y-4">
          <p className="text-xs sm:text-sm font-bold uppercase tracking-widest text-[#93c5fd]">
            DeltaCare Health Library • Diagnostic Preparation &amp; Procedures
          </p>
          <h1 className="mc-serif text-3xl sm:text-5xl lg:text-[54px] font-bold text-white tracking-tight leading-tight">
            Tests &amp; Procedures
          </h1>
          <p className="text-xl text-[#c5e2f9] font-medium">
            পরীক্ষা ও ডায়াগনস্টিক পদ্ধতিসমূহ
          </p>
          <p className="text-base sm:text-lg text-[#e8f0f9] max-w-3xl leading-relaxed">
            Review patient preparation instructions, what to expect during
            diagnostic tests, and effective-dated transparent BDT fees.
          </p>
        </div>
      </div>

      {/* Main Body - Unboxed Editorial */}
      <div className="w-full py-12 md:py-16">
        <div className="mc-container max-w-7xl mx-auto px-6 sm:px-10 lg:px-12 space-y-16">
          {/* Clinical Procedure Guides */}
          <section className="space-y-6">
            <div className="pb-4 border-b-2 border-[#080808]">
              <h2 className="mc-serif text-3xl sm:text-4xl text-[#080808]">
                Clinical Procedure Guides ({procedures.length})
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-14">
              {procedures.map((proc) => {
                const dept = departments.find((d) => d.id === proc.departmentId);
                return (
                  <article
                    key={proc.id}
                    className="pb-8 border-b border-[#e5e7eb] flex flex-col justify-between gap-4"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-[#0057b8] uppercase tracking-wider">
                          {proc.categoryEn} • {dept?.nameEn}
                        </span>
                        <span className="text-[#6b7280] inline-flex items-center gap-1">
                          <ShieldCheck className="w-3.5 h-3.5 text-[#0057b8]" />
                          Reviewed {proc.lastReviewedAt}
                        </span>
                      </div>

                      <h3 className="mc-serif text-2xl text-[#080808]">
                        <Link
                          href={`/tests-procedures/${proc.slug}`}
                          className="hover:text-[#0057b8] transition-colors"
                        >
                          {proc.nameEn}
                        </Link>
                      </h3>
                      <p className="text-sm font-semibold text-[#004181]">
                        {proc.nameBn}
                      </p>
                      <p className="text-base text-[#4b5563] leading-relaxed">
                        {proc.summaryEn}
                      </p>
                      <p className="text-sm text-[#6b7280] leading-relaxed">
                        <strong>Preparation:</strong> {proc.preparationEn}
                      </p>
                    </div>

                    <div className="pt-3 flex items-center justify-between text-sm">
                      <div>
                        <span className="text-xs text-[#6b7280] block">
                          Approved Fee (Effective {proc.feeEffectiveFrom})
                        </span>
                        <span className="font-bold text-lg text-[#004181]">
                          {proc.feeBdt ? `BDT ${proc.feeBdt}` : "Consult Desk"}
                        </span>
                      </div>
                      <Link
                        href={`/tests-procedures/${proc.slug}`}
                        className="inline-flex items-center gap-1 text-sm font-bold text-[#0057b8] hover:underline"
                      >
                        <span>Preparation Guide</span>
                        <ArrowRight className="w-4 h-4" />
                      </Link>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>

          {/* Diagnostic Services Fee Schedule */}
          <section className="space-y-6">
            <div className="flex flex-wrap items-end justify-between gap-4 pb-4 border-b-2 border-[#080808]">
              <div>
                <p className="text-xs sm:text-sm font-bold uppercase tracking-widest text-[#0057b8] mb-1">
                  Transparent Hospital Rates
                </p>
                <h2 className="mc-serif text-3xl sm:text-4xl text-[#080808]">
                  Outpatient Diagnostic Service Fee Schedule
                </h2>
              </div>
              <Link
                href="/request-appointment"
                className="mc-btn-primary text-sm !py-2.5 !px-5 inline-flex items-center gap-2"
              >
                <Calendar className="w-4 h-4" />
                <span>Request Consultation</span>
              </Link>
            </div>

            <div className="divide-y divide-[#e5e7eb]">
              {services.map((srv) => {
                const dept = departments.find((d) => d.id === srv.departmentId);
                return (
                  <div
                    key={srv.id}
                    className="py-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-[#fbfbfb] px-2 transition-colors"
                  >
                    <div className="space-y-1">
                      <p className="text-xs font-bold uppercase tracking-wider text-[#0057b8]">
                        {dept?.nameEn}
                      </p>
                      <h3 className="font-bold text-lg text-[#080808]">
                        {srv.nameEn}{" "}
                        <span className="font-normal text-sm text-[#4b5563]">
                          ({srv.nameBn})
                        </span>
                      </h3>
                      <p className="text-base text-[#4b5563]">{srv.descriptionEn}</p>
                      {srv.preparationEn && (
                        <p className="text-sm text-[#004181]">
                          <strong>Preparation:</strong> {srv.preparationEn}
                        </p>
                      )}
                    </div>
                    <div className="sm:text-right shrink-0">
                      <span className="block text-xl font-bold text-[#004181]">
                        {srv.feeLabelEn}
                      </span>
                      <span className="text-xs font-semibold text-[#6b7280]">
                        Effective from {srv.effectiveFrom}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
