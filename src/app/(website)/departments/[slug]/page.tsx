import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, ChevronRight } from "lucide-react";
import {
  getPublishedConditions,
  getPublishedDepartmentBySlug,
  getPublishedDoctors,
  getPublishedProcedures,
  getPublishedServices,
} from "@/server/services/publicQueryService";
import { getServerLocale } from "@/lib/i18n/server";
import { getTechnologyForDepartment } from "@/lib/medicalTechnology";
import { TechnologyShowcase } from "@/components/ui/TechnologyShowcase";
import { Reveal } from "@/components/ui/Reveal";
import { toBnDigits } from "@/lib/i18n/digits";

export const dynamic = "force-dynamic";

export default async function DepartmentDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const dept = getPublishedDepartmentBySlug(slug);
  if (!dept) notFound();

  const locale = await getServerLocale();
  const bn = locale === "bn";
  const L = (en?: string, b?: string) => (bn ? b || en : en) || "";
  const n = (v: number) => (bn ? toBnDigits(v.toLocaleString("en-IN")) : v.toLocaleString("en-IN"));

  const doctors = getPublishedDoctors({ departmentId: dept.id });
  const services = getPublishedServices(dept.id);
  const conditions = getPublishedConditions({ departmentId: dept.id });
  const procedures = getPublishedProcedures(dept.id);
  const tech = getTechnologyForDepartment(dept.id);
  const servicesList = (bn ? dept.servicesBn : dept.servicesEn) ?? [];

  return (
    <div className="bg-white">
      <section className="w-full bg-[#012d61] text-white">
        <div className="mc-container max-w-7xl mx-auto px-6 sm:px-10 lg:px-12 py-16 md:py-24">
          <Link
            href="/departments"
            className="inline-flex items-center gap-1.5 text-sm text-white/70 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            {bn ? "সকল বিভাগ" : "All departments"}
          </Link>
          <h1 className="mc-serif mt-6 text-4xl sm:text-5xl lg:text-6xl font-normal tracking-tight">
            {L(dept.nameEn, dept.nameBn)}
          </h1>
          <p className="mt-5 max-w-3xl text-lg leading-relaxed text-white/80">
            {L(dept.overviewEn, dept.overviewBn)}
          </p>
          <Link
            href={`/appointments?department=${encodeURIComponent(dept.slug)}`}
            className="mc-btn-primary mt-8 inline-flex items-center gap-2 !py-3 !px-6"
          >
            {bn ? "অ্যাপয়েন্টমেন্ট নিন" : "Book an appointment"}
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      <div className="mc-container max-w-7xl mx-auto px-6 sm:px-10 lg:px-12 py-20 space-y-24">
        {doctors.length > 0 && (
          <section className="space-y-10">
            <Reveal>
              <h2 className="mc-serif text-3xl sm:text-4xl text-[#0b1b33]">
                {bn ? "আমাদের বিশেষজ্ঞ চিকিৎসক" : "Our specialists"}
              </h2>
            </Reveal>
            <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
              {doctors.map((doc, i) => (
                <Reveal key={doc.id} delay={i * 0.06} as="article" className="group">
                  <Link href={`/doctors/${doc.slug}`} className="block">
                    <div className="overflow-hidden bg-[#eef2f6] aspect-[4/5]">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={doc.imageUrl}
                        alt={L(doc.nameEn, doc.nameBn)}
                        className="h-full w-full object-cover object-top transition-transform duration-700 group-hover:scale-105"
                      />
                    </div>
                    <h3 className="mt-5 text-xl font-semibold text-[#0b1b33] group-hover:text-[#0057b8] transition-colors">
                      {L(doc.nameEn, doc.nameBn)}
                    </h3>
                    <p className="mt-1 text-[#4b5563]">{L(doc.designationEn, doc.designationBn)}</p>
                    <p className="mt-2 text-sm text-[#6b7280]">
                      {bn ? "কনসালটেশন ফি" : "Consultation"} ৳{n(doc.consultationFeeBdt)}
                    </p>
                  </Link>
                </Reveal>
              ))}
            </div>
          </section>
        )}

        <TechnologyShowcase items={tech} locale={locale} />

        {(servicesList.length > 0 || conditions.length > 0) && (
          <section className="grid gap-16 md:grid-cols-2">
            {servicesList.length > 0 && (
              <Reveal>
                <h2 className="mc-serif text-2xl sm:text-3xl text-[#0b1b33]">
                  {bn ? "বিশেষায়িত সেবা" : "Specialised services"}
                </h2>
                <ul className="mt-6 divide-y divide-[#eef0f3]">
                  {servicesList.map((item) => (
                    <li key={item} className="py-4 text-lg text-[#1f2937]">
                      {item}
                    </li>
                  ))}
                </ul>
              </Reveal>
            )}
            {conditions.length > 0 && (
              <Reveal delay={0.08}>
                <h2 className="mc-serif text-2xl sm:text-3xl text-[#0b1b33]">
                  {bn ? "যেসব রোগের চিকিৎসা হয়" : "Conditions we treat"}
                </h2>
                <ul className="mt-6 divide-y divide-[#eef0f3]">
                  {conditions.map((c) => (
                    <li key={c.id}>
                      <Link
                        href={`/diseases-conditions/${c.slug}`}
                        className="group py-4 flex items-center justify-between text-lg text-[#1f2937] hover:text-[#0057b8] transition-colors"
                      >
                        {L(c.nameEn, c.nameBn)}
                        <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                      </Link>
                    </li>
                  ))}
                </ul>
              </Reveal>
            )}
          </section>
        )}

        {(services.length > 0 || procedures.length > 0) && (
          <section className="grid gap-16 md:grid-cols-2">
            {services.length > 0 && (
              <Reveal>
                <h2 className="mc-serif text-2xl sm:text-3xl text-[#0b1b33]">
                  {bn ? "সেবা ও ফি" : "Services & fees"}
                </h2>
                <ul className="mt-6 divide-y divide-[#eef0f3]">
                  {services.map((srv) => (
                    <li key={srv.id} className="py-4 flex items-start justify-between gap-6">
                      <div>
                        <p className="text-lg text-[#1f2937]">{L(srv.nameEn, srv.nameBn)}</p>
                        <p className="mt-1 text-sm text-[#6b7280]">{L(srv.descriptionEn, srv.descriptionBn)}</p>
                      </div>
                      <span className="shrink-0 font-semibold text-[#0b1b33]">
                        {L(srv.feeLabelEn, srv.feeLabelBn)}
                      </span>
                    </li>
                  ))}
                </ul>
              </Reveal>
            )}
            {procedures.length > 0 && (
              <Reveal delay={0.08}>
                <h2 className="mc-serif text-2xl sm:text-3xl text-[#0b1b33]">
                  {bn ? "পরীক্ষা ও প্রসিডিউর" : "Tests & procedures"}
                </h2>
                <ul className="mt-6 divide-y divide-[#eef0f3]">
                  {procedures.map((p) => (
                    <li key={p.id}>
                      <Link
                        href={`/tests-procedures/${p.slug}`}
                        className="group py-4 flex items-center justify-between text-lg text-[#1f2937] hover:text-[#0057b8] transition-colors"
                      >
                        {L(p.nameEn, p.nameBn)}
                        <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                      </Link>
                    </li>
                  ))}
                </ul>
              </Reveal>
            )}
          </section>
        )}
      </div>
    </div>
  );
}
