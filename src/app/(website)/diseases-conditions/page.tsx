import React from "react";
import Link from "next/link";
import { ChevronRight, ShieldCheck, Search } from "lucide-react";
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
    <div className="bg-[#f2f2f2] min-h-screen">
      {/* Top Brand Blue Alphabet Header (Matches inspo.html) */}
      <div className="bg-[#0057b8] text-white py-12">
        <div className="mc-container space-y-6">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-[#e8f0f9]">
              DeltaCare Health Library • Clinical Reviewer Approved
            </p>
            <h1 className="mt-2 mc-serif text-3xl md:text-5xl text-white">
              Diseases & Conditions A–Z / রোগ ও শারীরিক অবস্থা
            </h1>
            <p className="mt-2 text-base text-[#e8f0f9] max-w-3xl">
              Find comprehensive, clinically reviewed patient education guides on
              diseases, symptoms, diagnostic evaluations, and specialist care at
              DeltaCare.
            </p>
          </div>

          {/* Search Bar */}
          <form
            action="/diseases-conditions"
            method="GET"
            className="max-w-2xl flex items-center gap-2"
          >
            <div className="relative flex-1">
              <Search className="w-5 h-5 text-[#686868] absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="search"
                name="q"
                defaultValue={query}
                placeholder="Search conditions, symptoms, doctors, or procedures..."
                className="w-full h-12 pl-12 pr-4 rounded-full bg-white text-[#080808] text-sm"
              />
            </div>
            <button
              type="submit"
              className="h-12 px-6 rounded-full bg-[#012d61] hover:bg-[#002443] text-white text-sm font-semibold"
            >
              Search
            </button>
            {(activeLetter || query) && (
              <Link
                href="/diseases-conditions"
                className="h-12 px-4 rounded-full border border-white/60 text-white text-xs font-semibold flex items-center"
              >
                Reset
              </Link>
            )}
          </form>

          {/* A-Z Letter Strip */}
          <div>
            <p className="text-xs font-semibold text-[#e8f0f9] mb-2.5">
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
                    className={`mc-alpha-btn ${
                      isSelected
                        ? "!bg-white !text-[#004181] !border-white shadow"
                        : ""
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

      <div className="mc-container py-12 space-y-10">
        {/* Global Search Cross-Entity Results when ?q= is active */}
        {query && globalHits.length > 0 && (
          <div className="bg-white rounded-2xl border border-[#d6d6d6] p-6 space-y-4">
            <h2 className="font-bold text-lg text-[#080808]">
              Cross-Platform Search Matches for &ldquo;{query}&rdquo; (
              {globalHits.length})
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {globalHits.map((hit) => (
                <Link
                  key={`${hit.type}-${hit.id}`}
                  href={hit.href}
                  className="p-3.5 rounded-xl border border-[#d6d6d6] hover:border-[#0057b8] hover:bg-[#e8f0f9]/40 flex items-center justify-between gap-3"
                >
                  <div>
                    <span className="inline-block text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-[#e8f0f9] text-[#004181] mr-2">
                      {hit.type}
                    </span>
                    <span className="font-semibold text-sm text-[#080808]">
                      {hit.titleEn}
                    </span>
                    <p className="text-xs text-[#686868] mt-0.5">
                      {hit.subtitleEn}
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-[#0057b8] shrink-0" />
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Conditions List */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="mc-serif text-2xl md:text-3xl text-[#080808]">
              {activeLetter
                ? `Conditions Starting with "${activeLetter}" (${conditions.length})`
                : `All Published Conditions (${conditions.length})`}
            </h2>
          </div>

          {conditions.length === 0 ? (
            <div className="bg-white rounded-2xl border border-[#d6d6d6] p-8 text-center space-y-3">
              <p className="text-base font-semibold text-[#080808]">
                No published condition guides found for that filter.
              </p>
              <Link href="/diseases-conditions" className="mc-btn-secondary">
                View All Published Conditions
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {conditions.map((cond) => {
                const dept = departments.find(
                  (d) => d.id === cond.departmentId
                );
                return (
                  <article
                    key={cond.id}
                    className="bg-white rounded-2xl border border-[#d6d6d6] p-6 shadow-sm hover:border-[#0057b8] transition-all flex flex-col justify-between gap-4"
                  >
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between gap-2 text-xs">
                        <span className="px-2.5 py-0.5 rounded-full bg-[#e8f0f9] text-[#004181] font-bold">
                          Letter {cond.firstLetter} • {dept?.nameEn}
                        </span>
                        <span className="text-[#686868] inline-flex items-center gap-1">
                          <ShieldCheck className="w-3.5 h-3.5 text-[#0057b8]" />
                          Reviewed {cond.lastReviewedAt}
                        </span>
                      </div>

                      <h3 className="mc-serif text-2xl text-[#080808]">
                        <Link
                          href={`/diseases-conditions/${cond.slug}`}
                          className="hover:text-[#0057b8] hover:underline"
                        >
                          {cond.nameEn}
                        </Link>
                      </h3>
                      <p className="text-sm font-semibold text-[#004181]">
                        {cond.nameBn}
                      </p>
                      <p className="text-sm text-[#424242] leading-relaxed">
                        {cond.summaryEn}
                      </p>
                      <p className="text-xs text-[#686868] leading-relaxed">
                        {cond.summaryBn}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-[#f2f2f2] flex items-center justify-between text-xs">
                      <span className="text-[#686868]">
                        Reviewed by: {cond.reviewedByEn}
                      </span>
                      <Link
                        href={`/diseases-conditions/${cond.slug}`}
                        className="inline-flex items-center gap-1 font-bold text-[#004181] hover:text-[#0057b8]"
                      >
                        <span>Read Full Guide</span>
                        <ChevronRight className="w-4 h-4" />
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
  );
}

