import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, ExternalLink } from "lucide-react";
import {
  getPublishedBranchBySlug,
  getPublishedDepartments,
  getPublishedDoctors,
} from "@/server/services/publicQueryService";
import { getServerLocale } from "@/lib/i18n/server";
import { Reveal } from "@/components/ui/Reveal";

export const dynamic = "force-dynamic";

export default async function LocationDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const branch = getPublishedBranchBySlug(slug);
  if (!branch) notFound();

  const bn = (await getServerLocale()) === "bn";
  const L = (en?: string, b?: string) => (bn ? b || en : en) || "";
  const doctors = getPublishedDoctors({ branchId: branch.id });
  const departments = getPublishedDepartments(branch.id);
  const services = bn ? branch.servicesSummaryBn : branch.servicesSummaryEn;

  return (
    <div className="bg-white">
      <section className="w-full bg-[#012d61] text-white">
        <div className="mc-container max-w-7xl mx-auto px-6 sm:px-10 lg:px-12 py-16 md:py-24">
          <Link href="/locations" className="inline-flex items-center gap-1.5 text-sm text-white/70 hover:text-white">
            <ArrowLeft className="w-4 h-4" />
            {bn ? "সকল শাখা" : "All locations"}
          </Link>
          <h1 className="mc-serif mt-6 text-4xl sm:text-5xl lg:text-6xl font-normal tracking-tight">
            {L(branch.nameEn, branch.nameBn)}
          </h1>
          <p className="mt-4 text-lg text-white/80">{L(branch.subtitleEn, branch.subtitleBn)}</p>
          <div className="mt-8 flex flex-wrap items-center gap-6">
            <Link
              href={`/appointments?branch=${encodeURIComponent(branch.slug)}`}
              className="mc-btn-primary inline-flex items-center gap-2 !py-3 !px-6"
            >
              {bn ? "অ্যাপয়েন্টমেন্ট নিন" : "Book an appointment"}
              <ArrowRight className="w-4 h-4" />
            </Link>
            <a
              href={branch.directionsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-white/80 hover:text-white"
            >
              {bn ? "দিকনির্দেশনা" : "Directions"} <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </div>
      </section>

      <div className="mc-container max-w-7xl mx-auto px-6 sm:px-10 lg:px-12 py-20 space-y-24">
        <section className="grid gap-12 lg:grid-cols-2 items-start">
          <Reveal className="aspect-[4/3] overflow-hidden bg-[#eef2f6]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={branch.imageUrl} alt={L(branch.nameEn, branch.nameBn)} className="h-full w-full object-cover" />
          </Reveal>
          <Reveal delay={0.08} className="space-y-8">
            {[
              [bn ? "ঠিকানা" : "Address", L(branch.addressEn, branch.addressBn)],
              [bn ? "সময়" : "Hours", L(branch.operatingHoursEn, branch.operatingHoursBn)],
              [bn ? "ফোন" : "Phone", branch.phone],
              [bn ? "জরুরি" : "Emergency", branch.emergencyPhone],
            ].map(([k, v]) => (
              <div key={k}>
                <p className="text-sm text-[#6b7280]">{k}</p>
                <p className="mt-1 text-lg text-[#0b1b33]">{v}</p>
              </div>
            ))}
            {services.length > 0 && (
              <div>
                <p className="text-sm text-[#6b7280]">{bn ? "সেবাসমূহ" : "Services"}</p>
                <ul className="mt-2 grid sm:grid-cols-2 gap-x-8">
                  {services.map((s) => (
                    <li key={s} className="py-2 border-b border-[#eef0f3] text-[#374151]">
                      {s}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </Reveal>
        </section>

        {doctors.length > 0 && (
          <section className="space-y-10">
            <Reveal>
              <h2 className="mc-serif text-3xl sm:text-4xl text-[#0b1b33]">
                {bn ? "এই শাখার বিশেষজ্ঞ" : "Specialists at this branch"}
              </h2>
            </Reveal>
            <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
              {doctors.map((doc, i) => (
                <Reveal key={doc.id} delay={(i % 3) * 0.06} className="group">
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
                      <p className="text-sm text-[#6b7280]">{L(doc.designationEn, doc.designationBn)}</p>
                    </div>
                  </Link>
                </Reveal>
              ))}
            </div>
          </section>
        )}

        {departments.length > 0 && (
          <section>
            <Reveal>
              <h2 className="mc-serif text-3xl text-[#0b1b33]">{bn ? "বিভাগসমূহ" : "Departments"}</h2>
            </Reveal>
            <div className="mt-6 grid gap-x-12 sm:grid-cols-2 lg:grid-cols-3">
              {departments.map((d) => (
                <Link
                  key={d.id}
                  href={`/departments/${d.slug}`}
                  className="group flex items-center justify-between py-4 border-b border-[#eef0f3] text-lg text-[#1f2937] hover:text-[#0057b8]"
                >
                  {L(d.nameEn, d.nameBn)}
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
