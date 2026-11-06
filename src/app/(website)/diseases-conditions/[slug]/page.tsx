import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle2,
  Calendar,
  Stethoscope,
  ShieldAlert,
} from "lucide-react";
import {
  getPublishedConditionBySlug,
  getPublishedDepartments,
  getPublishedDoctors,
} from "@/server/services/publicQueryService";

export const dynamic = "force-dynamic";

export default async function DiseaseDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const condition = getPublishedConditionBySlug(slug);
  if (!condition) {
    notFound();
  }

  const departments = getPublishedDepartments();
  const department = departments.find((d) => d.id === condition.departmentId);
  const relatedDoctors = getPublishedDoctors({
    departmentId: condition.departmentId,
  });

  return (
    <div className="min-h-screen bg-white">
      {/* Full-bleed Stretched Dark Blue Hero Header */}
      <div className="w-full bg-[#012d61] text-white py-14 md:py-20 border-b border-[#001f44]">
        <div className="mc-container max-w-7xl mx-auto px-6 sm:px-10 lg:px-12 space-y-4">
          <Link
            href="/diseases-conditions"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#93c5fd] hover:underline mb-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>All Diseases &amp; Conditions (A–Z)</span>
          </Link>
          <div className="flex flex-wrap items-center gap-3 text-xs uppercase tracking-wider text-[#93c5fd]">
            <span>Diseases &amp; Conditions • Letter {condition.firstLetter}</span>
            {department && (
              <>
                <span>•</span>
                <Link
                  href={`/departments/${department.slug}`}
                  className="underline hover:text-white"
                >
                  {department.nameEn} ({department.nameBn})
                </Link>
              </>
            )}
          </div>
          <h1 className="mc-serif text-3xl sm:text-5xl lg:text-[54px] font-bold text-white tracking-tight leading-tight">
            {condition.nameEn}
          </h1>
          <p className="text-xl text-[#c5e2f9] font-medium">{condition.nameBn}</p>
          <div className="pt-2 flex flex-wrap items-center gap-4 text-xs sm:text-sm text-[#e8f0f9]">
            <span className="inline-flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-[#93c5fd]" />
              Clinically Reviewed by: {condition.reviewedByEn} ({condition.reviewedByBn})
            </span>
            <span>•</span>
            <span>Last Reviewed: {condition.lastReviewedAt}</span>
          </div>
        </div>
      </div>

      {/* Main Body - Unboxed Editorial */}
      <div className="w-full py-12 md:py-16">
        <div className="mc-container max-w-7xl mx-auto px-6 sm:px-10 lg:px-12 space-y-12">
          {/* Notice Bar */}
          <div className="p-4 border-l-4 border-[#0057b8] bg-[#f0f9ff] text-sm text-[#0369a1] flex items-start gap-3">
            <ShieldAlert className="w-5 h-5 text-[#0057b8] shrink-0 mt-0.5" />
            <div>
              <strong>Educational Health Information Notice:</strong> This guide
              provides general, reviewed educational information and does not
              substitute for a clinical consultation. For acute or emergency
              symptoms, call DeltaCare Emergency at <strong>10678</strong> immediately.
            </div>
          </div>

          {/* Overview */}
          <section className="space-y-3 pb-8 border-b border-[#e5e7eb]">
            <h2 className="mc-serif text-2xl md:text-3xl text-[#080808]">
              Overview / সংক্ষিপ্ত বিবরণ
            </h2>
            <p className="text-base sm:text-lg text-[#080808] leading-relaxed">
              {condition.summaryEn}
            </p>
            <p className="text-base text-[#4b5563] leading-relaxed">
              {condition.summaryBn}
            </p>
          </section>

          {/* Symptoms */}
          <section className="grid grid-cols-1 md:grid-cols-2 gap-8 pb-8 border-b border-[#e5e7eb]">
            <div>
              <h2 className="mc-serif text-2xl text-[#080808] mb-3">
                Common Symptoms (English)
              </h2>
              <ul className="list-disc list-inside space-y-2 text-base text-[#374151]">
                {condition.symptomsEn.map((sym) => (
                  <li key={sym}>{sym}</li>
                ))}
              </ul>
            </div>
            <div>
              <h2 className="mc-serif text-2xl text-[#080808] mb-3">
                সাধারণ লক্ষণসমূহ (বাংলা)
              </h2>
              <ul className="list-disc list-inside space-y-2 text-base text-[#374151]">
                {condition.symptomsBn.map((sym) => (
                  <li key={sym}>{sym}</li>
                ))}
              </ul>
            </div>
          </section>

          {/* Causes & Risk Factors */}
          <section className="space-y-3 pb-8 border-b border-[#e5e7eb]">
            <h2 className="mc-serif text-2xl md:text-3xl text-[#080808]">
              Causes &amp; Risk Factors / কারণ ও ঝুঁকি
            </h2>
            <p className="text-base text-[#374151] leading-relaxed">
              {condition.causesEn}
            </p>
            <p className="text-sm text-[#6b7280] leading-relaxed">
              {condition.causesBn}
            </p>
          </section>

          {/* Diagnosis & Evaluation */}
          <section className="space-y-3 pb-8 border-b border-[#e5e7eb]">
            <h2 className="mc-serif text-2xl md:text-3xl text-[#080808]">
              Diagnostic Evaluation / রোগ নির্ণয় পদ্ধতি
            </h2>
            <p className="text-base text-[#374151] leading-relaxed">
              {condition.diagnosisOverviewEn}
            </p>
            <p className="text-sm text-[#6b7280] leading-relaxed">
              {condition.diagnosisOverviewBn}
            </p>
          </section>

          {/* Care at DeltaCare */}
          <section className="p-8 border border-[#e5e7eb] space-y-4">
            <h2 className="mc-serif text-2xl md:text-3xl text-[#004181] flex items-center gap-2">
              <Stethoscope className="w-6 h-6 text-[#0057b8]" />
              <span>Care at DeltaCare / ডেল্টাকেয়ারে চিকিৎসা সেবা</span>
            </h2>
            <p className="text-base text-[#080808] leading-relaxed">
              {condition.careAtDeltaCareEn}
            </p>
            <p className="text-sm text-[#4b5563] leading-relaxed">
              {condition.careAtDeltaCareBn}
            </p>
            <div className="pt-2 flex flex-wrap gap-4">
              <Link
                href={`/request-appointment?departmentId=${encodeURIComponent(
                  condition.departmentId
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
                  Visit {department.nameEn}
                </Link>
              )}
            </div>
          </section>

          {/* Related Specialists */}
          {relatedDoctors.length > 0 && (
            <section className="space-y-6 pt-4">
              <div className="pb-4 border-b-2 border-[#080808]">
                <h2 className="mc-serif text-3xl text-[#080808]">
                  Specialists Treating {condition.nameEn}
                </h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {relatedDoctors.map((doc) => (
                  <div
                    key={doc.id}
                    className="pb-6 border-b border-[#e5e7eb] flex items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-4">
                      <img
                        src={doc.imageUrl}
                        alt={doc.nameEn}
                        className="w-16 h-16 rounded-full object-cover border border-[#0057b8] shrink-0"
                      />
                      <div>
                        <h3 className="font-bold text-lg text-[#080808]">
                          <Link
                            href={`/doctors/${doc.slug}`}
                            className="hover:text-[#0057b8] hover:underline"
                          >
                            {doc.nameEn}
                          </Link>
                        </h3>
                        <p className="text-xs text-[#004181]">
                          {doc.designationEn} • BMDC {doc.bmdcRegistrationNo}
                        </p>
                        <p className="text-xs font-semibold text-[#080808] mt-1">
                          Consultation Fee: BDT {doc.consultationFeeBdt}
                        </p>
                      </div>
                    </div>
                    <Link
                      href={`/request-appointment?doctorId=${encodeURIComponent(doc.id)}`}
                      className="mc-btn-primary !py-2 !px-4 text-xs shrink-0"
                    >
                      Book
                    </Link>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
