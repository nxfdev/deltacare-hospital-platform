"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Search,
  Award,
  Calendar,
  Building2,
  Globe2,
  CheckCircle2,
  Filter,
} from "lucide-react";
import { Branch, Department, Doctor, Specialty } from "@/types/domain";
import { useLocale } from "@/lib/i18n/LocaleContext";

export function DoctorsDirectoryClient({
  doctors,
  departments,
  branches,
  specialties,
}: {
  doctors: Doctor[];
  departments: Department[];
  branches: Branch[];
  specialties: Specialty[];
}) {
  const { locale } = useLocale();
  const [query, setQuery] = useState("");
  const [selectedDeptId, setSelectedDeptId] = useState("");
  const [selectedBranchId, setSelectedBranchId] = useState("");
  const [selectedSpecialtyId, setSelectedSpecialtyId] = useState("");
  const [selectedLanguage, setSelectedLanguage] = useState("");

  const filtered = doctors.filter((doc) => {
    if (selectedDeptId && doc.departmentId !== selectedDeptId) return false;
    if (
      selectedBranchId &&
      !doc.branches.some(
        (b) => b.branchId === selectedBranchId && b.status === "ACTIVE"
      )
    ) {
      return false;
    }
    if (
      selectedSpecialtyId &&
      !doc.specialtyIds.includes(selectedSpecialtyId)
    ) {
      return false;
    }
    if (
      selectedLanguage &&
      !doc.languagesEn.some(
        (l) => l.toLowerCase() === selectedLanguage.toLowerCase()
      )
    ) {
      return false;
    }
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      const hay = [
        doc.nameEn,
        doc.nameBn,
        doc.designationEn,
        doc.designationBn,
        doc.qualificationsEn,
        doc.bmdcRegistrationNo,
        ...doc.clinicalInterestsEn,
      ]
        .join(" ")
        .toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-white">
      {/* Full-bleed Stretched Blue Hero Header */}
      <div className="w-full bg-[#012d61] text-white py-14 md:py-20 border-b border-[#001f44]">
        <div className="mc-container max-w-7xl mx-auto px-6 sm:px-10 lg:px-12 space-y-4">
          <p className="text-xs sm:text-sm font-bold uppercase tracking-widest text-[#93c5fd]">
            {locale === "bn"
              ? "ডেল্টাকেয়ারে সেবা • অনুমোদিত চিকিৎসক ডিরেক্টরি"
              : "Care at DeltaCare • Verified Specialist Directory"}
          </p>
          <h1 className="mc-serif text-3xl sm:text-5xl lg:text-[54px] font-bold text-white tracking-tight leading-tight">
            {locale === "bn"
              ? "বিশেষজ্ঞ চিকিৎসক খুঁজুন"
              : "Find a Verified Specialist"}
          </h1>
          <p className="text-xl text-[#c5e2f9] font-medium">
            বিএমডিসি-নিবন্ধিত পরামর্শক ও ক্লিনিক্যাল বিশেষজ্ঞ
          </p>
          <p className="text-base sm:text-lg text-[#e8f0f9] max-w-3xl leading-relaxed">
            {locale === "bn"
              ? "বিভাগ, স্পেশালিটি, শাখা এবং ভাষা অনুযায়ী বিএমডিসি-নিবন্ধিত বিশেষজ্ঞ চিকিৎসকদের সময়সূচী ও অনুমোদিত কনসালটেশন ফি দেখুন।"
              : "Search and filter BMDC-registered consultants by department, specialty, hospital branch, and consultation language. Every profile displays verified chamber schedules and effective-dated fees."}
          </p>
        </div>
      </div>

      <div className="w-full py-12 md:py-16">
        <div className="mc-container max-w-7xl mx-auto px-6 sm:px-10 lg:px-12 space-y-12">
          {/* Unboxed Filter Bar */}
          <div className="pb-8 border-b border-[#e5e7eb] space-y-4">
            <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-[#0057b8]">
              <Filter className="w-4 h-4" />
              <span>
                {locale === "bn"
                  ? "চিকিৎসক অনুসন্ধান ও ফিল্টার"
                  : "Filter Specialists"}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="relative">
                <Search className="w-4 h-4 text-[#6b7280] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={
                    locale === "bn"
                      ? "নাম, বিএমডিসি বা রোগ..."
                      : "Doctor name, BMDC, interest..."
                  }
                  className="w-full h-11 pl-10 pr-3 border border-[#9ca3af] focus:border-[#0057b8] text-sm outline-none"
                />
              </div>

            <select
              aria-label="Filter by Department"
              value={selectedDeptId}
              onChange={(e) => setSelectedDeptId(e.target.value)}
              className="h-11 px-3 rounded-lg border border-[#757575] text-sm bg-white"
            >
              <option value="">
                {locale === "bn" ? "সকল বিভাগ" : "All Departments"}
              </option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {locale === "bn" ? d.nameBn : d.nameEn}
                </option>
              ))}
            </select>

            <select
              aria-label="Filter by Specialty"
              value={selectedSpecialtyId}
              onChange={(e) => setSelectedSpecialtyId(e.target.value)}
              className="h-11 px-3 rounded-lg border border-[#757575] text-sm bg-white"
            >
              <option value="">
                {locale === "bn" ? "সকল স্পেশালিটি" : "All Specialties"}
              </option>
              {specialties.map((s) => (
                <option key={s.id} value={s.id}>
                  {locale === "bn" ? s.nameBn : s.nameEn}
                </option>
              ))}
            </select>

            <select
              aria-label="Filter by Branch"
              value={selectedBranchId}
              onChange={(e) => setSelectedBranchId(e.target.value)}
              className="h-11 px-3 rounded-lg border border-[#757575] text-sm bg-white"
            >
              <option value="">
                {locale === "bn" ? "সকল শাখা" : "All Hospital Branches"}
              </option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {locale === "bn" ? b.nameBn : b.nameEn}
                </option>
              ))}
            </select>

            <select
              aria-label="Filter by Language"
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value)}
              className="h-11 px-3 rounded-lg border border-[#757575] text-sm bg-white"
            >
              <option value="">
                {locale === "bn" ? "সকল ভাষা" : "All Languages"}
              </option>
              <option value="Bangla">Bangla (বাংলা)</option>
              <option value="English">English</option>
            </select>
          </div>
        </div>

        {/* Results Count */}
        <div className="flex items-center justify-between text-sm text-[#424242]">
          <p>
            {locale === "bn"
              ? `${filtered.length} জন অনুমোদিত বিশেষজ্ঞ চিকিৎসক পাওয়া গেছে`
              : `Showing ${filtered.length} verified published specialists`}
          </p>
          {(query ||
            selectedDeptId ||
            selectedBranchId ||
            selectedSpecialtyId ||
            selectedLanguage) && (
            <button
              type="button"
              onClick={() => {
                setQuery("");
                setSelectedDeptId("");
                setSelectedBranchId("");
                setSelectedSpecialtyId("");
                setSelectedLanguage("");
              }}
              className="text-[#0057b8] font-semibold underline"
            >
              {locale === "bn" ? "ফিল্টার রিসেট করুন" : "Reset all filters"}
            </button>
          )}
        </div>

        {/* Specialist Editorial Grid - Unboxed */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-14">
          {filtered.map((doc) => {
            const dept = departments.find((d) => d.id === doc.departmentId);
            const primaryBranchAssign = doc.branches[0];
            const branchObj = branches.find(
              (b) => b.id === primaryBranchAssign?.branchId
            );
            const scheduleRule = primaryBranchAssign?.scheduleRules[0];

            return (
              <article
                key={doc.id}
                className="pb-8 border-b border-[#e5e7eb] flex flex-col justify-between gap-6"
              >
                <div className="flex flex-col sm:flex-row gap-5 items-start">
                  <img
                    src={doc.imageUrl}
                    alt={locale === "bn" ? doc.nameBn : doc.nameEn}
                    className="w-24 h-24 rounded-full object-cover border-2 border-[#0057b8] shrink-0 bg-[#e8f0f9]"
                  />
                  <div className="space-y-2 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-[#0057b8]">
                        <Award className="w-3.5 h-3.5" />
                        BMDC: {doc.bmdcRegistrationNo}
                      </span>
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#065f46]">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        {locale === "bn" ? "যাচাইকৃত" : "Verified"}
                      </span>
                    </div>

                    <h2 className="text-2xl font-bold text-[#080808]">
                      <Link
                        href={`/doctors/${doc.slug}`}
                        className="hover:text-[#0057b8] transition-colors"
                      >
                        {locale === "bn" ? doc.nameBn : doc.nameEn}
                      </Link>
                    </h2>

                    <p className="text-base font-semibold text-[#004181]">
                      {locale === "bn" ? doc.designationBn : doc.designationEn}{" "}
                      {dept
                        ? `• ${locale === "bn" ? dept.nameBn : dept.nameEn}`
                        : ""}
                    </p>

                    <p className="text-sm text-[#6b7280]">
                      {locale === "bn"
                        ? doc.qualificationsBn
                        : doc.qualificationsEn}{" "}
                      • {doc.experienceYears}{" "}
                      {locale === "bn" ? "বছরের অভিজ্ঞতা" : "years experience"}
                    </p>

                    <div className="flex flex-wrap gap-3 pt-1 text-sm text-[#4b5563]">
                      {branchObj && (
                        <span className="inline-flex items-center gap-1">
                          <Building2 className="w-3.5 h-3.5 text-[#0057b8]" />
                          {locale === "bn" ? branchObj.nameBn : branchObj.nameEn}{" "}
                          ({primaryBranchAssign.roomNumber})
                        </span>
                      )}
                      <span className="inline-flex items-center gap-1">
                        <Globe2 className="w-3.5 h-3.5 text-[#0057b8]" />
                        {(locale === "bn"
                          ? doc.languagesBn
                          : doc.languagesEn
                        ).join(", ")}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-[#f3f4f6] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="text-sm space-y-0.5">
                    <p className="text-[#6b7280]">
                      {scheduleRule
                        ? `${
                            locale === "bn"
                              ? scheduleRule.weekdayLabelBn
                              : scheduleRule.weekdayLabelEn
                          } (${scheduleRule.startTime}–${scheduleRule.endTime})`
                        : "Chamber by appointment"}
                    </p>
                    <p className="font-bold text-base text-[#080808]">
                      {locale === "bn" ? "কনসালটেশন ফি:" : "Consultation Fee:"}{" "}
                      BDT {doc.consultationFeeBdt}{" "}
                      <span className="font-normal text-xs text-[#6b7280]">
                        (Follow-up: BDT {doc.followupFeeBdt} • Effective{" "}
                        {doc.feeEffectiveFrom})
                      </span>
                    </p>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <Link
                      href={`/doctors/${doc.slug}`}
                      className="mc-btn-secondary !py-2 !px-4 text-xs"
                    >
                      {locale === "bn" ? "প্রোফাইল" : "View Profile"}
                    </Link>
                    <Link
                      href={`/request-appointment?doctorId=${encodeURIComponent(
                        doc.id
                      )}`}
                      className="mc-btn-primary !py-2 !px-4 text-xs inline-flex items-center gap-1.5"
                    >
                      <Calendar className="w-3.5 h-3.5" />
                      <span>
                        {locale === "bn"
                          ? "অ্যাপয়েন্টমেন্ট"
                          : "Request Appointment"}
                      </span>
                    </Link>
                  </div>
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

