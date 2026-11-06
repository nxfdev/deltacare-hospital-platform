import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  ClipboardCheck,
} from "lucide-react";
import {
  getPublishedDepartmentBySlug,
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
    <div className="min-h-screen bg-white">
      {/* Full-bleed Stretched Dark Blue Hero Header */}
      <div className="w-full bg-[#012d61] text-white py-14 md:py-20 border-b border-[#001f44]">
        <div className="mc-container max-w-7xl mx-auto px-6 sm:px-10 lg:px-12 space-y-4">
          <Link
            href="/tests-procedures"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#93c5fd] hover:underline mb-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>All Tests &amp; Procedures</span>
          </Link>
          <div className="flex flex-wrap items-center gap-3 text-xs uppercase tracking-wider text-[#93c5fd]">
            <span>{proc.categoryEn} • {department?.nameEn}</span>
          </div>
          <h1 className="mc-serif text-3xl sm:text-5xl lg:text-[54px] font-bold text-white tracking-tight leading-tight">
            {proc.nameEn}
          </h1>
          <p className="text-xl text-[#c5e2f9] font-medium">{proc.nameBn}</p>
          <div className="pt-2 flex flex-wrap items-center gap-4 text-xs sm:text-sm text-[#e8f0f9]">
            <span className="inline-flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-[#93c5fd]" />
              Reviewed by: {proc.reviewedByEn} ({proc.reviewedByBn})
            </span>
            <span>•</span>
            <span>Last Reviewed: {proc.lastReviewedAt}</span>
            {proc.feeBdt && (
              <>
                <span>•</span>
                <span className="font-bold text-white">
                  Approved Fee: BDT {proc.feeBdt} (Effective {proc.feeEffectiveFrom})
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Main Body - Unboxed Editorial */}
      <div className="w-full py-12 md:py-16">
        <div className="mc-container max-w-7xl mx-auto px-6 sm:px-10 lg:px-12 space-y-12">
          {/* Overview */}
          <section className="space-y-3 pb-8 border-b border-[#e5e7eb]">
            <h2 className="mc-serif text-2xl md:text-3xl text-[#080808]">
              Overview / সংক্ষিপ্ত বিবরণ
            </h2>
            <p className="text-base sm:text-lg text-[#080808] leading-relaxed">
              {proc.summaryEn}
            </p>
            <p className="text-base text-[#4b5563] leading-relaxed">
              {proc.summaryBn}
            </p>
          </section>

          {/* Preparation */}
          <section className="p-8 border-l-4 border-[#0057b8] bg-[#f0f9ff] space-y-3">
            <h2 className="mc-serif text-2xl text-[#004181] flex items-center gap-2">
              <ClipboardCheck className="w-6 h-6 text-[#0057b8]" />
              <span>How to Prepare / পরীক্ষার প্রস্তুতি</span>
            </h2>
            <p className="text-base text-[#080808] leading-relaxed">
              {proc.preparationEn}
            </p>
            <p className="text-sm text-[#004181] leading-relaxed">
              {proc.preparationBn}
            </p>
          </section>

          {/* What to Expect */}
          <section className="space-y-3 pb-8 border-b border-[#e5e7eb]">
            <h2 className="mc-serif text-2xl md:text-3xl text-[#080808]">
              What You Can Expect / পরীক্ষার সময় করণীয়
            </h2>
            <p className="text-base text-[#080808] leading-relaxed">
              {proc.whatToExpectEn}
            </p>
            <p className="text-base text-[#4b5563] leading-relaxed">
              {proc.whatToExpectBn}
            </p>
          </section>

          {/* Actions */}
          <div className="flex flex-wrap gap-4 pt-4">
            <Link
              href={`/request-appointment?departmentId=${encodeURIComponent(
                proc.departmentId
              )}`}
              className="mc-btn-primary inline-flex items-center gap-2 text-sm !py-2.5 !px-5"
            >
              <Calendar className="w-4 h-4" />
              <span>Request Specialist Consultation</span>
            </Link>
            {department && (
              <Link
                href={`/departments/${department.slug}`}
                className="mc-btn-secondary text-sm !py-2.5 !px-5"
              >
                View {department.nameEn}
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
