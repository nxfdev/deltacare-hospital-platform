import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight } from "lucide-react";
import {
  getPublishedConditionBySlug,
  getPublishedDepartments,
  getPublishedDoctors,
} from "@/server/services/publicQueryService";
import { getServerLocale } from "@/lib/i18n/server";
import { getTechnologyForDepartment } from "@/lib/medicalTechnology";
import { TechnologyShowcase } from "@/components/ui/TechnologyShowcase";
import { Reveal } from "@/components/ui/Reveal";
import { toBnDigits } from "@/lib/i18n/digits";

export const dynamic = "force-dynamic";

export default async function DiseaseDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const condition = getPublishedConditionBySlug(slug);
  if (!condition) notFound();

  const locale = await getServerLocale();
  const bn = locale === "bn";
  const L = (en?: string, b?: string) => (bn ? b || en : en) || "";

  const department = getPublishedDepartments().find((d) => d.id === condition.departmentId);
  const doctors = getPublishedDoctors({ departmentId: condition.departmentId });
  const tech = getTechnologyForDepartment(condition.departmentId);
  const symptoms = bn ? condition.symptomsBn : condition.symptomsEn;

  const sections: Array<[string, string]> = [
    [bn ? "কারণ ও ঝুঁকি" : "Causes & risk factors", L(condition.causesEn, condition.causesBn)],
    [bn ? "রোগ নির্ণয়" : "How it's diagnosed", L(condition.diagnosisOverviewEn, condition.diagnosisOverviewBn)],
    [bn ? "এভারকেয়ারে চিকিৎসা" : "Care at Evercare", L(condition.careAtEvercareEn, condition.careAtEvercareBn)],
  ];

  return (
    <div className="bg-white">
      <section className="w-full bg-[#012d61] text-white">
        <div className="mc-container max-w-7xl mx-auto px-6 sm:px-10 lg:px-12 py-16 md:py-24">
          <Link
            href="/diseases-conditions"
            className="inline-flex items-center gap-1.5 text-sm text-white/70 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            {bn ? "সকল রোগ ও অবস্থা" : "All diseases & conditions"}
          </Link>
          <h1 className="mc-serif mt-6 text-4xl sm:text-5xl lg:text-6xl font-normal tracking-tight">
            {L(condition.nameEn, condition.nameBn)}
          </h1>
          <p className="mt-5 max-w-3xl text-lg leading-relaxed text-white/80">
            {L(condition.summaryEn, condition.summaryBn)}
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-6">
            <Link
              href={`/appointments?department=${encodeURIComponent(department?.slug ?? condition.departmentId)}`}
              className="mc-btn-primary inline-flex items-center gap-2 !py-3 !px-6"
            >
              {bn ? "বিশেষজ্ঞ দেখান" : "See a specialist"}
              <ArrowRight className="w-4 h-4" />
            </Link>
            {department && (
              <Link href={`/departments/${department.slug}`} className="text-white/80 hover:text-white underline-offset-4 hover:underline">
                {L(department.nameEn, department.nameBn)}
              </Link>
            )}
          </div>
        </div>
      </section>

      <div className="mc-container max-w-7xl mx-auto px-6 sm:px-10 lg:px-12 py-20 space-y-24">
        <section className="grid gap-16 lg:grid-cols-[1fr_1.4fr]">
          <Reveal>
            <h2 className="mc-serif text-3xl text-[#0b1b33]">{bn ? "সাধারণ লক্ষণ" : "Common symptoms"}</h2>
            <ul className="mt-6 divide-y divide-[#eef0f3]">
              {symptoms.map((s) => (
                <li key={s} className="py-4 text-lg text-[#1f2937]">
                  {s}
                </li>
              ))}
            </ul>
          </Reveal>
          <div className="space-y-12">
            {sections.map(([title, body], i) =>
              body ? (
                <Reveal key={title} delay={i * 0.06}>
                  <h2 className="mc-serif text-2xl sm:text-3xl text-[#0b1b33]">{title}</h2>
                  <p className="mt-4 text-lg leading-relaxed text-[#374151]">{body}</p>
                </Reveal>
              ) : null
            )}
            <p className="text-sm text-[#6b7280]">
              {bn
                ? "এই তথ্য শুধুমাত্র সচেতনতার জন্য, চিকিৎসকের পরামর্শের বিকল্প নয়। জরুরি প্রয়োজনে ১০৬৬৬ নম্বরে কল করুন।"
                : "This information is for awareness only and does not replace a consultation. In an emergency, call 10666."}
            </p>
          </div>
        </section>

        <TechnologyShowcase items={tech} locale={locale} />

        {doctors.length > 0 && (
          <section className="space-y-10">
            <Reveal>
              <h2 className="mc-serif text-3xl sm:text-4xl text-[#0b1b33]">
                {bn ? "যে বিশেষজ্ঞরা চিকিৎসা করেন" : "Specialists who treat this"}
              </h2>
            </Reveal>
            <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
              {doctors.map((doc, i) => (
                <Reveal key={doc.id} delay={i * 0.06} as="article" className="group">
                  <Link href={`/doctors/${doc.slug}`} className="flex items-center gap-5">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={doc.imageUrl}
                      alt=""
                      className="w-20 h-20 rounded-full object-cover object-top transition-transform duration-500 group-hover:scale-105"
                    />
                    <div>
                      <h3 className="text-lg font-semibold text-[#0b1b33] group-hover:text-[#0057b8] transition-colors">
                        {L(doc.nameEn, doc.nameBn)}
                      </h3>
                      <p className="text-sm text-[#6b7280]">
                        {bn ? "ফি" : "Fee"} ৳
                        {bn ? toBnDigits(doc.consultationFeeBdt) : doc.consultationFeeBdt}
                      </p>
                    </div>
                  </Link>
                </Reveal>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
