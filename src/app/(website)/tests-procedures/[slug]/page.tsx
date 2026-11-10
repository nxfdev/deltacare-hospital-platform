import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { getPublishedDepartments, getPublishedProcedureBySlug } from "@/server/services/publicQueryService";
import { getServerLocale } from "@/lib/i18n/server";
import { getTechnologyForDepartment } from "@/lib/medicalTechnology";
import { TechnologyShowcase } from "@/components/ui/TechnologyShowcase";
import { Reveal } from "@/components/ui/Reveal";
import { toBnDigits } from "@/lib/i18n/digits";

export const dynamic = "force-dynamic";

export default async function ProcedureDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const proc = getPublishedProcedureBySlug(slug);
  if (!proc) notFound();

  const locale = await getServerLocale();
  const bn = locale === "bn";
  const department = getPublishedDepartments().find((d) => d.id === proc.departmentId);

  const blocks: Array<[string, string]> = [
    [bn ? "প্রস্তুতি" : "How to prepare", bn ? proc.preparationBn : proc.preparationEn],
    [bn ? "পরীক্ষার সময় যা হবে" : "What to expect", bn ? proc.whatToExpectBn : proc.whatToExpectEn],
  ];

  return (
    <div className="bg-white">
      <section className="w-full bg-[#012d61] text-white">
        <div className="mc-container max-w-7xl mx-auto px-6 sm:px-10 lg:px-12 py-16 md:py-24">
          <Link href="/tests-procedures" className="inline-flex items-center gap-1.5 text-sm text-white/70 hover:text-white">
            <ArrowLeft className="w-4 h-4" />
            {bn ? "সকল পরীক্ষা" : "All tests & procedures"}
          </Link>
          <h1 className="mc-serif mt-6 text-4xl sm:text-5xl lg:text-6xl font-normal tracking-tight">
            {bn ? proc.nameBn : proc.nameEn}
          </h1>
          <p className="mt-5 max-w-3xl text-lg leading-relaxed text-white/80">{bn ? proc.summaryBn : proc.summaryEn}</p>
          {proc.feeBdt ? (
            <p className="mt-6 text-2xl font-semibold">
              ৳{bn ? toBnDigits(proc.feeBdt.toLocaleString("en-IN")) : proc.feeBdt.toLocaleString("en-IN")}
            </p>
          ) : null}
          <Link
            href={`/appointments${department ? `?department=${department.slug}` : ""}`}
            className="mc-btn-primary mt-8 inline-flex items-center gap-2 !py-3 !px-6"
          >
            {bn ? "অ্যাপয়েন্টমেন্ট নিন" : "Book an appointment"}
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      <div className="mc-container max-w-7xl mx-auto px-6 sm:px-10 lg:px-12 py-20 space-y-24">
        <div className="grid gap-16 md:grid-cols-2">
          {blocks.map(([t, b], i) =>
            b ? (
              <Reveal key={t} delay={i * 0.06}>
                <h2 className="mc-serif text-2xl sm:text-3xl text-[#0b1b33]">{t}</h2>
                <p className="mt-4 text-lg leading-relaxed text-[#374151]">{b}</p>
              </Reveal>
            ) : null
          )}
        </div>
        <TechnologyShowcase items={getTechnologyForDepartment(proc.departmentId)} locale={locale} />
      </div>
    </div>
  );
}
