"use client";

import React from "react";
import Link from "next/link";
import {
  ChevronRight,
  MapPin,
  Phone,
  ShieldCheck,
  Calendar,
  Award,
  ArrowRight,
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
  const featuredSpecialists = doctors.slice(0, 4);

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

            <p className="text-lg md:text-xl text-[#e8f0f9] leading-relaxed max-w-2xl">
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

              <Link
                href="/patient-services"
                className="inline-flex items-center gap-2 text-base font-semibold text-white hover:text-[#c5e2f9] underline underline-offset-4 py-2.5 px-3 rounded-lg hover:bg-white/10 transition-colors"
              >
                <span>{t.hero.primaryCta}</span>
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
          SECTION 6: LOCATIONS & HOSPITAL BRANCHES
          - Exact 3-column grid where Col 1 is header/CTA and remaining 5 cards
            flow across the 3-column grid with dark bottom gradient overlays
         ==================================================================== */}
      <section
        aria-labelledby="locations-section-heading"
        className="bg-white py-16 md:py-20 border-b border-[#d6d6d6]"
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

      {/* ====================================================================
          SECTION 7: FEATURED CARE AREAS
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
          SECTION 8: ADDITIONAL HOMEPAGE CONTENT
          - Story Split Cards ("Healing starts here" & "World-class care")
          - Featured Specialists Strip with direct booking links
          - Institutional Governance Banner (#0d0d33 matching inspo.html)
         ==================================================================== */}
      <section className="bg-white py-16 md:py-20 space-y-20">
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
                  src="/images/inspo/healing-starts-here-MC11RE8-600x800.jpg"
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
                  src="/images/inspo/world-class-care-MC1X264-600x800.jpg"
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

          {/* Featured Verified Specialists Strip */}
          <div className="pt-6 border-t border-[#d6d6d6]">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-[#0057b8]">
                  {locale === "bn"
                    ? "বিএমডিসি নিবন্ধিত বিশেষজ্ঞ"
                    : "BMDC-Verified Senior Consultants"}
                </p>
                <h2 className="mt-1 mc-serif text-3xl md:text-4xl text-[#080808]">
                  {locale === "bn"
                    ? "আমাদের বিশেষজ্ঞ চিকিৎসকবৃন্দ"
                    : "Meet Our Verified Specialists"}
                </h2>
              </div>
              <Link href="/doctors" className="mc-btn-secondary">
                <span>
                  {locale === "bn"
                    ? "সকল চিকিৎসক দেখুন"
                    : "Explore All Specialists"}
                </span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {featuredSpecialists.map((doc) => (
                <div
                  key={doc.id}
                  className="rounded-2xl border border-[#d6d6d6] bg-white overflow-hidden flex flex-col justify-between hover:border-[#0057b8] transition-all shadow-sm"
                >
                  <div>
                    <div className="aspect-[4/3] bg-[#e8f0f9] flex items-center justify-center p-4">
                      <img
                        src={doc.imageUrl}
                        alt={locale === "bn" ? doc.nameBn : doc.nameEn}
                        className="h-32 w-32 rounded-full object-cover border-2 border-white shadow"
                      />
                    </div>
                    <div className="p-5 space-y-2">
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-[#e8f0f9] text-[#004181]">
                        <Award className="w-3 h-3" />
                        BMDC {doc.bmdcRegistrationNo}
                      </span>
                      <h3 className="font-bold text-lg text-[#080808]">
                        <Link
                          href={`/doctors/${doc.slug}`}
                          className="hover:text-[#0057b8] hover:underline"
                        >
                          {locale === "bn" ? doc.nameBn : doc.nameEn}
                        </Link>
                      </h3>
                      <p className="text-xs font-medium text-[#004181]">
                        {locale === "bn"
                          ? doc.designationBn
                          : doc.designationEn}
                      </p>
                      <p className="text-xs text-[#686868] line-clamp-2">
                        {locale === "bn"
                          ? doc.qualificationsBn
                          : doc.qualificationsEn}
                      </p>
                    </div>
                  </div>

                  <div className="px-5 pb-5 pt-3 border-t border-[#f2f2f2] flex items-center justify-between text-xs">
                    <div>
                      <span className="text-[#686868] block">
                        {locale === "bn" ? "কনসালটেশন ফি" : "Consultation Fee"}
                      </span>
                      <span className="font-bold text-sm text-[#080808]">
                        BDT {doc.consultationFeeBdt}
                      </span>
                    </div>
                    <Link
                      href={`/appointments?doctorId=${encodeURIComponent(
                        doc.id
                      )}`}
                      className="inline-flex items-center gap-1 px-3 py-2 rounded-full bg-[#0057b8] hover:bg-[#1371d5] text-white font-semibold"
                    >
                      <Calendar className="w-3.5 h-3.5" />
                      <span>{locale === "bn" ? "বুকিং" : "Book"}</span>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Institutional Banner (#0d0d33 matching inspo.html --mc-custom-palette-color-donations-bg) */}
          <div className="rounded-3xl bg-[#0d0d33] text-white p-8 md:p-12 overflow-hidden">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              <div className="lg:col-span-4 flex items-center gap-4">
                <img
                  src="/images/deltacare-logo-inverse.svg"
                  alt="DeltaCare Institutional Governance"
                  className="h-14 w-auto"
                />
              </div>
              <div className="lg:col-span-5 space-y-2">
                <h2 className="mc-serif text-2xl md:text-3xl text-white">
                  {t.institutionalBanner.title}
                </h2>
                <p className="text-sm text-[#e8f0f9] leading-relaxed">
                  {t.institutionalBanner.description}
                </p>
              </div>
              <div className="lg:col-span-3 flex lg:justify-end">
                <Link href="/patient-services" className="mc-btn-primary">
                  <span>{t.institutionalBanner.cta}</span>
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

