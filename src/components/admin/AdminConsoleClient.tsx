"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Shield,
  Building2,
  Calendar,
  BookOpen,
  CheckSquare,
  Bot,
  MessageSquare,
  BarChart3,
  Users,
  LogOut,
  ExternalLink,
  Menu,
  X,
  Stethoscope,
  Activity,
  CheckCircle2,
  AlertCircle,
  Sliders,
  Share2,
  History,
  Sparkles,
} from "lucide-react";
import {
  AIUpdateDraft,
  Appointment,
  ApprovalRequest,
  AuditEvent,
  Branch,
  ContactRequest,
  Department,
  DiseaseCondition,
  Doctor,
  FeedbackRecord,
  HospitalConfiguration,
  NotificationRecord,
  PublicationState,
  RoleCode,
  Specialty,
  UserAccount,
  FacebookPostBatch,
} from "@/types/domain";
import { OperationalAnalyticsReport } from "@/server/services/communicationAndAnalyticsService";
import { SuperAdminView } from "./SuperAdminView";
import { HospitalAdminView } from "./HospitalAdminView";
import { ReceptionistView } from "./ReceptionistView";
import { ContentEditorView } from "./ContentEditorView";

interface AdminConsoleClientProps {
  currentUser: {
    userId: string;
    email: string;
    fullName: string;
    role: RoleCode;
    scopedBranchId?: string;
  };
  initialHospital: HospitalConfiguration;
  initialAppointments: Appointment[];
  initialDoctors: Doctor[];
  initialDepartments: Department[];
  initialBranches: Branch[];
  initialSpecialties: Specialty[];
  initialConditions: DiseaseCondition[];
  initialApprovals: ApprovalRequest[];
  initialAIUpdates: AIUpdateDraft[];
  initialFeedbacks: FeedbackRecord[];
  initialCallbacks: ContactRequest[];
  initialNotifications: NotificationRecord[];
  initialAnalytics: OperationalAnalyticsReport;
  initialUsers: Array<Pick<UserAccount, "id" | "email" | "fullName" | "phone" | "role" | "scopedBranchId" | "isActive" | "updatedAt">>;
  initialAuditEvents: AuditEvent[];
  initialFacebookBatches?: FacebookPostBatch[];
}

export function AdminConsoleClient({
  currentUser,
  initialHospital,
  initialAppointments,
  initialDoctors,
  initialDepartments,
  initialBranches,
  initialSpecialties,
  initialConditions,
  initialApprovals,
  initialAIUpdates,
  initialFeedbacks,
  initialAnalytics,
  initialUsers,
  initialAuditEvents,
  initialFacebookBatches = [],
}: AdminConsoleClientProps) {
  const router = useRouter();

  // Core Data State
  const [appointments, setAppointments] = useState<Appointment[]>(initialAppointments);
  const [doctors, setDoctors] = useState<Doctor[]>(initialDoctors);
  const [departments, setDepartments] = useState<Department[]>(initialDepartments);
  const [conditions, setConditions] = useState<DiseaseCondition[]>(initialConditions);
  const [approvals, setApprovals] = useState<ApprovalRequest[]>(initialApprovals);
  const [aiUpdates, setAiUpdates] = useState<AIUpdateDraft[]>(initialAIUpdates);
  const [feedbacks, setFeedbacks] = useState<FeedbackRecord[]>(initialFeedbacks);
  const [users, setUsers] = useState(initialUsers);
  const [auditEvents, setAuditEvents] = useState<AuditEvent[]>(initialAuditEvents);

  // UI State
  const [statusBanner, setStatusBanner] = useState<string | null>(null);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Navigation & Active Tab State with History Support
  const defaultTab =
    currentUser.role === "RECEPTIONIST"
      ? "today"
      : currentUser.role === "CONTENT_EDITOR"
      ? "content"
      : "overview";

  const [activeTab, setActiveTab] = useState<string>(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get("tab");
      if (tabParam) return tabParam;
    }
    return defaultTab;
  });

  useEffect(() => {
    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get("tab");
      setActiveTab(tabParam || defaultTab);
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [defaultTab]);

  const handleTabChange = (newTab: string) => {
    setActiveTab(newTab);
    setMobileSidebarOpen(false);
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.set("tab", newTab);
      window.history.pushState({ tab: newTab }, "", url.toString());
    }
  };

  // Logout handler
  const handleLogout = async () => {
    try {
      await fetch("/api/v1/auth/logout", { method: "POST" });
    } catch {
      // Ignore
    }
    router.push("/login");
  };

  // ==========================================================================
  // ACTION HANDLERS
  // ==========================================================================

  // 1. Save Doctor (Create or Update)
  const handleSaveDoctor = (savedDoctor: Doctor, isNew: boolean) => {
    if (isNew) {
      setDoctors((prev) => [savedDoctor, ...prev]);
      setStatusBanner(`Successfully created specialist record: ${savedDoctor.nameEn} (BMDC: ${savedDoctor.bmdcRegistrationNo})`);
    } else {
      setDoctors((prev) => prev.map((d) => (d.id === savedDoctor.id ? savedDoctor : d)));
      setStatusBanner(`Updated specialist record: ${savedDoctor.nameEn} (State: ${savedDoctor.publicationState})`);
    }
    setTimeout(() => setStatusBanner(null), 6000);
  };

  // 2. Doctor Status Toggle (Deactivate / Activate)
  const handleUpdateDoctorStatus = (updatedDoctor: Doctor) => {
    setDoctors((prev) => prev.map((d) => (d.id === updatedDoctor.id ? updatedDoctor : d)));
    const actionWord = updatedDoctor.publicationState === "ARCHIVED" ? "Deactivated" : "Activated";
    setStatusBanner(`${actionWord} specialist ${updatedDoctor.nameEn}. Historical records preserved.`);
    setTimeout(() => setStatusBanner(null), 6000);
  };

  // 3. Appointment Transition
  const handleTransitionAppointment = async (
    aptId: string,
    toStatus: Appointment["status"],
    reason: string,
    chamberNote?: string
  ) => {
    try {
      const res = await fetch("/api/v1/admin/appointments", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          appointmentId: aptId,
          toStatus,
          reason,
          staffNotes: chamberNote,
        }),
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        setAppointments((prev) =>
          prev.map((a) => (a.id === aptId ? data.appointment : a))
        );
        setStatusBanner(`Appointment status updated to ${toStatus}.`);
        setTimeout(() => setStatusBanner(null), 5000);
      } else {
        setStatusBanner(`Error: ${data.error || "Failed to update appointment"}`);
      }
    } catch {
      setStatusBanner("Network error while updating appointment.");
    }
  };

  // 4. Review Approval Request
  const handleReviewApproval = async (
    approvalId: string,
    decision: "APPROVED_AND_PUBLISHED" | "REJECTED",
    reviewNote: string
  ) => {
    try {
      const res = await fetch("/api/v1/admin/approval-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          approvalId,
          decision,
          reviewNote,
        }),
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        setApprovals((prev) =>
          prev.map((a) => (a.id === approvalId ? data.approval : a))
        );
        setStatusBanner(`Approval request marked as ${decision}.`);
        setTimeout(() => setStatusBanner(null), 5000);
      } else {
        setStatusBanner(`Error: ${data.error || "Failed to process approval"}`);
      }
    } catch {
      setStatusBanner("Network error processing approval.");
    }
  };

  // 5. Update Feedback
  const handleUpdateFeedback = async (
    feedbackId: string,
    status: FeedbackRecord["status"],
    internalNotes: string
  ) => {
    try {
      const res = await fetch("/api/v1/admin/feedback", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          feedbackId,
          status,
          internalNotes,
        }),
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        setFeedbacks((prev) =>
          prev.map((f) => (f.id === feedbackId ? data.feedback : f))
        );
        setStatusBanner("Feedback record updated.");
        setTimeout(() => setStatusBanner(null), 4000);
      }
    } catch {
      setStatusBanner("Network error updating feedback.");
    }
  };

  // 6. Register Walk-In Feedback
  const handleRegisterFeedback = async (data: {
    patientName: string;
    patientPhone: string;
    subject: string;
    message: string;
    type: "FEEDBACK" | "COMPLAINT" | "SUGGESTION";
  }) => {
    try {
      const res = await fetch("/api/v1/public/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          branchId: currentUser.scopedBranchId || initialBranches[0]?.id || "branch-dhanmondi",
          consentAccepted: true,
        }),
      });
      const resData = await res.json();
      if (res.ok && resData.ok) {
        setFeedbacks((prev) => [resData.feedback, ...prev]);
        setStatusBanner("Walk-in feedback registered and forwarded to Hospital Admin.");
        setTimeout(() => setStatusBanner(null), 5000);
      }
    } catch {
      setStatusBanner("Error registering walk-in feedback.");
    }
  };

  // 7. Create Department
  const handleCreateDepartment = async (deptData: {
    nameEn: string;
    nameBn: string;
    slug: string;
    branchId: string;
  }) => {
    try {
      const res = await fetch("/api/v1/admin/departments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...deptData,
          shortDescriptionEn: `${deptData.nameEn} at DeltaCare.`,
          shortDescriptionBn: `ডেল্টাকেয়ারে ${deptData.nameBn}।`,
          publicationState: "PUBLISHED",
        }),
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        setDepartments((prev) => [...prev, data.department]);
        setStatusBanner(`Department ${data.department.nameEn} created successfully.`);
        setTimeout(() => setStatusBanner(null), 5000);
      }
    } catch {
      setStatusBanner("Error creating department.");
    }
  };

  // 8. Save Disease Condition (CMS)
  const handleSaveCondition = async (condition: Partial<DiseaseCondition>) => {
    try {
      const res = await fetch("/api/v1/admin/content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(condition),
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        if (condition.id) {
          setConditions((prev) =>
            prev.map((c) => (c.id === condition.id ? data.condition : c))
          );
        } else {
          setConditions((prev) => [data.condition, ...prev]);
        }
        setStatusBanner(`Saved condition article: ${data.condition.nameEn}.`);
        setTimeout(() => setStatusBanner(null), 5000);
      }
    } catch {
      setStatusBanner("Error saving disease article.");
    }
  };

  // 9. Save Doctor Profile Copy (CMS)
  const handleSaveDoctorProfileCopy = async (
    doctorId: string,
    bioEn: string,
    bioBn: string
  ) => {
    const doc = doctors.find((d) => d.id === doctorId);
    if (!doc) return;
    try {
      const res = await fetch("/api/v1/admin/doctors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: doc.id,
          departmentId: doc.departmentId,
          specialtyIds: doc.specialtyIds,
          slug: doc.slug,
          nameEn: doc.nameEn,
          nameBn: doc.nameBn,
          designationEn: doc.designationEn,
          designationBn: doc.designationBn,
          qualificationsEn: doc.qualificationsEn,
          qualificationsBn: doc.qualificationsBn,
          experienceYears: doc.experienceYears,
          bmdcRegistrationNo: doc.bmdcRegistrationNo,
          bioEn,
          bioBn,
          consultationFeeBdt: doc.consultationFeeBdt,
          followupFeeBdt: doc.followupFeeBdt,
          feeEffectiveFrom: doc.feeEffectiveFrom,
          branchId: doc.branches?.[0]?.branchId || initialBranches[0]?.id || "branch-dhanmondi",
          roomNumber: doc.branches?.[0]?.roomNumber || "Chamber Desk",
          publicationState: "PENDING_APPROVAL", // Always requires approval from editor
        }),
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        if (data.approvalRequest) {
          setApprovals((prev) => [data.approvalRequest, ...prev]);
        }
        setStatusBanner(`Doctor public profile submitted for Hospital Admin approval.`);
        setTimeout(() => setStatusBanner(null), 5000);
      }
    } catch {
      setStatusBanner("Error saving doctor profile copy.");
    }
  };

  // 10. Update Staff Status (Super Admin)
  const handleUpdateUserStatus = async (targetUserId: string, nextActive: boolean) => {
    try {
      const res = await fetch("/api/v1/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetUserId, isActive: nextActive }),
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        setUsers((prev) =>
          prev.map((u) => (u.id === targetUserId ? { ...u, isActive: data.user.isActive } : u))
        );
        setStatusBanner(`Staff member ${data.user.email} status changed to ${data.user.isActive ? "ACTIVE" : "INACTIVE"}.`);
        setTimeout(() => setStatusBanner(null), 5000);
      }
    } catch {
      setStatusBanner("Error updating user status.");
    }
  };

  // 11. Submit AI Update Note
  const handleSubmitAIUpdate = async (rawNotes: string) => {
    try {
      const res = await fetch("/api/v1/admin/ai-updates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          entityType: "SCHEDULE",
          rawStaffNotes: rawNotes,
          notes: "Converted from staff notes",
        }),
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        setAiUpdates((prev) => [data.draft, ...prev]);
        setStatusBanner("AI update draft generated and placed in PENDING_APPROVAL.");
        setTimeout(() => setStatusBanner(null), 5000);
      }
    } catch {
      setStatusBanner("Error generating AI update draft.");
    }
  };

  // Determine Role Label & Header Titles
  const getRoleBadge = (role: RoleCode) => {
    switch (role) {
      case "SUPER_ADMIN":
        return {
          title: "Super Admin",
          sub: "Platform Console",
          badgeColor: "bg-[#4f46e5] text-white",
          headerTitle: "DeltaCare Super Admin — Platform Console",
          headerSub: "Platform-wide governance, hospital branches, staff accounts & security audit logs.",
        };
      case "HOSPITAL_ADMIN":
      case "DEPT_MANAGER":
        return {
          title: "Hospital Admin",
          sub: "Operations Console",
          badgeColor: "bg-[#0057b8] text-white",
          headerTitle: "DeltaCare Admin — Hospital Operations",
          headerSub: "Assigned hospital operations, specialist CRUD, appointments, approval queue & reports.",
        };
      case "RECEPTIONIST":
        return {
          title: "Front Desk",
          sub: "Reception Console",
          badgeColor: "bg-[#059669] text-white",
          headerTitle: "DeltaCare Front Desk — Receptionist Console",
          headerSub: "Today's queue, appointment verification, check-in, and view-only doctor schedules.",
        };
      case "CONTENT_EDITOR":
        return {
          title: "Content Editor",
          sub: "CMS Workspace",
          badgeColor: "bg-[#d97706] text-white",
          headerTitle: "DeltaCare CMS — Editorial Workspace",
          headerSub: "Website content, diseases & conditions articles, public specialist bios & AI updates.",
        };
      default:
        return {
          title: role,
          sub: "Staff Portal",
          badgeColor: "bg-[#475569] text-white",
          headerTitle: "DeltaCare Staff Console",
          headerSub: "Operational management console.",
        };
    }
  };

  const roleInfo = getRoleBadge(currentUser.role);

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#f2f2f2]">
      {/* Mobile Backdrop Overlay */}
      {mobileSidebarOpen && (
        <div
          role="presentation"
          onClick={() => setMobileSidebarOpen(false)}
          className="fixed inset-0 z-30 bg-black/50 md:hidden backdrop-blur-sm"
        />
      )}

      {/* ====================================================================
          MINIMALIST SIDEBAR (Shared Design System, Role-Scoped Navigation)
         ==================================================================== */}
      <aside
        className={`fixed md:sticky top-0 inset-y-0 left-0 z-40 w-64 bg-[#012d61] text-white flex flex-col justify-between transition-transform duration-200 border-r border-white/10 ${
          mobileSidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Sidebar Brand Header */}
          <div className="p-5 border-b border-white/15 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2.5">
              <img
                src="/images/deltacare-logo-inverse.svg"
                alt="DeltaCare"
                className="h-8 w-auto"
              />
            </Link>
            <button
              type="button"
              onClick={() => setMobileSidebarOpen(false)}
              className="md:hidden text-white/70 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Role Pill & Hospital Scope Indicator */}
          <div className="px-5 py-4 border-b border-white/10 bg-[#002443]/70">
            <div className="flex items-center justify-between">
              <span className={`px-2 py-0.5 rounded text-[11px] font-bold tracking-wide uppercase ${roleInfo.badgeColor}`}>
                {roleInfo.title}
              </span>
              <span className="text-[10px] text-[#c5e2f9] font-medium font-mono">
                {currentUser.role}
              </span>
            </div>
            <p className="text-xs text-[#e8f0f9] font-semibold mt-1.5 truncate">
              {currentUser.fullName}
            </p>
            <p className="text-[11px] text-[#93c5fd] mt-0.5">
              {currentUser.scopedBranchId ? "Dhanmondi Campus Desk" : "DeltaCare Platform"}
            </p>
          </div>

          {/* Role Navigation List */}
          <nav className="flex-1 p-3 space-y-1 overflow-y-auto text-xs">
            <div className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-[#93c5fd]">
              {roleInfo.sub}
            </div>

            {/* SUPER ADMIN NAVIGATION */}
            {currentUser.role === "SUPER_ADMIN" && (
              <>
                <button
                  type="button"
                  onClick={() => handleTabChange("overview")}
                  className={`w-full text-left px-3 py-2 rounded-lg transition-colors flex items-center justify-between text-xs font-semibold ${
                    activeTab === "overview"
                      ? "bg-[#0057b8] text-white shadow font-bold"
                      : "text-[#e8f0f9] hover:bg-white/10"
                  }`}
                >
                  <span className="flex items-center gap-2.5 truncate">
                    <Activity className={`w-4 h-4 shrink-0 ${activeTab === "overview" ? "text-white" : "text-[#38bdf8]"}`} />
                    <span>Platform Overview</span>
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => handleTabChange("hospitals")}
                  className={`w-full text-left px-3 py-2 rounded-lg transition-colors flex items-center justify-between text-xs font-semibold ${
                    activeTab === "hospitals"
                      ? "bg-[#0057b8] text-white shadow font-bold"
                      : "text-[#e8f0f9] hover:bg-white/10"
                  }`}
                >
                  <span className="flex items-center gap-2.5 truncate">
                    <Building2 className={`w-4 h-4 shrink-0 ${activeTab === "hospitals" ? "text-white" : "text-[#93c5fd]"}`} />
                    <span>Hospital &amp; Branches</span>
                  </span>
                  <span className="px-1.5 py-0.2 rounded-full bg-white/20 text-[10px] font-bold">
                    {initialBranches.length}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => handleTabChange("staff")}
                  className={`w-full text-left px-3 py-2 rounded-lg transition-colors flex items-center justify-between text-xs font-semibold ${
                    activeTab === "staff"
                      ? "bg-[#0057b8] text-white shadow font-bold"
                      : "text-[#e8f0f9] hover:bg-white/10"
                  }`}
                >
                  <span className="flex items-center gap-2.5 truncate">
                    <Users className={`w-4 h-4 shrink-0 ${activeTab === "staff" ? "text-white" : "text-[#93c5fd]"}`} />
                    <span>Staff &amp; RBAC Accounts</span>
                  </span>
                  <span className="px-1.5 py-0.2 rounded-full bg-white/20 text-[10px] font-bold">
                    {users.length}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => handleTabChange("audit")}
                  className={`w-full text-left px-3 py-2 rounded-lg transition-colors flex items-center justify-between text-xs font-semibold ${
                    activeTab === "audit"
                      ? "bg-[#0057b8] text-white shadow font-bold"
                      : "text-[#e8f0f9] hover:bg-white/10"
                  }`}
                >
                  <span className="flex items-center gap-2.5 truncate">
                    <Shield className={`w-4 h-4 shrink-0 ${activeTab === "audit" ? "text-white" : "text-[#93c5fd]"}`} />
                    <span>Audit Logs &amp; Security</span>
                  </span>
                  <span className="px-1.5 py-0.2 rounded-full bg-white/20 text-[10px] font-bold">
                    {auditEvents.length}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => handleTabChange("config")}
                  className={`w-full text-left px-3 py-2 rounded-lg transition-colors flex items-center justify-between text-xs font-semibold ${
                    activeTab === "config"
                      ? "bg-[#0057b8] text-white shadow font-bold"
                      : "text-[#e8f0f9] hover:bg-white/10"
                  }`}
                >
                  <span className="flex items-center gap-2.5 truncate">
                    <Sliders className={`w-4 h-4 shrink-0 ${activeTab === "config" ? "text-white" : "text-[#93c5fd]"}`} />
                    <span>Platform Configuration</span>
                  </span>
                </button>
              </>
            )}

            {/* HOSPITAL ADMIN NAVIGATION */}
            {(currentUser.role === "HOSPITAL_ADMIN" || currentUser.role === "DEPT_MANAGER") && (
              <>
                <button
                  type="button"
                  onClick={() => handleTabChange("overview")}
                  className={`w-full text-left px-3 py-2 rounded-lg transition-colors flex items-center justify-between text-xs font-semibold ${
                    activeTab === "overview"
                      ? "bg-[#0057b8] text-white shadow font-bold"
                      : "text-[#e8f0f9] hover:bg-white/10"
                  }`}
                >
                  <span className="flex items-center gap-2.5 truncate">
                    <Activity className={`w-4 h-4 shrink-0 ${activeTab === "overview" ? "text-white" : "text-[#38bdf8]"}`} />
                    <span>Hospital Operations</span>
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => handleTabChange("specialists")}
                  className={`w-full text-left px-3 py-2 rounded-lg transition-colors flex items-center justify-between text-xs font-semibold ${
                    activeTab === "specialists"
                      ? "bg-[#0057b8] text-white shadow font-bold"
                      : "text-[#e8f0f9] hover:bg-white/10"
                  }`}
                >
                  <span className="flex items-center gap-2.5 truncate">
                    <Stethoscope className={`w-4 h-4 shrink-0 ${activeTab === "specialists" ? "text-white" : "text-[#93c5fd]"}`} />
                    <span>Specialists &amp; Doctors</span>
                  </span>
                  <span className="px-1.5 py-0.2 rounded-full bg-white/20 text-[10px] font-bold">
                    {doctors.length}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => handleTabChange("departments")}
                  className={`w-full text-left px-3 py-2 rounded-lg transition-colors flex items-center justify-between text-xs font-semibold ${
                    activeTab === "departments"
                      ? "bg-[#0057b8] text-white shadow font-bold"
                      : "text-[#e8f0f9] hover:bg-white/10"
                  }`}
                >
                  <span className="flex items-center gap-2.5 truncate">
                    <Building2 className={`w-4 h-4 shrink-0 ${activeTab === "departments" ? "text-white" : "text-[#93c5fd]"}`} />
                    <span>Departments &amp; Services</span>
                  </span>
                  <span className="px-1.5 py-0.2 rounded-full bg-white/20 text-[10px] font-bold">
                    {departments.length}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => handleTabChange("appointments")}
                  className={`w-full text-left px-3 py-2 rounded-lg transition-colors flex items-center justify-between text-xs font-semibold ${
                    activeTab === "appointments"
                      ? "bg-[#0057b8] text-white shadow font-bold"
                      : "text-[#e8f0f9] hover:bg-white/10"
                  }`}
                >
                  <span className="flex items-center gap-2.5 truncate">
                    <Calendar className={`w-4 h-4 shrink-0 ${activeTab === "appointments" ? "text-white" : "text-[#93c5fd]"}`} />
                    <span>Appointments</span>
                  </span>
                  {appointments.filter((a) => a.status === "REQUESTED").length > 0 && (
                    <span className="px-1.5 py-0.2 rounded-full bg-[#dc2626] text-white text-[10px] font-bold">
                      {appointments.filter((a) => a.status === "REQUESTED").length}
                    </span>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => handleTabChange("approvals")}
                  className={`w-full text-left px-3 py-2 rounded-lg transition-colors flex items-center justify-between text-xs font-semibold ${
                    activeTab === "approvals"
                      ? "bg-[#0057b8] text-white shadow font-bold"
                      : "text-[#e8f0f9] hover:bg-white/10"
                  }`}
                >
                  <span className="flex items-center gap-2.5 truncate">
                    <CheckSquare className={`w-4 h-4 shrink-0 ${activeTab === "approvals" ? "text-white" : "text-[#93c5fd]"}`} />
                    <span>Approval Queue</span>
                  </span>
                  {approvals.filter((a) => a.status === "PENDING_APPROVAL").length > 0 && (
                    <span className="px-1.5 py-0.2 rounded-full bg-[#d97706] text-white text-[10px] font-bold">
                      {approvals.filter((a) => a.status === "PENDING_APPROVAL").length}
                    </span>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => handleTabChange("feedback")}
                  className={`w-full text-left px-3 py-2 rounded-lg transition-colors flex items-center justify-between text-xs font-semibold ${
                    activeTab === "feedback"
                      ? "bg-[#0057b8] text-white shadow font-bold"
                      : "text-[#e8f0f9] hover:bg-white/10"
                  }`}
                >
                  <span className="flex items-center gap-2.5 truncate">
                    <MessageSquare className={`w-4 h-4 shrink-0 ${activeTab === "feedback" ? "text-white" : "text-[#93c5fd]"}`} />
                    <span>Feedback &amp; Complaints</span>
                  </span>
                  <span className="px-1.5 py-0.2 rounded-full bg-white/20 text-[10px] font-bold">
                    {feedbacks.length}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => handleTabChange("reports")}
                  className={`w-full text-left px-3 py-2 rounded-lg transition-colors flex items-center justify-between text-xs font-semibold ${
                    activeTab === "reports"
                      ? "bg-[#0057b8] text-white shadow font-bold"
                      : "text-[#e8f0f9] hover:bg-white/10"
                  }`}
                >
                  <span className="flex items-center gap-2.5 truncate">
                    <BarChart3 className={`w-4 h-4 shrink-0 ${activeTab === "reports" ? "text-white" : "text-[#93c5fd]"}`} />
                    <span>Operational Reports</span>
                  </span>
                </button>
              </>
            )}

            {/* RECEPTIONIST NAVIGATION */}
            {currentUser.role === "RECEPTIONIST" && (
              <>
                <button
                  type="button"
                  onClick={() => handleTabChange("today")}
                  className={`w-full text-left px-3 py-2 rounded-lg transition-colors flex items-center justify-between text-xs font-semibold ${
                    activeTab === "today"
                      ? "bg-[#0057b8] text-white shadow font-bold"
                      : "text-[#e8f0f9] hover:bg-white/10"
                  }`}
                >
                  <span className="flex items-center gap-2.5 truncate">
                    <Calendar className={`w-4 h-4 shrink-0 ${activeTab === "today" ? "text-white" : "text-[#38bdf8]"}`} />
                    <span>Today&apos;s Queue</span>
                  </span>
                  {appointments.filter((a) => a.status === "REQUESTED").length > 0 && (
                    <span className="px-1.5 py-0.2 rounded-full bg-[#dc2626] text-white text-[10px] font-bold">
                      {appointments.filter((a) => a.status === "REQUESTED").length}
                    </span>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => handleTabChange("appointments")}
                  className={`w-full text-left px-3 py-2 rounded-lg transition-colors flex items-center justify-between text-xs font-semibold ${
                    activeTab === "appointments"
                      ? "bg-[#0057b8] text-white shadow font-bold"
                      : "text-[#e8f0f9] hover:bg-white/10"
                  }`}
                >
                  <span className="flex items-center gap-2.5 truncate">
                    <Users className={`w-4 h-4 shrink-0 ${activeTab === "appointments" ? "text-white" : "text-[#93c5fd]"}`} />
                    <span>Appointment Lookup</span>
                  </span>
                  <span className="px-1.5 py-0.2 rounded-full bg-white/20 text-[10px] font-bold">
                    {appointments.length}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => handleTabChange("schedules")}
                  className={`w-full text-left px-3 py-2 rounded-lg transition-colors flex items-center justify-between text-xs font-semibold ${
                    activeTab === "schedules"
                      ? "bg-[#0057b8] text-white shadow font-bold"
                      : "text-[#e8f0f9] hover:bg-white/10"
                  }`}
                >
                  <span className="flex items-center gap-2.5 truncate">
                    <Stethoscope className={`w-4 h-4 shrink-0 ${activeTab === "schedules" ? "text-white" : "text-[#93c5fd]"}`} />
                    <span>Doctor Schedules (View)</span>
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => handleTabChange("register-feedback")}
                  className={`w-full text-left px-3 py-2 rounded-lg transition-colors flex items-center justify-between text-xs font-semibold ${
                    activeTab === "register-feedback"
                      ? "bg-[#0057b8] text-white shadow font-bold"
                      : "text-[#e8f0f9] hover:bg-white/10"
                  }`}
                >
                  <span className="flex items-center gap-2.5 truncate">
                    <MessageSquare className={`w-4 h-4 shrink-0 ${activeTab === "register-feedback" ? "text-white" : "text-[#93c5fd]"}`} />
                    <span>Register Walk-in Feedback</span>
                  </span>
                </button>
              </>
            )}

            {/* CONTENT EDITOR NAVIGATION (4 Clean Core Sections) */}
            {currentUser.role === "CONTENT_EDITOR" && (
              <>
                <button
                  type="button"
                  onClick={() => handleTabChange("content")}
                  className={`w-full text-left px-3 py-2 rounded-lg transition-colors flex items-center justify-between text-xs font-semibold ${
                    activeTab === "content" || activeTab === "overview"
                      ? "bg-[#0057b8] text-white shadow font-bold"
                      : "text-[#e8f0f9] hover:bg-white/10"
                  }`}
                >
                  <span className="flex items-center gap-2.5 truncate">
                    <BookOpen className={`w-4 h-4 shrink-0 ${activeTab === "content" || activeTab === "overview" ? "text-white" : "text-[#93c5fd]"}`} />
                    <span>Website Content</span>
                  </span>
                  <span className="px-1.5 py-0.2 rounded-full bg-white/20 text-[10px] font-bold">
                    {conditions.length}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => handleTabChange("profiles")}
                  className={`w-full text-left px-3 py-2 rounded-lg transition-colors flex items-center justify-between text-xs font-semibold ${
                    activeTab === "profiles"
                      ? "bg-[#0057b8] text-white shadow font-bold"
                      : "text-[#e8f0f9] hover:bg-white/10"
                  }`}
                >
                  <span className="flex items-center gap-2.5 truncate">
                    <Stethoscope className={`w-4 h-4 shrink-0 ${activeTab === "profiles" ? "text-white" : "text-[#93c5fd]"}`} />
                    <span>Doctor Profiles</span>
                  </span>
                  <span className="px-1.5 py-0.2 rounded-full bg-white/20 text-[10px] font-bold">
                    {doctors.length}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => handleTabChange("generator")}
                  className={`w-full text-left px-3 py-2 rounded-lg transition-colors flex items-center justify-between text-xs font-semibold ${
                    activeTab === "generator"
                      ? "bg-[#0057b8] text-white shadow font-bold"
                      : "text-[#e8f0f9] hover:bg-white/10"
                  }`}
                >
                  <span className="flex items-center gap-2.5 truncate">
                    <Calendar className={`w-4 h-4 shrink-0 ${activeTab === "generator" ? "text-white" : "text-[#38bdf8]"}`} />
                    <span>Daily Availability Generator</span>
                  </span>
                  <span className="px-1.5 py-0.2 rounded-full bg-emerald-500 text-white text-[10px] font-bold">
                    Cards
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => handleTabChange("publishing")}
                  className={`w-full text-left px-3 py-2 rounded-lg transition-colors flex items-center justify-between text-xs font-semibold ${
                    activeTab === "publishing"
                      ? "bg-[#0057b8] text-white shadow font-bold"
                      : "text-[#e8f0f9] hover:bg-white/10"
                  }`}
                >
                  <span className="flex items-center gap-2.5 truncate">
                    <History className={`w-4 h-4 shrink-0 ${activeTab === "publishing" ? "text-white" : "text-[#93c5fd]"}`} />
                    <span>Publishing History</span>
                  </span>
                </button>
              </>
            )}
          </nav>

          {/* Sidebar Footer User Box */}
          <div className="p-4 border-t border-white/10 bg-[#001830] space-y-3">
            <div className="flex items-center justify-between text-xs">
              <Link
                href="/"
                className="text-[#93c5fd] hover:text-white flex items-center gap-1 font-semibold"
              >
                <span>Website</span>
                <ExternalLink className="w-3 h-3" />
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                className="text-[#f87171] hover:text-white flex items-center gap-1 font-semibold"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign out</span>
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* ====================================================================
          MAIN CONTENT AREA (Minimal Header + Role-Specific Dashboard)
         ==================================================================== */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Minimal Admin Header */}
        <header className="sticky top-0 z-30 bg-white border-b border-[#d6d6d6] px-4 sm:px-8 py-3.5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileSidebarOpen(true)}
              className="md:hidden text-[#080808] p-1.5 rounded-lg hover:bg-[#f2f2f2]"
              aria-label="Open sidebar"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-base sm:text-lg font-bold text-[#080808] flex items-center gap-2">
                <span>{roleInfo.headerTitle}</span>
              </h1>
              <p className="text-xs text-[#686868] hidden sm:block">
                {roleInfo.headerSub}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#ecfdf5] text-[#065f46] font-semibold">
              <span className="w-2 h-2 rounded-full bg-[#059669] animate-pulse" />
              <span>Platform Online</span>
            </div>
            <Link
              href="/"
              className="hidden md:inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-[#d6d6d6] text-[#004181] font-semibold hover:bg-[#e8f0f9]"
            >
              <span>Public Site</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>
        </header>

        {/* Main Body */}
        <main className="flex-1 p-4 sm:p-8 space-y-6">
          {/* Status Toast Notification */}
          {statusBanner && (
            <div
              role="status"
              className="p-3.5 rounded-xl bg-[#e8f0f9] border border-[#0057b8] text-xs text-[#004181] flex items-center justify-between gap-4 shadow-sm"
            >
              <div className="flex items-center gap-2 font-medium">
                <CheckCircle2 className="w-4 h-4 text-[#0057b8] shrink-0" />
                <span>{statusBanner}</span>
              </div>
              <button
                type="button"
                onClick={() => setStatusBanner(null)}
                className="text-xs font-bold underline shrink-0 hover:text-[#080808]"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* RENDER DEDICATED ROLE DASHBOARD */}
          {currentUser.role === "SUPER_ADMIN" && (
            <SuperAdminView
              hospital={initialHospital}
              branches={initialBranches}
              users={users}
              auditEvents={auditEvents}
              analytics={{
                totalAppointments: initialAnalytics.appointments.total,
                appointmentsByStatus: initialAnalytics.appointments.byStatus,
                totalDoctors: doctors.length,
                totalDepartments: departments.length,
                assistantQueriesTotal: initialAnalytics.aiAssistant.totalInteractions,
              }}
              onUpdateUserStatus={handleUpdateUserStatus}
              statusBanner={statusBanner}
              activeTab={activeTab as any}
              onTabChange={handleTabChange as any}
            />
          )}

          {(currentUser.role === "HOSPITAL_ADMIN" || currentUser.role === "DEPT_MANAGER") && (
            <HospitalAdminView
              doctors={doctors}
              departments={departments}
              branches={initialBranches}
              specialties={initialSpecialties}
              appointments={appointments}
              approvals={approvals}
              feedbacks={feedbacks}
              analytics={{
                totalAppointments: initialAnalytics.appointments.total,
                appointmentsByStatus: initialAnalytics.appointments.byStatus,
                totalDoctors: doctors.length,
                totalDepartments: departments.length,
              }}
              onSaveDoctor={handleSaveDoctor}
              onUpdateDoctorStatus={handleUpdateDoctorStatus}
              onTransitionAppointment={handleTransitionAppointment}
              onReviewApproval={handleReviewApproval}
              onUpdateFeedback={handleUpdateFeedback}
              onCreateDepartment={handleCreateDepartment}
              activeTab={activeTab as any}
              onTabChange={handleTabChange as any}
            />
          )}

          {currentUser.role === "RECEPTIONIST" && (
            <ReceptionistView
              currentUser={currentUser}
              appointments={appointments}
              doctors={doctors}
              departments={departments}
              branches={initialBranches}
              onTransitionAppointment={handleTransitionAppointment}
              onSubmitFeedback={handleRegisterFeedback}
              activeTab={activeTab as any}
              onTabChange={handleTabChange as any}
            />
          )}

          {currentUser.role === "CONTENT_EDITOR" && (
            <ContentEditorView
              conditions={conditions}
              departments={departments}
              doctors={doctors}
              branches={initialBranches}
              approvals={approvals}
              aiUpdates={aiUpdates}
              facebookBatches={initialFacebookBatches}
              onSaveCondition={handleSaveCondition}
              onSaveDoctorProfileCopy={handleSaveDoctorProfileCopy}
              onSubmitAIUpdate={handleSubmitAIUpdate}
              onDoctorUpdated={(updated) =>
                setDoctors((prev) => prev.map((d) => (d.id === updated.id ? updated : d)))
              }
              activeTab={activeTab as any}
              onTabChange={handleTabChange as any}
            />
          )}
        </main>
      </div>
    </div>
  );
}
