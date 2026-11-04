import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  ShieldAlert,
  Stethoscope,
} from "lucide-react";
import {
  getPublishedConditionBySlug,
  getPublishedDepartments,
  getPublishedDoctors,
} from "@/server/services/publicQueryService";

export const dynamic = "force-dynamic";

export default async function ConditionDetailPage({
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
    <div className="bg-[#f2f2f2] min-h-screen py-12">
      <div className="mc-container space-y-8">
        <div>
          <Link
            href="/diseases-conditions"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#004181] hover:text-[#0057b8] hover:underline"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>All Diseases & Conditions (A–Z)</span>
          </Link>
        </div>

        {/* Article Header */}
        <article className="bg-white rounded-3xl border border-[#d6d6d6] overflow-hidden shadow-sm">
          <div className="bg-[#012d61] text-white p-8 md:p-12 space-y-3">
            <div className="flex flex-wrap items-center gap-3 text-xs text-[#c5e2f9]">
              <span className="px-3 py-1 rounded-full bg-white/15 font-bold uppercase">
                Diseases & Conditions • {condition.firstLetter}
              </span>
              {department && (
                <Link
                  href={`/departments/${department.slug}`}
                  className="underline hover:text-white"
                >
                  {department.nameEn} ({department.nameBn})
                </Link>
              )}
            </div>
            <h1 className="mc-serif text-3xl md:text-5xl text-white">
              {condition.nameEn}
            </h1>
            <p className="text-xl text-[#c5e2f9] font-medium">
              {condition.nameBn}
            </p>
            <div className="pt-2 flex flex-wrap items-center gap-4 text-xs text-[#e8f0f9]">
              <span className="inline-flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-[#c5e2f9]" />
                Clinically Reviewed by: {condition.reviewedByEn} (
                {condition.reviewedByBn})
              </span>
              <span>•</span>
              <span>Last Reviewed: {condition.lastReviewedAt}</span>
            </div>
          </div>

          <div className="p-8 md:p-12 space-y-8">
            {/* Educational Disclaimer Banner */}
            <div className="p-4 rounded-xl bg-[#e8f0f9] border border-[#c5e2f9] flex items-start gap-3 text-xs text-[#004181]">
              <ShieldAlert className="w-5 h-5 text-[#0057b8] shrink-0 mt-0.5" />
              <div>
                <strong>Educational Health Information Notice:</strong> This
                guide provides general, reviewed educational information and does
                not substitute for a clinical consultation. For acute or
                emergency symptoms, call DeltaCare Emergency at{" "}
                <strong>10678</strong> immediately.
              </div>
            </div>

            {/* Overview */}
            <section className="space-y-2">
              <h2 className="mc-serif text-2xl text-[#080808]">
                Overview / সংক্ষিপ্ত বিবরণ
              </h2>
              <p className="text-base text-[#080808] leading-relaxed">
                {condition.summaryEn}
              </p>
              <p className="text-base text-[#424242] leading-relaxed">
                {condition.summaryBn}
              </p>
            </section>

            {/* Symptoms */}
            <section className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-[#d6d6d6]">
              <div>
                <h2 className="mc-serif text-xl text-[#080808] mb-3">
                  Common Symptoms (English)
                </h2>
                <ul className="list-disc list-inside space-y-1.5 text-sm text-[#080808]">
                  {condition.symptomsEn.map((sym) => (
                    <li key={sym}>{sym}</li>
                  ))}
                </ul>
              </div>
              <div>
                <h2 className="mc-serif text-xl text-[#080808] mb-3">
                  সাধারণ লক্ষণসমূহ (বাংলা)
                </h2>
                <ul className="list-disc list-inside space-y-1.5 text-sm text-[#080808]">
                  {condition.symptomsBn.map((sym) => (
                    <li key={sym}>{sym}</li>
                  ))}
                </ul>
              </div>
            </section>

            {/* Causes & Risk Factors */}
            <section className="space-y-2 pt-4 border-t border-[#d6d6d6]">
              <h2 className="mc-serif text-2xl text-[#080808]">
                Causes & Risk Factors / কারণ ও ঝুঁকি
              </h2>
              <p className="text-sm text-[#080808] leading-relaxed">
                {condition.causesEn}
              </p>
              <p className="text-sm text-[#424242] leading-relaxed">
                {condition.causesBn}
              </p>
            </section>

            {/* Diagnosis & Evaluation */}
            <section className="space-y-2 pt-4 border-t border-[#d6d6d6]">
              <h2 className="mc-serif text-2xl text-[#080808]">
                Diagnostic Evaluation / রোগ নির্ণয় পদ্ধতি
              </h2>
              <p className="text-sm text-[#080808] leading-relaxed">
                {condition.diagnosisOverviewEn}
              </p>
              <p className="text-sm text-[#424242] leading-relaxed">
                {condition.diagnosisOverviewBn}
              </p>
            </section>

            {/* Care at DeltaCare */}
            <section className="p-6 rounded-2xl bg-[#f8fafc] border border-[#d6d6d6] space-y-3">
              <h2 className="mc-serif text-2xl text-[#004181] flex items-center gap-2">
                <Stethoscope className="w-6 h-6 text-[#0057b8]" />
                <span>Care at DeltaCare / ডেল্টাকেয়ারে চিকিৎসা সেবা</span>
              </h2>
              <p className="text-sm text-[#080808] leading-relaxed">
                {condition.careAtDeltaCareEn}
              </p>
              <p className="text-sm text-[#424242] leading-relaxed">
                {condition.careAtDeltaCareBn}
              </p>
              <div className="pt-2 flex flex-wrap gap-3">
                <Link
                  href={`/appointments?departmentId=${encodeURIComponent(
                    condition.departmentId
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
                    Visit {department.nameEn}
                  </Link>
                )}
              </div>
            </section>
          </div>
        </article>

        {/* Related Specialists */}
        {relatedDoctors.length > 0 && (
          <section className="space-y-4">
            <h2 className="mc-serif text-2xl text-[#080808]">
              Specialists Treating {condition.nameEn}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {relatedDoctors.map((doc) => (
                <div
                  key={doc.id}
                  className="bg-white rounded-2xl border border-[#d6d6d6] p-5 flex items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-4">
                    <img
                      src={doc.imageUrl}
                      alt={doc.nameEn}
                      className="w-16 h-16 rounded-full object-cover border border-[#0057b8]"
                    />
                    <div>
                      <h3 className="font-bold text-base text-[#080808]">
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
                    href={`/appointments?doctorId=${encodeURIComponent(doc.id)}`}
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
  );
}

