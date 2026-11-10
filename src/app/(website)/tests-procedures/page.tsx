import React from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { getPublishedProcedures, getPublishedServices } from "@/server/services/publicQueryService";
import { getServerLocale } from "@/lib/i18n/server";
import { Reveal } from "@/components/ui/Reveal";

export const dynamic = "force-dynamic";

export default async function TestsProceduresPage() {
  const bn = (await getServerLocale()) === "bn";
  const procedures = getPublishedProcedures();
  const services = getPublishedServices();

  return (
    <div className="bg-white">
      <section className="w-full bg-[#012d61] text-white">
        <div className="mc-container max-w-7xl mx-auto px-6 sm:px-10 lg:px-12 py-16 md:py-24">
          <h1 className="mc-serif text-4xl sm:text-5xl lg:text-6xl font-normal tracking-tight">
            {bn ? "পরীক্ষা ও প্রসিডিউর" : "Tests & procedures"}
          </h1>
          <p className="mt-5 max-w-2xl text-lg text-white/80">
            {bn
              ? "পরীক্ষার আগে কী প্রস্তুতি নিতে হবে, পরীক্ষার সময় কী হয় এবং খরচ কত — সহজ ভাষায়।"
              : "How to prepare, what to expect and what it costs — explained simply."}
          </p>
        </div>
      </section>

      <div className="mc-container max-w-7xl mx-auto px-6 sm:px-10 lg:px-12 py-20 space-y-24">
        <div className="grid gap-x-16 md:grid-cols-2">
          {procedures.map((p, i) => (
            <Reveal key={p.id} delay={(i % 2) * 0.05}>
              <Link href={`/tests-procedures/${p.slug}`} className="group flex items-start justify-between gap-6 py-8 border-b border-[#eef0f3]">
                <div>
                  <p className="text-sm text-[#6b7280]">{bn ? p.categoryBn : p.categoryEn}</p>
                  <h2 className="mc-serif mt-1 text-2xl text-[#0b1b33] group-hover:text-[#0057b8] transition-colors">
                    {bn ? p.nameBn : p.nameEn}
                  </h2>
                  <p className="mt-2 text-[#4b5563] line-clamp-2">{bn ? p.summaryBn : p.summaryEn}</p>
                </div>
                <ArrowRight className="mt-2 w-5 h-5 shrink-0 text-[#9ca3af] transition-all group-hover:text-[#0057b8] group-hover:translate-x-1" />
              </Link>
            </Reveal>
          ))}
        </div>

        {services.length > 0 && (
          <section>
            <Reveal>
              <h2 className="mc-serif text-3xl sm:text-4xl text-[#0b1b33]">{bn ? "ফি তালিকা" : "Fee list"}</h2>
            </Reveal>
            <ul className="mt-8 divide-y divide-[#eef0f3]">
              {services.map((s) => (
                <li key={s.id} className="py-5 flex items-start justify-between gap-6">
                  <div>
                    <p className="text-lg text-[#0b1b33]">{bn ? s.nameBn : s.nameEn}</p>
                    {(bn ? s.preparationBn : s.preparationEn) && (
                      <p className="mt-1 text-[#6b7280]">{bn ? s.preparationBn : s.preparationEn}</p>
                    )}
                  </div>
                  <span className="shrink-0 text-lg font-semibold text-[#0b1b33]">{bn ? s.feeLabelBn : s.feeLabelEn}</span>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </div>
  );
}
