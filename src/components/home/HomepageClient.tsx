"use client";

import React from "react";
import Link from "next/link";
import {
  ChevronRight,
  MapPin,
  Phone,
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

  const featuredConditions = [...conditions]
    .sort((a, b) => a.nameEn.localeCompare(b.nameEn))
    .slice(0, 21);

  return (
    <div>
      {/* ====================================================================
          SECTION 2: HERO SECTION (Mirrors inspo.html .cmp-ViewportHero)
          - Full-bleed dark gradient overlay + display serif headline
          - Centered CTA
         ==================================================================== */}
      <section
        aria-label="Hero Banner"
        className="relative overflow-hidden bg-[#012d61] text-white min-h-[500px] md:min-h-[600px] flex items-center justify-center"
      >
        {/* Background Visual Layer - Hospital Surgical Team */}
        <div className="absolute inset-0 overflow-hidden">
          <img
            src="/images/hero-surgery.jpg"
            alt="Advanced surgical and specialist medical team performing operation at DeltaCare"
            className="w-full h-full object-cover object-[center_35%] opacity-50 scale-105 transition-transform duration-1000 ease-out"
          />
          {/* Centered cinematic overlay for balanced contrast */}
          <div className="absolute inset-0 bg-[#012d61]/70" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#012d61] via-transparent to-[#012d61]/50" />
        </div>

        {/* Hero Content Container - Centrally Aligned */}
        <div className="mc-container relative z-10 py-16 md:py-24 w-full flex flex-col items-center justify-center text-center">
          <div className="max-w-5xl mx-auto flex flex-col items-center justify-center space-y-8 text-center">
            <h1 className="mc-serif text-3xl sm:text-5xl md:text-6xl lg:text-[68px] xl:text-[76px] text-white font-normal tracking-tight leading-tight text-center sm:whitespace-nowrap">
              {t.hero.headline}
            </h1>

            {/* Hero CTA - Centered */}
            <div className="flex justify-center items-center">
              <Link
                href="/request-appointment"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full bg-[#0057b8] hover:bg-[#004181] active:bg-[#002d61] text-white font-bold text-base sm:text-lg shadow-lg hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-white/40 transition-all duration-200"
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
          - Elegant 3:4 Portrait Composition with Minimalist Editorial Typography
         ==================================================================== */}
      <section className="bg-white py-20 md:py-28 border-b border-[#d6d6d6]">
        <div className="mc-container space-y-24 md:space-y-32">
          {/* Story Split Block 1: "Healing starts here" (Text Left, 3:4 Image Right) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
            <div className="lg:col-span-7 space-y-6">
              <span className="text-xs font-bold uppercase tracking-widest text-[#0057b8]">
                {locale === "bn" ? "ক্লিনিক্যাল উৎকর্ষ ও সেবা" : "Clinical Excellence"}
              </span>

              <h2 className="mc-serif text-3xl sm:text-4xl lg:text-[42px] leading-tight text-[#080808]">
                {t.storySections.story1Title}
              </h2>

              <div className="space-y-6 pt-2">
                <div className="border-l-2 border-[#0057b8] pl-5 space-y-2">
                  <h3 className="text-xl font-bold text-[#080808]">
                    {t.storySections.story1Sub1Title}
                  </h3>
                  <p className="text-lg md:text-[19px] text-[#424242] leading-relaxed text-justify">
                    {t.storySections.story1Sub1Body}
                  </p>
                </div>

                <div className="border-l-2 border-[#d6d6d6] pl-5 space-y-2">
                  <h3 className="text-xl font-bold text-[#080808]">
                    {t.storySections.story1Sub2Title}
                  </h3>
                  <p className="text-lg md:text-[19px] text-[#424242] leading-relaxed text-justify">
                    {t.storySections.story1Sub2Body}{" "}
                    <Link
                      href="/departments"
                      className="text-[#0057b8] font-semibold underline hover:text-[#004181] transition-colors"
                    >
                      {t.storySections.story1Link}
                    </Link>
                  </p>
                </div>
              </div>

              <div className="pt-2">
                <Link
                  href="/about"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-full bg-[#0057b8] hover:bg-[#004181] active:bg-[#002d61] text-white font-bold text-base shadow-md hover:shadow-lg transition-all group"
                >
                  <span>{locale === "bn" ? "কেন ডেল্টাকেয়ার বেছে নেবেন" : "Why choose DeltaCare"}</span>
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </Link>
              </div>
            </div>

            <div className="lg:col-span-5 flex justify-center lg:justify-end">
              <div className="group relative aspect-[3/4] w-full max-w-[400px] sm:max-w-[440px] rounded-3xl overflow-hidden shadow-2xl ring-1 ring-black/5 bg-[#f8f9fc]">
                <img
                  src="/images/world-class-care.jpg"
                  alt={t.storySections.story1Title}
                  className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700 ease-out"
                />
                <div className="absolute inset-0 ring-1 ring-inset ring-black/5 rounded-3xl pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Story Split Block 2: "World-class care" (3:4 Image Left, Text Right on Desktop) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
            <div className="lg:col-span-5 order-2 lg:order-1 flex justify-center lg:justify-start">
              <div className="group relative aspect-[3/4] w-full max-w-[400px] sm:max-w-[440px] rounded-3xl overflow-hidden shadow-2xl ring-1 ring-black/5 bg-[#f8f9fc]">
                <img
                  src="/images/healing-starts-here.jpg"
                  alt={t.storySections.story2Title}
                  className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700 ease-out"
                />
                <div className="absolute inset-0 ring-1 ring-inset ring-black/5 rounded-3xl pointer-events-none" />
              </div>
            </div>

            <div className="lg:col-span-7 order-1 lg:order-2 space-y-6">
              <span className="text-xs font-bold uppercase tracking-widest text-[#0057b8]">
                {locale === "bn" ? "সবার জন্য স্বাস্থ্যসেবা" : "Cross-Border & Regional Care"}
              </span>

              <h2 className="mc-serif text-3xl sm:text-4xl lg:text-[42px] leading-tight text-[#080808]">
                {t.storySections.story2Title}
              </h2>

              <p className="text-lg md:text-[19px] text-[#424242] leading-relaxed text-justify pt-1">
                {t.storySections.story2Body}
              </p>

              <div className="pt-2">
                <Link
                  href="/doctors"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-full bg-[#0057b8] hover:bg-[#004181] active:bg-[#002d61] text-white font-bold text-base shadow-md hover:shadow-lg transition-all group"
                >
                  <span>{locale === "bn" ? "আমাদের বিশেষজ্ঞ চিকিৎসকবৃন্দ" : "Explore Our Specialists"}</span>
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ====================================================================
          SECTION 5: FEATURED CARE AREAS
          - Full-width spread from left to right edge of screen
          - Height expanded in balanced proportion with homepage composition (py-20 md:py-28 lg:py-32)
          - 21 featured clinical conditions spread cleanly across 3 columns (no boxes)
         ==================================================================== */}
      <section
        aria-labelledby="featured-care-heading"
        className="bg-white py-20 md:py-28 lg:py-32 border-b border-[#d6d6d6]"
      >
        <div className="w-full px-6 sm:px-10 md:px-12 lg:px-16 xl:px-20 2xl:px-24">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 xl:gap-14 items-start">
            {/* Left Column: Title & Description */}
            <div className="lg:col-span-4 xl:col-span-3 space-y-6">
              <span className="text-xs font-bold uppercase tracking-widest text-[#0057b8]">
                {locale === "bn" ? "বিশেষায়িত চিকিৎসা ক্ষেত্র" : "Specialized Care Areas"}
              </span>

              <h2
                id="featured-care-heading"
                className="mc-serif text-3xl sm:text-4xl lg:text-[42px] leading-tight text-[#080808]"
              >
                {t.featuredCareSection.title}
              </h2>

              <p className="text-lg md:text-[19px] text-[#424242] leading-relaxed text-justify">
                {t.featuredCareSection.description}
              </p>

              <div className="pt-2">
                <Link
                  href="/diseases-conditions"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-full bg-[#0057b8] hover:bg-[#004181] active:bg-[#002d61] text-white font-bold text-base shadow-md hover:shadow-lg transition-all group"
                >
                  <span>{locale === "bn" ? "সকল রোগের ডিরেক্টরি" : "Explore All Diseases A–Z"}</span>
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </Link>
              </div>
            </div>

            {/* Right Column: 21 Spread-out Diseases Across 3 Columns (No Box) */}
            <div className="lg:col-span-8 xl:col-span-9">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-10 xl:gap-x-14">
                {featuredConditions.map((item) => (
                  <Link
                    key={item.id}
                    href={`/diseases-conditions/${item.slug}`}
                    className="group flex items-center justify-between py-4 sm:py-4.5 border-b border-[#d6d6d6] text-[#004181] hover:text-[#0057b8] text-base md:text-lg font-medium transition-colors"
                  >
                    <span className="group-hover:translate-x-0.5 transition-transform">
                      {locale === "bn" ? item.nameBn : item.nameEn}
                    </span>
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
          - Spread across full width from left to right part of the screen
          - Exact 3-column grid where Col 1 is header/CTA and remaining 5 cards
            flow across the 3-column grid with dark bottom gradient overlays
          - Positioned as the final section of the homepage right before the endbar
         ==================================================================== */}
      <section
        aria-labelledby="locations-section-heading"
        className="bg-white py-20 md:py-28"
      >
        <div className="w-full px-4 sm:px-8 md:px-12 lg:px-16 xl:px-20 2xl:px-24">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 xl:gap-10">
            {/* Grid Item 1: Header & CTA Block (Mirrors inspo.html .cmp-locations-intro) */}
            <div className="flex flex-col justify-center pr-4 py-6 space-y-6">
              <span className="text-xs font-bold uppercase tracking-widest text-[#0057b8]">
                {locale === "bn" ? "সারাদেশে সেবা কেন্দ্র" : "Nationwide Network"}
              </span>

              <h2
                id="locations-section-heading"
                className="mc-serif text-3xl sm:text-4xl lg:text-[42px] leading-tight text-[#080808]"
              >
                {t.locationsSection.title}
              </h2>

              <p className="text-lg md:text-[19px] text-[#424242] leading-relaxed text-justify">
                {t.locationsSection.description}
              </p>

              <div className="pt-2">
                <Link
                  href="/locations"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-full bg-[#0057b8] hover:bg-[#004181] active:bg-[#002d61] text-white font-bold text-base shadow-md hover:shadow-lg transition-all group"
                >
                  <span>{t.locationsSection.cta}</span>
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </Link>
              </div>
            </div>

            {/* Grid Items 2..6: 5 Campus Image Cards with Bottom Gradient Scrim */}
            {branches.slice(0, 5).map((branch) => (
              <Link
                key={branch.id}
                href={`/locations/${branch.slug}`}
                className="group relative rounded-3xl overflow-hidden min-h-[340px] md:min-h-[380px] xl:min-h-[420px] flex flex-col justify-end border border-[#d6d6d6] shadow-sm hover:shadow-xl transition-all"
              >
                <img
                  src={branch.imageUrl}
                  alt={locale === "bn" ? branch.nameBn : branch.nameEn}
                  className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                />
                <div className="absolute inset-0 mc-location-scrim" />

                <div className="relative z-10 p-7 xl:p-8 text-white">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-2xl font-bold text-white group-hover:underline">
                      {locale === "bn" ? branch.nameBn : branch.nameEn}
                    </h3>
                    <ChevronRight className="w-5 h-5 text-white shrink-0 group-hover:translate-x-1 transition-transform" />
                  </div>
                  <p className="mt-2 text-sm sm:text-base text-[#e8f0f9] leading-relaxed line-clamp-2">
                    {locale === "bn" ? branch.subtitleBn : branch.subtitleEn}
                  </p>
                  <div className="mt-4 pt-3 border-t border-white/25 flex flex-wrap items-center gap-4 text-xs sm:text-sm text-[#c5e2f9]">
                    <span className="inline-flex items-center gap-1.5 font-medium">
                      <MapPin className="w-4 h-4" />
                      {locale === "bn" ? branch.cityBn : branch.cityEn}
                    </span>
                    <span className="inline-flex items-center gap-1.5 font-medium">
                      <Phone className="w-4 h-4" />
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

