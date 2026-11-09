import React from "react";
import Link from "next/link";
import { Bell, Calendar, Pin, ArrowRight } from "lucide-react";
import {
  getPublishedBranches,
  getPublishedHospitalNotices,
} from "@/server/services/publicQueryService";

export const dynamic = "force-dynamic";

export default function HospitalNoticesPage() {
  const notices = getPublishedHospitalNotices();
  const branches = getPublishedBranches();

  return (
    <div className="min-h-screen bg-white">
      {/* Full-bleed Stretched Blue Hero Header */}
      <div className="w-full bg-[#012d61] text-white py-14 md:py-20 border-b border-[#001f44]">
        <div className="mc-container max-w-7xl mx-auto px-6 sm:px-10 lg:px-12 space-y-4">
          <p className="text-xs sm:text-sm font-bold uppercase tracking-widest text-[#93c5fd]">
            Care at DeltaCare • Official Hospital Bulletins &amp; Chamber Advisories
          </p>
          <h1 className="mc-serif text-3xl sm:text-5xl lg:text-[54px] font-bold text-white tracking-tight leading-tight">
            Hospital Notices &amp; Patient Advisories
          </h1>
          <p className="text-xl text-[#c5e2f9] font-medium">
            হাসপাতাল বিজ্ঞপ্তি ও রোগীদের জন্য জরুরি নির্দেশনা
          </p>
          <p className="text-base sm:text-lg text-[#e8f0f9] max-w-3xl leading-relaxed">
            Stay informed on special clinical clinics, branch openings, chamber
            schedule updates, and outpatient visiting guidelines across DeltaCare.
          </p>
        </div>
      </div>

      {/* Main Body - Unboxed Editorial List */}
      <div className="w-full py-12 md:py-16">
        <div className="mc-container max-w-7xl mx-auto px-6 sm:px-10 lg:px-12 space-y-12">
          <div className="divide-y divide-[#e5e7eb]">
            {notices.map((notice) => {
              const branch = branches.find((b) => b.id === notice.branchId);
              return (
                <article
                  key={notice.id}
                  className="py-10 first:pt-0 space-y-4"
                >
                  <div className="flex flex-wrap items-center gap-3 text-xs font-bold uppercase tracking-wider">
                    {notice.isPinned && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#e8f0f9] text-[#0057b8]">
                        <Pin className="w-3.5 h-3.5" />
                        Pinned Notice
                      </span>
                    )}
                    <span className="inline-flex items-center gap-1 text-[#004181]">
                      <Bell className="w-3.5 h-3.5 text-[#0057b8]" />
                      {notice.category}
                    </span>
                    {branch && (
                      <span className="text-[#4b5563]">
                        • {branch.nameEn} ({branch.nameBn})
                      </span>
                    )}
                    <span className="text-[#6b7280]">
                      • Published {notice.publishedAt.slice(0, 10)}
                    </span>
                  </div>

                  <h2 className="mc-serif text-2xl sm:text-3xl text-[#080808]">
                    {notice.titleEn}
                  </h2>
                  <p className="text-lg font-semibold text-[#004181]">
                    {notice.titleBn}
                  </p>

                  <p className="text-base text-[#374151] leading-relaxed max-w-4xl">
                    {notice.bodyEn}
                  </p>
                  <p className="text-sm text-[#4b5563] leading-relaxed max-w-4xl">
                    {notice.bodyBn}
                  </p>

                  <div className="pt-2 flex flex-wrap items-center gap-4">
                    <Link
                      href="/request-appointment"
                      className="mc-btn-primary !py-2 !px-5 text-xs inline-flex items-center gap-1.5"
                    >
                      <Calendar className="w-3.5 h-3.5" />
                      <span>Request Appointment</span>
                    </Link>
                    <Link
                      href="/doctors"
                      className="inline-flex items-center gap-1 text-sm font-bold text-[#0057b8] hover:underline"
                    >
                      <span>Browse Specialist Chambers</span>
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

