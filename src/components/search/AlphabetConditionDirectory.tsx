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
      className="bg-[#0057b8] text-white py-14 md:py-16"
    >
      <div className="mc-container">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          {/* Left Column: Search Diseases, Procedures, Doctors & Departments */}
          <div className="lg:col-span-5 space-y-4">
            <h2
              id="alphabet-search-heading"
              className="text-xl md:text-2xl font-semibold text-white"
            >
              {t.alphabetSearchSection.searchHeading}
            </h2>
            <p
              id="homepage-search-hint"
              className="text-xs text-[#e8f0f9] leading-relaxed"
            >
              {t.alphabetSearchSection.searchHint}
            </p>

            <form
              onSubmit={handleSearchSubmit}
              className="relative"
              role="search"
            >
              <div className="relative flex items-center">
                <Search
                  className="w-5 h-5 text-[#686868] absolute left-4 pointer-events-none"
                  aria-hidden="true"
                />
                <input
                  type="search"
                  aria-describedby="homepage-search-hint"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={handleSearchKeyDown}
                  placeholder={t.alphabetSearchSection.searchPlaceholder}
                  className="w-full h-14 pl-12 pr-28 rounded-full bg-white text-[#080808] text-base shadow-md border-2 border-white focus:border-[#012d61]"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    aria-label={t.alphabetSearchSection.clearSearch}
                    className="absolute right-24 p-1.5 text-[#686868] hover:text-[#080808]"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
                <button
                  type="submit"
                  className="absolute right-1.5 h-11 px-5 rounded-full bg-[#012d61] hover:bg-[#002443] text-white text-sm font-semibold transition-colors"
                >
                  {t.alphabetSearchSection.searchButton}
                </button>
              </div>

              {/* Autocomplete Dropdown */}
              {suggestions.length > 0 && (
                <div
                  role="listbox"
                  aria-label="Suggested search options"
                  className="absolute left-0 right-0 mt-2 rounded-2xl bg-white text-[#080808] shadow-2xl border border-[#d6d6d6] divide-y divide-[#d6d6d6] z-30 overflow-hidden"
                >
                  {suggestions.map((item, idx) => (
                    <Link
                      key={`${item.type}-${item.id}`}
                      href={item.href}
                      role="option"
                      aria-selected={idx === activeIndex}
                      className={`flex items-center justify-between px-4 py-3 text-sm transition-colors ${
                        idx === activeIndex
                          ? "bg-[#c5e2f9] text-[#004181]"
                          : "hover:bg-[#e8f0f9]"
                      }`}
                    >
                      <div>
                        <span className="inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-[#f2f2f2] text-[#004181] mr-2">
                          {item.type}
                        </span>
                        <span className="font-semibold">
                          {locale === "bn" ? item.titleBn : item.titleEn}
                        </span>
                        <p className="text-xs text-[#686868] mt-0.5">
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
            <div className="pt-2 flex flex-wrap gap-2 text-xs">
              <Link
                href="/diseases-conditions/coronary-artery-disease"
                className="px-3 py-1 rounded-full bg-white/10 hover:bg-white/20 border border-white/40 text-white"
              >
                {locale === "bn" ? "করোনারি আর্টারি ডিজিজ" : "Coronary Artery Disease"}
              </Link>
              <Link
                href="/diseases-conditions/ischemic-stroke"
                className="px-3 py-1 rounded-full bg-white/10 hover:bg-white/20 border border-white/40 text-white"
              >
                {locale === "bn" ? "ইস্কেমিক স্ট্রোক" : "Ischemic Stroke"}
              </Link>
              <Link
                href="/diseases-conditions/type-2-diabetes"
                className="px-3 py-1 rounded-full bg-white/10 hover:bg-white/20 border border-white/40 text-white"
              >
                {locale === "bn" ? "টাইপ ২ ডায়াবেটিস" : "Type 2 Diabetes"}
              </Link>
            </div>
          </div>

          {/* Right Column: Alphabetical Diseases & Conditions Facet (48px circular buttons) */}
          <div className="lg:col-span-7 space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-xl md:text-2xl font-semibold text-white">
                {t.alphabetSearchSection.alphabetHeading}
              </h2>
              <Link
                href="/diseases-conditions"
                className="inline-flex items-center gap-1 text-sm font-medium text-[#e8f0f9] hover:text-white underline"
              >
                <span>{t.alphabetSearchSection.viewAllConditions}</span>
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>

            {/* 27 Circular 48x48 Buttons (Mirrors inspo.html .cmp-alphabet-facet) */}
            <ul
              role="list"
              aria-label="Alphabetical index of diseases and conditions"
              className="flex flex-wrap gap-2.5"
            >
              {ALPHABET_LETTERS.map((letter) => {
                const isSelected = selectedLetter === letter;
                return (
                  <li key={letter}>
                    <button
                      type="button"
                      onClick={() => setSelectedLetter(letter)}
                      aria-pressed={isSelected}
                      className={`mc-alpha-btn ${
                        isSelected
                          ? "!bg-white !text-[#004181] !border-white shadow-md scale-105"
                          : ""
                      }`}
                    >
                      {letter}
                    </button>
                  </li>
                );
              })}
            </ul>

            {/* Live Selected Letter Preview Strip */}
            <div className="rounded-xl bg-[#012d61]/75 border border-white/30 p-4">
              <div className="flex items-center justify-between mb-2.5">
                <p className="text-xs font-bold uppercase tracking-wider text-[#c5e2f9] flex items-center gap-1.5">
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
                  className="text-xs text-white underline hover:text-[#c5e2f9]"
                >
                  {locale === "bn" ? "সব দেখুন" : "Open letter page"}
                </Link>
              </div>

              {matchingConditions.length === 0 ? (
                <p className="text-sm text-[#e8f0f9]">
                  {locale === "bn"
                    ? `বর্তমানে "${selectedLetter}" অক্ষরে কোনো নিবন্ধ তালিকাভুক্ত নেই। অনুগ্রহ করে C, D, H, I, B, A, বা P অক্ষর নির্বাচন করুন অথবা সম্পূর্ণ ডিরেক্টরি দেখুন।`
                    : `No condition guides under "${selectedLetter}" in this seed set. Try letters A, B, C, D, G, H, I, K, M, O, P, R, S, or T, or browse the full directory.`}
                </p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {matchingConditions.map((cond) => (
                    <Link
                      key={cond.id}
                      href={`/diseases-conditions/${cond.slug}`}
                      className="group flex items-center justify-between px-3.5 py-2.5 rounded-lg bg-white/10 hover:bg-white/20 border border-white/25 transition-colors"
                    >
                      <div>
                        <p className="font-semibold text-sm text-white">
                          {locale === "bn" ? cond.nameBn : cond.nameEn}
                        </p>
                        <p className="text-xs text-[#e8f0f9] line-clamp-1">
                          {locale === "bn" ? cond.summaryBn : cond.summaryEn}
                        </p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-white shrink-0 group-hover:translate-x-0.5 transition-transform" />
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

