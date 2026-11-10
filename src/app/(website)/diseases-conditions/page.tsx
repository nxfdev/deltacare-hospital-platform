import React from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import { executeGlobalSearch, getPublishedConditions } from "@/server/services/publicQueryService";
import { getServerLocale } from "@/lib/i18n/server";
import { Reveal } from "@/components/ui/Reveal";

export const dynamic = "force-dynamic";

const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

export default async function DiseasesConditionsPage({
  searchParams,
}: {
  searchParams: Promise<{ letter?: string; q?: string }>;
}) {
  const sp = await searchParams;
  const locale = await getServerLocale();
  const bn = locale === "bn";
  const activeLetter = bn ? "" : sp.letter?.toUpperCase() || "";
  const query = sp.q?.trim() || "";

  const all = getPublishedConditions();
  const available = new Set(all.map((c) => c.firstLetter.toUpperCase()));
  let conditions = getPublishedConditions({
    letter: activeLetter || undefined,
    query: query || undefined,
  });
  if (bn && !query) conditions = [...conditions].sort((a, b) => a.nameBn.localeCompare(b.nameBn, "bn"));
  const otherHits = query
    ? executeGlobalSearch(query, locale).filter((h) => h.type !== "CONDITION").slice(0, 8)
    : [];

  return (
    <div className="bg-white">
      <section className="w-full bg-[#012d61] text-white">
        <div className="mc-container max-w-7xl mx-auto px-6 sm:px-10 lg:px-12 py-16 md:py-24">
          <h1 className="mc-serif text-4xl sm:text-5xl lg:text-6xl font-normal tracking-tight">
            {bn ? "রোগ ও শারীরিক অবস্থা" : "Diseases & conditions"}
          </h1>
          <p className="mt-5 max-w-2xl text-lg text-white/80">
            {bn
              ? "লক্ষণ, কারণ, রোগনির্ণয় ও এভারকেয়ারে চিকিৎসা সম্পর্কে সহজ ভাষায় জানুন।"
              : "Clear guides to symptoms, causes, diagnosis and treatment at Evercare."}
          </p>
          <form action="/diseases-conditions" method="GET" className="mt-8 max-w-2xl">
            <label htmlFor="cond-q" className="sr-only">
              {bn ? "খুঁজুন" : "Search"}
            </label>
            <div className="relative">
              <Search className="w-5 h-5 text-[#6b7280] absolute left-5 top-1/2 -translate-y-1/2" />
              <input
                id="cond-q"
                type="search"
                name="q"
                defaultValue={query}
                placeholder={bn ? "রোগ, লক্ষণ বা ডাক্তার খুঁজুন…" : "Search a condition, symptom or doctor…"}
                className="w-full h-14 rounded-full pl-14 pr-32 bg-white text-[#0b1b33] text-base outline-none"
              />
              <button
                type="submit"
                className="absolute right-1.5 top-1/2 -translate-y-1/2 h-11 px-6 rounded-full bg-[#0057b8] hover:bg-[#004a9c] text-white font-medium transition-colors"
              >
                {bn ? "খুঁজুন" : "Search"}
              </button>
            </div>
          </form>
        </div>
      </section>

      <div className="mc-container max-w-7xl mx-auto px-6 sm:px-10 lg:px-12 py-16">
        {!bn && (
          <nav aria-label="A–Z" className="flex flex-wrap gap-1.5 mb-12">
            <Link
              href="/diseases-conditions"
              className={`h-10 px-4 rounded-full flex items-center text-sm transition-colors ${
                !activeLetter && !query ? "bg-[#0b1b33] text-white" : "text-[#374151] hover:bg-[#f3f4f6]"
              }`}
            >
              All
            </Link>
            {LETTERS.map((l) =>
              available.has(l) ? (
                <Link
                  key={l}
                  href={`/diseases-conditions?letter=${l}`}
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-sm transition-colors ${
                    activeLetter === l ? "bg-[#0b1b33] text-white" : "text-[#374151] hover:bg-[#f3f4f6]"
                  }`}
                >
                  {l}
                </Link>
              ) : (
                <span key={l} className="w-10 h-10 flex items-center justify-center text-sm text-[#d1d5db]">
                  {l}
                </span>
              )
            )}
          </nav>
        )}

        {query && (
          <p className="mb-8 text-[#4b5563]">
            {bn ? `"${query}" এর ফলাফল` : `Results for "${query}"`}{" "}
            <Link href="/diseases-conditions" className="ml-2 text-[#0057b8] hover:underline">
              {bn ? "মুছুন" : "Clear"}
            </Link>
          </p>
        )}

        {conditions.length === 0 && otherHits.length === 0 ? (
          <p className="py-16 text-center text-[#6b7280]">
            {bn ? "কিছু পাওয়া যায়নি। অন্য বানানে চেষ্টা করুন।" : "Nothing found. Try a different spelling."}
          </p>
        ) : (
          <div className="grid gap-x-16 md:grid-cols-2 lg:grid-cols-3">
            {conditions.map((c, i) => (
              <Reveal key={c.id} delay={(i % 3) * 0.04}>
                <Link href={`/diseases-conditions/${c.slug}`} className="group block py-6 border-b border-[#eef0f3]">
                  <h2 className="text-xl font-semibold text-[#0b1b33] group-hover:text-[#0057b8] transition-colors">
                    {bn ? c.nameBn : c.nameEn}
                  </h2>
                  <p className="mt-1.5 text-[#6b7280] line-clamp-2">{bn ? c.summaryBn : c.summaryEn}</p>
                </Link>
              </Reveal>
            ))}
          </div>
        )}

        {otherHits.length > 0 && (
          <section className="mt-16">
            <h2 className="mc-serif text-2xl text-[#0b1b33]">{bn ? "অন্যান্য ফলাফল" : "Also matching"}</h2>
            <ul className="mt-4 grid gap-x-16 md:grid-cols-2">
              {otherHits.map((h) => (
                <li key={h.type + h.id}>
                  <Link href={h.href} className="group block py-4 border-b border-[#eef0f3]">
                    <span className="font-medium text-[#0b1b33] group-hover:text-[#0057b8]">{h.title}</span>
                    <span className="ml-2 text-sm text-[#9ca3af]">{h.categoryLabel}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </div>
  );
}
