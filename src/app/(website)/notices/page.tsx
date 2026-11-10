import React from "react";
import { getPublishedBranches, getPublishedHospitalNotices } from "@/server/services/publicQueryService";
import { getServerLocale } from "@/lib/i18n/server";
import { Reveal } from "@/components/ui/Reveal";
import { toBnDigits } from "@/lib/i18n/digits";

export const dynamic = "force-dynamic";

export default async function HospitalNoticesPage() {
  const locale = await getServerLocale();
  const bn = locale === "bn";
  const notices = [...getPublishedHospitalNotices()].sort((a, b) => Number(b.isPinned) - Number(a.isPinned));
  const branches = getPublishedBranches();
  const fmtDate = (iso: string) => {
    const s = new Intl.DateTimeFormat(bn ? "bn-BD" : "en-GB", { day: "numeric", month: "long", year: "numeric" }).format(
      new Date(iso)
    );
    return bn ? toBnDigits(s) : s;
  };

  return (
    <div className="bg-white">
      <section className="w-full bg-[#012d61] text-white">
        <div className="mc-container max-w-7xl mx-auto px-6 sm:px-10 lg:px-12 py-16 md:py-24">
          <h1 className="mc-serif text-4xl sm:text-5xl lg:text-6xl font-normal tracking-tight">
            {bn ? "বিজ্ঞপ্তি" : "Notices"}
          </h1>
          <p className="mt-5 max-w-2xl text-lg text-white/80">
            {bn
              ? "বিশেষ ক্লিনিক, চেম্বারের সময় পরিবর্তন ও হাসপাতালের হালনাগাদ তথ্য।"
              : "Special clinics, chamber schedule changes and hospital updates."}
          </p>
        </div>
      </section>

      <div className="mc-container max-w-4xl mx-auto px-6 sm:px-10 py-20">
        {notices.length === 0 ? (
          <p className="text-center text-[#6b7280]">{bn ? "এখন কোনো বিজ্ঞপ্তি নেই।" : "No notices right now."}</p>
        ) : (
          <div className="divide-y divide-[#eef0f3]">
            {notices.map((n, i) => {
              const branch = branches.find((b) => b.id === n.branchId);
              return (
                <Reveal key={n.id} as="article" delay={Math.min(i, 3) * 0.05} className="py-10 first:pt-0 scroll-mt-24">
                  <span id={n.slug} />
                  <p className="text-sm text-[#6b7280]">
                    {fmtDate(n.publishedAt)}
                    {branch ? ` · ${bn ? branch.nameBn : branch.nameEn}` : ""}
                  </p>
                  <h2 className="mc-serif mt-2 text-2xl sm:text-3xl text-[#0b1b33]">{bn ? n.titleBn : n.titleEn}</h2>
                  <p className="mt-4 text-lg leading-relaxed text-[#374151]">{bn ? n.bodyBn : n.bodyEn}</p>
                </Reveal>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
