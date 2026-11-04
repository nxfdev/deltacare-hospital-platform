"use client";

import React, { useState } from "react";
import Link from "next/link";
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
} from "lucide-react";
import {
  AIUpdateDraft,
  ApprovalRequest,
  Department,
  DiseaseCondition,
  Doctor,
  PublicationState,
} from "@/types/domain";

interface ContentEditorViewProps {
  conditions: DiseaseCondition[];
  departments: Department[];
  doctors: Doctor[];
  approvals: ApprovalRequest[];
  aiUpdates: AIUpdateDraft[];
  activeTab?: ContentEditorTab;
  onTabChange?: (tab: ContentEditorTab) => void;
  onSaveCondition: (condition: Partial<DiseaseCondition>) => Promise<void>;
  onSaveDoctorProfileCopy: (doctorId: string, bioEn: string, bioBn: string) => Promise<void>;
  onSubmitAIUpdate: (rawText: string) => Promise<void>;
}

export type ContentEditorTab = "overview" | "content" | "profiles" | "departments" | "ai-updates";

export function ContentEditorView({
  conditions,
  departments,
  doctors,
  approvals,
  aiUpdates,
  activeTab: controlledTab,
  onTabChange,
  onSaveCondition,
  onSaveDoctorProfileCopy,
  onSubmitAIUpdate,
}: ContentEditorViewProps) {
  const [internalTab, setInternalTab] = useState<ContentEditorTab>("overview");
  const activeTab = controlledTab || internalTab;
  const setTab = (tab: ContentEditorTab) => {
    setInternalTab(tab);
    onTabChange?.(tab);
  };

  // Condition Form State
  const [editingCondition, setEditingCondition] = useState<DiseaseCondition | null>(null);
  const [condNameEn, setCondNameEn] = useState("");
  const [condNameBn, setCondNameBn] = useState("");
  const [condSlug, setCondSlug] = useState("");
  const [condDeptId, setCondDeptId] = useState(departments[0]?.id || "");
  const [condSummaryEn, setCondSummaryEn] = useState("");
  const [condSummaryBn, setCondSummaryBn] = useState("");
  const [condSymptomsEn, setCondSymptomsEn] = useState("");
  const [condSymptomsBn, setCondSymptomsBn] = useState("");
  const [condCausesEn, setCondCausesEn] = useState("");
  const [condPubState, setCondPubState] = useState<PublicationState>("DRAFT");
  const [condLoading, setCondLoading] = useState(false);
  const [condSearch, setCondSearch] = useState("");

  // Doctor Profile copy editing
  const [selectedDocForBio, setSelectedDocForBio] = useState<Doctor | null>(null);
  const [docBioEn, setDocBioEn] = useState("");
  const [docBioBn, setDocBioBn] = useState("");
  const [bioSuccess, setBioSuccess] = useState(false);
  const [bioLoading, setBioLoading] = useState(false);

  // AI Update state
  const [aiRawText, setAiRawText] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiSuccess, setAiSuccess] = useState(false);

  const publishedCount = conditions.filter((c) => c.publicationState === "PUBLISHED").length;
  const draftCount = conditions.filter((c) => c.publicationState === "DRAFT").length;
  const pendingApprovalsCount = approvals.filter((a) => a.status === "PENDING_APPROVAL").length;

  const filteredConditions = conditions.filter(
    (c) =>
      c.nameEn.toLowerCase().includes(condSearch.toLowerCase()) ||
      c.nameBn.includes(condSearch) ||
      c.slug.includes(condSearch.toLowerCase())
  );

  const handleConditionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCondLoading(true);
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
      summaryBn: condSummaryBn,
      symptomsEn: condSymptomsEn.split(",").map((s) => s.trim()).filter(Boolean),
      symptomsBn: condSymptomsBn.split(",").map((s) => s.trim()).filter(Boolean),
      causesEn: condCausesEn,
      publicationState: condPubState,
    });
    setCondLoading(false);
    setEditingCondition(null);
    setCondNameEn("");
    setCondNameBn("");
    setCondSlug("");
    setCondSummaryEn("");
    setCondSummaryBn("");
    setCondSymptomsEn("");
    setCondSymptomsBn("");
    setCondCausesEn("");
  };

  const handleBioSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDocForBio) return;
    setBioLoading(true);
    await onSaveDoctorProfileCopy(selectedDocForBio.id, docBioEn, docBioBn);
    setBioLoading(false);
    setBioSuccess(true);
    setTimeout(() => setBioSuccess(false), 4000);
  };

  const handleAiSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAiLoading(true);
    await onSubmitAIUpdate(aiRawText);
    setAiLoading(false);
    setAiSuccess(true);
    setAiRawText("");
    setTimeout(() => setAiSuccess(false), 4000);
  };

  return (
    <div className="space-y-6">
      {/* Sub-navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-[#d6d6d6] pb-3 overflow-x-auto">
        <button
          type="button"
          onClick={() => setTab("overview")}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors ${
            activeTab === "overview"
              ? "bg-[#0057b8] text-white shadow-sm"
              : "text-[#484848] hover:bg-[#e2e8f0]"
          }`}
        >
          CMS Overview
        </button>

        <button
          type="button"
          onClick={() => setTab("content")}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors ${
            activeTab === "content"
              ? "bg-[#0057b8] text-white shadow-sm"
              : "text-[#484848] hover:bg-[#e2e8f0]"
          }`}
        >
          Diseases &amp; Conditions ({conditions.length})
        </button>

        <button
          type="button"
          onClick={() => setTab("profiles")}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors ${
            activeTab === "profiles"
              ? "bg-[#0057b8] text-white shadow-sm"
              : "text-[#484848] hover:bg-[#e2e8f0]"
          }`}
        >
          Doctor Public Profiles ({doctors.length})
        </button>

        <button
          type="button"
          onClick={() => setTab("departments")}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors ${
            activeTab === "departments"
              ? "bg-[#0057b8] text-white shadow-sm"
              : "text-[#484848] hover:bg-[#e2e8f0]"
          }`}
        >
          Department Copy ({departments.length})
        </button>

        <button
          type="button"
          onClick={() => setTab("ai-updates")}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 ${
            activeTab === "ai-updates"
              ? "bg-[#0057b8] text-white shadow-sm"
              : "text-[#484848] hover:bg-[#e2e8f0]"
          }`}
        >
          <Bot className="w-3.5 h-3.5" />
          <span>Staff AI Update Assistant</span>
        </button>
      </div>

      {/* ====================================================================
          TAB 1: CMS OVERVIEW
         ==================================================================== */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl border border-[#d6d6d6] p-4 shadow-sm">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#059669]">
                Published Health Articles
              </span>
              <h3 className="text-xl font-bold text-[#080808] mt-1">{publishedCount}</h3>
              <p className="text-xs text-[#686868] mt-1">Live in A–Z Directory</p>
            </div>

            <div className="bg-white rounded-xl border border-[#d6d6d6] p-4 shadow-sm">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#d97706]">
                Draft Articles
              </span>
              <h3 className="text-xl font-bold text-[#d97706] mt-1">{draftCount}</h3>
              <p className="text-xs text-[#686868] mt-1">In Editorial Review</p>
            </div>

            <div className="bg-white rounded-xl border border-[#d6d6d6] p-4 shadow-sm">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#0057b8]">
                Awaiting Admin Approval
              </span>
              <h3 className="text-xl font-bold text-[#0057b8] mt-1">{pendingApprovalsCount}</h3>
              <p className="text-xs text-[#686868] mt-1">Hospital Admin Sign-off</p>
            </div>

            <div className="bg-white rounded-xl border border-[#d6d6d6] p-4 shadow-sm">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#686868]">
                Specialist Public Bios
              </span>
              <h3 className="text-xl font-bold text-[#080808] mt-1">{doctors.length}</h3>
              <p className="text-xs text-[#686868] mt-1">Editorial Descriptions</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-[#d6d6d6] p-6 space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-[#080808]">Editorial Workflows</h3>
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => setTab("content")}
                className="mc-btn-primary !h-10 !text-xs !px-4"
              >
                <Plus className="w-4 h-4 mr-1.5" />
                <span>Draft New Disease / Condition Article</span>
              </button>

              <button
                type="button"
                onClick={() => setTab("profiles")}
                className="mc-btn-secondary !h-10 !text-xs !px-4"
              >
                <Edit3 className="w-4 h-4 mr-1.5" />
                <span>Edit Specialist Public Bios</span>
              </button>

              <button
                type="button"
                onClick={() => setTab("ai-updates")}
                className="mc-btn-secondary !h-10 !text-xs !px-4"
              >
                <Bot className="w-4 h-4 mr-1.5" />
                <span>Launch Staff AI Assistant</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ====================================================================
          TAB 2: DISEASES & CONDITIONS CMS
         ==================================================================== */}
      {activeTab === "content" && (
        <div className="space-y-6">
          {/* Article Form */}
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

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block font-semibold mb-1">Common Symptoms (Comma separated)</label>
                  <input
                    type="text"
                    placeholder="Fatigue, Frequent urination, Blurred vision"
                    value={condSymptomsEn}
                    onChange={(e) => setCondSymptomsEn(e.target.value)}
                    className="w-full h-9 px-3 rounded-lg border border-[#a1a1a1]"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Primary Causes</label>
                  <input
                    type="text"
                    placeholder="Insulin resistance, Genetics"
                    value={condCausesEn}
                    onChange={(e) => setCondCausesEn(e.target.value)}
                    className="w-full h-9 px-3 rounded-lg border border-[#a1a1a1]"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Publication State</label>
                  <select
                    value={condPubState}
                    onChange={(e) => setCondPubState(e.target.value as PublicationState)}
                    className="w-full h-9 px-3 rounded-lg border border-[#a1a1a1] bg-white font-semibold"
                  >
                    <option value="DRAFT">DRAFT (Hidden)</option>
                    <option value="PENDING_APPROVAL">PENDING_APPROVAL (Submit to Admin)</option>
                    <option value="PUBLISHED">PUBLISHED (Direct)</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="submit"
                  disabled={condLoading}
                  className="mc-btn-primary !h-9 !text-xs !px-5"
                >
                  {condLoading ? "Saving..." : editingCondition ? "Update Article" : "Create Article"}
                </button>
                {editingCondition && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingCondition(null);
                      setCondNameEn("");
                      setCondNameBn("");
                      setCondSummaryEn("");
                    }}
                    className="px-3 py-1.5 rounded-lg border border-[#757575] text-xs"
                  >
                    Cancel Editing
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* Condition Articles List */}
          <div className="bg-white rounded-2xl border border-[#d6d6d6] p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#d6d6d6]">
              <div>
                <h3 className="text-base font-bold text-[#080808]">
                  Health Condition Articles Directory ({filteredConditions.length})
                </h3>
              </div>
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-[#686868] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search condition or slug..."
                  value={condSearch}
                  onChange={(e) => setCondSearch(e.target.value)}
                  className="h-8 pl-8 pr-3 rounded-lg border border-[#a1a1a1] text-xs w-60"
                />
              </div>
            </div>

            <div className="divide-y divide-[#d6d6d6]">
              {filteredConditions.map((cond) => (
                <div key={cond.id} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div>
                    <div className="flex items-center gap-2">
                      <strong className="text-sm text-[#080808]">{cond.nameEn}</strong>
                      <span className="text-[#686868]">({cond.nameBn})</span>
                      <span
                        className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                          cond.publicationState === "PUBLISHED"
                            ? "bg-[#ecfdf5] text-[#065f46]"
                            : "bg-[#fef3c7] text-[#92400e]"
                        }`}
                      >
                        {cond.publicationState}
                      </span>
                    </div>
                    <p className="text-[#484848] mt-1">{cond.summaryEn}</p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingCondition(cond);
                        setCondNameEn(cond.nameEn);
                        setCondNameBn(cond.nameBn);
                        setCondSlug(cond.slug);
                        setCondDeptId(cond.departmentId);
                        setCondSummaryEn(cond.summaryEn);
                        setCondSummaryBn(cond.summaryBn);
                        setCondSymptomsEn(cond.symptomsEn.join(", "));
                        setCondCausesEn(cond.causesEn);
                        setCondPubState(cond.publicationState);
                      }}
                      className="px-2.5 py-1 rounded border border-[#0057b8] text-[#0057b8] font-bold text-[11px]"
                    >
                      Edit
                    </button>
                    <Link
                      href={`/diseases-conditions/${cond.slug}`}
                      className="text-[#686868] hover:text-[#0057b8]"
                      title="View Article"
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

      {/* ====================================================================
          TAB 3: DOCTOR PUBLIC PROFILES
         ==================================================================== */}
      {activeTab === "profiles" && (
        <div className="bg-white rounded-2xl border border-[#d6d6d6] p-6 space-y-5">
          <div className="border-b border-[#d6d6d6] pb-3">
            <h3 className="text-base font-bold text-[#080808]">Specialist Public-Facing Bios &amp; Content</h3>
            <p className="text-xs text-[#686868]">
              Manage patient-facing biographies and qualifications descriptions. Changes submit an Approval Request and do NOT alter operational consultation fees or schedules.
            </p>
          </div>

          {bioSuccess && (
            <div className="p-3 rounded-lg bg-[#ecfdf5] border border-[#059669] text-xs text-[#065f46] flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#059669]" />
              <span>Doctor public bio update submitted for Hospital Admin approval.</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* List */}
            <div className="md:col-span-1 border border-[#d6d6d6] rounded-xl overflow-hidden divide-y divide-[#d6d6d6] max-h-96 overflow-y-auto text-xs">
              {doctors.map((d) => (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => {
                    setSelectedDocForBio(d);
                    setDocBioEn(d.bioEn);
                    setDocBioBn(d.bioBn);
                  }}
                  className={`w-full text-left p-3 hover:bg-[#f8fafc] transition-colors ${
                    selectedDocForBio?.id === d.id ? "bg-[#e8f0f9] font-bold text-[#0057b8]" : ""
                  }`}
                >
                  <p className="text-[#080808]">{d.nameEn}</p>
                  <span className="text-[11px] text-[#686868]">{d.designationEn}</span>
                </button>
              ))}
            </div>

            {/* Editor */}
            <div className="md:col-span-2">
              {selectedDocForBio ? (
                <form onSubmit={handleBioSubmit} className="space-y-4 text-xs">
                  <div>
                    <h4 className="font-bold text-sm text-[#080808]">
                      Editing Public Copy: {selectedDocForBio.nameEn}
                    </h4>
                    <p className="text-[11px] text-[#686868]">BMDC: {selectedDocForBio.bmdcRegistrationNo}</p>
                  </div>

                  <div>
                    <label className="block font-semibold mb-1">Public Bio (English) *</label>
                    <textarea
                      required
                      rows={4}
                      value={docBioEn}
                      onChange={(e) => setDocBioEn(e.target.value)}
                      className="w-full p-2.5 rounded-lg border border-[#a1a1a1]"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold mb-1">Public Bio (Bangla)</label>
                    <textarea
                      rows={4}
                      value={docBioBn}
                      onChange={(e) => setDocBioBn(e.target.value)}
                      className="w-full p-2.5 rounded-lg border border-[#a1a1a1]"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={bioLoading}
                    className="mc-btn-primary !h-9 !text-xs !px-5"
                  >
                    {bioLoading ? "Submitting..." : "Submit Profile Copy for Approval"}
                  </button>
                </form>
              ) : (
                <div className="p-8 text-center text-[#686868] text-xs border border-dashed border-[#d6d6d6] rounded-xl">
                  Select a specialist from the list to edit their public biography.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ====================================================================
          TAB 4: DEPARTMENT COPY
         ==================================================================== */}
      {activeTab === "departments" && (
        <div className="bg-white rounded-2xl border border-[#d6d6d6] p-6 space-y-4">
          <div className="border-b border-[#d6d6d6] pb-3">
            <h3 className="text-base font-bold text-[#080808]">Clinical Department Descriptions</h3>
            <p className="text-xs text-[#686868]">Patient-facing department overviews, clinical scope, and preparation guides.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            {departments.map((dept) => (
              <div key={dept.id} className="p-4 rounded-xl border border-[#d6d6d6] bg-[#f8fafc] space-y-2">
                <div className="flex items-center justify-between">
                  <strong className="text-sm text-[#080808]">{dept.nameEn}</strong>
                  <span className="text-[11px] text-[#686868]">({dept.nameBn})</span>
                </div>
                <p className="text-[#484848] line-clamp-2">{dept.shortDescriptionEn}</p>
                <div className="pt-2 flex items-center justify-between">
                  <Link
                    href={`/departments/${dept.slug}`}
                    className="text-[#0057b8] font-bold underline inline-flex items-center gap-1"
                  >
                    <span>View Department Page</span>
                    <ExternalLink className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ====================================================================
          TAB 5: STAFF AI UPDATE ASSISTANT
         ==================================================================== */}
      {activeTab === "ai-updates" && (
        <div className="bg-white rounded-2xl border border-[#d6d6d6] p-6 space-y-5 max-w-2xl">
          <div className="border-b border-[#d6d6d6] pb-3">
            <h3 className="text-base font-bold text-[#080808] flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-[#0057b8]" />
              <span>Staff AI Update Assistant (Draft Helper)</span>
            </h3>
            <p className="text-xs text-[#686868]">
              Paste unstructured meeting notes or clinical schedule change text. The AI structures it into proposed changes and creates a draft requiring human approver sign-off.
            </p>
          </div>

          {aiSuccess && (
            <div className="p-3.5 rounded-xl bg-[#ecfdf5] border border-[#059669] text-xs text-[#065f46] flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#059669]" />
              <span>AI update draft created and placed in PENDING_APPROVAL for Admin review.</span>
            </div>
          )}

          <form onSubmit={handleAiSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold mb-1">Unstructured Update Notes *</label>
              <textarea
                required
                rows={5}
                placeholder="e.g. Dr. Ayesha Siddiqua will be consulting from 5pm to 9pm starting next Monday at Dhanmondi campus Room 401..."
                value={aiRawText}
                onChange={(e) => setAiRawText(e.target.value)}
                className="w-full p-3 rounded-xl border border-[#a1a1a1] text-xs"
              />
            </div>

            <button
              type="submit"
              disabled={aiLoading}
              className="mc-btn-primary !h-9 !text-xs !px-5 inline-flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{aiLoading ? "Generating AI Draft..." : "Convert to Structured Draft"}</span>
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
