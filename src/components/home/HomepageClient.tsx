"use client";

import React from "react";
import Link from "next/link";
import {
  ChevronRight,
  MapPin,
  Phone,
  ShieldCheck,
} from "lucide-react";
import {
  Branch,
  Department,
  DiseaseCondition,
  Doctor,
} from "@/types/domain";
import { useLocale } from "@/lib/i18n/LocaleContext";
import { AlphabetConditionDirectory } from "@/components/search/AlphabetConditionDirectory";

export function HomepageClient({
  branches,
  departments,
  doctors,
  conditions,
}: {
  branches: Branch[];
  departments: Department[];
  doctors: Doctor[];
  conditions: DiseaseCondition[];
}) {
  const { locale, t } = useLocale();

  const featuredConditions = conditions.filter((c) => c.isFeaturedCareArea);

  return (
    <div>
      {/* ====================================================================
          SECTION 2: HERO SECTION (Mirrors inspo.html .cmp-ViewportHero)
          - Full-bleed dark gradient overlay + 76px display serif headline
          - Primary & Secondary CTAs
         ==================================================================== */}
      <section
        aria-label="Hero Banner"
        className="relative overflow-hidden bg-[#012d61] text-white min-h-[540px] md:min-h-[640px] flex items-end"
      >
        {/* Background Visual Layer - Hospital Surgical Team */}
        <div className="absolute inset-0 overflow-hidden">
          <img
            src="/images/hero-surgery.jpg"
            alt="Advanced surgical and specialist medical team performing operation at DeltaCare"
            className="w-full h-full object-cover object-[center_35%] opacity-60 scale-105 transition-transform duration-1000 ease-out"
          />
          {/* Multi-layered cinematic gradient: deep navy on the left/bottom to guarantee WCAG AAA text contrast, translucent on the right to showcase the surgical team & theater lighting */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#012d61] via-[#012d61]/85 to-[#012d61]/40" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#012d61] via-transparent to-[#012d61]/40" />
        </div>

        {/* Hero Content Container */}
        <div className="mc-container relative z-10 py-14 md:py-20 w-full">
          <div className="max-w-3xl space-y-6">
            <p className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/15 border border-white/30 text-xs uppercase tracking-widest font-semibold text-[#e8f0f9]">
              <ShieldCheck className="w-4 h-4 text-[#c5e2f9]" />
              <span>{t.brand.tagline}</span>
            </p>

            <h1 className="mc-hero-headline text-white">{t.hero.headline}</h1>

            <p className="text-lg md:text-xl text-[#e8f0f9] leading-relaxed max-w-2xl text-justify">
              {t.hero.subheadline}
            </p>

            {/* Hero CTA Cluster */}
            <div className="pt-2 flex flex-wrap items-center gap-4">
              <Link
                href="/request-appointment"
                className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-full bg-[#0057b8] hover:bg-[#004181] active:bg-[#002d61] text-white font-bold text-base shadow-lg hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-white/40 transition-all duration-200"
              >
                <span>{locale === "bn" ? "অ্যাপয়েন্টমেন্ট অনুরোধ করুন" : "Request Appointment"}</span>
                <ChevronRight className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ====================================================================
          SECTION 3: GLOBAL SEARCH & ALPHABETICAL DISEASES DIRECTORY (A–Z, #)
          - Minimal white background, enlarged, crisp typography
          - 27 circular A–Z & # buttons + live autocomplete Global Search
         ==================================================================== */}
      <AlphabetConditionDirectory conditions={conditions} />

      {/* ====================================================================
          SECTION 4: HEALTH STORIES & CLINICAL APPROACH
          - Story Split Cards ("Healing starts here" & "World-class care")
         ==================================================================== */}
      <section className="bg-white py-16 md:py-20 border-b border-[#d6d6d6] space-y-20">
        <div className="mc-container space-y-20">
          {/* Story Split Block 1: "Healing starts here" (Text Left, Image Right) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            <div className="lg:col-span-6 space-y-5">
              <h2 className="mc-serif text-3xl md:text-[40px] leading-tight text-[#080808]">
                {t.storySections.story1Title}
              </h2>

              <div className="space-y-2">
                <h3 className="text-lg font-bold text-[#080808]">
                  {t.storySections.story1Sub1Title}
                </h3>
                <p className="text-base text-[#424242] leading-relaxed">
                  {t.storySections.story1Sub1Body}
                </p>
              </div>

              <div className="space-y-2">
                <h3 className="text-lg font-bold text-[#080808]">
                  {t.storySections.story1Sub2Title}
                </h3>
                <p className="text-base text-[#424242] leading-relaxed">
                  {t.storySections.story1Sub2Body}{" "}
                  <Link
                    href="/departments"
                    className="text-[#004181] font-semibold underline hover:text-[#0057b8]"
                  >
                    {t.storySections.story1Link}
                  </Link>
                </p>
              </div>

              <div className="pt-2">
                <Link href="/about" className="mc-btn-secondary">
                  <span>{t.storySections.story1Cta}</span>
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            </div>

            <div className="lg:col-span-6">
              <div className="rounded-2xl overflow-hidden border border-[#d6d6d6] shadow-md">
                <img
                  src="/images/healing-starts-here.jpg"
                  alt={t.storySections.story1Title}
                  className="w-full max-h-[480px] object-cover"
                />
              </div>
            </div>
          </div>

          {/* Story Split Block 2: "World-class care" (Image Left, Text Right on Desktop) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            <div className="lg:col-span-6 order-2 lg:order-1">
              <div className="rounded-2xl overflow-hidden border border-[#d6d6d6] shadow-md">
                <img
                  src="/images/world-class-care.jpg"
                  alt={t.storySections.story2Title}
                  className="w-full max-h-[480px] object-cover"
                />
              </div>
            </div>

            <div className="lg:col-span-6 order-1 lg:order-2 space-y-5">
              <h2 className="mc-serif text-3xl md:text-[40px] leading-tight text-[#080808]">
                {t.storySections.story2Title}
              </h2>
              <p className="text-base text-[#424242] leading-relaxed">
                {t.storySections.story2Body}
              </p>
              <div className="pt-2">
                <Link href="/international" className="mc-btn-secondary">
                  <span>{t.storySections.story2Cta}</span>
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ====================================================================
          SECTION 5: FEATURED CARE AREAS
          - 12-column layout (4-col intro + 8-col 2-column list of chevron links)
          - Mirrors inspo.html .cmp-link-list--featured-care
         ==================================================================== */}
      <section
        aria-labelledby="featured-care-heading"
        className="bg-[#f2f2f2] py-16 md:py-20 border-b border-[#d6d6d6]"
      >
        <div className="mc-container">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
            {/* Left 4 Columns: Title & Description */}
            <div className="lg:col-span-4 space-y-4">
              <h2
                id="featured-care-heading"
                className="mc-serif text-3xl md:text-[40px] leading-tight text-[#080808]"
              >
                {t.featuredCareSection.title}
              </h2>
              <p className="text-base text-[#686868] leading-relaxed">
                {t.featuredCareSection.description}
              </p>
              <div className="pt-2">
                <Link
                  href="/departments"
                  className="inline-flex items-center gap-1.5 font-semibold text-[#004181] hover:text-[#0057b8] underline"
                >
                  <span>{t.featuredCareSection.viewAllLink}</span>
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            </div>

            {/* Right 8 Columns: 2-Column List of Chevron Links with Hairline Dividers */}
            <div className="lg:col-span-8 bg-white rounded-2xl border border-[#d6d6d6] p-6 md:p-8">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8">
                {featuredConditions.map((item) => (
                  <Link
                    key={item.id}
                    href={`/diseases-conditions/${item.slug}`}
                    className="group flex items-center justify-between py-4 border-b border-[#d6d6d6] text-[#004181] hover:text-[#0057b8] font-semibold transition-colors"
                  >
                    <span>{locale === "bn" ? item.nameBn : item.nameEn}</span>
                    <ChevronRight className="w-5 h-5 text-[#0057b8] shrink-0 group-hover:translate-x-1 transition-transform" />
                  </Link>
                ))}
                {departments.slice(0, 4).map((dept) => (
                  <Link
                    key={dept.id}
                    href={`/departments/${dept.slug}`}
                    className="group flex items-center justify-between py-4 border-b border-[#d6d6d6] text-[#004181] hover:text-[#0057b8] font-semibold transition-colors"
                  >
                    <span>{locale === "bn" ? dept.nameBn : dept.nameEn}</span>
                    <ChevronRight className="w-5 h-5 text-[#0057b8] shrink-0 group-hover:translate-x-1 transition-transform" />
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ====================================================================
          SECTION 6: LOCATIONS & HOSPITAL BRANCHES
          - Exact 3-column grid where Col 1 is header/CTA and remaining 5 cards
            flow across the 3-column grid with dark bottom gradient overlays
          - Positioned as the final section of the homepage right before the endbar
         ==================================================================== */}
      <section
        aria-labelledby="locations-section-heading"
        className="bg-white py-16 md:py-20"
      >
        <div className="mc-container">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Grid Item 1: Header & CTA Block (Mirrors inspo.html .cmp-locations-intro) */}
            <div className="flex flex-col justify-center pr-4 py-4 space-y-5">
              <h2
                id="locations-section-heading"
                className="mc-serif text-3xl md:text-[40px] leading-tight text-[#080808]"
              >
                {t.locationsSection.title}
              </h2>
              <p className="text-base text-[#686868] leading-relaxed">
                {t.locationsSection.description}
              </p>
              <div>
                <Link href="/locations" className="mc-btn-secondary">
                  <span>{t.locationsSection.cta}</span>
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            </div>

            {/* Grid Items 2..6: 5 Campus Image Cards with Bottom Gradient Scrim */}
            {branches.slice(0, 5).map((branch) => (
              <Link
                key={branch.id}
                href={`/locations/${branch.slug}`}
                className="group relative rounded-2xl overflow-hidden min-h-[280px] flex flex-col justify-end border border-[#d6d6d6] shadow-sm hover:shadow-xl transition-all"
              >
                <img
                  src={branch.imageUrl}
                  alt={locale === "bn" ? branch.nameBn : branch.nameEn}
                  className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 mc-location-scrim" />

                <div className="relative z-10 p-6 text-white">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-xl font-semibold text-white group-hover:underline">
                      {locale === "bn" ? branch.nameBn : branch.nameEn}
                    </h3>
                    <ChevronRight className="w-5 h-5 text-white shrink-0 group-hover:translate-x-1 transition-transform" />
                  </div>
                  <p className="mt-1 text-sm text-[#e8f0f9]">
                    {locale === "bn" ? branch.subtitleBn : branch.subtitleEn}
                  </p>
                  <div className="mt-3 pt-2.5 border-t border-white/25 flex flex-wrap items-center gap-3 text-xs text-[#c5e2f9]">
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5" />
                      {locale === "bn" ? branch.cityBn : branch.cityEn}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Phone className="w-3.5 h-3.5" />
                      {branch.phone}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

