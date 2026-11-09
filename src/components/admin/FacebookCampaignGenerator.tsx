"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Calendar,
  Check,
  CheckCircle2,
  Copy,
  Download,
  Filter,
  Layers,
  MapPin,
  Palette,
  PhoneCall,
  RefreshCw,
  Sparkles,
  Stethoscope,
  UserCheck,
  X,
} from "lucide-react";
import { toPng } from "html-to-image";
import {
  DoctorFacebookSpotlight,
  FacebookCampaignResponse,
} from "@/server/services/facebookCampaignService";

interface BranchOption {
  id: string;
  nameEn: string;
}

interface DepartmentOption {
  id: string;
  nameEn: string;
}

type AspectRatioMode = "1:1" | "4:5";
type ThemeMode = "NAVY" | "EMERALD" | "ROYAL";
type LanguageMode = "BN_PRIMARY" | "EN_PRIMARY";

export function FacebookCampaignGenerator({
  embedded = false,
  initialDoctorId = null,
}: {
  embedded?: boolean;
  initialDoctorId?: string | null;
}) {
  const [date, setDate] = useState<string>(() => {
    return new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Dhaka",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date());
  });

  const [selectedBranch, setSelectedBranch] = useState<string>("ALL");
  const [selectedDept, setSelectedDept] = useState<string>("ALL");
  const [selectedDoctorFilter, setSelectedDoctorFilter] = useState<string>(
    initialDoctorId || "ALL"
  );
  const [aspectRatio, setAspectRatio] = useState<AspectRatioMode>("1:1");
  const [theme, setTheme] = useState<ThemeMode>("NAVY");
  const [languageMode, setLanguageMode] = useState<LanguageMode>("BN_PRIMARY");

  const [campaignData, setCampaignData] = useState<FacebookCampaignResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [copiedMaster, setCopiedMaster] = useState(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [downloadAllProgress, setDownloadAllProgress] = useState<string | null>(null);

  // Custom headline overrides per doctorId
  const [customHeadlines, setCustomHeadlines] = useState<Record<string, string>>({});

  const [branches, setBranches] = useState<BranchOption[]>([]);
  const [departments, setDepartments] = useState<DepartmentOption[]>([]);

  const cardRefs = useRef<Record<string, HTMLDivElement | null>>({});

  useEffect(() => {
    if (initialDoctorId) {
      setSelectedDoctorFilter(initialDoctorId);
    } else if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const docParam = params.get("doctor");
      if (docParam) {
        setSelectedDoctorFilter(docParam);
      }
    }
  }, [initialDoctorId]);

  const todayIso = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Dhaka",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());

  const tomorrowIso = (() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Dhaka",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(d);
  })();

  const fetchCampaign = useCallback(async () => {
    setLoading(true);
    try {
      const qBranch = selectedBranch !== "ALL" ? `&branchId=${encodeURIComponent(selectedBranch)}` : "";
      const qDept = selectedDept !== "ALL" ? `&departmentId=${encodeURIComponent(selectedDept)}` : "";
      const res = await fetch(`/api/v1/admin/facebook-campaign?date=${date}${qBranch}${qDept}`, {
        cache: "no-store",
      });
      const data: FacebookCampaignResponse = await res.json();
      if (data.ok) {
        setCampaignData(data);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [date, selectedBranch, selectedDept]);

  useEffect(() => {
    fetch("/api/v1/staff/overview")
      .then((r) => r.json())
      .then((d) => {
        if (d.branches) setBranches(d.branches);
        if (d.departments) setDepartments(d.departments);
      })
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    void fetchCampaign();
  }, [fetchCampaign]);

  const displayedDoctors = (campaignData?.doctors || []).filter((doc) =>
    selectedDoctorFilter === "ALL" ? true : doc.doctorId === selectedDoctorFilter
  );

  const handleCopyCaption = async (caption: string, idx: number) => {
    try {
      await navigator.clipboard.writeText(caption);
      setCopiedIndex(idx);
      setTimeout(() => setCopiedIndex(null), 3000);
    } catch {
      // fallback
    }
  };

  const handleCopyMasterCaption = async () => {
    if (!campaignData?.masterDailyCaption) return;
    try {
      await navigator.clipboard.writeText(campaignData.masterDailyCaption);
      setCopiedMaster(true);
      setTimeout(() => setCopiedMaster(false), 3000);
    } catch {
      // fallback
    }
  };

  const downloadCardPng = async (doc: DoctorFacebookSpotlight) => {
    const key = `${doc.doctorId}-${doc.branchId}`;
    const node = cardRefs.current[key];
    if (!node) return;
    setDownloadingId(key);
    try {
      const dataUrl = await toPng(node, {
        pixelRatio: 2,
        cacheBust: true,
      });
      const link = document.createElement("a");
      link.download = `doctor-spotlight-${doc.doctorSlug}-${date}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error("Failed to export PNG", err);
    } finally {
      setDownloadingId(null);
    }
  };

  const downloadAllCards = async () => {
    if (displayedDoctors.length === 0) return;
    setDownloadAllProgress("Starting sequential PNG export...");
    for (let i = 0; i < displayedDoctors.length; i++) {
      const doc = displayedDoctors[i];
      setDownloadAllProgress(`Downloading card ${i + 1} of ${displayedDoctors.length}: ${doc.nameEn}...`);
      await downloadCardPng(doc);
      await new Promise((r) => setTimeout(r, 600));
    }
    setDownloadAllProgress("All cards downloaded successfully!");
    setTimeout(() => setDownloadAllProgress(null), 4000);
  };

  // Curated hospital themes matching Phase 3 specification:
  // 1. DeltaCare Deep Navy (#012d61)
  // 2. Ibn Sina Clinical Emerald (#065f46)
  // 3. Royal Medical Blue (#0057b8)
  const themeStyles = {
    NAVY: {
      cardBg: "bg-[#012d61]",
      headerBg: "bg-[#001f44]",
      accentBg: "bg-[#0057b8]",
      accentText: "text-sky-300",
      boxBg: "bg-[#00224d]",
      boxBorder: "border-[#0057b8]/60",
      pillBg: "bg-[#0057b8]/40 border-[#0057b8]",
      footerBg: "bg-[#001835]",
    },
    EMERALD: {
      cardBg: "bg-[#065f46]",
      headerBg: "bg-[#022c22]",
      accentBg: "bg-[#059669]",
      accentText: "text-emerald-200",
      boxBg: "bg-[#044332]",
      boxBorder: "border-emerald-400/50",
      pillBg: "bg-[#059669]/40 border-emerald-400",
      footerBg: "bg-[#022c22]",
    },
    ROYAL: {
      cardBg: "bg-[#0057b8]",
      headerBg: "bg-[#012d61]",
      accentBg: "bg-[#0284c7]",
      accentText: "text-sky-200",
      boxBg: "bg-[#013b82]",
      boxBorder: "border-sky-300/50",
      pillBg: "bg-[#012d61]/60 border-sky-300",
      footerBg: "bg-[#012d61]",
    },
  }[theme];

  return (
    <div className="space-y-8 bg-white text-slate-900">
      {/* Top Banner if not embedded */}
      {!embedded && (
        <section className="w-full bg-[#012d61] text-white py-10 md:py-12 border-b border-[#0057b8]/30">
          <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-10">
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.22em] text-sky-300">
                  Daily Social Media Marketing &amp; Patient Engagement Suite
                </p>
                <h1 className="mc-serif mt-2 text-3xl sm:text-4xl lg:text-5xl font-normal tracking-tight text-white">
                  Daily Facebook Doctor Spotlight Studio
                </h1>
                <p className="mt-2 text-sm sm:text-base text-slate-200 max-w-3xl">
                  Automatically generates agency-grade 1080×1080 &amp; 1080×1350 social spotlight cards and bilingual Facebook captions for every specialist holding chamber today.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={downloadAllCards}
                  className="inline-flex min-h-[44px] items-center gap-2 bg-[#0057b8] hover:bg-[#004494] text-white font-semibold px-4 py-2.5 text-xs uppercase tracking-wider transition-colors cursor-pointer"
                >
                  <Download className="h-4 w-4" />
                  Download All Today&apos;s Cards (PNG)
                </button>
                <button
                  type="button"
                  onClick={handleCopyMasterCaption}
                  className="inline-flex min-h-[44px] items-center gap-2 border border-white/30 bg-white/10 hover:bg-white/20 text-white font-semibold px-4 py-2.5 text-xs uppercase tracking-wider transition-colors cursor-pointer"
                >
                  {copiedMaster ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
                  Copy Combined Daily Roster Post
                </button>
              </div>
            </div>
          </div>
        </section>
      )}

      <div className={embedded ? "space-y-8" : "mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-10 space-y-8 pb-12"}>
        {/* Embedded Header Bar */}
        {embedded && (
          <div className="bg-[#012d61] text-white p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4 border border-[#012d61]">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-sky-300">
                Automated Social Media Studio · Live Chamber Roster Integration
              </p>
              <h2 className="mc-serif text-2xl sm:text-3xl font-normal text-white mt-1">
                Daily Facebook Doctor Spotlight Generator
              </h2>
              <p className="text-xs text-slate-300 mt-1">
                One-click 1080×1080 Square &amp; 1080×1350 Portrait PNG cards with bilingual Bangla + English Facebook captions.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={downloadAllCards}
                className="inline-flex min-h-[40px] items-center gap-1.5 bg-[#0057b8] hover:bg-[#004494] text-white px-3.5 py-2 text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
              >
                <Download className="h-3.5 w-3.5" />
                Download All Today&apos;s Cards ({displayedDoctors.length})
              </button>
              <button
                type="button"
                onClick={handleCopyMasterCaption}
                className="inline-flex min-h-[40px] items-center gap-1.5 border border-white/30 bg-white/10 hover:bg-white/20 text-white px-3.5 py-2 text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
              >
                {copiedMaster ? <Check className="h-3.5 w-3.5 text-emerald-300" /> : <Copy className="h-3.5 w-3.5" />}
                {copiedMaster ? "Copied Daily Roster!" : "Copy Combined Daily Roster Post"}
              </button>
            </div>
          </div>
        )}

        {/* Controls Bar */}
        <div className="border border-[#e5e7eb] bg-slate-50/80 p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#e5e7eb] pb-4">
            {/* Date Pickers */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 mr-1 flex items-center gap-1.5">
                <Calendar className="h-4 w-4 text-[#0057b8]" />
                Target Date:
              </span>
              <button
                type="button"
                onClick={() => setDate(todayIso)}
                className={`px-3 py-1.5 text-xs font-bold transition-colors cursor-pointer ${
                  date === todayIso
                    ? "bg-[#012d61] text-white"
                    : "bg-white border border-slate-300 text-slate-700 hover:bg-slate-100"
                }`}
              >
                Today (আজ · {todayIso})
              </button>
              <button
                type="button"
                onClick={() => setDate(tomorrowIso)}
                className={`px-3 py-1.5 text-xs font-bold transition-colors cursor-pointer ${
                  date === tomorrowIso
                    ? "bg-[#012d61] text-white"
                    : "bg-white border border-slate-300 text-slate-700 hover:bg-slate-100"
                }`}
              >
                Tomorrow (আগামীকাল · {tomorrowIso})
              </button>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="min-h-[36px] border border-slate-300 bg-white px-2.5 text-xs font-semibold tabular-nums"
              />
            </div>

            {/* Quick Action: Master Post Copy */}
            <div className="flex flex-wrap items-center gap-2">
              {selectedDoctorFilter !== "ALL" && (
                <button
                  type="button"
                  onClick={() => setSelectedDoctorFilter("ALL")}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-100 border border-amber-300 text-amber-900 text-xs font-bold uppercase tracking-wider cursor-pointer"
                >
                  <X className="h-3.5 w-3.5" />
                  Clear Spotlight Filter (Show All {campaignData?.totalDoctorsAvailable ?? 0})
                </button>
              )}
              <button
                type="button"
                onClick={downloadAllCards}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#0057b8] hover:bg-[#004494] text-white text-xs font-bold uppercase tracking-wider cursor-pointer"
              >
                <Download className="h-3.5 w-3.5" />
                Download All ({displayedDoctors.length} Cards)
              </button>
              <button
                type="button"
                onClick={handleCopyMasterCaption}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-[#012d61] text-[#012d61] hover:bg-slate-100 text-xs font-bold uppercase tracking-wider cursor-pointer"
              >
                {copiedMaster ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                {copiedMaster ? "Copied Roster!" : "Copy Combined Daily Roster Post"}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4 items-end">
            {/* Branch Filter */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                <Filter className="inline h-3 w-3 mr-1" />
                Branch Filter
              </label>
              <select
                value={selectedBranch}
                onChange={(e) => setSelectedBranch(e.target.value)}
                className="w-full min-h-[38px] border border-slate-300 bg-white px-3 text-xs font-semibold text-slate-800"
              >
                <option value="ALL">All Hospital Branches</option>
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.nameEn}
                  </option>
                ))}
              </select>
            </div>

            {/* Department Filter */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                <Stethoscope className="inline h-3 w-3 mr-1" />
                Department Filter
              </label>
              <select
                value={selectedDept}
                onChange={(e) => setSelectedDept(e.target.value)}
                className="w-full min-h-[38px] border border-slate-300 bg-white px-3 text-xs font-semibold text-slate-800"
              >
                <option value="ALL">All Clinical Departments</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.nameEn}
                  </option>
                ))}
              </select>
            </div>

            {/* Doctor Filter (supports NEEDS_PROMOTION deep link) */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                <UserCheck className="inline h-3 w-3 mr-1" />
                Specialist Focus
              </label>
              <select
                value={selectedDoctorFilter}
                onChange={(e) => setSelectedDoctorFilter(e.target.value)}
                className="w-full min-h-[38px] border border-slate-300 bg-white px-3 text-xs font-semibold text-slate-800"
              >
                <option value="ALL">All Available Doctors ({campaignData?.doctors.length ?? 0})</option>
                {(campaignData?.doctors || []).map((doc) => (
                  <option key={`${doc.doctorId}-${doc.branchId}`} value={doc.doctorId}>
                    {doc.nameEn} ({doc.branchNameEn})
                  </option>
                ))}
              </select>
            </div>

            {/* Aspect Ratio Toggle */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                <Layers className="inline h-3 w-3 mr-1" />
                Card Format &amp; Resolution
              </label>
              <div className="grid grid-cols-2 border border-slate-300 bg-white p-0.5">
                <button
                  type="button"
                  onClick={() => setAspectRatio("1:1")}
                  className={`py-1.5 text-xs font-bold cursor-pointer ${
                    aspectRatio === "1:1" ? "bg-[#012d61] text-white" : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  Square 1:1 (1080×1080)
                </button>
                <button
                  type="button"
                  onClick={() => setAspectRatio("4:5")}
                  className={`py-1.5 text-xs font-bold cursor-pointer ${
                    aspectRatio === "4:5" ? "bg-[#012d61] text-white" : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  Portrait 4:5 (1080×1350)
                </button>
              </div>
            </div>

            {/* Theme Selector */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                <Palette className="inline h-3 w-3 mr-1" />
                Card Visual Theme
              </label>
              <select
                value={theme}
                onChange={(e) => setTheme(e.target.value as ThemeMode)}
                className="w-full min-h-[38px] border border-slate-300 bg-white px-3 text-xs font-semibold text-slate-800"
              >
                <option value="NAVY">DeltaCare Deep Navy (#012d61)</option>
                <option value="EMERALD">Ibn Sina Clinical Emerald (#065f46)</option>
                <option value="ROYAL">Royal Medical Blue (#0057b8)</option>
              </select>
            </div>

            {/* Primary Language Toggle */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                Card Primary Language
              </label>
              <div className="grid grid-cols-2 border border-slate-300 bg-white p-0.5">
                <button
                  type="button"
                  onClick={() => setLanguageMode("BN_PRIMARY")}
                  className={`py-1.5 text-xs font-bold cursor-pointer ${
                    languageMode === "BN_PRIMARY" ? "bg-[#0057b8] text-white" : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  Bangla Primary
                </button>
                <button
                  type="button"
                  onClick={() => setLanguageMode("EN_PRIMARY")}
                  className={`py-1.5 text-xs font-bold cursor-pointer ${
                    languageMode === "EN_PRIMARY" ? "bg-[#0057b8] text-white" : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  English Primary
                </button>
              </div>
            </div>
          </div>

          {downloadAllProgress && (
            <div className="bg-[#012d61] text-white px-4 py-2.5 text-xs font-semibold flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-sky-300 animate-spin" />
              {downloadAllProgress}
            </div>
          )}
        </div>

        {/* Status Bar */}
        {campaignData && (
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#e5e7eb] pb-4">
            <div>
              <h2 className="mc-serif text-2xl font-normal text-[#012d61]">
                {campaignData.weekdayNameBn} ({campaignData.weekdayNameEn}) — {campaignData.date}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Showing <strong className="text-slate-900 tabular-nums">{displayedDoctors.length}</strong> of{" "}
                <strong className="text-slate-900 tabular-nums">{campaignData.totalDoctorsAvailable}</strong> specialists holding active chambers (automatically excludes doctors on full-day leave).
              </p>
            </div>
            <button
              type="button"
              onClick={() => void fetchCampaign()}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0057b8] hover:underline cursor-pointer"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
              Refresh Live Chamber Schedule
            </button>
          </div>
        )}

        {/* Cards Grid */}
        {loading && !campaignData ? (
          <div className="p-12 text-center border border-[#e5e7eb]">
            <RefreshCw className="h-6 w-6 animate-spin text-[#0057b8] mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-700">Building today&apos;s doctor social spotlight cards...</p>
          </div>
        ) : displayedDoctors.length === 0 ? (
          <div className="p-12 text-center border border-[#e5e7eb] bg-slate-50">
            <p className="text-base font-bold text-slate-800">No Active Doctor Chambers Found for This Selection</p>
            <p className="text-xs text-slate-500 mt-1">
              Try selecting another date, clearing the specialist filter, or switching branch/department filters.
            </p>
          </div>
        ) : (
          <div className="space-y-10">
            {displayedDoctors.map((doc, idx) => {
              const cardKey = `${doc.doctorId}-${doc.branchId}`;
              const defaultHighlight =
                doc.symptomTags.slice(0, 4).join(" · ") ||
                `${doc.departmentNameBn} বিশেষজ্ঞ পরামর্শ ও চিকিৎসা`;
              const headlineText = customHeadlines[doc.doctorId] ?? defaultHighlight;
              const isSquare = aspectRatio === "1:1";

              return (
                <div
                  key={cardKey}
                  className="border border-[#e5e7eb] bg-white grid grid-cols-1 xl:grid-cols-12 overflow-hidden"
                >
                  {/* Left Column: High-Craft Social Card Canvas Preview */}
                  <div className="xl:col-span-7 bg-slate-100/90 p-4 sm:p-6 flex flex-col items-center justify-center border-b xl:border-b-0 xl:border-r border-[#e5e7eb] overflow-x-auto">
                    <div className="mb-3 flex items-center justify-between w-full max-w-[540px] text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      <span>
                        Live Card Canvas ({isSquare ? "1080×1080 Square 1:1" : "1080×1350 Portrait 4:5"} @ 2x PNG)
                      </span>
                      <span className="text-[#0057b8] tabular-nums">BMDC #{doc.bmdcRegistrationNo}</span>
                    </div>

                    {/* Export Target Node (540px width × 2 pixelRatio = 1080px PNG output) */}
                    <div
                      ref={(el) => {
                        cardRefs.current[cardKey] = el;
                      }}
                      style={{
                        width: "540px",
                        minHeight: isSquare ? "540px" : "675px",
                      }}
                      className={`${themeStyles.cardBg} text-white relative flex flex-col justify-between overflow-hidden shadow-xl select-none`}
                    >
                      {/* Decorative Subtle Medical Grid & Radial Glow */}
                      <div
                        className="pointer-events-none absolute -top-24 -right-24 h-72 w-72 rounded-full opacity-20 blur-2xl"
                        style={{ background: "radial-gradient(circle, #38bdf8 0%, transparent 70%)" }}
                      />
                      <div
                        className="pointer-events-none absolute -bottom-24 -left-24 h-72 w-72 rounded-full opacity-15 blur-2xl"
                        style={{ background: "radial-gradient(circle, #0057b8 0%, transparent 70%)" }}
                      />

                      {/* 1. Top Header Bar */}
                      <div className={`${themeStyles.headerBg} px-6 py-4 flex items-center justify-between border-b border-white/15 relative z-10`}>
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 bg-[#0057b8] flex items-center justify-center font-serif font-bold text-lg text-white border border-white/30 shadow-xs">
                            Δ
                          </div>
                          <div>
                            <p className="text-sm font-bold tracking-tight text-white leading-none">
                              DELTACARE HOSPITAL
                            </p>
                            <p className="text-[11px] text-sky-300 font-medium mt-1">
                              ডেল্টাকেয়ার মাল্টিস্পেশালিটি হাসপাতাল · {doc.branchNameBn}
                            </p>
                          </div>
                        </div>

                        <div className="text-right">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-400/40">
                            <CheckCircle2 className="h-3 w-3" />
                            {languageMode === "BN_PRIMARY"
                              ? "আজকের বিশেষজ্ঞ চিকিৎসক চেম্বার"
                              : "Available Today"}
                          </span>
                          <p className="text-[11px] text-slate-300 mt-1 font-semibold tabular-nums">
                            {campaignData?.weekdayNameBn} · {campaignData?.date}
                          </p>
                        </div>
                      </div>

                      {/* 2. Center Body: Doctor Portrait, BMDC, Qualifications & Specialty Focus */}
                      <div className={`px-6 ${isSquare ? "py-4" : "py-7"} flex-1 flex flex-col justify-between relative z-10`}>
                        <div className="grid grid-cols-12 gap-5 items-center">
                          {/* Portrait Frame with High-Contrast Medical Monogram / SVG Avatar */}
                          <div className="col-span-4 flex flex-col items-center">
                            <div className="w-36 h-40 bg-gradient-to-b from-sky-900/80 to-[#001835] border-2 border-sky-400/50 flex flex-col items-center justify-center relative overflow-hidden shadow-md">
                              <div className="w-16 h-16 rounded-full bg-white/10 border border-white/25 flex items-center justify-center mb-1.5">
                                <Stethoscope className="h-8 w-8 text-sky-300" />
                              </div>
                              <span className="text-[10px] font-bold uppercase tracking-widest text-sky-200 px-2 text-center">
                                {doc.departmentNameEn}
                              </span>
                              <div className="absolute bottom-0 inset-x-0 bg-[#0057b8] text-white text-[9px] font-bold py-1 text-center tracking-wider uppercase tabular-nums">
                                BMDC: {doc.bmdcRegistrationNo}
                              </div>
                            </div>
                          </div>

                          {/* Doctor Identity & Credentials */}
                          <div className="col-span-8 space-y-2">
                            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 text-[11px] font-bold bg-white/10 text-sky-200 border border-white/15">
                              {doc.departmentNameBn} ({doc.departmentNameEn})
                            </div>

                            {languageMode === "BN_PRIMARY" ? (
                              <>
                                <h3 className="text-2xl font-bold text-white leading-snug">
                                  {doc.nameBn}
                                </h3>
                                <p className="text-xs font-semibold text-sky-200 tracking-wide">
                                  {doc.nameEn}
                                </p>
                              </>
                            ) : (
                              <>
                                <h3 className="mc-serif text-2xl font-bold text-white leading-snug">
                                  {doc.nameEn}
                                </h3>
                                <p className="text-sm font-semibold text-sky-200">
                                  {doc.nameBn}
                                </p>
                              </>
                            )}

                            <p className="text-xs font-bold text-amber-300 leading-relaxed">
                              {languageMode === "BN_PRIMARY" ? doc.qualificationsBn : doc.qualificationsEn}
                            </p>

                            <p className="text-xs text-slate-200 font-medium leading-snug">
                              {languageMode === "BN_PRIMARY" ? doc.designationBn : doc.designationEn}
                            </p>
                            <p className="text-[11px] text-slate-300 leading-snug">
                              {languageMode === "BN_PRIMARY" ? doc.workplaceBn : doc.workplaceEn}
                            </p>
                          </div>
                        </div>

                        {/* 3. Specialty & Disease Focus Banner */}
                        <div className={`mt-4 ${themeStyles.pillBg} border px-4 py-2.5`}>
                          <p className="text-[10px] font-bold uppercase tracking-wider text-sky-200">
                            চিকিৎসা ও পরামর্শ ক্ষেত্র (Clinical Focus &amp; Symptoms Treated):
                          </p>
                          <p className="text-xs font-bold text-white mt-0.5 leading-snug">
                            {headlineText}
                          </p>
                        </div>

                        {/* 4. Chamber Schedule Callout Box */}
                        <div className={`mt-4 ${themeStyles.boxBg} border ${themeStyles.boxBorder} p-4`}>
                          <div className="flex items-center justify-between border-b border-white/10 pb-2 mb-2.5">
                            <span className="text-[11px] font-bold uppercase tracking-wider text-sky-300 flex items-center gap-1.5">
                              <MapPin className="h-3.5 w-3.5" />
                              চেম্বার সময়সূচী ও শাখা (Today&apos;s Chamber Schedule)
                            </span>
                            <span className="text-[11px] font-bold text-emerald-300 tabular-nums">
                              {doc.availableSlotsCount}/{doc.totalSlotsToday} Slots Open
                            </span>
                          </div>

                          <div className="flex items-center justify-between text-xs">
                            <div>
                              <p className="font-bold text-white">
                                {doc.branchNameBn}{" "}
                                <span className="text-slate-300 font-normal">({doc.branchNameEn})</span>
                              </p>
                              <p className="text-[11px] text-sky-200 tabular-nums mt-0.5">
                                {doc.chamberRoom}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="font-bold text-amber-300 text-sm tabular-nums">
                                {doc.visitingHoursBn}
                              </p>
                              <p className="text-[11px] text-slate-300 tabular-nums">
                                {doc.visitingHoursEn}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* 5. Bottom Hotline & Booking Strip */}
                      <div className={`${themeStyles.footerBg} px-6 py-3.5 border-t border-white/15 flex items-center justify-between relative z-10`}>
                        <div className="flex items-center gap-2.5">
                          <div className="h-9 w-9 bg-amber-400 text-[#012d61] flex items-center justify-center font-bold">
                            <PhoneCall className="h-4 w-4" />
                          </div>
                          <div>
                            <p className="text-[10px] font-bold uppercase tracking-wider text-sky-200">
                              সিরিয়ালের জন্য কল করুন (24/7 Appointment Desk)
                            </p>
                            <p className="text-base font-extrabold text-white tracking-tight tabular-nums">
                              হটলাইন: ১০৬৬৬ (10666) · +8809612310666
                            </p>
                          </div>
                        </div>

                        <div className="text-right">
                          <p className="text-[10px] uppercase tracking-wider text-slate-300 font-semibold">
                            অনলাইন অ্যাপয়েন্টমেন্ট
                          </p>
                          <p className="text-xs font-bold text-sky-300">
                            deltacare.bd/appointments
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Card Controls, Custom Headline Override & Ready-to-Paste Bilingual Caption */}
                  <div className="xl:col-span-5 p-6 flex flex-col justify-between space-y-5">
                    <div className="space-y-4">
                      <div className="flex items-start justify-between gap-3 border-b border-[#e5e7eb] pb-3">
                        <div>
                          <span className="text-[11px] font-bold uppercase tracking-wider text-[#0057b8]">
                            Spotlight Card #{idx + 1} · {doc.departmentNameEn}
                          </span>
                          <h3 className="mc-serif text-xl font-normal text-slate-900 mt-0.5">
                            {doc.nameEn}
                          </h3>
                          <p className="text-xs text-slate-600">{doc.nameBn}</p>
                        </div>
                        <span className="px-2.5 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold tabular-nums">
                          Fee: ৳{doc.consultationFeeBdt}
                        </span>
                      </div>

                      {/* Custom Disease / Specialty Highlight Input */}
                      <div>
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                          Customize Specialty / Symptom Banner Text (Live Card Preview):
                        </label>
                        <input
                          type="text"
                          value={headlineText}
                          onChange={(e) =>
                            setCustomHeadlines((prev) => ({
                              ...prev,
                              [doc.doctorId]: e.target.value,
                            }))
                          }
                          className="w-full min-h-[38px] border border-slate-300 px-3 text-xs font-medium text-slate-900 focus:border-[#0057b8] focus:outline-none"
                        />
                      </div>

                      {/* Bilingual Facebook Post Caption Box */}
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600">
                            Ready-to-Paste Bilingual Facebook Caption (Bangla + English):
                          </label>
                          <button
                            type="button"
                            onClick={() => handleCopyCaption(doc.caption, idx)}
                            className="inline-flex items-center gap-1 text-xs font-bold text-[#0057b8] hover:underline cursor-pointer"
                          >
                            {copiedIndex === idx ? (
                              <>
                                <Check className="h-3.5 w-3.5 text-emerald-600" />
                                <span className="text-emerald-700">Copied!</span>
                              </>
                            ) : (
                              <>
                                <Copy className="h-3.5 w-3.5" />
                                <span>Copy Caption</span>
                              </>
                            )}
                          </button>
                        </div>
                        <textarea
                          readOnly
                          rows={10}
                          value={doc.caption}
                          className="w-full border border-[#e5e7eb] bg-slate-50 p-3 text-xs font-mono text-slate-800 leading-relaxed focus:outline-none"
                        />
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="pt-3 border-t border-[#e5e7eb] flex flex-wrap items-center gap-3">
                      <button
                        type="button"
                        onClick={() => void downloadCardPng(doc)}
                        disabled={downloadingId === cardKey}
                        className="flex-1 min-h-[44px] inline-flex items-center justify-center gap-2 bg-[#0057b8] hover:bg-[#004494] disabled:opacity-50 text-white text-xs font-bold uppercase tracking-wider px-4 py-2.5 transition-colors cursor-pointer"
                      >
                        <Download className="h-4 w-4" />
                        {downloadingId === cardKey
                          ? "Exporting High-Res PNG..."
                          : `Download Card (PNG · ${isSquare ? "1080×1080" : "1080×1350"})`}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleCopyCaption(doc.caption, idx)}
                        className="min-h-[44px] inline-flex items-center justify-center gap-2 border border-[#012d61] text-[#012d61] hover:bg-slate-100 text-xs font-bold uppercase tracking-wider px-4 py-2.5 transition-colors cursor-pointer"
                      >
                        {copiedIndex === idx ? (
                          <>
                            <Check className="h-4 w-4 text-emerald-600" />
                            Copied Caption
                          </>
                        ) : (
                          <>
                            <Copy className="h-4 w-4" />
                            Copy Bilingual Caption
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Master Daily Roster Caption Preview */}
        {campaignData && campaignData.masterDailyCaption && (
          <div className="border border-[#e5e7eb] bg-white p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#e5e7eb] pb-4">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#0057b8]">
                  Combined Daily Roster Post (All Active Specialists)
                </span>
                <h3 className="mc-serif text-xl font-normal text-slate-900 mt-0.5">
                  Master Bilingual Facebook Status — {campaignData.date} ({campaignData.weekdayNameBn})
                </h3>
              </div>
              <button
                type="button"
                onClick={handleCopyMasterCaption}
                className="inline-flex min-h-[40px] items-center gap-2 bg-[#012d61] hover:bg-[#0057b8] text-white px-4 py-2 text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
              >
                {copiedMaster ? <Check className="h-4 w-4 text-emerald-300" /> : <Copy className="h-4 w-4" />}
                {copiedMaster ? "Copied Master Post to Clipboard!" : "Copy Combined Daily Roster Post"}
              </button>
            </div>
            <textarea
              readOnly
              rows={10}
              value={campaignData.masterDailyCaption}
              className="w-full border border-[#e5e7eb] bg-slate-50 p-4 text-xs font-mono text-slate-800 leading-relaxed focus:outline-none"
            />
          </div>
        )}
      </div>
    </div>
  );
}
