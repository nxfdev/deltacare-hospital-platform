"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, X, ChevronRight, BookOpen } from "lucide-react";
import { DiseaseCondition } from "@/types/domain";
import { useLocale } from "@/lib/i18n/LocaleContext";

const ALPHABET_LETTERS = [
  "A",
  "B",
  "C",
  "D",
  "E",
  "F",
  "G",
  "H",
  "I",
  "J",
  "K",
  "L",
  "M",
  "N",
  "O",
  "P",
  "Q",
  "R",
  "S",
  "T",
  "U",
  "V",
  "W",
  "X",
  "Y",
  "Z",
  "#",
];

interface SearchHit {
  type: "DOCTOR" | "DEPARTMENT" | "CONDITION" | "PROCEDURE" | "SERVICE" | "BRANCH";
  id: string;
  titleEn: string;
  titleBn: string;
  subtitleEn: string;
  subtitleBn: string;
  href: string;
}

export function AlphabetConditionDirectory({
  conditions,
}: {
  conditions: DiseaseCondition[];
}) {
  const { locale, t } = useLocale();
  const router = useRouter();
  const [selectedLetter, setSelectedLetter] = useState<string>("C");
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState<SearchHit[]>([]);
  const [activeIndex, setActiveIndex] = useState(-1);

  const matchingConditions = conditions.filter(
    (c) => c.firstLetter.toUpperCase() === selectedLetter.toUpperCase()
  );

  useEffect(() => {
    if (searchQuery.trim().length < 2) {
      setSuggestions([]);
      setActiveIndex(-1);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/v1/public/search?q=${encodeURIComponent(searchQuery.trim())}`
        );
        if (res.ok) {
          const data = await res.json();
          setSuggestions(data.results?.slice(0, 7) ?? []);
          setActiveIndex(-1);
        }
      } catch {
        // Ignore
      }
    }, 150);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (suggestions.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((prev) =>
        prev < suggestions.length - 1 ? prev + 1 : 0
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((prev) =>
        prev > 0 ? prev - 1 : suggestions.length - 1
      );
    } else if (e.key === "Enter" && activeIndex >= 0) {
      e.preventDefault();
      const target = suggestions[activeIndex];
      if (target) {
        router.push(target.href);
      }
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    router.push(
      `/diseases-conditions?q=${encodeURIComponent(searchQuery.trim())}`
    );
  };

  return (
    <section
      aria-labelledby="alphabet-search-heading"
      className="bg-white text-[#080808] py-16 md:py-24 border-b border-[#e5e7eb]"
    >
      <div className="mc-container">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 xl:gap-14 items-start">
          {/* Left Column: Search Diseases, Procedures, Doctors & Departments */}
          <div className="lg:col-span-5 space-y-6">
            <div className="space-y-3">
              <h2
                id="alphabet-search-heading"
                className="text-2xl sm:text-3xl lg:text-[34px] font-semibold text-[#080808] font-serif leading-tight tracking-tight"
              >
                {t.alphabetSearchSection.searchHeading}
              </h2>
              <p
                id="homepage-search-hint"
                className="text-sm md:text-base text-[#595959] leading-relaxed max-w-lg"
              >
                {t.alphabetSearchSection.searchHint}
              </p>
            </div>

            <form
              onSubmit={handleSearchSubmit}
              className="relative"
              role="search"
            >
              <div className="relative flex items-center">
                <Search
                  className="w-5 h-5 text-[#9ca3af] absolute left-5 pointer-events-none"
                  aria-hidden="true"
                />
                <input
                  type="search"
                  aria-describedby="homepage-search-hint"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={handleSearchKeyDown}
                  placeholder={t.alphabetSearchSection.searchPlaceholder}
                  className="w-full h-16 pl-14 pr-32 rounded-full bg-[#f9fafb] hover:bg-white focus:bg-white text-[#080808] text-base md:text-lg border-2 border-[#e5e7eb] focus:border-[#0057b8] shadow-sm focus:shadow-md focus:outline-none transition-all placeholder-[#9ca3af]"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    aria-label={t.alphabetSearchSection.clearSearch}
                    className="absolute right-28 p-2 text-[#9ca3af] hover:text-[#111827] transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
                <button
                  type="submit"
                  className="absolute right-2 h-12 px-7 rounded-full bg-[#0057b8] hover:bg-[#004181] text-white text-sm md:text-base font-semibold shadow-sm hover:shadow transition-colors"
                >
                  {t.alphabetSearchSection.searchButton}
                </button>
              </div>

              {/* Autocomplete Dropdown */}
              {suggestions.length > 0 && (
                <div
                  role="listbox"
                  aria-label="Suggested search options"
                  className="absolute left-0 right-0 mt-3 rounded-2xl bg-white text-[#080808] shadow-2xl border border-[#e5e7eb] divide-y divide-[#f3f4f6] z-30 overflow-hidden"
                >
                  {suggestions.map((item, idx) => (
                    <Link
                      key={`${item.type}-${item.id}`}
                      href={item.href}
                      role="option"
                      aria-selected={idx === activeIndex}
                      className={`flex items-center justify-between px-5 py-3.5 text-sm transition-colors ${
                        idx === activeIndex
                          ? "bg-[#f0f7ff] text-[#0057b8]"
                          : "hover:bg-[#f9fafb]"
                      }`}
                    >
                      <div>
                        <span className="inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-[#e8f0f9] text-[#004181] mr-2.5">
                          {item.type}
                        </span>
                        <span className="font-semibold text-sm text-[#111827]">
                          {locale === "bn" ? item.titleBn : item.titleEn}
                        </span>
                        <p className="text-xs text-[#6b7280] mt-0.5">
                          {locale === "bn" ? item.subtitleBn : item.subtitleEn}
                        </p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-[#0057b8] shrink-0" />
                    </Link>
                  ))}
                </div>
              )}
            </form>

            {/* Quick Links under Search */}
            <div className="pt-1 flex flex-wrap items-center gap-2 text-xs md:text-sm">
              <span className="text-xs font-semibold text-[#6b7280] uppercase tracking-wider mr-1">
                {locale === "bn" ? "জনপ্রিয়:" : "Popular:"}
              </span>
              <Link
                href="/diseases-conditions/coronary-artery-disease"
                className="px-3.5 py-1.5 rounded-full bg-[#f3f4f6] hover:bg-[#e8f0f9] border border-[#e5e7eb] hover:border-[#bfdbfe] text-[#374151] hover:text-[#0057b8] transition-colors font-medium"
              >
                {locale === "bn" ? "করোনারি আর্টারি ডিজিজ" : "Coronary Artery Disease"}
              </Link>
              <Link
                href="/diseases-conditions/ischemic-stroke"
                className="px-3.5 py-1.5 rounded-full bg-[#f3f4f6] hover:bg-[#e8f0f9] border border-[#e5e7eb] hover:border-[#bfdbfe] text-[#374151] hover:text-[#0057b8] transition-colors font-medium"
              >
                {locale === "bn" ? "ইস্কেমিক স্ট্রোক" : "Ischemic Stroke"}
              </Link>
              <Link
                href="/diseases-conditions/type-2-diabetes"
                className="px-3.5 py-1.5 rounded-full bg-[#f3f4f6] hover:bg-[#e8f0f9] border border-[#e5e7eb] hover:border-[#bfdbfe] text-[#374151] hover:text-[#0057b8] transition-colors font-medium"
              >
                {locale === "bn" ? "টাইপ ২ ডায়াবেটিস" : "Type 2 Diabetes"}
              </Link>
            </div>
          </div>

          {/* Right Column: Alphabetical Diseases & Conditions Facet (Circular buttons) */}
          <div className="lg:col-span-7 space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-2xl sm:text-3xl font-serif font-semibold text-[#080808]">
                {t.alphabetSearchSection.alphabetHeading}
              </h2>
              <Link
                href="/diseases-conditions"
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#0057b8] hover:text-[#004181] hover:underline transition-colors"
              >
                <span>{t.alphabetSearchSection.viewAllConditions}</span>
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>

            {/* 27 Circular Buttons */}
            <ul
              role="list"
              aria-label="Alphabetical index of diseases and conditions"
              className="flex flex-wrap gap-2 sm:gap-2.5"
            >
              {ALPHABET_LETTERS.map((letter) => {
                const isSelected = selectedLetter === letter;
                return (
                  <li key={letter}>
                    <button
                      type="button"
                      onClick={() => setSelectedLetter(letter)}
                      aria-pressed={isSelected}
                      className={`w-10 h-10 sm:w-11 sm:h-11 md:w-12 md:h-12 rounded-full border text-sm sm:text-base font-semibold flex items-center justify-center transition-all duration-150 ${
                        isSelected
                          ? "bg-[#0057b8] text-white border-[#0057b8] shadow-md scale-105 font-bold"
                          : "bg-white border-[#d1d5db] text-[#374151] hover:border-[#0057b8] hover:text-[#0057b8] hover:bg-[#f0f7ff]"
                      }`}
                    >
                      {letter}
                    </button>
                  </li>
                );
              })}
            </ul>

            {/* Live Selected Letter Preview Strip (Minimal Light Card) */}
            <div className="rounded-2xl bg-[#f8fafc] border border-[#e2e8f0] p-5 md:p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-[#e2e8f0] pb-3.5">
                <p className="text-xs font-bold uppercase tracking-wider text-[#0057b8] flex items-center gap-2">
                  <BookOpen className="w-4 h-4" />
                  <span>
                    {locale === "bn"
                      ? `"${selectedLetter}" দিয়ে শুরু হওয়া অনুমোদিত স্বাস্থ্য নির্দেশিকা`
                      : `Verified Conditions Starting with "${selectedLetter}"`}
                  </span>
                </p>
                <Link
                  href={`/diseases-conditions?letter=${encodeURIComponent(
                    selectedLetter
                  )}`}
                  className="text-xs font-semibold text-[#0057b8] hover:text-[#004181] hover:underline inline-flex items-center gap-1"
                >
                  <span>{locale === "bn" ? "সব দেখুন" : "Open letter page"}</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              {matchingConditions.length === 0 ? (
                <p className="text-sm text-[#64748b] py-2">
                  {locale === "bn"
                    ? `বর্তমানে "${selectedLetter}" অক্ষরে কোনো নিবন্ধ তালিকাভুক্ত নেই। অনুগ্রহ করে C, D, H, I, B, A, বা P অক্ষর নির্বাচন করুন অথবা সম্পূর্ণ ডিরেক্টরি দেখুন।`
                    : `No condition guides under "${selectedLetter}" in this seed set. Try letters A, B, C, D, G, H, I, K, M, O, P, R, S, or T, or browse the full directory.`}
                </p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {matchingConditions.map((cond) => (
                    <Link
                      key={cond.id}
                      href={`/diseases-conditions/${cond.slug}`}
                      className="group p-4 rounded-xl bg-white hover:bg-[#f0f7ff] border border-[#e2e8f0] hover:border-[#bfdbfe] shadow-sm hover:shadow transition-all flex items-start justify-between gap-3 text-left"
                    >
                      <div className="min-w-0">
                        <p className="font-semibold text-sm md:text-[15px] text-[#080808] group-hover:text-[#0057b8] transition-colors">
                          {locale === "bn" ? cond.nameBn : cond.nameEn}
                        </p>
                        <p className="text-xs text-[#64748b] line-clamp-2 mt-1 leading-relaxed">
                          {locale === "bn" ? cond.summaryBn : cond.summaryEn}
                        </p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-[#94a3b8] group-hover:text-[#0057b8] group-hover:translate-x-0.5 shrink-0 mt-0.5 transition-transform" />
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

