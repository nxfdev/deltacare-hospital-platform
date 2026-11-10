"use client";

import { fuzzyRecordScore, FUZZY_THRESHOLD } from "@/lib/fuzzy";
import React, { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
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
      const dept = departments.find((d) => d.id === doc.departmentId);
      const score = fuzzyRecordScore(q, [doc.nameEn, doc.nameBn, dept?.nameEn, dept?.nameBn], [
        doc.designationEn,
        doc.designationBn,
        doc.qualificationsEn,
        doc.qualificationsBn,
        doc.workplaceEn ?? "",
        doc.workplaceBn ?? "",
        doc.bmdcRegistrationNo,
        ...(doc.symptomTags ?? []),
        ...doc.clinicalInterestsEn,
        ...doc.clinicalInterestsBn,
      ]);
      if (score < FUZZY_THRESHOLD) return false;
    }
    return true;
  });

  const bn = locale === "bn";
  const QUICK = bn
    ? [
        { label: "ডেঙ্গু", query: "Dengue" },
        { label: "বুকে ব্যথা", query: "Chest Pain" },
        { label: "ফ্যাটি লিভার", query: "Fatty Liver" },
        { label: "ডায়াবেটিস", query: "Diabetes" },
        { label: "শিশুর জ্বর", query: "Child Fever" },
        { label: "গর্ভকালীন সেবা", query: "Pregnancy" },
      ]
    : [
        { label: "Dengue", query: "Dengue" },
        { label: "Chest pain", query: "Chest Pain" },
        { label: "Fatty liver", query: "Fatty Liver" },
        { label: "Diabetes", query: "Diabetes" },
        { label: "Child fever", query: "Child Fever" },
        { label: "Pregnancy", query: "Pregnancy" },
      ];
  const hasFilters = Boolean(query || selectedDeptId || selectedBranchId || selectedSpecialtyId || selectedLanguage);
  const selectCls =
    "h-12 rounded-lg border border-[#e5e7eb] bg-white px-4 text-[15px] text-[#0b1b33] focus:border-[#0057b8] outline-none";
  const num = (v: number) => (bn ? String(v).replace(/\d/g, (d) => "০১২৩৪৫৬৭৮৯"[Number(d)]) : String(v));

  return (
    <div className="bg-white">
      <section className="w-full bg-[#012d61] text-white">
        <div className="mc-container max-w-7xl mx-auto px-6 sm:px-10 lg:px-12 py-16 md:py-24">
          <h1 className="mc-serif text-4xl sm:text-5xl lg:text-6xl font-normal tracking-tight">
            {bn ? "ডাক্তার খুঁজুন" : "Find a doctor"}
          </h1>
          <p className="mt-5 max-w-2xl text-lg text-white/80">
            {bn
              ? "নাম, বিভাগ বা উপসর্গ লিখে খুঁজুন — বানান ভুল হলেও সমস্যা নেই।"
              : "Search by name, department or symptom — spelling mistakes are fine."}
          </p>
          <div className="relative mt-8 max-w-2xl">
            <Search className="w-5 h-5 text-[#6b7280] absolute left-5 top-1/2 -translate-y-1/2" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label={bn ? "ডাক্তার খুঁজুন" : "Search doctors"}
              placeholder={bn ? "যেমন: হৃদরোগ, ডেঙ্গু, ডা. রফিকুল…" : "e.g. cardiology, dengue, Dr. Rafiqul…"}
              className="w-full h-14 rounded-full pl-14 pr-5 bg-white text-[#0b1b33] text-base outline-none"
            />
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            {QUICK.map((pill) => (
              <button
                key={pill.query}
                type="button"
                onClick={() => setQuery(query === pill.query ? "" : pill.query)}
                className={`px-4 py-1.5 rounded-full text-sm transition-colors ${
                  query === pill.query ? "bg-white text-[#012d61]" : "bg-white/10 text-white hover:bg-white/20"
                }`}
              >
                {pill.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      <div className="mc-container max-w-7xl mx-auto px-6 sm:px-10 lg:px-12 py-14">
        <div className="flex flex-wrap items-center gap-3">
          <select aria-label={bn ? "বিভাগ" : "Department"} value={selectedDeptId} onChange={(e) => setSelectedDeptId(e.target.value)} className={selectCls}>
            <option value="">{bn ? "সকল বিভাগ" : "All departments"}</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {bn ? d.nameBn : d.nameEn}
              </option>
            ))}
          </select>
          <select aria-label={bn ? "শাখা" : "Branch"} value={selectedBranchId} onChange={(e) => setSelectedBranchId(e.target.value)} className={selectCls}>
            <option value="">{bn ? "সকল শাখা" : "All branches"}</option>
            {branches.map((b) => (
              <option key={b.id} value={b.id}>
                {bn ? b.nameBn : b.nameEn}
              </option>
            ))}
          </select>
          <span className="ml-auto text-sm text-[#6b7280]">
            {bn ? `${num(filtered.length)} জন ডাক্তার` : `${filtered.length} doctor${filtered.length === 1 ? "" : "s"}`}
          </span>
          {hasFilters && (
            <button
              type="button"
              onClick={() => {
                setQuery("");
                setSelectedDeptId("");
                setSelectedBranchId("");
                setSelectedSpecialtyId("");
                setSelectedLanguage("");
              }}
              className="text-sm text-[#0057b8] hover:underline"
            >
              {bn ? "মুছুন" : "Clear"}
            </button>
          )}
        </div>

        {filtered.length === 0 ? (
          <p className="py-24 text-center text-[#6b7280]">
            {bn ? "কোনো ডাক্তার পাওয়া যায়নি।" : "No doctors match your search."}
          </p>
        ) : (
          <div className="mt-12 grid gap-x-10 gap-y-14 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((doc, i) => {
              const dept = departments.find((d) => d.id === doc.departmentId);
              return (
                <motion.article
                  key={doc.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-40px" }}
                  transition={{ duration: 0.5, delay: (i % 3) * 0.06 }}
                  className="group"
                >
                  <Link href={`/doctors/${doc.slug}`} className="block">
                    <div className="aspect-[4/5] overflow-hidden bg-[#eef2f6]">
                      <img
                        src={doc.imageUrl}
                        alt={bn ? doc.nameBn : doc.nameEn}
                        className="h-full w-full object-cover object-top transition-transform duration-700 group-hover:scale-105"
                      />
                    </div>
                    <h2 className="mt-5 text-xl font-semibold text-[#0b1b33] group-hover:text-[#0057b8] transition-colors">
                      {bn ? doc.nameBn : doc.nameEn}
                    </h2>
                    <p className="mt-1 text-[#4b5563]">{dept ? (bn ? dept.nameBn : dept.nameEn) : ""}</p>
                    <p className="mt-2 text-sm text-[#6b7280]">
                      {bn ? "ফি" : "Fee"} ৳{num(doc.consultationFeeBdt)}
                    </p>
                  </Link>
                  <Link
                    href={`/appointments?doctor=${encodeURIComponent(doc.slug)}`}
                    className="mt-4 inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium text-[#0057b8] ring-1 ring-[#dbe3ee] hover:bg-[#0057b8] hover:text-white transition-colors"
                  >
                    {bn ? "অ্যাপয়েন্টমেন্ট নিন" : "Book appointment"}
                  </Link>
                </motion.article>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
