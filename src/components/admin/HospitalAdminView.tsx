"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Stethoscope,
  Plus,
  Search,
  Calendar,
  Building2,
  CheckSquare,
  MessageSquare,
  BarChart3,
  Edit2,
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  ChevronRight,
  Filter,
  Download,
  Clock,
  User,
  ShieldCheck,
} from "lucide-react";
import {
  Appointment,
  ApprovalRequest,
  Branch,
  Department,
  Doctor,
  FeedbackRecord,
  PublicationState,
  Specialty,
} from "@/types/domain";
import { SpecialistModal } from "./SpecialistModal";
import { DeactivateSpecialistModal } from "./DeactivateSpecialistModal";

interface HospitalAdminViewProps {
  doctors: Doctor[];
  departments: Department[];
  branches: Branch[];
  specialties: Specialty[];
  appointments: Appointment[];
  approvals: ApprovalRequest[];
  feedbacks: FeedbackRecord[];
  analytics: {
    totalAppointments: number;
    appointmentsByStatus: Record<string, number>;
    totalDoctors: number;
    totalDepartments: number;
  };
  onSaveDoctor: (doctor: Doctor, isNew: boolean) => void;
  onUpdateDoctorStatus: (doctor: Doctor) => void;
  onTransitionAppointment: (
    aptId: string,
    toStatus: Appointment["status"],
    reason: string,
    chamberNote?: string
  ) => Promise<void>;
  onReviewApproval: (approvalId: string, decision: "APPROVED_AND_PUBLISHED" | "REJECTED", note: string) => Promise<void>;
  onUpdateFeedback: (feedbackId: string, status: FeedbackRecord["status"], notes: string) => Promise<void>;
  onCreateDepartment: (data: { nameEn: string; nameBn: string; slug: string; branchId: string }) => Promise<void>;
  activeTab?: HospitalAdminTab;
  onTabChange?: (tab: HospitalAdminTab) => void;
}

export type HospitalAdminTab =
  | "overview"
  | "specialists"
  | "departments"
  | "appointments"
  | "approvals"
  | "feedback"
  | "reports";

export function HospitalAdminView({
  doctors,
  departments,
  branches,
  specialties,
  appointments,
  approvals,
  feedbacks,
  analytics,
  onSaveDoctor,
  onUpdateDoctorStatus,
  onTransitionAppointment,
  onReviewApproval,
  onUpdateFeedback,
  onCreateDepartment,
  activeTab: controlledTab,
  onTabChange,
}: HospitalAdminViewProps) {
  const [internalTab, setInternalTab] = useState<HospitalAdminTab>("overview");
  const activeTab = controlledTab || internalTab;
  const setTab = (tab: HospitalAdminTab) => {
    if (onTabChange) onTabChange(tab);
    setInternalTab(tab);
  };

  // Specialist Modals State
  const [specialistModalOpen, setSpecialistModalOpen] = useState(false);
  const [specialistModalMode, setSpecialistModalMode] = useState<"CREATE" | "EDIT">("CREATE");
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);

  const [deactivateModalOpen, setDeactivateModalOpen] = useState(false);
  const [deactivateAction, setDeactivateAction] = useState<"DEACTIVATE" | "ACTIVATE">("DEACTIVATE");

  // Specialist Filtering
  const [docSearch, setDocSearch] = useState("");
  const [docDeptFilter, setDocDeptFilter] = useState("ALL");
  const [docStatusFilter, setDocStatusFilter] = useState("ALL");

  // Appointment Filtering
  const [aptSearch, setAptSearch] = useState("");
  const [aptStatusFilter, setAptStatusFilter] = useState<string>("ALL");

  // Department creation state
  const [newDeptEn, setNewDeptEn] = useState("");
  const [newDeptBn, setNewDeptBn] = useState("");
  const [newDeptSlug, setNewDeptSlug] = useState("");
  const [newDeptBranch, setNewDeptBranch] = useState(branches[0]?.id || "");
  const [deptLoading, setDeptLoading] = useState(false);

  // Filtered Specialists
  const filteredDoctors = doctors.filter((doc) => {
    const matchesSearch =
      doc.nameEn.toLowerCase().includes(docSearch.toLowerCase()) ||
      doc.nameBn.includes(docSearch) ||
      doc.bmdcRegistrationNo.toLowerCase().includes(docSearch.toLowerCase());
    const matchesDept = docDeptFilter === "ALL" || doc.departmentId === docDeptFilter;
    const matchesStatus = docStatusFilter === "ALL" || doc.publicationState === docStatusFilter;
    return matchesSearch && matchesDept && matchesStatus;
  });

  // Filtered Appointments
  const filteredAppointments = appointments.filter((apt) => {
    const matchesSearch =
      apt.reference.toLowerCase().includes(aptSearch.toLowerCase()) ||
      apt.patientName.toLowerCase().includes(aptSearch.toLowerCase()) ||
      apt.patientPhone.includes(aptSearch);
    const matchesStatus = aptStatusFilter === "ALL" || apt.status === aptStatusFilter;
    return matchesSearch && matchesStatus;
  });

  const pendingApprovalsCount = approvals.filter((a) => a.status === "PENDING_APPROVAL").length;
  const pendingAppointmentsCount = appointments.filter((a) => a.status === "REQUESTED").length;

  const handleCreateDeptSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setDeptLoading(true);
    await onCreateDepartment({
      nameEn: newDeptEn,
      nameBn: newDeptBn || newDeptEn,
      slug:
        newDeptSlug ||
        newDeptEn
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/(^-|-$)/g, ""),
      branchId: newDeptBranch,
    });
    setNewDeptEn("");
    setNewDeptBn("");
    setNewDeptSlug("");
    setDeptLoading(false);
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
          Hospital Overview
        </button>
        <button
          type="button"
          onClick={() => setTab("specialists")}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors ${
            activeTab === "specialists"
              ? "bg-[#0057b8] text-white shadow-sm"
              : "text-[#484848] hover:bg-[#e2e8f0]"
          }`}
        >
          Specialists & Doctors ({doctors.length})
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
          Departments ({departments.length})
        </button>
        <button
          type="button"
          onClick={() => setTab("appointments")}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 ${
            activeTab === "appointments"
              ? "bg-[#0057b8] text-white shadow-sm"
              : "text-[#484848] hover:bg-[#e2e8f0]"
          }`}
        >
          <span>Appointments</span>
          {pendingAppointmentsCount > 0 && (
            <span className="px-1.5 py-0.2 rounded-full bg-[#dc2626] text-white text-[10px]">
              {pendingAppointmentsCount}
            </span>
          )}
        </button>
        <button
          type="button"
          onClick={() => setTab("approvals")}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 ${
            activeTab === "approvals"
              ? "bg-[#0057b8] text-white shadow-sm"
              : "text-[#484848] hover:bg-[#e2e8f0]"
          }`}
        >
          <span>Approval Queue</span>
          {pendingApprovalsCount > 0 && (
            <span className="px-1.5 py-0.2 rounded-full bg-[#d97706] text-white text-[10px]">
              {pendingApprovalsCount}
            </span>
          )}
        </button>
        <button
          type="button"
          onClick={() => setTab("feedback")}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors ${
            activeTab === "feedback"
              ? "bg-[#0057b8] text-white shadow-sm"
              : "text-[#484848] hover:bg-[#e2e8f0]"
          }`}
        >
          Feedback ({feedbacks.length})
        </button>
        <button
          type="button"
          onClick={() => setTab("reports")}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors ${
            activeTab === "reports"
              ? "bg-[#0057b8] text-white shadow-sm"
              : "text-[#484848] hover:bg-[#e2e8f0]"
          }`}
        >
          Reports & CSV
        </button>
      </div>

      {/* ====================================================================
          TAB 1: OVERVIEW
         ==================================================================== */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl border border-[#d6d6d6] p-4 shadow-sm">
              <p className="text-[11px] font-bold uppercase tracking-wider text-[#686868]">Active Specialists</p>
              <h3 className="text-xl font-bold text-[#080808] mt-1">{doctors.length}</h3>
              <p className="text-xs text-[#059669] font-semibold mt-1">BMDC Verified</p>
            </div>

            <div className="bg-white rounded-xl border border-[#d6d6d6] p-4 shadow-sm">
              <p className="text-[11px] font-bold uppercase tracking-wider text-[#686868]">Pending Requests</p>
              <h3 className="text-xl font-bold text-[#dc2626] mt-1">{pendingAppointmentsCount}</h3>
              <p className="text-xs text-[#686868] mt-1">Awaiting Front-Desk Call</p>
            </div>

            <div className="bg-white rounded-xl border border-[#d6d6d6] p-4 shadow-sm">
              <p className="text-[11px] font-bold uppercase tracking-wider text-[#686868]">Pending Approvals</p>
              <h3 className="text-xl font-bold text-[#d97706] mt-1">{pendingApprovalsCount}</h3>
              <p className="text-xs text-[#686868] mt-1">CMS / Fee Changes</p>
            </div>

            <div className="bg-white rounded-xl border border-[#d6d6d6] p-4 shadow-sm">
              <p className="text-[11px] font-bold uppercase tracking-wider text-[#686868]">Hospital Campuses</p>
              <h3 className="text-xl font-bold text-[#080808] mt-1">{branches.length}</h3>
              <p className="text-xs text-[#0057b8] font-semibold mt-1">Dhanmondi, Uttara & Banani</p>
            </div>
          </div>

          {/* Quick Actions Cluster */}
          <div className="bg-white rounded-2xl border border-[#d6d6d6] p-6 space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-[#080808]">Quick Hospital Actions</h3>
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => {
                  setSelectedDoctor(null);
                  setSpecialistModalMode("CREATE");
                  setSpecialistModalOpen(true);
                }}
                className="mc-btn-primary !h-10 !text-xs !px-4"
              >
                <Plus className="w-4 h-4 mr-1.5" />
                <span>Add Specialist Record</span>
              </button>

              <button
                type="button"
                onClick={() => setTab("appointments")}
                className="mc-btn-secondary !h-10 !text-xs !px-4"
              >
                <Calendar className="w-4 h-4 mr-1.5" />
                <span>Triage Appointments ({pendingAppointmentsCount} Pending)</span>
              </button>

              <button
                type="button"
                onClick={() => setTab("approvals")}
                className="mc-btn-secondary !h-10 !text-xs !px-4"
              >
                <CheckSquare className="w-4 h-4 mr-1.5" />
                <span>Review Approval Queue ({pendingApprovalsCount})</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ====================================================================
          TAB 2: SPECIALISTS MANAGEMENT (FULL CRUD)
         ==================================================================== */}
      {activeTab === "specialists" && (
        <div className="bg-white rounded-2xl border border-[#d6d6d6] p-6 space-y-5">
          {/* Top Controls: Title, Search, Filters, Add Button */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-[#d6d6d6]">
            <div>
              <h3 className="text-base font-bold text-[#080808]">
                Hospital Specialists & Physicians Directory ({filteredDoctors.length} of {doctors.length})
              </h3>
              <p className="text-xs text-[#686868]">
                Add, search, update clinical credentials, manage consultation fees, or deactivate specialist profiles.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-[#686868] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search doctor or BMDC..."
                  value={docSearch}
                  onChange={(e) => setDocSearch(e.target.value)}
                  className="h-9 pl-8 pr-3 rounded-lg border border-[#a1a1a1] text-xs w-48 sm:w-56 focus:ring-2 focus:ring-[#0057b8]"
                />
              </div>

              <select
                value={docDeptFilter}
                onChange={(e) => setDocDeptFilter(e.target.value)}
                className="h-9 px-2.5 rounded-lg border border-[#a1a1a1] text-xs bg-white font-medium"
              >
                <option value="ALL">All Departments</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.nameEn}
                  </option>
                ))}
              </select>

              <select
                value={docStatusFilter}
                onChange={(e) => setDocStatusFilter(e.target.value)}
                className="h-9 px-2.5 rounded-lg border border-[#a1a1a1] text-xs bg-white font-medium"
              >
                <option value="ALL">All Statuses</option>
                <option value="PUBLISHED">PUBLISHED</option>
                <option value="PENDING_APPROVAL">PENDING_APPROVAL</option>
                <option value="DRAFT">DRAFT</option>
                <option value="ARCHIVED">ARCHIVED</option>
              </select>

              <button
                type="button"
                onClick={() => {
                  setSelectedDoctor(null);
                  setSpecialistModalMode("CREATE");
                  setSpecialistModalOpen(true);
                }}
                className="mc-btn-primary !h-9 !text-xs !px-4"
              >
                <Plus className="w-4 h-4 mr-1" />
                <span>Add Specialist</span>
              </button>
            </div>
          </div>

          {/* Specialist Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#f8fafc] text-[#484848] font-bold border-b border-[#d6d6d6]">
                <tr>
                  <th className="py-2.5 px-3">Specialist Name & Qualifications</th>
                  <th className="py-2.5 px-3">Department</th>
                  <th className="py-2.5 px-3">Chamber & Branch</th>
                  <th className="py-2.5 px-3">Consultation Fee</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#d6d6d6]">
                {filteredDoctors.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-[#686868]">
                      No specialists match the specified search or filter criteria.
                    </td>
                  </tr>
                ) : (
                  filteredDoctors.map((doc) => {
                    const dept = departments.find((d) => d.id === doc.departmentId);
                    const primaryBranch = doc.branches?.[0];
                    const branchObj = branches.find((b) => b.id === primaryBranch?.branchId);

                    return (
                      <tr key={doc.id} className="hover:bg-[#f8fafc]">
                        <td className="py-3 px-3">
                          <strong className="text-sm text-[#080808]">{doc.nameEn}</strong>
                          <div className="text-[11px] text-[#686868]">
                            {doc.nameBn} • <span className="font-mono text-[#004181] font-semibold">{doc.bmdcRegistrationNo}</span>
                          </div>
                          <div className="text-[11px] text-[#484848] font-medium">{doc.qualificationsEn}</div>
                        </td>

                        <td className="py-3 px-3 text-[#080808] font-medium">
                          {dept?.nameEn || doc.departmentId}
                        </td>

                        <td className="py-3 px-3 text-[#484848]">
                          <div>{branchObj?.nameEn || "Hospital Campus"}</div>
                          <div className="text-[11px] text-[#686868]">{primaryBranch?.roomNumber || "Chamber Desk"}</div>
                        </td>

                        <td className="py-3 px-3">
                          <span className="font-bold text-[#080808]">BDT {doc.consultationFeeBdt}</span>
                          <div className="text-[10px] text-[#686868]">Follow-up: BDT {doc.followupFeeBdt}</div>
                        </td>

                        <td className="py-3 px-3">
                          <span
                            className={`inline-block px-2 py-0.5 rounded-full font-bold text-[10px] ${
                              doc.publicationState === "PUBLISHED"
                                ? "bg-[#ecfdf5] text-[#065f46]"
                                : doc.publicationState === "PENDING_APPROVAL"
                                ? "bg-[#fef3c7] text-[#92400e]"
                                : doc.publicationState === "ARCHIVED"
                                ? "bg-[#fef2f2] text-[#991b1b]"
                                : "bg-[#f1f5f9] text-[#475569]"
                            }`}
                          >
                            {doc.publicationState}
                          </span>
                        </td>

                        <td className="py-3 px-3 text-right">
                          <div className="inline-flex items-center gap-1.5">
                            {/* Update Specialist Button */}
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedDoctor(doc);
                                setSpecialistModalMode("EDIT");
                                setSpecialistModalOpen(true);
                              }}
                              className="px-2.5 py-1 rounded-md border border-[#0057b8] text-[#0057b8] font-semibold hover:bg-[#e8f0f9] text-[11px] inline-flex items-center gap-1"
                              title="Update Specialist Profile"
                            >
                              <Edit2 className="w-3 h-3" />
                              <span>Update</span>
                            </button>

                            {/* Deactivate / Activate Button */}
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedDoctor(doc);
                                setDeactivateAction(doc.publicationState === "ARCHIVED" ? "ACTIVATE" : "DEACTIVATE");
                                setDeactivateModalOpen(true);
                              }}
                              className={`px-2 py-1 rounded-md text-[11px] font-semibold ${
                                doc.publicationState === "ARCHIVED"
                                  ? "border border-[#059669] text-[#059669] hover:bg-[#ecfdf5]"
                                  : "border border-[#dc2626] text-[#dc2626] hover:bg-[#fef2f2]"
                              }`}
                            >
                              {doc.publicationState === "ARCHIVED" ? "Activate" : "Deactivate"}
                            </button>

                            <Link
                              href={`/doctors/${doc.slug}`}
                              className="p-1 text-[#686868] hover:text-[#0057b8]"
                              title="View Public Profile"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </Link>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ====================================================================
          TAB 3: DEPARTMENTS & SERVICES
         ==================================================================== */}
      {activeTab === "departments" && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-[#d6d6d6] p-6 space-y-4">
            <h3 className="text-base font-bold text-[#080808]">Create Clinical Department</h3>
            <form onSubmit={handleCreateDeptSubmit} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 items-end text-xs">
              <div>
                <label className="block font-semibold mb-1">Department Name (EN) *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Pulmonology & Chest Medicine"
                  value={newDeptEn}
                  onChange={(e) => setNewDeptEn(e.target.value)}
                  className="w-full h-9 px-3 rounded-lg border border-[#a1a1a1]"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">Department Name (BN)</label>
                <input
                  type="text"
                  placeholder="পালমোনোলজি ও বক্ষব্যাধি"
                  value={newDeptBn}
                  onChange={(e) => setNewDeptBn(e.target.value)}
                  className="w-full h-9 px-3 rounded-lg border border-[#a1a1a1]"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">Primary Branch</label>
                <select
                  value={newDeptBranch}
                  onChange={(e) => setNewDeptBranch(e.target.value)}
                  className="w-full h-9 px-3 rounded-lg border border-[#a1a1a1] bg-white"
                >
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.nameEn}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <button
                  type="submit"
                  disabled={deptLoading}
                  className="mc-btn-primary w-full !h-9 !text-xs justify-center"
                >
                  {deptLoading ? "Creating..." : "Add Department"}
                </button>
              </div>
            </form>
          </div>

          <div className="bg-white rounded-2xl border border-[#d6d6d6] p-6 space-y-4">
            <h3 className="text-base font-bold text-[#080808]">Clinical Departments ({departments.length})</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
              {departments.map((dept) => (
                <div key={dept.id} className="p-3.5 rounded-xl border border-[#d6d6d6] bg-[#f8fafc]">
                  <strong className="text-[#080808] text-sm">{dept.nameEn}</strong>
                  <div className="text-[#686868] mt-0.5">{dept.nameBn}</div>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-[11px] text-[#0057b8] font-bold">
                      {doctors.filter((d) => d.departmentId === dept.id).length} Specialists
                    </span>
                    <Link
                      href={`/departments/${dept.slug}`}
                      className="text-[11px] text-[#004181] font-bold underline"
                    >
                      View Page
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ====================================================================
          TAB 4: APPOINTMENTS MANAGEMENT
         ==================================================================== */}
      {activeTab === "appointments" && (
        <div className="bg-white rounded-2xl border border-[#d6d6d6] p-6 space-y-5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#d6d6d6]">
            <div>
              <h3 className="text-base font-bold text-[#080808]">
                Hospital Appointments & Triage ({filteredAppointments.length})
              </h3>
              <p className="text-xs text-[#686868]">Manage requests, confirm chamber timings, reschedule, or cancel.</p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-[#686868] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search reference, patient, phone..."
                  value={aptSearch}
                  onChange={(e) => setAptSearch(e.target.value)}
                  className="h-8 pl-8 pr-3 rounded-lg border border-[#a1a1a1] text-xs w-56"
                />
              </div>

              <select
                value={aptStatusFilter}
                onChange={(e) => setAptStatusFilter(e.target.value)}
                className="h-8 px-2.5 rounded-lg border border-[#a1a1a1] text-xs bg-white font-semibold"
              >
                <option value="ALL">All Statuses</option>
                <option value="REQUESTED">REQUESTED</option>
                <option value="CONFIRMED">CONFIRMED</option>
                <option value="CANCELLED">CANCELLED</option>
                <option value="COMPLETED">COMPLETED</option>
              </select>
            </div>
          </div>

          <div className="divide-y divide-[#d6d6d6]">
            {filteredAppointments.length === 0 ? (
              <div className="py-8 text-center text-[#686868] text-xs">No appointments match the filter.</div>
            ) : (
              filteredAppointments.map((apt) => {
                const doc = doctors.find((d) => d.id === apt.doctorId);
                return (
                  <div key={apt.id} className="py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-[#0057b8] text-sm">{apt.reference}</span>
                        <span
                          className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                            apt.status === "CONFIRMED"
                              ? "bg-[#ecfdf5] text-[#065f46]"
                              : apt.status === "REQUESTED"
                              ? "bg-[#fef3c7] text-[#92400e]"
                              : "bg-[#fef2f2] text-[#991b1b]"
                          }`}
                        >
                          {apt.status}
                        </span>
                      </div>
                      <div className="text-[#080808] font-semibold">
                        {apt.patientName} • <span className="text-[#686868]">{apt.patientPhone}</span>
                      </div>
                      <div className="text-[#484848]">
                        Specialist: <strong>{doc?.nameEn || "Consultant"}</strong> • Preferred: {apt.preferredDate} ({apt.preferredTimeSlot || "Evening"})
                      </div>
                      {apt.staffNotes && (
                        <p className="text-[11px] text-[#059669] italic">Chamber note: {apt.staffNotes}</p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {apt.status === "REQUESTED" && (
                        <button
                          type="button"
                          onClick={() =>
                            onTransitionAppointment(
                              apt.id,
                              "CONFIRMED",
                              "Front-desk verified slot and called patient",
                              "Confirmed for Chamber 302"
                            )
                          }
                          className="px-3 py-1.5 rounded-lg bg-[#059669] text-white font-bold hover:bg-[#047857]"
                        >
                          Confirm Slot
                        </button>
                      )}
                      {apt.status !== "CANCELLED" && (
                        <button
                          type="button"
                          onClick={() => {
                            const reason = prompt("Enter cancellation reason:");
                            if (reason) onTransitionAppointment(apt.id, "CANCELLED", reason);
                          }}
                          className="px-3 py-1.5 rounded-lg border border-[#dc2626] text-[#dc2626] font-semibold hover:bg-[#fef2f2]"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* ====================================================================
          TAB 5: APPROVAL QUEUE
         ==================================================================== */}
      {activeTab === "approvals" && (
        <div className="bg-white rounded-2xl border border-[#d6d6d6] p-6 space-y-5">
          <div>
            <h3 className="text-base font-bold text-[#080808]">Content & Fee Approval Queue</h3>
            <p className="text-xs text-[#686868]">
              Review draft submissions from Content Editors. Approvals atomically publish updates and refresh the AI index.
            </p>
          </div>

          <div className="divide-y divide-[#d6d6d6]">
            {approvals.length === 0 ? (
              <div className="py-8 text-center text-[#686868] text-xs">No items currently in the approval queue.</div>
            ) : (
              approvals.map((req) => (
                <div key={req.id} className="py-4 space-y-3 text-xs">
                  <div className="flex items-center justify-between">
                    <div>
                      <strong className="text-sm text-[#080808]">{req.entityTitle}</strong>
                      <p className="text-[#686868]">{req.changeSummary}</p>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                        req.status === "PENDING_APPROVAL"
                          ? "bg-[#fef3c7] text-[#92400e]"
                          : req.status === "APPROVED" || req.status === "PUBLISHED"
                          ? "bg-[#ecfdf5] text-[#065f46]"
                          : "bg-[#fef2f2] text-[#991b1b]"
                      }`}
                    >
                      {req.status}
                    </span>
                  </div>

                  {req.status === "PENDING_APPROVAL" && (
                    <div className="flex items-center gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() =>
                          onReviewApproval(req.id, "APPROVED_AND_PUBLISHED", "Verified by Hospital Administrator")
                        }
                        className="px-3 py-1.5 rounded-lg bg-[#0057b8] text-white font-bold hover:bg-[#004181]"
                      >
                        Approve & Publish Atomically
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const note = prompt("Enter rejection reason note:");
                          if (note) onReviewApproval(req.id, "REJECTED", note);
                        }}
                        className="px-3 py-1.5 rounded-lg border border-[#757575] text-[#080808] hover:bg-[#f2f2f2]"
                      >
                        Reject with Note
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ====================================================================
          TAB 6: FEEDBACK & COMPLAINTS
         ==================================================================== */}
      {activeTab === "feedback" && (
        <div className="bg-white rounded-2xl border border-[#d6d6d6] p-6 space-y-5">
          <div>
            <h3 className="text-base font-bold text-[#080808]">Patient Feedback & Complaints Triage</h3>
            <p className="text-xs text-[#686868]">Patient submissions are private and strictly isolated.</p>
          </div>

          <div className="divide-y divide-[#d6d6d6]">
            {feedbacks.length === 0 ? (
              <div className="py-8 text-center text-[#686868] text-xs">No feedback submissions found.</div>
            ) : (
              feedbacks.map((fb) => (
                <div key={fb.id} className="py-4 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-bold text-[#004181]">{fb.subject}</span>
                      <span className="text-[#686868] ml-2">from {fb.patientName || "Anonymous"} ({fb.patientPhone || "No Phone"})</span>
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-[#f1f5f9] text-[#475569] font-bold text-[10px]">
                      {fb.status}
                    </span>
                  </div>
                  <p className="text-[#484848] bg-[#f8fafc] p-3 rounded-lg border border-[#e2e8f0]">{fb.message}</p>
                  {fb.status !== "RESOLVED" && (
                    <button
                      type="button"
                      onClick={() => onUpdateFeedback(fb.id, "RESOLVED", "Addressed by Hospital Patient Relations")}
                      className="px-3 py-1 rounded bg-[#059669] text-white font-semibold hover:bg-[#047857]"
                    >
                      Mark Resolved
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ====================================================================
          TAB 7: OPERATIONAL REPORTS & CSV
         ==================================================================== */}
      {activeTab === "reports" && (
        <div className="bg-white rounded-2xl border border-[#d6d6d6] p-6 space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-[#d6d6d6]">
            <div>
              <h3 className="text-base font-bold text-[#080808]">Hospital Operational Analytics & Reports</h3>
              <p className="text-xs text-[#686868]">Export raw appointment logs or review department performance.</p>
            </div>
            <a
              href="/api/v1/admin/analytics?format=csv"
              download
              className="mc-btn-primary !h-9 !text-xs !px-4 inline-flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Appointments CSV</span>
            </a>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="p-4 rounded-xl border border-[#d6d6d6] bg-[#f8fafc]">
              <span className="font-bold text-[#686868]">Total Consultations Tracked</span>
              <p className="text-2xl font-bold text-[#080808] mt-1">{appointments.length}</p>
            </div>
            <div className="p-4 rounded-xl border border-[#d6d6d6] bg-[#f8fafc]">
              <span className="font-bold text-[#686868]">Confirmed Completion Rate</span>
              <p className="text-2xl font-bold text-[#059669] mt-1">
                {appointments.length > 0
                  ? Math.round((appointments.filter((a) => a.status === "CONFIRMED").length / appointments.length) * 100)
                  : 0}
                %
              </p>
            </div>
            <div className="p-4 rounded-xl border border-[#d6d6d6] bg-[#f8fafc]">
              <span className="font-bold text-[#686868]">Clinical Departments</span>
              <p className="text-2xl font-bold text-[#0057b8] mt-1">{departments.length}</p>
            </div>
          </div>
        </div>
      )}

      {/* Specialist Modal: Add / Update */}
      <SpecialistModal
        isOpen={specialistModalOpen}
        mode={specialistModalMode}
        doctor={selectedDoctor}
        departments={departments}
        branches={branches}
        specialties={specialties}
        onClose={() => setSpecialistModalOpen(false)}
        onSuccess={onSaveDoctor}
      />

      {/* Deactivate Specialist Modal */}
      <DeactivateSpecialistModal
        isOpen={deactivateModalOpen}
        doctor={selectedDoctor}
        action={deactivateAction}
        onClose={() => setDeactivateModalOpen(false)}
        onSuccess={onUpdateDoctorStatus}
      />
    </div>
  );
}
