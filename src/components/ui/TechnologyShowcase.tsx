import React from "react";
import type { Locale } from "@/types/domain";
import type { MedicalTechnology } from "@/lib/medicalTechnology";
import { Reveal } from "./Reveal";

export function TechnologyShowcase({
  items,
  locale,
}: {
  items: MedicalTechnology[];
  locale: Locale;
}) {
  if (!items.length) return null;
  const bn = locale === "bn";
  return (
    <section className="space-y-10">
      <Reveal>
        <h2 className="mc-serif text-3xl sm:text-4xl text-[#0b1b33]">
          {bn ? "চিকিৎসা প্রযুক্তি ও রোগনির্ণয় যন্ত্রপাতি" : "Medical Technology & Diagnostic Equipment"}
        </h2>
        <p className="mt-3 max-w-2xl text-lg text-[#4b5563]">
          {bn
            ? "নির্ভুল রোগনির্ণয় ও নিরাপদ চিকিৎসার জন্য আমাদের ব্যবহৃত আধুনিক যন্ত্রপাতি।"
            : "The equipment our specialists rely on for accurate diagnosis and safer treatment."}
        </p>
      </Reveal>
      <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((tech, i) => (
          <Reveal key={tech.id} delay={i * 0.08} as="article" className="group">
            <div className="overflow-hidden bg-[#eef2f6] aspect-[4/3]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={tech.imageUrl}
                alt={bn ? tech.nameBn : tech.nameEn}
                loading="lazy"
                referrerPolicy="no-referrer"
                className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
              />
            </div>
            <h3 className="mt-5 text-xl font-semibold text-[#0b1b33] transition-colors group-hover:text-[#0057b8]">
              {bn ? tech.nameBn : tech.nameEn}
            </h3>
            <p className="mt-2 text-base leading-relaxed text-[#4b5563]">
              {bn ? tech.descriptionBn : tech.descriptionEn}
            </p>
            <p className="mt-2 text-xs text-[#9ca3af]">{tech.credit}</p>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
