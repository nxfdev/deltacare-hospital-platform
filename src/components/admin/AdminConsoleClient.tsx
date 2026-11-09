"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Calendar,
  BookOpen,
  MessageSquare,
  BarChart3,
  LogOut,
  ExternalLink,
  Menu,
  X,
  Stethoscope,
  CheckCircle2,
  Sparkles,
  ShieldCheck,
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
  RoleCode,
  Specialty,
  UserAccount,
  FacebookPostBatch,
  OperationalInsight,
} from "@/types/domain";
import { OperationalAnalyticsReport } from "@/server/services/communicationAndAnalyticsService";
import { HospitalAdminView, HospitalAdminTab } from "./HospitalAdminView";

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
  initialUsers: Array<
    Pick<
      UserAccount,
      | "id"
      | "email"
      | "fullName"
      | "phone"
      | "role"
      | "scopedBranchId"
      | "isActive"
      | "updatedAt"
    >
  >;
  initialAuditEvents: AuditEvent[];
  initialFacebookBatches?: FacebookPostBatch[];
  initialInsights?: OperationalInsight[];
}

const LEGACY_TAB_MAP: Record<string, HospitalAdminTab> = {
  overview: "analytics",
  reports: "analytics",
  today: "front-desk",
  requests: "front-desk",
  appointments: "front-desk",
  schedules: "front-desk",
  calendar: "front-desk",
  generator: "facebook-studio",
  content: "notices-cms",
  profiles: "doctors-cms",
  specialists: "doctors-cms",
  departments: "doctors-cms",
  users: "staff",
  roles: "staff",
  audit: "staff",
  approvals: "staff",
};

export function AdminConsoleClient({
  currentUser,
  initialHospital,
  initialAppointments,
  initialDoctors,
  initialDepartments,
  initialBranches,
  initialSpecialties,
  initialApprovals,
  initialFeedbacks,
  initialNotifications = [],
  initialAnalytics,
  initialUsers,
  initialAuditEvents,
  initialInsights = [],
}: AdminConsoleClientProps) {
  const router = useRouter();

  // Core Data State
  const [appointments, setAppointments] = useState<Appointment[]>(initialAppointments);
  const [doctors, setDoctors] = useState<Doctor[]>(initialDoctors);
  const [departments, setDepartments] = useState<Department[]>(initialDepartments);
  const [approvals, setApprovals] = useState<ApprovalRequest[]>(initialApprovals);
  const [feedbacks, setFeedbacks] = useState<FeedbackRecord[]>(initialFeedbacks);
  const [users] = useState(initialUsers);
  const [auditEvents] = useState<AuditEvent[]>(initialAuditEvents);

  // UI State
  const [statusBanner, setStatusBanner] = useState<string | null>(null);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Role-based default tab
  const defaultTab: HospitalAdminTab =
    currentUser.role === "RECEPTIONIST"
      ? "front-desk"
      : currentUser.role === "CONTENT_EDITOR"
        ? "facebook-studio"
        : "analytics";

  const normalizeTab = (raw: string | null): HospitalAdminTab => {
    if (!raw) return defaultTab;
    if (LEGACY_TAB_MAP[raw]) return LEGACY_TAB_MAP[raw];
    return raw as HospitalAdminTab;
  };

  const [activeTab, setActiveTab] = useState<HospitalAdminTab>(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get("tab");
      if (tabParam) return normalizeTab(tabParam);
    }
    return defaultTab;
  });

  useEffect(() => {
    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get("tab");
      setActiveTab(normalizeTab(tabParam));
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [defaultTab]);

  const handleTabChange = (newTab: HospitalAdminTab) => {
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

  const handleSaveDoctor = (savedDoctor: Doctor, isNew: boolean) => {
    if (isNew) {
      setDoctors((prev) => [savedDoctor, ...prev]);
      setStatusBanner(
        `Successfully created specialist record: ${savedDoctor.nameEn} (BMDC: ${savedDoctor.bmdcRegistrationNo})`
      );
    } else {
      setDoctors((prev) => prev.map((d) => (d.id === savedDoctor.id ? savedDoctor : d)));
      setStatusBanner(
        `Updated specialist record: ${savedDoctor.nameEn} (State: ${savedDoctor.publicationState})`
      );
    }
    setTimeout(() => setStatusBanner(null), 6000);
  };

  const handleUpdateDoctorStatus = (updatedDoctor: Doctor) => {
    setDoctors((prev) => prev.map((d) => (d.id === updatedDoctor.id ? updatedDoctor : d)));
    const actionWord =
      updatedDoctor.publicationState === "ARCHIVED" ? "Deactivated" : "Activated";
    setStatusBanner(
      `${actionWord} specialist ${updatedDoctor.nameEn}. Historical records preserved.`
    );
    setTimeout(() => setStatusBanner(null), 6000);
  };

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
        setStatusBanner(
          `Department ${data.department.nameEn} created successfully.`
        );
        setTimeout(() => setStatusBanner(null), 5000);
      }
    } catch {
      setStatusBanner("Error creating department.");
    }
  };

  // Determine Role Label & Header Titles (Unified Hospital Operations — No Super Admin View)
  const getRoleBadge = (role: RoleCode) => {
    switch (role) {
      case "RECEPTIONIST":
        return {
          title: "Front Desk & Chamber Assistant",
          sub: "Schedule & Slot Operations",
          badgeColor: "bg-[#059669] text-white",
          headerTitle: "DeltaCare Front Desk & Doctor Schedule Manager",
          headerSub:
            "14-day fixed-slot calendar, 2-click extra chambers, emergency leave blocker, and 10666 SMS booking.",
        };
      case "CONTENT_EDITOR":
        return {
          title: "CMS & Marketing Editor",
          sub: "Editorial & Social Studio",
          badgeColor: "bg-[#d97706] text-white",
          headerTitle: "DeltaCare CMS & Daily Facebook Spotlight Studio",
          headerSub:
            "Daily Facebook doctor spotlight cards (1080×1080 & 1080×1350), specialist profiles, and hospital notices.",
        };
      case "HOSPITAL_ADMIN":
      case "DEPT_MANAGER":
      case "SUPER_ADMIN":
      default:
        return {
          title: "Hospital Admin",
          sub: "Unified Operations Suite",
          badgeColor: "bg-[#0057b8] text-white",
          headerTitle: "DeltaCare Admin — Unified Hospital Operations & Analytics",
          headerSub:
            "Executive healthcare analytics, live multi-branch schedule engine, daily Facebook studio, and hospital CMS.",
        };
    }
  };

  const roleInfo = getRoleBadge(currentUser.role);

  const canViewAnalytics =
    currentUser.role === "HOSPITAL_ADMIN" ||
    currentUser.role === "DEPT_MANAGER" ||
    currentUser.role === "SUPER_ADMIN";
  const canViewFrontDesk =
    currentUser.role === "HOSPITAL_ADMIN" ||
    currentUser.role === "DEPT_MANAGER" ||
    currentUser.role === "SUPER_ADMIN" ||
    currentUser.role === "RECEPTIONIST";
  const canViewCmsAndFacebook =
    currentUser.role === "HOSPITAL_ADMIN" ||
    currentUser.role === "DEPT_MANAGER" ||
    currentUser.role === "SUPER_ADMIN" ||
    currentUser.role === "CONTENT_EDITOR";
  const canViewStaffAndAudit =
    currentUser.role === "HOSPITAL_ADMIN" ||
    currentUser.role === "DEPT_MANAGER" ||
    currentUser.role === "SUPER_ADMIN";

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
          MINIMALIST SIDEBAR (Unified Role-Scoped Navigation)
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
            <div className="flex items-center justify-between gap-2">
              <span
                className={`px-2 py-0.5 text-[10px] font-bold tracking-wide uppercase ${roleInfo.badgeColor}`}
              >
                {roleInfo.title}
              </span>
            </div>
            <p className="text-xs text-[#e8f0f9] font-semibold mt-1.5 truncate">
              {currentUser.fullName}
            </p>
            <p className="text-[11px] text-[#93c5fd] mt-0.5">
              {currentUser.scopedBranchId
                ? "Dhanmondi Flagship Campus"
                : "All Hospital Campuses"}
            </p>
          </div>

          {/* Unified Role Navigation List */}
          <nav className="flex-1 p-3 space-y-1 overflow-y-auto text-xs">
            <div className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-[#93c5fd]">
              {roleInfo.sub}
            </div>

            {canViewAnalytics && (
              <button
                type="button"
                onClick={() => handleTabChange("analytics")}
                className={`w-full text-left px-3 py-2.5 transition-colors flex items-center justify-between text-xs font-semibold cursor-pointer ${
                  activeTab === "analytics"
                    ? "bg-[#0057b8] text-white font-bold"
                    : "text-[#e8f0f9] hover:bg-white/10"
                }`}
              >
                <span className="flex items-center gap-2.5 truncate">
                  <BarChart3
                    className={`w-4 h-4 shrink-0 ${
                      activeTab === "analytics" ? "text-white" : "text-[#38bdf8]"
                    }`}
                  />
                  <span>Executive Analytics</span>
                </span>
              </button>
            )}

            {canViewFrontDesk && (
              <button
                type="button"
                onClick={() => handleTabChange("front-desk")}
                className={`w-full text-left px-3 py-2.5 transition-colors flex items-center justify-between text-xs font-semibold cursor-pointer ${
                  activeTab === "front-desk"
                    ? "bg-[#0057b8] text-white font-bold"
                    : "text-[#e8f0f9] hover:bg-white/10"
                }`}
              >
                <span className="flex items-center gap-2.5 truncate">
                  <Calendar
                    className={`w-4 h-4 shrink-0 ${
                      activeTab === "front-desk" ? "text-white" : "text-[#93c5fd]"
                    }`}
                  />
                  <span>Front Desk &amp; Schedules</span>
                </span>
              </button>
            )}

            {canViewCmsAndFacebook && (
              <button
                type="button"
                onClick={() => handleTabChange("facebook-studio")}
                className={`w-full text-left px-3 py-2.5 transition-colors flex items-center justify-between text-xs font-semibold cursor-pointer ${
                  activeTab === "facebook-studio"
                    ? "bg-[#0057b8] text-white font-bold"
                    : "text-[#e8f0f9] hover:bg-white/10"
                }`}
              >
                <span className="flex items-center gap-2.5 truncate">
                  <Sparkles
                    className={`w-4 h-4 shrink-0 ${
                      activeTab === "facebook-studio"
                        ? "text-white"
                        : "text-[#93c5fd]"
                    }`}
                  />
                  <span>Daily Facebook Studio</span>
                </span>
              </button>
            )}

            {canViewCmsAndFacebook && (
              <button
                type="button"
                onClick={() => handleTabChange("doctors-cms")}
                className={`w-full text-left px-3 py-2.5 transition-colors flex items-center justify-between text-xs font-semibold cursor-pointer ${
                  activeTab === "doctors-cms"
                    ? "bg-[#0057b8] text-white font-bold"
                    : "text-[#e8f0f9] hover:bg-white/10"
                }`}
              >
                <span className="flex items-center gap-2.5 truncate">
                  <Stethoscope
                    className={`w-4 h-4 shrink-0 ${
                      activeTab === "doctors-cms" ? "text-white" : "text-[#93c5fd]"
                    }`}
                  />
                  <span>Doctors &amp; Depts CMS</span>
                </span>
                <span className="px-1.5 py-0.2 bg-white/20 text-[10px] font-bold tabular-nums">
                  {doctors.length}
                </span>
              </button>
            )}

            {canViewCmsAndFacebook && (
              <button
                type="button"
                onClick={() => handleTabChange("notices-cms")}
                className={`w-full text-left px-3 py-2.5 transition-colors flex items-center justify-between text-xs font-semibold cursor-pointer ${
                  activeTab === "notices-cms"
                    ? "bg-[#0057b8] text-white font-bold"
                    : "text-[#e8f0f9] hover:bg-white/10"
                }`}
              >
                <span className="flex items-center gap-2.5 truncate">
                  <BookOpen
                    className={`w-4 h-4 shrink-0 ${
                      activeTab === "notices-cms" ? "text-white" : "text-[#93c5fd]"
                    }`}
                  />
                  <span>Website Notices CMS</span>
                </span>
              </button>
            )}

            <button
              type="button"
              onClick={() => handleTabChange("feedback-moderation")}
              className={`w-full text-left px-3 py-2.5 transition-colors flex items-center justify-between text-xs font-semibold cursor-pointer ${
                activeTab === "feedback-moderation"
                  ? "bg-[#0057b8] text-white font-bold"
                  : "text-[#e8f0f9] hover:bg-white/10"
              }`}
            >
              <span className="flex items-center gap-2.5 truncate">
                <MessageSquare
                  className={`w-4 h-4 shrink-0 ${
                    activeTab === "feedback-moderation"
                      ? "text-white"
                      : "text-[#93c5fd]"
                  }`}
                />
                <span>Patient Feedback &amp; Enquiries</span>
              </span>
            </button>

            {canViewStaffAndAudit && (
              <button
                type="button"
                onClick={() => handleTabChange("staff")}
                className={`w-full text-left px-3 py-2.5 transition-colors flex items-center justify-between text-xs font-semibold cursor-pointer ${
                  activeTab === "staff"
                    ? "bg-[#0057b8] text-white font-bold"
                    : "text-[#e8f0f9] hover:bg-white/10"
                }`}
              >
                <span className="flex items-center gap-2.5 truncate">
                  <ShieldCheck
                    className={`w-4 h-4 shrink-0 ${
                      activeTab === "staff" ? "text-white" : "text-[#93c5fd]"
                    }`}
                  />
                  <span>Staff, Roles &amp; Audit Log</span>
                </span>
              </button>
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
                className="text-[#f87171] hover:text-white flex items-center gap-1 font-semibold cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign out</span>
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* ====================================================================
          MAIN CONTENT AREA (Minimal Header + Unified Workspace)
         ==================================================================== */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Minimal Admin Header */}
        <header className="sticky top-0 z-30 bg-white border-b border-[#d6d6d6] px-4 sm:px-8 py-3.5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileSidebarOpen(true)}
              className="md:hidden text-[#080808] p-1.5 hover:bg-[#f2f2f2]"
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
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 bg-[#ecfdf5] text-[#065f46] font-semibold">
              <span className="w-2 h-2 rounded-full bg-[#059669] animate-pulse" />
              <span>Platform Online</span>
            </div>
            <Link
              href="/dashboard/front-desk"
              className="hidden lg:inline-flex items-center gap-1 px-3 py-1.5 border border-[#012d61] text-[#012d61] font-semibold hover:bg-[#f0f4f8]"
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Full-Screen Front Desk</span>
            </Link>
            <Link
              href="/"
              className="hidden md:inline-flex items-center gap-1 px-3 py-1.5 border border-[#d6d6d6] text-[#004181] font-semibold hover:bg-[#e8f0f9]"
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
              className="p-3.5 bg-[#e8f0f9] border border-[#0057b8] text-xs text-[#004181] flex items-center justify-between gap-4 shadow-xs"
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

          {/* UNIFIED ROLE-SCOPED HOSPITAL OPERATIONS WORKSPACE */}
          <HospitalAdminView
            userRole={currentUser.role}
            hospital={initialHospital}
            doctors={doctors}
            departments={departments}
            branches={initialBranches}
            specialties={initialSpecialties}
            appointments={appointments}
            approvals={approvals}
            feedbacks={feedbacks}
            users={users}
            notifications={initialNotifications}
            auditEvents={auditEvents}
            insights={initialInsights}
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
            activeTab={activeTab}
            onTabChange={handleTabChange}
          />
        </main>
      </div>
    </div>
  );
}
