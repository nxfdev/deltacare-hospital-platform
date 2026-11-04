"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import JSZip from "jszip";
import {
  BookOpen,
  Edit3,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  Bot,
  ExternalLink,
  FileText,
  Sparkles,
  Building2,
  UserCheck,
  Calendar,
  Download,
  Share2,
  AlertTriangle,
  Upload,
  RotateCcw,
  Eye,
  Sliders,
  Copy,
  Check,
  RefreshCw,
  History,
  Image as ImageIcon,
  Globe,
  Activity,
} from "lucide-react";
import {
  AIUpdateDraft,
  ApprovalRequest,
  Branch,
  Department,
  DiseaseCondition,
  Doctor,
  FacebookPostBatch,
  PublicationState,
} from "@/types/domain";
import { AvailableDoctorCardData } from "@/server/services/availabilityGeneratorService";
import { DoctorAvailabilityCard } from "./facebook/DoctorAvailabilityCard";
import { DoctorCardInspectionModal } from "./facebook/DoctorCardInspectionModal";
import { DoctorPublicProfilePreviewModal } from "./facebook/DoctorPublicProfilePreviewModal";
import { drawDoctorCardToCanvas } from "./facebook/cardCanvasRenderer";

export type ContentEditorTab =
  | "overview"
  | "content"
  | "profiles"
  | "media"
  | "generator"
  | "seo"
  | "publishing"
  | "departments"
  | "ai-updates";

interface ContentEditorViewProps {
  conditions: DiseaseCondition[];
  departments: Department[];
  doctors: Doctor[];
  branches?: Branch[];
  approvals: ApprovalRequest[];
  aiUpdates: AIUpdateDraft[];
  facebookBatches?: FacebookPostBatch[];
  activeTab?: ContentEditorTab;
  onTabChange?: (tab: ContentEditorTab) => void;
  onSaveCondition: (condition: Partial<DiseaseCondition>) => Promise<void>;
  onSaveDoctorProfileCopy: (doctorId: string, bioEn: string, bioBn: string) => Promise<void>;
  onSubmitAIUpdate: (rawText: string) => Promise<void>;
  onDoctorUpdated?: (doctor: Doctor) => void;
}

export function ContentEditorView({
  conditions,
  departments,
  doctors,
  branches = [],
  approvals,
  aiUpdates,
  facebookBatches = [],
  activeTab: controlledTab,
  onTabChange,
  onSaveCondition,
  onSaveDoctorProfileCopy,
  onSubmitAIUpdate,
  onDoctorUpdated,
}: ContentEditorViewProps) {
  const [internalTab, setInternalTab] = useState<ContentEditorTab>("content");
  const rawTab = controlledTab || internalTab;
  // Normalize backwards-compatible aliases
  const activeTab: ContentEditorTab = rawTab;

  const setTab = (tab: ContentEditorTab) => {
    setInternalTab(tab);
    onTabChange?.(tab);
  };

  // ==========================================================================
  // SECTION 1: WEBSITE CONTENT STATE (Conditions & Articles)
  // ==========================================================================
  const [contentSubTab, setContentSubTab] = useState<"articles" | "departments" | "ai">("articles");
  const [editingCondition, setEditingCondition] = useState<DiseaseCondition | null>(null);
  const [condNameEn, setCondNameEn] = useState("");
  const [condNameBn, setCondNameBn] = useState("");
  const [condSlug, setCondSlug] = useState("");
  const [condDeptId, setCondDeptId] = useState(departments[0]?.id || "");
  const [condSummaryEn, setCondSummaryEn] = useState("");
  const [condSummaryBn, setCondSummaryBn] = useState("");
  const [condSymptomsEn, setCondSymptomsEn] = useState("");
  const [condCausesEn, setCondCausesEn] = useState("");
  const [condPubState, setCondPubState] = useState<PublicationState>("DRAFT");
  const [condLoading, setCondLoading] = useState(false);
  const [condSearch, setCondSearch] = useState("");

  // AI Update state
  const [aiRawText, setAiRawText] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiSuccess, setAiSuccess] = useState(false);

  const filteredConditions = conditions.filter(
    (c) =>
      c.nameEn.toLowerCase().includes(condSearch.toLowerCase()) ||
      c.nameBn.includes(condSearch) ||
      c.slug.includes(condSearch.toLowerCase())
  );

  const handleConditionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCondLoading(true);
    try {
      await onSaveCondition({
        id: editingCondition?.id,
        nameEn: condNameEn,
        nameBn: condNameBn || condNameEn,
        slug:
          condSlug ||
          condNameEn
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/(^-|-$)/g, ""),
        departmentId: condDeptId,
        summaryEn: condSummaryEn,
        summaryBn: condSummaryBn || condSummaryEn,
        symptomsEn: condSymptomsEn.split(",").map((s) => s.trim()).filter(Boolean),
        causesEn: condCausesEn,
        publicationState: condPubState,
      });
      setEditingCondition(null);
      setCondNameEn("");
      setCondNameBn("");
      setCondSlug("");
      setCondSummaryEn("");
      setCondSummaryBn("");
      setCondSymptomsEn("");
      setCondCausesEn("");
    } finally {
      setCondLoading(false);
    }
  };

  // ==========================================================================
  // SECTION 2: DOCTOR PROFILES & PRESENTATION STATE
  // ==========================================================================
  const [docSearch, setDocSearch] = useState("");
  const [selectedDoc, setSelectedDoc] = useState<Doctor | null>(doctors[0] || null);
  const [docBioEn, setDocBioEn] = useState(doctors[0]?.bioEn || "");
  const [docBioBn, setDocBioBn] = useState(doctors[0]?.bioBn || "");
  const [docTaglineEn, setDocTaglineEn] = useState(doctors[0]?.publicTaglineEn || "");
  const [docTaglineBn, setDocTaglineBn] = useState(doctors[0]?.publicTaglineBn || "");
  const [docPhotoUrl, setDocPhotoUrl] = useState(doctors[0]?.imageUrl || "");
  const [photoZoom, setPhotoZoom] = useState(doctors[0]?.imageCrop?.zoom || 1);
  const [photoPanX, setPhotoPanX] = useState(doctors[0]?.imageCrop?.x || 0);
  const [photoPanY, setPhotoPanY] = useState(doctors[0]?.imageCrop?.y || 0);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSuccessMsg, setProfileSuccessMsg] = useState<string | null>(null);
  const [previewModalDoc, setPreviewModalDoc] = useState<Doctor | null>(null);

  // Sync editor fields when selected doctor changes
  useEffect(() => {
    if (selectedDoc) {
      setDocBioEn(selectedDoc.bioEn || "");
      setDocBioBn(selectedDoc.bioBn || "");
      setDocTaglineEn(selectedDoc.publicTaglineEn || "");
      setDocTaglineBn(selectedDoc.publicTaglineBn || "");
      setDocPhotoUrl(selectedDoc.imageUrl || "");
      setPhotoZoom(selectedDoc.imageCrop?.zoom || 1);
      setPhotoPanX(selectedDoc.imageCrop?.x || 0);
      setPhotoPanY(selectedDoc.imageCrop?.y || 0);
      setProfileSuccessMsg(null);
    }
  }, [selectedDoc]);

  const filteredDoctors = doctors.filter(
    (d) =>
      d.nameEn.toLowerCase().includes(docSearch.toLowerCase()) ||
      d.designationEn.toLowerCase().includes(docSearch.toLowerCase()) ||
      d.bmdcRegistrationNo.includes(docSearch)
  );

  const handlePhotoFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Please upload a valid image file (PNG, JPG, SVG, WebP).");
      return;
    }

    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      const dataUri = uploadEvent.target?.result as string;
      if (dataUri) {
        setDocPhotoUrl(dataUri);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleResetPhoto = () => {
    if (!selectedDoc) return;
    setDocPhotoUrl(`/images/doctors/doc-${(doctors.indexOf(selectedDoc) % 8) + 1}.svg`);
    setPhotoZoom(1);
    setPhotoPanX(0);
    setPhotoPanY(0);
  };

  const handleSaveDoctorProfilePresentation = async () => {
    if (!selectedDoc) return;
    setProfileSaving(true);
    setProfileSuccessMsg(null);
    try {
      const res = await fetch("/api/v1/admin/doctors/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          doctorId: selectedDoc.id,
          imageUrl: docPhotoUrl,
          imagePosition: `${50 + photoPanX}% ${50 + photoPanY}%`,
          imageCrop: {
            zoom: photoZoom,
            x: photoPanX,
            y: photoPanY,
          },
          bioEn: docBioEn,
          bioBn: docBioBn,
          publicTaglineEn: docTaglineEn,
          publicTaglineBn: docTaglineBn,
        }),
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        setProfileSuccessMsg(`Successfully updated public profile presentation for ${data.doctor.nameEn}`);
        setSelectedDoc(data.doctor);
        onDoctorUpdated?.(data.doctor);
        setTimeout(() => setProfileSuccessMsg(null), 5000);
      } else {
        alert(data.error || "Failed to save profile presentation.");
      }
    } catch {
      alert("Error communicating with server.");
    } finally {
      setProfileSaving(false);
    }
  };

  // ==========================================================================
  // SECTION 3: DAILY DOCTOR AVAILABILITY GENERATOR STATE
  // ==========================================================================
  const getTodayFormatted = () => {
    const d = new Date();
    return d.toISOString().split("T")[0];
  };

  const [targetDate, setTargetDate] = useState(getTodayFormatted());
  const [generatorLoading, setGeneratorLoading] = useState(false);
  const [availableCards, setAvailableCards] = useState<AvailableDoctorCardData[]>([]);
  const [excludedCount, setExcludedCount] = useState(0);
  const [dataConflicts, setDataConflicts] = useState<Array<{ doctorId: string; doctorName: string; reason: string }>>([]);
  const [lastGeneratedAt, setLastGeneratedAt] = useState<string | null>(null);
  const [stalenessWarning, setStalenessWarning] = useState<string | null>(null);
  const [inspectedCard, setInspectedCard] = useState<AvailableDoctorCardData | null>(null);
  const [batchCaption, setBatchCaption] = useState("");
  const [copiedBatchCaption, setCopiedBatchCaption] = useState(false);
  const [zipDownloading, setZipDownloading] = useState(false);
  const [batchSaving, setBatchSaving] = useState(false);
  const [batchSavedSuccess, setBatchSavedSuccess] = useState(false);

  const fetchDailyAvailability = async (dateStr: string) => {
    setGeneratorLoading(true);
    setStalenessWarning(null);
    try {
      const res = await fetch(`/api/v1/admin/availability/daily?date=${dateStr}`);
      const data = await res.json();
      if (res.ok && data.ok) {
        setAvailableCards(data.availability.eligibleDoctors || []);
        setExcludedCount(data.availability.excludedCount || 0);
        setDataConflicts(data.availability.conflicts || []);
        setLastGeneratedAt(data.availability.generatedAt);

        // Pre-fill professional Facebook caption
        const doctorsList = (data.availability.eligibleDoctors || [])
          .map(
            (d: AvailableDoctorCardData) =>
              `• ${d.nameEn} (${d.primarySpecialtyEn}) — ${d.consultationHours} at ${d.branchNameEn}`
          )
          .join("\n");

        setBatchCaption(
          `🩺 DeltaCare Daily Specialist Availability | ${data.availability.weekdayName}, ${dateStr}\n\n` +
            `Our verified medical chambers are open for outpatient consultations today:\n\n` +
            `${doctorsList || "No specialists scheduled today."}\n\n` +
            `📍 Direct online appointment requests: https://deltacare.bd/request-appointment\n` +
            `📞 24/7 Clinical Helpline: +8809612310666\n` +
            `#DeltaCare #HealthcareBangladesh #DoctorsAvailability #DhakaHospitals`
        );
      } else {
        alert(data.error || "Failed to load daily availability.");
      }
    } catch {
      alert("Network error fetching availability.");
    } finally {
      setGeneratorLoading(false);
    }
  };

  // Initial fetch for today
  useEffect(() => {
    if (activeTab === "generator" && availableCards.length === 0) {
      fetchDailyAvailability(targetDate);
    }
  }, [activeTab]);

  // Revalidate availability staleness check before download
  const revalidateBeforeDownload = async (): Promise<boolean> => {
    try {
      const baselineIds = availableCards.map((c) => c.doctorId).join(",");
      const res = await fetch(
        `/api/v1/admin/availability/daily?date=${targetDate}&baselineIds=${baselineIds}`
      );
      const data = await res.json();
      if (res.ok && data.ok && data.staleness?.isStale) {
        setStalenessWarning(
          `⚠️ Operational schedule updated since cards were generated! (${data.staleness.reason}) Please click "Regenerate Cards" before publishing.`
        );
        return false;
      }
      return true;
    } catch {
      return true; // continue if network probe fails
    }
  };

  // Batch ZIP Download with all generated PNGs and caption
  const handleBatchZipDownload = async () => {
    if (availableCards.length === 0) return;

    // Check staleness first
    const isFresh = await revalidateBeforeDownload();
    if (!isFresh) {
      const proceed = confirm(
        "Notice: Schedule availability has changed since generation. Do you still want to download this batch?"
      );
      if (!proceed) return;
    }

    setZipDownloading(true);
    try {
      const zip = new JSZip();

      // 1. Add post caption file
      zip.file(
        "facebook-post-caption.txt",
        `${batchCaption}\n\nBatch Generated: ${lastGeneratedAt}\nTarget Date: ${targetDate}`
      );

      // 2. Render each doctor card to canvas and save PNG to ZIP
      for (let i = 0; i < availableCards.length; i++) {
        const card = availableCards[i];
        const canvas = document.createElement("canvas");
        await drawDoctorCardToCanvas(card, canvas);

        const dataUrl = canvas.toDataURL("image/png");
        const base64Data = dataUrl.replace(/^data:image\/png;base64,/, "");
        zip.file(
          `card-${i + 1}-${card.doctorSlug}-${card.consultationDate}.png`,
          base64Data,
          { base64: true }
        );
      }

      // Generate zip blob
      const zipBlob = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(zipBlob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `deltacare-facebook-cards-${targetDate}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Batch zip generation error:", err);
      alert("Error generating batch ZIP file.");
    } finally {
      setZipDownloading(false);
    }
  };

  const handleMarkBatchReady = async () => {
    if (availableCards.length === 0) return;
    setBatchSaving(true);
    try {
      const items = availableCards.map((c) => ({
        id: `item-${c.doctorId}-${c.consultationDate}`,
        doctorId: c.doctorId,
        doctorName: c.nameEn,
        specialtyName: c.primarySpecialtyEn,
        branchName: c.branchNameEn,
        consultationDate: c.consultationDate,
        consultationHours: c.consultationHours,
        photoUrl: c.photoUrl,
        status: "READY" as const,
      }));

      const res = await fetch("/api/v1/admin/facebook/batches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetDate,
          caption: batchCaption,
          status: "READY",
          items,
          generatedAt: lastGeneratedAt,
        }),
      });

      const data = await res.json();
      if (res.ok && data.ok) {
        setBatchSavedSuccess(true);
        setTimeout(() => setBatchSavedSuccess(false), 4000);
      }
    } catch {
      alert("Failed to mark batch as ready.");
    } finally {
      setBatchSaving(false);
    }
  };

  // ==========================================================================
  // SECTION 4: PUBLISHING HISTORY STATE
  // ==========================================================================
  const [batchesHistory, setBatchesHistory] = useState<FacebookPostBatch[]>(facebookBatches);
  const [batchesLoading, setBatchesLoading] = useState(false);

  const refreshPublishingHistory = async () => {
    setBatchesLoading(true);
    try {
      const res = await fetch("/api/v1/admin/facebook/batches");
      const data = await res.json();
      if (res.ok && data.ok) {
        setBatchesHistory(data.batches || []);
      }
    } finally {
      setBatchesLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* ====================================================================
          CMS TOP NAVIGATION TABS (Section 7 Specification)
         ==================================================================== */}
      <div className="bg-white rounded-2xl border border-[#d6d6d6] p-2 flex flex-wrap items-center justify-between gap-2 shadow-sm">
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => setTab("overview")}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === "overview"
                ? "bg-[#0057b8] text-white shadow"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            <Activity className="w-4 h-4" />
            <span>CMS Overview</span>
          </button>

          <button
            type="button"
            onClick={() => setTab("content")}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === "content"
                ? "bg-[#0057b8] text-white shadow"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Website Content</span>
          </button>

          <button
            type="button"
            onClick={() => setTab("profiles")}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === "profiles"
                ? "bg-[#0057b8] text-white shadow"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            <Edit3 className="w-4 h-4" />
            <span>Doctor Profiles</span>
            <span className="px-1.5 py-0.2 rounded-full bg-white/20 text-[10px]">
              {doctors.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setTab("media")}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === "media"
                ? "bg-[#0057b8] text-white shadow"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            <ImageIcon className="w-4 h-4" />
            <span>Media Library</span>
          </button>

          <button
            type="button"
            onClick={() => setTab("generator")}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === "generator"
                ? "bg-[#0057b8] text-white shadow"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Daily Availability Generator</span>
            <span className="px-1.5 py-0.2 rounded-full bg-emerald-500 text-white text-[10px] font-bold">
              Facebook Cards
            </span>
          </button>

          <button
            type="button"
            onClick={() => setTab("seo")}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === "seo"
                ? "bg-[#0057b8] text-white shadow"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            <Globe className="w-4 h-4" />
            <span>SEO Management</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setTab("publishing");
              refreshPublishingHistory();
            }}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === "publishing"
                ? "bg-[#0057b8] text-white shadow"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            <History className="w-4 h-4" />
            <span>Publishing History</span>
          </button>
        </div>

        <div className="text-[11px] text-slate-500 px-3 hidden sm:block">
          CMS Editorial Workspace • Strict RBAC Boundary
        </div>
      </div>

      {/* ====================================================================
          TAB 0: CMS OVERVIEW (Section 7 Specification)
         ==================================================================== */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="bg-white rounded-2xl border border-[#d6d6d6] p-4 space-y-1">
              <span className="text-[11px] font-semibold text-[#686868] uppercase">Published Articles</span>
              <p className="text-2xl font-bold text-[#080808]">{conditions.length}</p>
              <span className="text-[10px] text-[#059669] font-bold">Health Directory</span>
            </div>
            <div className="bg-white rounded-2xl border border-[#d6d6d6] p-4 space-y-1">
              <span className="text-[11px] font-semibold text-[#686868] uppercase">Departments</span>
              <p className="text-2xl font-bold text-[#0057b8]">{departments.length}</p>
              <span className="text-[10px] text-[#0057b8] font-bold">Public Overviews</span>
            </div>
            <div className="bg-white rounded-2xl border border-[#d6d6d6] p-4 space-y-1">
              <span className="text-[11px] font-semibold text-[#686868] uppercase">Doctor Profiles</span>
              <p className="text-2xl font-bold text-[#080808]">{doctors.length}</p>
              <span className="text-[10px] text-[#059669] font-bold">Live Presentation</span>
            </div>
            <div className="bg-white rounded-2xl border border-[#d6d6d6] p-4 space-y-1">
              <span className="text-[11px] font-semibold text-[#686868] uppercase">Missing Photos</span>
              <p className="text-2xl font-bold text-[#d97706]">
                {doctors.filter((d) => !d.imageUrl || d.imageUrl.includes("placeholder")).length}
              </p>
              <span className="text-[10px] text-[#d97706] font-bold">Needs Image</span>
            </div>
            <div className="bg-white rounded-2xl border border-[#d6d6d6] p-4 space-y-1">
              <span className="text-[11px] font-semibold text-[#686868] uppercase">Pending Sign-Off</span>
              <p className="text-2xl font-bold text-[#dc2626]">
                {approvals.filter((a) => a.status === "PENDING_APPROVAL").length}
              </p>
              <span className="text-[10px] text-[#dc2626] font-bold">In Approval Queue</span>
            </div>
            <div className="bg-white rounded-2xl border border-[#d6d6d6] p-4 space-y-1">
              <span className="text-[11px] font-semibold text-[#686868] uppercase">FB Batches</span>
              <p className="text-2xl font-bold text-[#4f46e5]">{facebookBatches.length}</p>
              <span className="text-[10px] text-[#4f46e5] font-bold">Card Promos</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl border border-[#d6d6d6] p-6 space-y-4">
              <h3 className="font-bold text-base text-[#080808]">Content Health &amp; Editorial Action Items</h3>
              <div className="space-y-3 text-xs">
                <div className="p-3 rounded-xl border border-[#ededed] bg-[#f8fafc] flex items-center justify-between">
                  <div className="space-y-0.5">
                    <p className="font-bold text-[#080808]">Doctor Profile Visual Readiness</p>
                    <p className="text-[11px] text-[#686868]">
                      {Math.round(((doctors.length - doctors.filter((d) => !d.imageUrl || d.imageUrl.includes("placeholder")).length) / Math.max(1, doctors.length)) * 100)}% of specialists have approved photos with zoom/crop alignment.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setTab("profiles")}
                    className="font-bold text-[#0057b8] hover:underline"
                  >
                    Edit →
                  </button>
                </div>

                <div className="p-3 rounded-xl border border-[#ededed] bg-[#f8fafc] flex items-center justify-between">
                  <div className="space-y-0.5">
                    <p className="font-bold text-[#080808]">Daily Social Media Promotional Cards</p>
                    <p className="text-[11px] text-[#686868]">
                      Generate branded 1080x1080 Facebook availability cards with Asia/Dhaka schedule verification.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setTab("generator")}
                    className="font-bold text-[#0057b8] hover:underline"
                  >
                    Generate →
                  </button>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-[#d6d6d6] p-6 space-y-4">
              <h3 className="font-bold text-base text-[#080808]">Quick Navigation</h3>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <button
                  type="button"
                  onClick={() => setTab("content")}
                  className="p-3 rounded-xl border border-[#ededed] hover:border-[#0057b8] text-left space-y-1 transition-colors"
                >
                  <p className="font-bold text-[#080808]">Disease Articles</p>
                  <p className="text-[11px] text-[#686868]">Edit A-Z clinical copy</p>
                </button>
                <button
                  type="button"
                  onClick={() => setTab("profiles")}
                  className="p-3 rounded-xl border border-[#ededed] hover:border-[#0057b8] text-left space-y-1 transition-colors"
                >
                  <p className="font-bold text-[#080808]">Doctor Biographies</p>
                  <p className="text-[11px] text-[#686868]">Photos &amp; Taglines</p>
                </button>
                <button
                  type="button"
                  onClick={() => setTab("media")}
                  className="p-3 rounded-xl border border-[#ededed] hover:border-[#0057b8] text-left space-y-1 transition-colors"
                >
                  <p className="font-bold text-[#080808]">Media Assets</p>
                  <p className="text-[11px] text-[#686868]">Hospital photographs</p>
                </button>
                <button
                  type="button"
                  onClick={() => setTab("seo")}
                  className="p-3 rounded-xl border border-[#ededed] hover:border-[#0057b8] text-left space-y-1 transition-colors"
                >
                  <p className="font-bold text-[#080808]">SEO Metadata</p>
                  <p className="text-[11px] text-[#686868]">Search previews</p>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ====================================================================
          TAB: MEDIA LIBRARY (Section 7 Specification)
         ==================================================================== */}
      {activeTab === "media" && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-[#d6d6d6] p-6 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="mc-serif text-xl text-[#080808]">Digital Media Asset Library</h3>
                <p className="text-xs text-[#686868]">
                  Verified imagery, high-resolution doctor headshots, and facility photography.
                </p>
              </div>
              <button
                type="button"
                onClick={() => alert("Upload media: Select image file to store in DeltaCare CDN assets.")}
                className="mc-btn-primary text-xs"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Upload Media Asset</span>
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 text-xs">
              {[
                { name: "Arizona Campus", path: "/images/inspo/Arizona.png", dims: "600x400", type: "Location" },
                { name: "Florida Campus", path: "/images/inspo/Florida.png", dims: "600x400", type: "Location" },
                { name: "Minnesota Campus", path: "/images/inspo/Minnesota.png", dims: "600x400", type: "Location" },
                { name: "World Class Care", path: "/images/inspo/world-class care-MC1XASH-600x800.jpg", dims: "600x800", type: "Editorial" },
                { name: "Healing Starts Here", path: "/images/inspo/healing-starts-here-MC11REJU-600x800.jpg", dims: "600x800", type: "Editorial" },
                { name: "Doctor Synthetic 1", path: "/images/inspo/1710753_3980687_0060.png", dims: "800x800", type: "Doctor Headshot" },
              ].map((asset) => (
                <div key={asset.name} className="p-3 rounded-xl border border-[#ededed] bg-[#f8fafc] space-y-2">
                  <div className="aspect-video w-full rounded-lg bg-[#e2e8f0] overflow-hidden">
                    <img
                      src={asset.path}
                      alt={asset.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as any).src = "/images/inspo/1710753_3980687_0060.png";
                      }}
                    />
                  </div>
                  <div>
                    <p className="font-bold text-[#080808] truncate">{asset.name}</p>
                    <p className="text-[11px] text-[#686868]">{asset.dims} • {asset.type}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ====================================================================
          TAB: SEO MANAGEMENT (Section 7 Specification)
         ==================================================================== */}
      {activeTab === "seo" && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-[#d6d6d6] p-6 space-y-5">
            <div>
              <h3 className="mc-serif text-xl text-[#080808]">Search Engine Optimization &amp; Social Meta</h3>
              <p className="text-xs text-[#686868]">
                Configure public meta titles, search descriptions, and OpenGraph social share previews.
              </p>
            </div>

            <div className="p-4 rounded-xl border border-[#ededed] bg-[#f8fafc] space-y-2 text-xs">
              <span className="font-bold text-[#0057b8]">Google Search Preview</span>
              <div className="p-3 bg-white rounded-lg border border-[#d6d6d6] space-y-1 max-w-lg">
                <p className="text-xs text-[#1a0dab] font-bold hover:underline cursor-pointer">
                  DeltaCare Hospital Platform — Care at DeltaCare (Dhaka, Bangladesh)
                </p>
                <p className="text-[11px] text-[#006621]">https://deltacare.bd</p>
                <p className="text-xs text-[#545454]">
                  DeltaCare is a premier digital healthcare institution providing world-class cardiology, neurology, pediatrics, and surgical care in Dhaka, Bangladesh.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}


      {/* ====================================================================
          TAB 1: WEBSITE CONTENT
         ==================================================================== */}
      {activeTab === "content" && (
        <div className="space-y-6">
          {/* Sub Navigation */}
          <div className="flex items-center gap-3 border-b border-[#d6d6d6] pb-3">
            <button
              type="button"
              onClick={() => setContentSubTab("articles")}
              className={`text-xs font-bold pb-1 border-b-2 transition-colors ${
                contentSubTab === "articles"
                  ? "border-[#0057b8] text-[#0057b8]"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              Health Conditions &amp; Articles ({conditions.length})
            </button>
            <button
              type="button"
              onClick={() => setContentSubTab("departments")}
              className={`text-xs font-bold pb-1 border-b-2 transition-colors ${
                contentSubTab === "departments"
                  ? "border-[#0057b8] text-[#0057b8]"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              Clinical Department Descriptions ({departments.length})
            </button>
            <button
              type="button"
              onClick={() => setContentSubTab("ai")}
              className={`text-xs font-bold pb-1 border-b-2 transition-colors ${
                contentSubTab === "ai"
                  ? "border-[#0057b8] text-[#0057b8]"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              Staff AI Assistant Updates
            </button>
          </div>

          {contentSubTab === "articles" && (
            <div className="space-y-6">
              {/* Form */}
              <div className="bg-white rounded-2xl border border-[#d6d6d6] p-6 space-y-4">
                <h3 className="text-base font-bold text-[#080808]">
                  {editingCondition ? `Edit Condition: ${editingCondition.nameEn}` : "Create Disease & Condition Article"}
                </h3>
                <form onSubmit={handleConditionSubmit} className="space-y-4 text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block font-semibold mb-1">Condition Name (EN) *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Type 2 Diabetes"
                        value={condNameEn}
                        onChange={(e) => setCondNameEn(e.target.value)}
                        className="w-full h-9 px-3 rounded-lg border border-[#a1a1a1]"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold mb-1">Condition Name (BN)</label>
                      <input
                        type="text"
                        placeholder="টাইপ ২ ডায়াবেটিস"
                        value={condNameBn}
                        onChange={(e) => setCondNameBn(e.target.value)}
                        className="w-full h-9 px-3 rounded-lg border border-[#a1a1a1]"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold mb-1">Department *</label>
                      <select
                        value={condDeptId}
                        onChange={(e) => setCondDeptId(e.target.value)}
                        className="w-full h-9 px-3 rounded-lg border border-[#a1a1a1] bg-white"
                      >
                        {departments.map((d) => (
                          <option key={d.id} value={d.id}>
                            {d.nameEn}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-semibold mb-1">Clinical Summary (EN) *</label>
                      <textarea
                        required
                        rows={2}
                        value={condSummaryEn}
                        onChange={(e) => setCondSummaryEn(e.target.value)}
                        className="w-full p-2.5 rounded-lg border border-[#a1a1a1]"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold mb-1">Clinical Summary (BN)</label>
                      <textarea
                        rows={2}
                        value={condSummaryBn}
                        onChange={(e) => setCondSummaryBn(e.target.value)}
                        className="w-full p-2.5 rounded-lg border border-[#a1a1a1]"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2">
                    {editingCondition && (
                      <button
                        type="button"
                        onClick={() => setEditingCondition(null)}
                        className="px-4 py-1.5 rounded-lg border border-slate-300 font-bold"
                      >
                        Cancel
                      </button>
                    )}
                    <button
                      type="submit"
                      disabled={condLoading}
                      className="mc-btn-primary !h-9 !text-xs !px-5"
                    >
                      {condLoading ? "Saving..." : editingCondition ? "Update Article" : "Save Article Draft"}
                    </button>
                  </div>
                </form>
              </div>

              {/* Directory */}
              <div className="bg-white rounded-2xl border border-[#d6d6d6] p-6 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                  <h4 className="font-bold text-slate-900 text-sm">
                    Articles Directory ({filteredConditions.length})
                  </h4>
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Search condition..."
                      value={condSearch}
                      onChange={(e) => setCondSearch(e.target.value)}
                      className="h-8 pl-8 pr-3 rounded-lg border border-slate-300 text-xs w-56"
                    />
                  </div>
                </div>

                <div className="divide-y divide-slate-100 max-h-80 overflow-y-auto">
                  {filteredConditions.map((cond) => (
                    <div key={cond.id} className="py-2.5 flex items-center justify-between text-xs">
                      <div>
                        <strong className="text-slate-900">{cond.nameEn}</strong>
                        <span className="text-slate-500 ml-1.5">({cond.nameBn})</span>
                        <p className="text-slate-600 line-clamp-1">{cond.summaryEn}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingCondition(cond);
                            setCondNameEn(cond.nameEn);
                            setCondNameBn(cond.nameBn);
                            setCondDeptId(cond.departmentId);
                            setCondSummaryEn(cond.summaryEn);
                            setCondSummaryBn(cond.summaryBn);
                          }}
                          className="px-2.5 py-1 rounded border border-[#0057b8] text-[#0057b8] font-bold text-[11px]"
                        >
                          Edit
                        </button>
                        <Link
                          href={`/diseases-conditions/${cond.slug}`}
                          target="_blank"
                          className="text-slate-400 hover:text-[#0057b8]"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {contentSubTab === "departments" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {departments.map((dept) => (
                <div key={dept.id} className="p-4 rounded-xl border border-slate-200 bg-white space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-slate-900 text-sm">{dept.nameEn}</h4>
                    <span className="text-xs text-slate-500">{dept.nameBn}</span>
                  </div>
                  <p className="text-xs text-slate-600 line-clamp-2">{dept.shortDescriptionEn}</p>
                  <Link
                    href={`/departments/${dept.slug}`}
                    target="_blank"
                    className="text-xs text-[#0057b8] font-semibold flex items-center gap-1 hover:underline"
                  >
                    <span>View Department Page</span>
                    <ExternalLink className="w-3 h-3" />
                  </Link>
                </div>
              ))}
            </div>
          )}

          {contentSubTab === "ai" && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
              <h4 className="font-bold text-slate-900 text-sm">Staff AI Assistant Knowledge Update</h4>
              <p className="text-xs text-slate-600">
                Submit conversational clinical announcements or service changes to be indexed by DeltaCare's grounded AI assistant.
              </p>
              <textarea
                rows={4}
                placeholder="Enter operational notice or service announcement..."
                value={aiRawText}
                onChange={(e) => setAiRawText(e.target.value)}
                className="w-full text-xs p-3 rounded-lg border border-slate-300"
              />
              <button
                type="button"
                disabled={aiLoading || !aiRawText.trim()}
                onClick={async () => {
                  setAiLoading(true);
                  try {
                    await onSubmitAIUpdate(aiRawText);
                    setAiRawText("");
                    setAiSuccess(true);
                    setTimeout(() => setAiSuccess(false), 4000);
                  } finally {
                    setAiLoading(false);
                  }
                }}
                className="mc-btn-primary !h-9 !text-xs !px-5"
              >
                {aiLoading ? "Submitting..." : "Submit AI Update Draft"}
              </button>
              {aiSuccess && (
                <span className="text-xs text-emerald-600 font-bold ml-3">
                  AI update submitted for review!
                </span>
              )}
            </div>
          )}
        </div>
      )}

      {/* ====================================================================
          TAB 2: DOCTOR PROFILES MANAGEMENT (Photo Crop/Position, Bios, Preview)
         ==================================================================== */}
      {activeTab === "profiles" && (
        <div className="bg-white rounded-2xl border border-[#d6d6d6] p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Doctor Profile Copywriting &amp; Presentation Management
              </h3>
              <p className="text-xs text-slate-600">
                CMS Editors manage profile photographs, public biographies, and web presentation. Operational schedules, BMDC credentials, and fees remain managed exclusively by Hospital Administration.
              </p>
            </div>

            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search doctors..."
                value={docSearch}
                onChange={(e) => setDocSearch(e.target.value)}
                className="h-8 pl-8 pr-3 rounded-lg border border-slate-300 text-xs w-56"
              />
            </div>
          </div>

          {profileSuccessMsg && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-300 text-xs text-emerald-800 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>{profileSuccessMsg}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            {/* Left Column: Doctor Selection List */}
            <div className="md:col-span-4 border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100 max-h-[620px] overflow-y-auto">
              {filteredDoctors.map((doc) => (
                <button
                  key={doc.id}
                  type="button"
                  onClick={() => setSelectedDoc(doc)}
                  className={`w-full text-left p-3 flex items-center gap-3 transition-colors ${
                    selectedDoc?.id === doc.id
                      ? "bg-sky-50 text-[#0057b8] font-bold"
                      : "hover:bg-slate-50 text-slate-700"
                  }`}
                >
                  <img
                    src={doc.imageUrl}
                    alt={doc.nameEn}
                    className="w-10 h-10 rounded-full object-cover border border-slate-300 bg-slate-100 shrink-0"
                    style={{ objectPosition: doc.imagePosition || "center" }}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-bold text-slate-900">{doc.nameEn}</p>
                    <p className="truncate text-[11px] text-slate-500">{doc.designationEn}</p>
                    <span className="text-[10px] text-slate-400">BMDC: {doc.bmdcRegistrationNo}</span>
                  </div>
                </button>
              ))}
            </div>

            {/* Right Column: Profile Editor & Photo Controls */}
            {selectedDoc ? (
              <div className="md:col-span-8 space-y-6">
                {/* Header Bar with Action Buttons */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <div>
                    <h4 className="font-bold text-base text-slate-900">{selectedDoc.nameEn}</h4>
                    <p className="text-xs text-slate-600">
                      BMDC: <strong className="text-slate-800">{selectedDoc.bmdcRegistrationNo}</strong> • Status:{" "}
                      <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                        {selectedDoc.publicationState}
                      </span>
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setPreviewModalDoc(selectedDoc)}
                      className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold flex items-center gap-1.5 shadow-sm"
                    >
                      <Eye className="w-3.5 h-3.5 text-sky-600" />
                      <span>Preview Live Website Profile</span>
                    </button>

                    <button
                      type="button"
                      disabled={profileSaving}
                      onClick={handleSaveDoctorProfilePresentation}
                      className="mc-btn-primary !h-8 !text-xs !px-4"
                    >
                      {profileSaving ? "Saving..." : "Save Profile Changes"}
                    </button>
                  </div>
                </div>

                {/* Photo Upload & Cropping Section */}
                <div className="p-4 rounded-xl border border-slate-200 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h5 className="font-bold text-xs uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                        <ImageIcon className="w-4 h-4 text-sky-600" />
                        <span>Doctor Profile Photograph &amp; Cropping</span>
                      </h5>
                      <p className="text-[11px] text-slate-500">
                        Upload custom portrait photograph or adjust zoom and positioning.
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <label className="cursor-pointer px-3 py-1 rounded-lg bg-sky-50 text-[#0057b8] border border-sky-200 text-xs font-bold hover:bg-sky-100 flex items-center gap-1.5">
                        <Upload className="w-3 h-3" />
                        <span>Upload Photo</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handlePhotoFileUpload}
                          className="hidden"
                        />
                      </label>

                      <button
                        type="button"
                        onClick={handleResetPhoto}
                        className="px-2 py-1 rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-50 text-xs font-semibold"
                        title="Reset to default avatar"
                      >
                        <RotateCcw className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
                    {/* Visual Photo Viewport */}
                    <div className="sm:col-span-4 flex flex-col items-center justify-center p-3 bg-slate-50 rounded-xl border border-dashed border-slate-300">
                      <div className="w-28 h-28 rounded-full overflow-hidden border-2 border-[#0057b8] bg-[#e8f0f9] shadow relative">
                        <img
                          src={docPhotoUrl}
                          alt="Preview"
                          className="w-full h-full object-cover transition-transform"
                          style={{
                            objectPosition: `${50 + photoPanX}% ${50 + photoPanY}%`,
                            transform: `scale(${photoZoom})`,
                          }}
                        />
                      </div>
                      <span className="text-[10px] text-slate-400 mt-2">Live Viewport Preview</span>
                    </div>

                    {/* Fine Adjustment Sliders */}
                    <div className="sm:col-span-8 space-y-3 text-xs">
                      <div>
                        <div className="flex justify-between font-semibold text-slate-700 mb-0.5">
                          <span>Zoom / Scale: {photoZoom.toFixed(1)}x</span>
                          <span className="text-slate-400 text-[10px]">1.0x to 2.5x</span>
                        </div>
                        <input
                          type="range"
                          min="1"
                          max="2.5"
                          step="0.1"
                          value={photoZoom}
                          onChange={(e) => setPhotoZoom(parseFloat(e.target.value))}
                          className="w-full h-1.5 bg-slate-200 rounded-lg accent-[#0057b8] cursor-pointer"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <div className="flex justify-between font-semibold text-slate-700 mb-0.5">
                            <span>Pan Vertical (Y):</span>
                            <span>{photoPanY}%</span>
                          </div>
                          <input
                            type="range"
                            min="-40"
                            max="40"
                            step="5"
                            value={photoPanY}
                            onChange={(e) => setPhotoPanY(parseInt(e.target.value, 10))}
                            className="w-full h-1.5 bg-slate-200 rounded-lg accent-[#0057b8] cursor-pointer"
                          />
                        </div>

                        <div>
                          <div className="flex justify-between font-semibold text-slate-700 mb-0.5">
                            <span>Pan Horizontal (X):</span>
                            <span>{photoPanX}%</span>
                          </div>
                          <input
                            type="range"
                            min="-40"
                            max="40"
                            step="5"
                            value={photoPanX}
                            onChange={(e) => setPhotoPanX(parseInt(e.target.value, 10))}
                            className="w-full h-1.5 bg-slate-200 rounded-lg accent-[#0057b8] cursor-pointer"
                          />
                        </div>
                      </div>

                      <div className="flex items-center gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => {
                            setPhotoPanY(-15);
                            setPhotoPanX(0);
                          }}
                          className="px-2 py-0.5 rounded bg-slate-200 hover:bg-slate-300 text-[10px] font-bold text-slate-700"
                        >
                          Focus Top
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setPhotoPanY(0);
                            setPhotoPanX(0);
                          }}
                          className="px-2 py-0.5 rounded bg-slate-200 hover:bg-slate-300 text-[10px] font-bold text-slate-700"
                        >
                          Center
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setPhotoZoom(1);
                            setPhotoPanX(0);
                            setPhotoPanY(0);
                          }}
                          className="px-2 py-0.5 rounded bg-slate-200 hover:bg-slate-300 text-[10px] font-bold text-slate-700"
                        >
                          Reset Framing
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Public Copywriting & Biographies */}
                <div className="space-y-4 text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">
                        Public Profile Tagline (English)
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Specialist in Interventional Cardiology & Heart Failure"
                        value={docTaglineEn}
                        onChange={(e) => setDocTaglineEn(e.target.value)}
                        className="w-full h-9 px-3 rounded-lg border border-slate-300"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">
                        Public Profile Tagline (Bangla)
                      </label>
                      <input
                        type="text"
                        placeholder="ইন্টারভেনশনাল কার্ডিওলজি ও হার্ট ফেইলিউর বিশেষজ্ঞ"
                        value={docTaglineBn}
                        onChange={(e) => setDocTaglineBn(e.target.value)}
                        className="w-full h-9 px-3 rounded-lg border border-slate-300"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Public Biography &amp; Copywriting (English) *
                    </label>
                    <textarea
                      rows={4}
                      value={docBioEn}
                      onChange={(e) => setDocBioEn(e.target.value)}
                      className="w-full p-2.5 rounded-lg border border-slate-300 text-xs leading-relaxed"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Public Biography &amp; Copywriting (Bangla)
                    </label>
                    <textarea
                      rows={4}
                      value={docBioBn}
                      onChange={(e) => setDocBioBn(e.target.value)}
                      className="w-full p-2.5 rounded-lg border border-slate-300 text-xs leading-relaxed font-bengali"
                    />
                  </div>

                  {/* Operational Information Notice */}
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-800 flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <strong>Governance Notice:</strong> Doctor consultation fees (৳ {selectedDoc.consultationFeeBdt} BDT),
                      BMDC registration ({selectedDoc.bmdcRegistrationNo}), and branch chamber schedules are managed
                      by Hospital Admin. Changes to clinical credentials require official approval.
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="md:col-span-8 p-12 text-center text-slate-400 text-xs border border-dashed rounded-xl">
                Select a doctor to edit presentation and photographs.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ====================================================================
          TAB 3: DAILY DOCTOR AVAILABILITY GENERATOR (Facebook Cards Engine)
         ==================================================================== */}
      {activeTab === "generator" && (
        <div className="bg-white rounded-2xl border border-[#d6d6d6] p-6 space-y-6">
          {/* Top Control Bar */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-200 pb-5">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <h3 className="text-base font-bold text-slate-900">
                  Daily Doctor Availability Generator &amp; Facebook Promotion
                </h3>
              </div>
              <p className="text-xs text-slate-600 mt-0.5">
                Automatically scans active chamber rules, doctor leave, and existing appointments in Asia/Dhaka timezone to generate verified promotional cards.
              </p>
            </div>

            {/* Date Selector & Action */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-300 rounded-xl px-3 py-1.5">
                <Calendar className="w-4 h-4 text-sky-600" />
                <span className="text-xs font-semibold text-slate-600">Date:</span>
                <input
                  type="date"
                  value={targetDate}
                  onChange={(e) => setTargetDate(e.target.value)}
                  className="text-xs font-bold text-slate-800 bg-transparent outline-none cursor-pointer"
                />
              </div>

              <button
                type="button"
                onClick={() => setTargetDate(getTodayFormatted())}
                className="px-2.5 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700"
              >
                Today
              </button>

              <button
                type="button"
                disabled={generatorLoading}
                onClick={() => fetchDailyAvailability(targetDate)}
                className="mc-btn-primary !h-9 !text-xs !px-4 flex items-center gap-1.5"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${generatorLoading ? "animate-spin" : ""}`} />
                <span>{generatorLoading ? "Calculating..." : "Generate Availability Cards"}</span>
              </button>
            </div>
          </div>

          {/* Warnings & Staleness alerts */}
          {stalenessWarning && (
            <div className="p-3 rounded-xl bg-amber-50 border border-amber-300 text-xs text-amber-800 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>{stalenessWarning}</span>
              </div>
              <button
                type="button"
                onClick={() => fetchDailyAvailability(targetDate)}
                className="px-2.5 py-1 rounded bg-amber-200 hover:bg-amber-300 font-bold text-[11px] text-amber-900"
              >
                Regenerate Now
              </button>
            </div>
          )}

          {/* Summary KPI Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-3.5 rounded-xl bg-sky-50 border border-sky-100">
              <span className="text-slate-500 font-medium">Eligible Available Specialists:</span>
              <p className="text-xl font-bold text-[#0057b8] mt-1">{availableCards.length}</p>
              <span className="text-[10px] text-sky-700">Chambers open for {targetDate}</span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-slate-500 font-medium">Excluded / Off-Duty:</span>
              <p className="text-xl font-bold text-slate-700 mt-1">{excludedCount}</p>
              <span className="text-[10px] text-slate-500">No shift or leave today</span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-slate-500 font-medium">Conflicting / Blocked:</span>
              <p className="text-xl font-bold text-amber-600 mt-1">{dataConflicts.length}</p>
              <span className="text-[10px] text-slate-500">Excluded from promotion</span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-slate-500 font-medium">Batch Generation Time:</span>
              <p className="text-xs font-bold text-slate-800 mt-1 truncate">
                {lastGeneratedAt ? new Date(lastGeneratedAt).toLocaleTimeString() : "Pending"}
              </p>
              <span className="text-[10px] text-emerald-600 font-bold">Asia/Dhaka Synced</span>
            </div>
          </div>

          {/* Action Bar: Download ZIP & Mark Ready */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="text-xs text-slate-600">
              <strong>Workflow:</strong> 1. Preview cards ➔ 2. Download high-res ZIP or individual PNGs ➔ 3. Copy caption ➔ 4. Publish directly on DeltaCare Facebook Page.
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                disabled={zipDownloading || availableCards.length === 0}
                onClick={handleBatchZipDownload}
                className="px-3.5 py-2 rounded-xl bg-[#0057b8] hover:bg-[#004181] text-white text-xs font-bold flex items-center gap-2 shadow"
              >
                <Download className="w-3.5 h-3.5" />
                <span>{zipDownloading ? "Bundling ZIP..." : "Download All Cards as ZIP"}</span>
              </button>

              <button
                type="button"
                disabled={batchSaving || availableCards.length === 0}
                onClick={handleMarkBatchReady}
                className="px-3.5 py-2 rounded-xl border border-[#0057b8] text-[#0057b8] hover:bg-sky-50 text-xs font-bold flex items-center gap-2"
              >
                <Check className="w-3.5 h-3.5" />
                <span>{batchSaving ? "Saving..." : "Mark Batch Ready"}</span>
              </button>
            </div>
          </div>

          {batchSavedSuccess && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-300 text-xs text-emerald-800 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Batch marked READY in Publishing History for manual DeltaCare Facebook posting.</span>
            </div>
          )}

          {/* Editable Post Caption */}
          <div className="p-4 rounded-xl border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <span>Accompanying Facebook Post Caption</span>
                <span className="text-[10px] text-slate-400 font-normal">
                  (Editable • Included in ZIP download)
                </span>
              </label>

              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(batchCaption);
                  setCopiedBatchCaption(true);
                  setTimeout(() => setCopiedBatchCaption(false), 2000);
                }}
                className="text-xs text-[#0057b8] hover:underline flex items-center gap-1 font-semibold"
              >
                {copiedBatchCaption ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-600" />
                    <span className="text-emerald-600">Copied to Clipboard!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    <span>Copy Caption</span>
                  </>
                )}
              </button>
            </div>

            <textarea
              rows={4}
              value={batchCaption}
              onChange={(e) => setBatchCaption(e.target.value)}
              className="w-full text-xs p-2.5 rounded-lg border border-slate-300 font-mono text-slate-700"
            />
          </div>

          {/* Generated Cards Grid */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-sm text-slate-900">
                Generated Promotional Cards ({availableCards.length})
              </h4>
              <span className="text-xs text-slate-500">
                Click any card to inspect full-size 1080×1080 resolution
              </span>
            </div>

            {availableCards.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {availableCards.map((card) => (
                  <DoctorAvailabilityCard
                    key={`${card.doctorId}-${card.branchId}`}
                    data={card}
                    onInspect={(c) => setInspectedCard(c)}
                  />
                ))}
              </div>
            ) : (
              <div className="p-12 text-center text-slate-400 border border-dashed border-slate-300 rounded-2xl text-xs space-y-2">
                <Calendar className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="font-semibold text-slate-600">
                  No specialists have open consultation chambers on {targetDate}.
                </p>
                <p className="text-[11px] text-slate-400">
                  Select another day or verify doctor schedule rules in Hospital Admin.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ====================================================================
          TAB 4: PUBLISHING HISTORY & META API READINESS
         ==================================================================== */}
      {activeTab === "publishing" && (
        <div className="bg-white rounded-2xl border border-[#d6d6d6] p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">Facebook Promotional Publishing History</h3>
              <p className="text-xs text-slate-600">
                Audit log of generated card batches, publishing readiness statuses, and future Meta Graph API configuration.
              </p>
            </div>

            <button
              type="button"
              disabled={batchesLoading}
              onClick={refreshPublishingHistory}
              className="px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-bold text-slate-700 flex items-center gap-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${batchesLoading ? "animate-spin" : ""}`} />
              <span>Refresh Log</span>
            </button>
          </div>

          {/* Meta Graph API Integration Architecture Box */}
          <div className="p-4 rounded-xl bg-slate-900 text-white space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Share2 className="w-4 h-4 text-sky-400" />
                <h4 className="font-bold text-xs uppercase tracking-wider text-sky-200">
                  Meta Graph API Publishing Architecture
                </h4>
              </div>

              <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/30 text-[10px] font-bold">
                Manual Workflow Active
              </span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              DeltaCare's automated publishing adapter is fully built and ready for future Meta API activation. Automatic publishing is currently disabled by security feature flag (<code className="text-sky-300">FB_AUTO_PUBLISH_ENABLED=false</code>).
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs pt-1">
              <div className="p-2.5 rounded-lg bg-white/5 border border-white/10">
                <span className="text-slate-400 text-[10px] uppercase font-bold block">Meta Page ID</span>
                <span className="font-mono text-slate-200">FB_PAGE_ID (Ready)</span>
              </div>
              <div className="p-2.5 rounded-lg bg-white/5 border border-white/10">
                <span className="text-slate-400 text-[10px] uppercase font-bold block">Page Access Token</span>
                <span className="font-mono text-slate-200">Secured in Server Env</span>
              </div>
              <div className="p-2.5 rounded-lg bg-white/5 border border-white/10">
                <span className="text-slate-400 text-[10px] uppercase font-bold block">Active Mode</span>
                <span className="font-bold text-emerald-400">Generate ➔ Download ➔ Publish</span>
              </div>
            </div>
          </div>

          {/* Batches Table */}
          <div className="space-y-3">
            <h4 className="font-bold text-sm text-slate-900">Generated Batches Log</h4>

            {batchesHistory.length > 0 ? (
              <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100 text-xs">
                {batchesHistory.map((batch) => (
                  <div key={batch.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <strong className="text-slate-900 text-sm">Target Date: {batch.targetDate}</strong>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            batch.status === "PUBLISHED"
                              ? "bg-emerald-100 text-emerald-800"
                              : batch.status === "READY"
                              ? "bg-sky-100 text-[#0057b8]"
                              : "bg-slate-100 text-slate-700"
                          }`}
                        >
                          {batch.status}
                        </span>
                      </div>
                      <p className="text-slate-500 text-[11px] mt-1">
                        {batch.items.length} doctor cards • Generated by {batch.generatedByUserName} on{" "}
                        {new Date(batch.generatedAt).toLocaleString()}
                      </p>
                      <p className="text-slate-600 line-clamp-1 mt-0.5 font-mono text-[11px]">{batch.caption}</p>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setTargetDate(batch.targetDate);
                        setTab("generator");
                      }}
                      className="px-3 py-1.5 rounded-lg border border-[#0057b8] text-[#0057b8] font-bold text-xs hover:bg-sky-50 shrink-0"
                    >
                      View &amp; Redownload
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-slate-400 border border-dashed rounded-xl text-xs">
                No Facebook card batches saved yet. Use the Daily Availability Generator to create a batch.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ====================================================================
          MODALS
         ==================================================================== */}
      {/* 1. Full-Size Card Inspection Modal */}
      <DoctorCardInspectionModal
        card={inspectedCard}
        onClose={() => setInspectedCard(null)}
        accompanyingCaption={batchCaption}
      />

      {/* 2. Doctor Live Website Profile Preview Modal */}
      <DoctorPublicProfilePreviewModal
        doctor={previewModalDoc}
        department={departments.find((d) => d.id === previewModalDoc?.departmentId)}
        branches={branches}
        onClose={() => setPreviewModalDoc(null)}
      />
    </div>
  );
}
