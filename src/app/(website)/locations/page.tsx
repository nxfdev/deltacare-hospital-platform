import React from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { getPublishedBranches } from "@/server/services/publicQueryService";
import { getServerLocale } from "@/lib/i18n/server";
import { Reveal } from "@/components/ui/Reveal";

export const dynamic = "force-dynamic";

export default async function LocationsPage() {
  const bn = (await getServerLocale()) === "bn";
  const branches = getPublishedBranches();

  return (
    <div className="bg-white">
      <section className="w-full bg-[#012d61] text-white">
        <div className="mc-container max-w-7xl mx-auto px-6 sm:px-10 lg:px-12 py-16 md:py-24">
          <h1 className="mc-serif text-4xl sm:text-5xl lg:text-6xl font-normal tracking-tight">
            {bn ? "আমাদের শাখাসমূহ" : "Our locations"}
          </h1>
          <p className="mt-5 max-w-2xl text-lg text-white/80">
            {bn
              ? "প্রতিটি শাখায় ২৪/৭ জরুরি বিভাগ, বিশেষজ্ঞ চেম্বার ও ডায়াগনস্টিক সেবা।"
              : "Every branch has a 24/7 emergency department, specialist chambers and diagnostics."}
          </p>
        </div>
      </section>

      <div className="mc-container max-w-7xl mx-auto px-6 sm:px-10 lg:px-12 py-20 space-y-20">
        <div className="grid gap-x-10 gap-y-16 md:grid-cols-2 lg:grid-cols-3">
          {branches.map((b, i) => (
            <Reveal key={b.id} as="article" delay={(i % 3) * 0.06} className="group">
              <Link href={`/locations/${b.slug}`} className="block">
                <div className="aspect-[4/3] overflow-hidden bg-[#eef2f6]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={b.imageUrl}
                    alt={bn ? b.nameBn : b.nameEn}
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                </div>
                <h2 className="mt-5 flex items-center justify-between gap-3 text-2xl font-semibold text-[#0b1b33] group-hover:text-[#0057b8] transition-colors">
                  {bn ? b.nameBn : b.nameEn}
                  <ArrowRight className="w-5 h-5 shrink-0 transition-transform group-hover:translate-x-1" />
                </h2>
                <p className="mt-1.5 text-[#6b7280]">{bn ? b.addressBn : b.addressEn}</p>
              </Link>
              <a href={`tel:${b.phone.replace(/\s/g, "")}`} className="mt-2 inline-block text-[#0057b8] hover:underline">
                {b.phone}
              </a>
            </Reveal>
          ))}
        </div>

        <p className="text-lg text-[#374151]">
          {bn ? "জরুরি প্রয়োজনে ২৪ ঘণ্টা কল করুন " : "For emergencies, call 24/7 "}
          <a href="tel:10666" className="font-semibold text-[#c62828] hover:underline">
            {bn ? "১০৬৬৬" : "10666"}
          </a>
        </p>
      </div>
    </div>
  );
}
