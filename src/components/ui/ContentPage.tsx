import React from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Reveal } from "./Reveal";

export interface ContentSection {
  heading: string;
  body: string | string[];
}

/** Simple editorial page: blue hero, then clean text sections. */
export function ContentPage({
  title,
  intro,
  sections,
  cta,
}: {
  title: string;
  intro?: string;
  sections: ContentSection[];
  cta?: { label: string; href: string };
}) {
  return (
    <div className="bg-white">
      <section className="w-full bg-[#012d61] text-white">
        <div className="mc-container max-w-7xl mx-auto px-6 sm:px-10 lg:px-12 py-16 md:py-24">
          <h1 className="mc-serif text-4xl sm:text-5xl lg:text-6xl font-normal tracking-tight">{title}</h1>
          {intro && <p className="mt-5 max-w-3xl text-lg leading-relaxed text-white/80">{intro}</p>}
          {cta && (
            <Link href={cta.href} className="mc-btn-primary mt-8 inline-flex items-center gap-2 !py-3 !px-6">
              {cta.label}
              <ArrowRight className="w-4 h-4" />
            </Link>
          )}
        </div>
      </section>
      <div className="mc-container max-w-4xl mx-auto px-6 sm:px-10 py-20 space-y-14">
        {sections.map((s, i) => (
          <Reveal key={s.heading} delay={Math.min(i, 3) * 0.05}>
            <h2 className="mc-serif text-2xl sm:text-3xl text-[#0b1b33]">{s.heading}</h2>
            {(Array.isArray(s.body) ? s.body : [s.body]).map((p, j) => (
              <p key={j} className="mt-4 text-lg leading-relaxed text-[#374151]">
                {p}
              </p>
            ))}
          </Reveal>
        ))}
      </div>
    </div>
  );
}
