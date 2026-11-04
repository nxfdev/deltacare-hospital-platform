import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Calendar, CheckCircle2, ClipboardCheck } from "lucide-react";
import {
  getPublishedDepartments,
  getPublishedProcedureBySlug,
} from "@/server/services/publicQueryService";

export const dynamic = "force-dynamic";

export default async function ProcedureDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const proc = getPublishedProcedureBySlug(slug);
  if (!proc) {
    notFound();
  }

  const departments = getPublishedDepartments();
  const department = departments.find((d) => d.id === proc.departmentId);

  return (
    <div className="bg-[#f2f2f2] min-h-screen py-12">
      <div className="mc-container space-y-8">
        <div>
          <Link
            href="/tests-procedures"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#004181] hover:text-[#0057b8] hover:underline"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>All Tests & Procedures</span>
          </Link>
        </div>

        <article className="bg-white rounded-3xl border border-[#d6d6d6] overflow-hidden shadow-sm">
          <div className="bg-[#012d61] text-white p-8 md:p-12 space-y-3">
            <span className="px-3 py-1 rounded-full bg-white/15 text-xs font-bold uppercase text-[#c5e2f9]">
              {proc.categoryEn} • {department?.nameEn}
            </span>
            <h1 className="mc-serif text-3xl md:text-5xl text-white">
              {proc.nameEn}
            </h1>
            <p className="text-xl text-[#c5e2f9] font-medium">{proc.nameBn}</p>
            <div className="pt-2 flex flex-wrap items-center gap-4 text-xs text-[#e8f0f9]">
              <span className="inline-flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-[#c5e2f9]" />
                Reviewed by: {proc.reviewedByEn} ({proc.reviewedByBn})
              </span>
              <span>•</span>
              <span>Last Reviewed: {proc.lastReviewedAt}</span>
              {proc.feeBdt && (
                <>
                  <span>•</span>
                  <span className="font-bold text-white">
                    Approved Fee: BDT {proc.feeBdt} (Effective{" "}
                    {proc.feeEffectiveFrom})
                  </span>
                </>
              )}
            </div>
          </div>

          <div className="p-8 md:p-12 space-y-8">
            <section className="space-y-2">
              <h2 className="mc-serif text-2xl text-[#080808]">
                Overview / সংক্ষিপ্ত বিবরণ
              </h2>
              <p className="text-base text-[#080808] leading-relaxed">
                {proc.summaryEn}
              </p>
              <p className="text-base text-[#424242] leading-relaxed">
                {proc.summaryBn}
              </p>
            </section>

            <section className="p-6 rounded-2xl bg-[#e8f0f9] border border-[#c5e2f9] space-y-2">
              <h2 className="mc-serif text-xl text-[#004181] flex items-center gap-2">
                <ClipboardCheck className="w-5 h-5 text-[#0057b8]" />
                <span>How to Prepare / পরীক্ষার প্রস্তুতি</span>
              </h2>
              <p className="text-sm text-[#080808] leading-relaxed">
                {proc.preparationEn}
              </p>
              <p className="text-sm text-[#004181] leading-relaxed">
                {proc.preparationBn}
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="mc-serif text-2xl text-[#080808]">
                What You Can Expect / পরীক্ষার সময় করণীয়
              </h2>
              <p className="text-sm text-[#080808] leading-relaxed">
                {proc.whatToExpectEn}
              </p>
              <p className="text-sm text-[#424242] leading-relaxed">
                {proc.whatToExpectBn}
              </p>
            </section>

            <div className="pt-4 border-t border-[#d6d6d6] flex flex-wrap gap-3">
              <Link
                href={`/appointments?departmentId=${encodeURIComponent(
                  proc.departmentId
                )}`}
                className="mc-btn-primary"
              >
                <Calendar className="w-4 h-4" />
                <span>Request Specialist Consultation</span>
              </Link>
              {department && (
                <Link
                  href={`/departments/${department.slug}`}
                  className="mc-btn-secondary"
                >
                  View {department.nameEn}
                </Link>
              )}
            </div>
          </div>
        </article>
      </div>
    </div>
  );
}

