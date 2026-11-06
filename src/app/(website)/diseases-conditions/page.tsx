import React from "react";
import Link from "next/link";
import { ArrowRight, ShieldCheck, Search } from "lucide-react";
import {
  executeGlobalSearch,
  getPublishedConditions,
  getPublishedDepartments,
} from "@/server/services/publicQueryService";

export const dynamic = "force-dynamic";

const LETTERS = [
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

export default async function DiseasesConditionsPage({
  searchParams,
}: {
  searchParams: Promise<{ letter?: string; q?: string }>;
}) {
  const sp = await searchParams;
  const activeLetter = sp.letter?.toUpperCase() || "";
  const query = sp.q?.trim() || "";

  const conditions = getPublishedConditions({
    letter: activeLetter || undefined,
    query: query || undefined,
  });
  const departments = getPublishedDepartments();
  const globalHits = query ? executeGlobalSearch(query) : [];

  return (
    <div className="min-h-screen bg-white">
      {/* Full-bleed Stretched Dark Blue Hero Header */}
      <div className="w-full bg-[#012d61] text-white py-14 md:py-20 border-b border-[#001f44]">
        <div className="mc-container max-w-7xl mx-auto px-6 sm:px-10 lg:px-12 space-y-6">
          <div>
            <p className="text-xs sm:text-sm font-bold uppercase tracking-widest text-[#93c5fd]">
              DeltaCare Health Library • Clinical Reviewer Approved
            </p>
            <h1 className="mc-serif text-3xl sm:text-5xl lg:text-[54px] font-bold text-white tracking-tight leading-tight mt-2">
              Diseases &amp; Conditions A–Z
            </h1>
            <p className="text-xl text-[#c5e2f9] font-medium mt-1">
              রোগ ও শারীরিক অবস্থা নির্দেশিকা
            </p>
            <p className="text-base sm:text-lg text-[#e8f0f9] max-w-3xl leading-relaxed mt-2">
              Find comprehensive, clinically reviewed patient education guides on
              diseases, symptoms, diagnostic evaluations, and specialist care at
              DeltaCare.
            </p>
          </div>

          {/* Search Bar - Unboxed */}
          <form
            action="/diseases-conditions"
            method="GET"
            className="max-w-2xl flex items-center gap-2 pt-2"
          >
            <div className="relative flex-1">
              <Search className="w-5 h-5 text-[#6b7280] absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="search"
                name="q"
                defaultValue={query}
                placeholder="Search conditions, symptoms, doctors, or procedures..."
                className="w-full h-12 pl-12 pr-4 bg-white text-[#080808] text-base outline-none"
              />
            </div>
            <button
              type="submit"
              className="h-12 px-6 bg-[#0057b8] hover:bg-[#004181] text-white text-base font-semibold transition-colors"
            >
              Search
            </button>
            {(activeLetter || query) && (
              <Link
                href="/diseases-conditions"
                className="h-12 px-4 border border-white/60 text-white text-sm font-semibold flex items-center hover:bg-white/10"
              >
                Reset
              </Link>
            )}
          </form>

          {/* A-Z Letter Strip */}
          <div className="pt-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-[#93c5fd] mb-3">
              Browse by first letter:
            </p>
            <div className="flex flex-wrap gap-2">
              {LETTERS.map((letter) => {
                const isSelected = activeLetter === letter;
                return (
                  <Link
                    key={letter}
                    href={`/diseases-conditions?letter=${encodeURIComponent(
                      letter
                    )}`}
                    className={`w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center font-bold text-sm transition-colors ${
                      isSelected
                        ? "bg-white text-[#004181]"
                        : "bg-white/10 text-white hover:bg-white/20"
                    }`}
                  >
                    {letter}
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Main Body - Unboxed Editorial */}
      <div className="w-full py-12 md:py-16">
        <div className="mc-container max-w-7xl mx-auto px-6 sm:px-10 lg:px-12 space-y-14">
          {/* Global Search Cross-Entity Results when ?q= is active */}
          {query && globalHits.length > 0 && (
            <div className="space-y-4 pb-8 border-b border-[#e5e7eb]">
              <h2 className="mc-serif text-2xl text-[#080808]">
                Cross-Platform Search Matches for &ldquo;{query}&rdquo; ({globalHits.length})
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {globalHits.map((hit) => (
                  <Link
                    key={`${hit.type}-${hit.id}`}
                    href={hit.href}
                    className="py-3 px-4 border border-[#e5e7eb] hover:border-[#0057b8] flex items-center justify-between gap-3 group"
                  >
                    <div>
                      <span className="inline-block text-[10px] font-bold uppercase px-2 py-0.5 bg-[#e8f0f9] text-[#004181] mr-2">
                        {hit.type}
                      </span>
                      <span className="font-semibold text-base text-[#080808] group-hover:text-[#0057b8]">
                        {hit.titleEn}
                      </span>
                      <p className="text-xs text-[#6b7280] mt-0.5">
                        {hit.subtitleEn}
                      </p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-[#0057b8] shrink-0" />
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Conditions List */}
          <div className="space-y-8">
            <div className="pb-4 border-b-2 border-[#080808] flex items-center justify-between">
              <h2 className="mc-serif text-3xl sm:text-4xl text-[#080808]">
                {activeLetter
                  ? `Conditions Starting with "${activeLetter}" (${conditions.length})`
                  : `All Published Conditions (${conditions.length})`}
              </h2>
            </div>

            {conditions.length === 0 ? (
              <div className="py-12 text-center space-y-4">
                <p className="text-lg font-semibold text-[#080808]">
                  No published condition guides found for that filter.
                </p>
                <Link href="/diseases-conditions" className="mc-btn-secondary inline-block">
                  View All Published Conditions
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-14">
                {conditions.map((cond) => {
                  const dept = departments.find(
                    (d) => d.id === cond.departmentId
                  );
                  return (
                    <article
                      key={cond.id}
                      className="pb-8 border-b border-[#e5e7eb] flex flex-col justify-between gap-4"
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between gap-2 text-xs">
                          <span className="font-bold text-[#0057b8] uppercase tracking-wider">
                            Letter {cond.firstLetter} • {dept?.nameEn}
                          </span>
                          <span className="text-[#6b7280] inline-flex items-center gap-1">
                            <ShieldCheck className="w-3.5 h-3.5 text-[#0057b8]" />
                            Reviewed {cond.lastReviewedAt}
                          </span>
                        </div>

                        <h3 className="mc-serif text-2xl text-[#080808]">
                          <Link
                            href={`/diseases-conditions/${cond.slug}`}
                            className="hover:text-[#0057b8] transition-colors"
                          >
                            {cond.nameEn}
                          </Link>
                        </h3>
                        <p className="text-sm font-semibold text-[#004181]">
                          {cond.nameBn}
                        </p>
                        <p className="text-base text-[#4b5563] leading-relaxed">
                          {cond.summaryEn}
                        </p>
                        <p className="text-xs text-[#6b7280] leading-relaxed">
                          {cond.summaryBn}
                        </p>
                      </div>

                      <div className="pt-2 flex items-center justify-between text-sm">
                        <span className="text-xs text-[#6b7280]">
                          Reviewed by: {cond.reviewedByEn}
                        </span>
                        <Link
                          href={`/diseases-conditions/${cond.slug}`}
                          className="inline-flex items-center gap-1 font-bold text-[#0057b8] hover:underline"
                        >
                          <span>Read Full Guide</span>
                          <ArrowRight className="w-4 h-4" />
                        </Link>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
