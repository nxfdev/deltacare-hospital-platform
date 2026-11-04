import React from "react";
import Link from "next/link";
import { ChevronRight, ShieldCheck, Calendar } from "lucide-react";
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
    <div className="bg-[#f2f2f2] min-h-screen py-12">
      <div className="mc-container space-y-10">
        <div className="bg-[#012d61] text-white rounded-3xl p-8 md:p-12 space-y-3">
          <p className="text-xs font-bold uppercase tracking-widest text-[#c5e2f9]">
            DeltaCare Health Library • Diagnostic Preparation & Procedures
          </p>
          <h1 className="mc-serif text-3xl md:text-5xl text-white">
            Tests & Procedures / পরীক্ষা ও পদ্ধতিসমূহ
          </h1>
          <p className="text-base text-[#e8f0f9] max-w-3xl">
            Review patient preparation instructions, what to expect during
            diagnostic tests, and effective-dated transparent BDT fees.
          </p>
        </div>

        <section className="space-y-4">
          <h2 className="mc-serif text-2xl md:text-3xl text-[#080808]">
            Clinical Procedure Guides ({procedures.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {procedures.map((proc) => {
              const dept = departments.find((d) => d.id === proc.departmentId);
              return (
                <article
                  key={proc.id}
                  className="bg-white rounded-2xl border border-[#d6d6d6] p-6 shadow-sm hover:border-[#0057b8] transition-all flex flex-col justify-between gap-4"
                >
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="px-2.5 py-0.5 rounded-full bg-[#e8f0f9] text-[#004181] font-bold">
                        {proc.categoryEn} • {dept?.nameEn}
                      </span>
                      <span className="text-[#686868] inline-flex items-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5 text-[#0057b8]" />
                        Reviewed {proc.lastReviewedAt}
                      </span>
                    </div>

                    <h3 className="mc-serif text-2xl text-[#080808]">
                      <Link
                        href={`/tests-procedures/${proc.slug}`}
                        className="hover:text-[#0057b8] hover:underline"
                      >
                        {proc.nameEn}
                      </Link>
                    </h3>
                    <p className="text-sm font-semibold text-[#004181]">
                      {proc.nameBn}
                    </p>
                    <p className="text-sm text-[#424242] leading-relaxed">
                      {proc.summaryEn}
                    </p>
                    <p className="text-xs text-[#686868] leading-relaxed">
                      <strong>Preparation:</strong> {proc.preparationEn}
                    </p>
                  </div>

                  <div className="pt-4 border-t border-[#f2f2f2] flex items-center justify-between">
                    <div>
                      <span className="text-xs text-[#686868] block">
                        Approved Fee (Effective {proc.feeEffectiveFrom})
                      </span>
                      <span className="font-bold text-base text-[#004181]">
                        {proc.feeBdt ? `BDT ${proc.feeBdt}` : "Consult Desk"}
                      </span>
                    </div>
                    <Link
                      href={`/tests-procedures/${proc.slug}`}
                      className="inline-flex items-center gap-1 text-sm font-bold text-[#004181] hover:text-[#0057b8]"
                    >
                      <span>Preparation Guide</span>
                      <ChevronRight className="w-4 h-4" />
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        {/* Diagnostic Services Fee Schedule */}
        <section className="bg-white rounded-2xl border border-[#d6d6d6] p-6 md:p-8 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="mc-serif text-2xl text-[#080808]">
                Outpatient Diagnostic Service Fee Schedule
              </h2>
              <p className="text-xs text-[#686868]">
                All fees carry an explicit effective date and administrative verification stamp.
              </p>
            </div>
            <Link href="/appointments" className="mc-btn-primary text-xs !py-2 !px-4">
              <Calendar className="w-3.5 h-3.5" />
              <span>Request Consultation</span>
            </Link>
          </div>

          <div className="divide-y divide-[#d6d6d6]">
            {services.map((srv) => {
              const dept = departments.find((d) => d.id === srv.departmentId);
              return (
                <div
                  key={srv.id}
                  className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div>
                    <p className="text-xs font-bold text-[#0057b8]">
                      {dept?.nameEn}
                    </p>
                    <h3 className="font-bold text-base text-[#080808]">
                      {srv.nameEn} ({srv.nameBn})
                    </h3>
                    <p className="text-sm text-[#424242]">{srv.descriptionEn}</p>
                    {srv.preparationEn && (
                      <p className="text-xs text-[#004181] mt-1">
                        <strong>Preparation:</strong> {srv.preparationEn}
                      </p>
                    )}
                  </div>
                  <div className="text-left sm:text-right shrink-0">
                    <span className="block text-lg font-bold text-[#004181]">
                      {srv.feeLabelEn}
                    </span>
                    <span className="text-xs text-[#686868]">
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
  );
}

