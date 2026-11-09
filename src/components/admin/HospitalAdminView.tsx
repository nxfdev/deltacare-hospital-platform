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
  CalendarDays,
  FileText,
  DollarSign,
  Bell,
  History,
  Sliders,
  Check,
  X,
  Users,
  Activity,
  UserX,
  Layers,
  MapPin,
  Sparkles,
} from "lucide-react";
import {
  Appointment,
  ApprovalRequest,
  AuditEvent,
  Branch,
  Department,
  Doctor,
  FeedbackRecord,
  HospitalConfiguration,
  NotificationRecord,
  OperationalInsight,
  PublicationState,
  RoleCode,
  ScheduleException,
  ScheduleRule,
  Specialty,
  UserAccount,
} from "@/types/domain";
import { SpecialistModal } from "./SpecialistModal";
import { DeactivateSpecialistModal } from "./DeactivateSpecialistModal";
import { KpiCard } from "./shared/KpiCard";
import { ActionableInsightsSection } from "./shared/ActionableInsightsSection";
import { AdminHealthcareAnalytics } from "./AdminHealthcareAnalytics";
import { FrontDeskScheduleManager } from "@/components/staff/FrontDeskScheduleManager";
import { FacebookCampaignGenerator } from "./FacebookCampaignGenerator";
import { WebsiteNoticesCMS } from "./WebsiteNoticesCMS";
import { PatientFeedbackModeration } from "./PatientFeedbackModeration";

export type HospitalAdminTab =
  | "analytics"
  | "front-desk"
  | "facebook-studio"
  | "doctors-cms"
  | "notices-cms"
  | "feedback-moderation"
  | "overview"
  | "appointments"
  | "calendar"
  | "patients"
  | "specialists"
  | "departments"
  | "specialties"
  | "branches"
  | "schedules"
  | "leave"
  | "staff"
  | "roles"
  | "fees"
  | "reports"
  | "notifications"
  | "approvals"
  | "audit"
  | "settings";

interface HospitalAdminViewProps {
  hospital?: HospitalConfiguration;
  doctors: Doctor[];
  departments: Department[];
  branches: Branch[];
  specialties: Specialty[];
  appointments: Appointment[];
  approvals: ApprovalRequest[];
  feedbacks: FeedbackRecord[];
  users?: Array<
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
  notifications?: NotificationRecord[];
  auditEvents?: AuditEvent[];
  insights?: OperationalInsight[];
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
  onReviewApproval: (
    approvalId: string,
    decision: "APPROVED_AND_PUBLISHED" | "REJECTED",
    note: string
  ) => Promise<void>;
  onUpdateFeedback: (
    feedbackId: string,
    status: FeedbackRecord["status"],
    notes: string
  ) => Promise<void>;
  onCreateDepartment: (data: {
    nameEn: string;
    nameBn: string;
    slug: string;
    branchId: string;
  }) => Promise<void>;
  activeTab?: HospitalAdminTab;
  onTabChange?: (tab: HospitalAdminTab) => void;
  userRole?: RoleCode;
}

export function HospitalAdminView({
  hospital,
  doctors,
  departments,
  branches,
  specialties,
  appointments,
  approvals,
  feedbacks,
  users = [],
  notifications = [],
  auditEvents = [],
  insights = [],
  analytics,
  onSaveDoctor,
  onUpdateDoctorStatus,
  onTransitionAppointment,
  onReviewApproval,
  onUpdateFeedback,
  onCreateDepartment,
  activeTab: controlledTab,
  onTabChange,
  userRole = "HOSPITAL_ADMIN",
}: HospitalAdminViewProps) {
  const defaultTabForRole: HospitalAdminTab =
    userRole === "RECEPTIONIST"
      ? "front-desk"
      : userRole === "CONTENT_EDITOR"
        ? "facebook-studio"
        : "analytics";

  const [internalTab, setInternalTab] = useState<HospitalAdminTab>(defaultTabForRole);
  const [promotedDoctorId, setPromotedDoctorId] = useState<string | null>(null);
  const activeTab = controlledTab || internalTab;
  const setTab = (tab: HospitalAdminTab) => {
    if (onTabChange) onTabChange(tab);
    setInternalTab(tab);
  };

  const canViewAnalytics =
    userRole === "HOSPITAL_ADMIN" || userRole === "DEPT_MANAGER" || userRole === "SUPER_ADMIN";
  const canViewFrontDesk =
    userRole === "HOSPITAL_ADMIN" ||
    userRole === "DEPT_MANAGER" ||
    userRole === "SUPER_ADMIN" ||
    userRole === "RECEPTIONIST";
  const canViewCmsAndFacebook =
    userRole === "HOSPITAL_ADMIN" ||
    userRole === "DEPT_MANAGER" ||
    userRole === "SUPER_ADMIN" ||
    userRole === "CONTENT_EDITOR";
  const canViewStaffAndAudit =
    userRole === "HOSPITAL_ADMIN" || userRole === "DEPT_MANAGER" || userRole === "SUPER_ADMIN";

  // Specialist Modals State
  const [specialistModalOpen, setSpecialistModalOpen] = useState(false);
  const [specialistModalMode, setSpecialistModalMode] = useState<"CREATE" | "EDIT">("CREATE");
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [deactivateModalOpen, setDeactivateModalOpen] = useState(false);
  const [deactivateAction, setDeactivateAction] = useState<"DEACTIVATE" | "ACTIVATE">("DEACTIVATE");

  // Filter States
  const [docSearch, setDocSearch] = useState("");
  const [docDeptFilter, setDocDeptFilter] = useState("ALL");
  const [docStatusFilter, setDocStatusFilter] = useState("ALL");
  const [aptSearch, setAptSearch] = useState("");
  const [aptStatusFilter, setAptStatusFilter] = useState<string>("ALL");
  const [patientSearch, setPatientSearch] = useState("");

  // Appointment Status Transition Modal State
  const [selectedAptForTransition, setSelectedAptForTransition] = useState<Appointment | null>(null);
  const [targetStatus, setTargetStatus] = useState<Appointment["status"]>("CONFIRMED");
  const [transitionReason, setTransitionReason] = useState("");
  const [transitionNote, setTransitionNote] = useState("");
  const [transitionLoading, setTransitionLoading] = useState(false);

  // Department creation state
  const [newDeptEn, setNewDeptEn] = useState("");
  const [newDeptBn, setNewDeptBn] = useState("");
  const [newDeptSlug, setNewDeptSlug] = useState("");
  const [newDeptBranch, setNewDeptBranch] = useState(branches[0]?.id || "");
  const [deptLoading, setDeptLoading] = useState(false);

  // Leave / Schedule Exception Modal State
  const [leaveModalOpen, setLeaveModalOpen] = useState(false);
  const [leaveDoctorId, setLeaveDoctorId] = useState(doctors[0]?.id || "");
  const [leaveDateStr, setLeaveDateStr] = useState("");
  const [leaveReasonEn, setLeaveReasonEn] = useState("");
  const [leaveReasonBn, setLeaveReasonBn] = useState("");
  const [leaveType, setLeaveType] = useState<"BLOCKED" | "LEAVE" | "RESCHEDULED">("LEAVE");

  // Calendar Date State
  const [selectedCalendarDate, setSelectedCalendarDate] = useState(() => {
    return new Date().toISOString().split("T")[0];
  });

  // KPI Calculations (Section 5 Compliance)
  const todayDateStr = new Date().toISOString().split("T")[0];
  const todayAppointments = appointments.filter((a) => a.preferredDate === todayDateStr);
  const confirmedToday = todayAppointments.filter((a) => a.status === "CONFIRMED").length;
  const pendingRequestsTotal = appointments.filter(
    (a) => a.status === "REQUESTED" || a.status === "PENDING_CONFIRMATION"
  ).length;
  const completedCount = appointments.filter((a) => a.status === "COMPLETED").length;
  const cancelledCount = appointments.filter((a) => a.status === "CANCELLED").length;
  const noShowCount = appointments.filter((a) => a.status === "NO_SHOW").length;
  const activeDoctorsCount = doctors.filter((d) => d.publicationState === "PUBLISHED").length;
  const activeDepartmentsCount = departments.filter((d) => d.publicationState === "PUBLISHED").length;

  // Filtered Lists
  const filteredDoctors = doctors.filter((doc) => {
    const matchesSearch =
      doc.nameEn.toLowerCase().includes(docSearch.toLowerCase()) ||
      doc.nameBn.includes(docSearch) ||
      doc.bmdcRegistrationNo.toLowerCase().includes(docSearch.toLowerCase());
    const matchesDept = docDeptFilter === "ALL" || doc.departmentId === docDeptFilter;
    const matchesStatus = docStatusFilter === "ALL" || doc.publicationState === docStatusFilter;
    return matchesSearch && matchesDept && matchesStatus;
  });

  const filteredAppointments = appointments.filter((apt) => {
    const matchesSearch =
      apt.reference.toLowerCase().includes(aptSearch.toLowerCase()) ||
      apt.patientName.toLowerCase().includes(aptSearch.toLowerCase()) ||
      apt.patientPhone.includes(aptSearch);
    const matchesStatus = aptStatusFilter === "ALL" || apt.status === aptStatusFilter;
    return matchesSearch && matchesStatus;
  });

  // Extract unique patients from appointments & users
  const patientsMap = new Map<string, { phone: string; name: string; email?: string; bookingsCount: number; lastVisit: string }>();
  for (const apt of appointments) {
    const existing = patientsMap.get(apt.patientPhone);
    if (!existing) {
      patientsMap.set(apt.patientPhone, {
        phone: apt.patientPhone,
        name: apt.patientName,
        email: apt.patientEmail,
        bookingsCount: 1,
        lastVisit: apt.preferredDate,
      });
    } else {
      existing.bookingsCount += 1;
      if (apt.preferredDate > existing.lastVisit) {
        existing.lastVisit = apt.preferredDate;
      }
    }
  }
  const patientsList = Array.from(patientsMap.values()).filter(
    (p) =>
      p.name.toLowerCase().includes(patientSearch.toLowerCase()) ||
      p.phone.includes(patientSearch) ||
      (p.email && p.email.toLowerCase().includes(patientSearch.toLowerCase()))
  );

  // All Schedule Exceptions
  const allScheduleExceptions = doctors.flatMap((d) =>
    d.branches.flatMap((b) =>
      (b.scheduleExceptions || []).map((ex) => ({
        ...ex,
        doctorId: d.id,
        doctorName: d.nameEn,
        branchId: b.branchId,
        branchName: branches.find((br) => br.id === b.branchId)?.nameEn || b.branchId,
      }))
    )
  );

  const handleCreateDeptSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDeptEn || !newDeptBn || !newDeptSlug || !newDeptBranch) return;
    setDeptLoading(true);
    try {
      await onCreateDepartment({
        nameEn: newDeptEn,
        nameBn: newDeptBn,
        slug: newDeptSlug,
        branchId: newDeptBranch,
      });
      setNewDeptEn("");
      setNewDeptBn("");
      setNewDeptSlug("");
    } finally {
      setDeptLoading(false);
    }
  };

  const handleTransitionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAptForTransition) return;
    setTransitionLoading(true);
    try {
      await onTransitionAppointment(
        selectedAptForTransition.id,
        targetStatus,
        transitionReason || `Updated to ${targetStatus} by Hospital Admin`,
        transitionNote
      );
      setSelectedAptForTransition(null);
      setTransitionReason("");
      setTransitionNote("");
    } finally {
      setTransitionLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* ====================================================================
          UNIFIED HOSPITAL OPERATIONS TABS (DECLUTTERED 7-TAB NAVIGATION)
         ==================================================================== */}
      <div className="flex items-center gap-1.5 border-b border-[#e5e7eb] pb-3 overflow-x-auto bg-white p-2 border border-[#e5e7eb]">
        {canViewAnalytics && (
          <button
            type="button"
            onClick={() => setTab("analytics")}
            className={`px-3.5 py-2 text-xs font-bold transition-colors whitespace-nowrap flex items-center gap-2 cursor-pointer ${
              activeTab === "analytics" || activeTab === "overview" || activeTab === "reports"
                ? "bg-[#012d61] text-white shadow-xs"
                : "text-[#444444] hover:bg-[#f0f4f8]"
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5 text-[#82b4ff]" />
            <span>Executive Analytics</span>
          </button>
        )}

        {canViewFrontDesk && (
          <button
            type="button"
            onClick={() => setTab("front-desk")}
            className={`px-3.5 py-2 text-xs font-bold transition-colors whitespace-nowrap flex items-center gap-2 cursor-pointer ${
              activeTab === "front-desk" ||
              activeTab === "appointments" ||
              activeTab === "schedules" ||
              activeTab === "calendar"
                ? "bg-[#012d61] text-white shadow-xs"
                : "text-[#444444] hover:bg-[#f0f4f8]"
            }`}
          >
            <Calendar className="w-3.5 h-3.5 text-[#82b4ff]" />
            <span>Front Desk &amp; Doctor Schedules</span>
          </button>
        )}

        {canViewCmsAndFacebook && (
          <button
            type="button"
            onClick={() => setTab("facebook-studio")}
            className={`px-3.5 py-2 text-xs font-bold transition-colors whitespace-nowrap flex items-center gap-2 cursor-pointer ${
              activeTab === "facebook-studio"
                ? "bg-[#012d61] text-white shadow-xs"
                : "text-[#444444] hover:bg-[#f0f4f8]"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-[#82b4ff]" />
            <span>Daily Facebook Studio</span>
          </button>
        )}

        {canViewCmsAndFacebook && (
          <button
            type="button"
            onClick={() => setTab("doctors-cms")}
            className={`px-3.5 py-2 text-xs font-bold transition-colors whitespace-nowrap flex items-center gap-2 cursor-pointer ${
              activeTab === "doctors-cms" || activeTab === "specialists" || activeTab === "departments"
                ? "bg-[#012d61] text-white shadow-xs"
                : "text-[#444444] hover:bg-[#f0f4f8]"
            }`}
          >
            <Stethoscope className="w-3.5 h-3.5 text-[#82b4ff]" />
            <span>Doctors &amp; Departments CMS</span>
          </button>
        )}

        {canViewCmsAndFacebook && (
          <button
            type="button"
            onClick={() => setTab("notices-cms")}
            className={`px-3.5 py-2 text-xs font-bold transition-colors whitespace-nowrap flex items-center gap-2 cursor-pointer ${
              activeTab === "notices-cms"
                ? "bg-[#012d61] text-white shadow-xs"
                : "text-[#444444] hover:bg-[#f0f4f8]"
            }`}
          >
            <FileText className="w-3.5 h-3.5 text-[#82b4ff]" />
            <span>Website Notices CMS</span>
          </button>
        )}

        <button
          type="button"
          onClick={() => setTab("feedback-moderation")}
          className={`px-3.5 py-2 text-xs font-bold transition-colors whitespace-nowrap flex items-center gap-2 cursor-pointer ${
            activeTab === "feedback-moderation"
              ? "bg-[#012d61] text-white shadow-xs"
              : "text-[#444444] hover:bg-[#f0f4f8]"
          }`}
        >
          <MessageSquare className="w-3.5 h-3.5 text-[#82b4ff]" />
          <span>Patient Feedback &amp; Enquiries</span>
        </button>

        {canViewStaffAndAudit && (
          <button
            type="button"
            onClick={() => setTab("staff")}
            className={`px-3.5 py-2 text-xs font-bold transition-colors whitespace-nowrap flex items-center gap-2 cursor-pointer ${
              activeTab === "staff" ||
              activeTab === "roles" ||
              activeTab === "audit" ||
              activeTab === "approvals"
                ? "bg-[#012d61] text-white shadow-xs"
                : "text-[#444444] hover:bg-[#f0f4f8]"
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-[#82b4ff]" />
            <span>Staff, Roles &amp; Audit Log</span>
          </button>
        )}
      </div>



        
      {/* ====================================================================
          TAB 1: EXECUTIVE ANALYTICS
         ==================================================================== */}
      {(activeTab === "analytics" || activeTab === "overview" || activeTab === "reports") && (
        <AdminHealthcareAnalytics
          embedded
          onPromoteDoctor={(docId) => {
            setPromotedDoctorId(docId);
            setTab("facebook-studio");
          }}
        />
      )}

      {/* ====================================================================
          TAB 2: FRONT DESK & DOCTOR SCHEDULE MANAGER
         ==================================================================== */}
      {(activeTab === "front-desk" || activeTab === "schedules" || activeTab === "calendar") && (
        <FrontDeskScheduleManager embedded />
      )}

      {/* ====================================================================
          TAB 3: DAILY FACEBOOK CAMPAIGN STUDIO
         ==================================================================== */}
      {activeTab === "facebook-studio" && (
        <FacebookCampaignGenerator embedded initialDoctorId={promotedDoctorId} />
      )}

      {/* ====================================================================
          TAB 5: WEBSITE NOTICES CMS
         ==================================================================== */}
      {activeTab === "notices-cms" && (
        <WebsiteNoticesCMS />
      )}

      {/* ====================================================================
          TAB 6: PATIENT FEEDBACK MODERATION
         ==================================================================== */}
      {activeTab === "feedback-moderation" && (
        <PatientFeedbackModeration />
      )}

      {/* ====================================================================
          TAB 2: APPOINTMENTS MANAGEMENT (Section 5 Specification)
         ==================================================================== */}
      {activeTab === "appointments" && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-[#d6d6d6] p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="mc-serif text-xl text-[#080808]">Hospital Appointment Roster</h3>
                <p className="text-xs text-[#686868]">
                  Verified booking requests, status lifecycle updates, and chamber notes.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-[#686868]" />
                  <input
                    type="text"
                    value={aptSearch}
                    onChange={(e) => setAptSearch(e.target.value)}
                    placeholder="Search reference, patient..."
                    className="pl-8 pr-3 py-1.5 rounded-lg border border-[#949494] text-xs focus:outline-none"
                  />
                </div>

                <select
                  value={aptStatusFilter}
                  onChange={(e) => setAptStatusFilter(e.target.value)}
                  className="px-3 py-1.5 rounded-lg border border-[#949494] text-xs focus:outline-none"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="REQUESTED">REQUESTED</option>
                  <option value="CONFIRMED">CONFIRMED</option>
                  <option value="COMPLETED">COMPLETED</option>
                  <option value="CANCELLED">CANCELLED</option>
                  <option value="NO_SHOW">NO_SHOW</option>
                </select>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[#ededed] bg-[#f8fafc] text-[#595959] uppercase tracking-wider text-[11px]">
                    <th className="py-3 px-4 font-bold">Reference</th>
                    <th className="py-3 px-4 font-bold">Patient</th>
                    <th className="py-3 px-4 font-bold">Specialist &amp; Dept</th>
                    <th className="py-3 px-4 font-bold">Date &amp; Slot</th>
                    <th className="py-3 px-4 font-bold">Status</th>
                    <th className="py-3 px-4 font-bold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#ededed]">
                  {filteredAppointments.map((apt) => {
                    const doc = doctors.find((d) => d.id === apt.doctorId);
                    const dept = departments.find((d) => d.id === apt.departmentId);
                    return (
                      <tr key={apt.id} className="hover:bg-[#f8fafc]">
                        <td className="py-3.5 px-4 font-mono font-bold text-[#0057b8]">
                          {apt.reference}
                        </td>
                        <td className="py-3.5 px-4">
                          <p className="font-bold text-[#080808]">{apt.patientName}</p>
                          <p className="text-[11px] text-[#686868]">{apt.patientPhone}</p>
                        </td>
                        <td className="py-3.5 px-4">
                          <p className="font-semibold text-[#080808]">{doc?.nameEn || apt.doctorId}</p>
                          <p className="text-[11px] text-[#686868]">{dept?.nameEn || apt.departmentId}</p>
                        </td>
                        <td className="py-3.5 px-4 font-mono">
                          <strong>{apt.preferredDate}</strong> at {apt.preferredTimeSlot}
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              apt.status === "CONFIRMED"
                                ? "bg-[#dcfce7] text-[#15803d]"
                                : apt.status === "REQUESTED"
                                ? "bg-[#fee2e2] text-[#991b1b]"
                                : apt.status === "COMPLETED"
                                ? "bg-[#ede9fe] text-[#6d28d9]"
                                : "bg-[#f1f5f9] text-[#475569]"
                            }`}
                          >
                            {apt.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedAptForTransition(apt);
                              setTargetStatus(apt.status === "REQUESTED" ? "CONFIRMED" : "COMPLETED");
                            }}
                            className="text-xs font-bold text-[#0057b8] hover:underline"
                          >
                            Update Status →
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ====================================================================
          TAB 3: APPOINTMENT CALENDAR (Section 5 Specification)
         ==================================================================== */}
      {activeTab === "calendar" && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-[#d6d6d6] p-6 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="mc-serif text-xl text-[#080808]">Interactive Chamber Calendar</h3>
                <p className="text-xs text-[#686868]">
                  Visual daily schedule, chamber room occupancy, and patient consultation slots.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <label className="text-xs font-bold text-[#080808]">Select Date:</label>
                <input
                  type="date"
                  value={selectedCalendarDate}
                  onChange={(e) => setSelectedCalendarDate(e.target.value)}
                  className="px-3 py-1.5 rounded-lg border border-[#949494] text-xs font-mono"
                />
              </div>
            </div>

            <div className="border border-[#ededed] rounded-xl overflow-hidden">
              <div className="p-3 bg-[#f8fafc] border-b border-[#ededed] font-bold text-xs text-[#080808] flex items-center justify-between">
                <span>Chamber Schedule for {selectedCalendarDate}</span>
                <span className="text-[#0057b8]">
                  {appointments.filter((a) => a.preferredDate === selectedCalendarDate).length} Bookings Scheduled
                </span>
              </div>

              <div className="divide-y divide-[#ededed]">
                {doctors.map((doc) => {
                  const docAppointments = appointments.filter(
                    (a) => a.doctorId === doc.id && a.preferredDate === selectedCalendarDate
                  );
                  const branchAssign = doc.branches[0];
                  return (
                    <div key={doc.id} className="p-4 hover:bg-[#f8fafc] transition-colors">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                        <div>
                          <p className="font-bold text-sm text-[#080808]">{doc.nameEn}</p>
                          <p className="text-xs text-[#686868]">
                            Chamber: {branchAssign?.roomNumber || "Consultation Desk"} • Fee: ৳{doc.consultationFeeBdt}
                          </p>
                        </div>
                        <span className="text-xs font-bold text-[#484848]">
                          {docAppointments.length} Patient{docAppointments.length === 1 ? "" : "s"}
                        </span>
                      </div>

                      {docAppointments.length === 0 ? (
                        <p className="text-xs text-[#949494] italic">
                          No patient bookings scheduled for this date.
                        </p>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                          {docAppointments.map((apt) => (
                            <div
                              key={apt.id}
                              className="p-2.5 rounded-lg border border-[#d6d6d6] bg-white text-xs space-y-1"
                            >
                              <div className="flex items-center justify-between">
                                <span className="font-mono font-bold text-[#0057b8]">{apt.preferredTimeSlot}</span>
                                <span
                                  className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                                    apt.status === "CONFIRMED"
                                      ? "bg-[#dcfce7] text-[#15803d]"
                                      : "bg-[#fef3c7] text-[#92400e]"
                                  }`}
                                >
                                  {apt.status}
                                </span>
                              </div>
                              <p className="font-bold text-[#080808] truncate">{apt.patientName}</p>
                              <p className="text-[11px] text-[#686868]">{apt.patientPhone}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ====================================================================
          TAB 4: PATIENTS DIRECTORY (Section 5 Specification)
         ==================================================================== */}
      {activeTab === "patients" && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-[#d6d6d6] p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="mc-serif text-xl text-[#080808]">Patient Outpatient Directory</h3>
                <p className="text-xs text-[#686868]">
                  Aggregated patient scheduling records, visit history, and contact coordinates.
                </p>
              </div>

              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-[#686868]" />
                <input
                  type="text"
                  value={patientSearch}
                  onChange={(e) => setPatientSearch(e.target.value)}
                  placeholder="Search by phone, name..."
                  className="pl-8 pr-3 py-1.5 rounded-lg border border-[#949494] text-xs focus:outline-none"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[#ededed] bg-[#f8fafc] text-[#595959] uppercase tracking-wider text-[11px]">
                    <th className="py-3 px-4 font-bold">Patient Name</th>
                    <th className="py-3 px-4 font-bold">Phone Number</th>
                    <th className="py-3 px-4 font-bold">Email</th>
                    <th className="py-3 px-4 font-bold">Total Bookings</th>
                    <th className="py-3 px-4 font-bold">Last Activity</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#ededed]">
                  {patientsList.map((p) => (
                    <tr key={p.phone} className="hover:bg-[#f8fafc]">
                      <td className="py-3 px-4 font-bold text-[#080808]">{p.name}</td>
                      <td className="py-3 px-4 font-mono text-[#0057b8]">{p.phone}</td>
                      <td className="py-3 px-4 text-[#686868]">{p.email || "—"}</td>
                      <td className="py-3 px-4 font-mono font-bold text-[#080808]">{p.bookingsCount}</td>
                      <td className="py-3 px-4 text-[#686868]">{p.lastVisit}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ====================================================================
          TAB 5: SPECIALISTS & DOCTORS (Section 5 Specification)
         ==================================================================== */}
      {(activeTab === "doctors-cms" || activeTab === "specialists") && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-[#d6d6d6] p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="mc-serif text-xl text-[#080808]">Canonical Doctor Operational Records</h3>
                <p className="text-xs text-[#686868]">
                  Hospital Admin owns verified credentials, BMDC registrations, consultation fees, and working hours.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-[#686868]" />
                  <input
                    type="text"
                    value={docSearch}
                    onChange={(e) => setDocSearch(e.target.value)}
                    placeholder="Search doctor, BMDC..."
                    className="pl-8 pr-3 py-1.5 rounded-lg border border-[#949494] text-xs focus:outline-none"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setSelectedDoctor(null);
                    setSpecialistModalMode("CREATE");
                    setSpecialistModalOpen(true);
                  }}
                  className="mc-btn-primary text-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Specialist</span>
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[#ededed] bg-[#f8fafc] text-[#595959] uppercase tracking-wider text-[11px]">
                    <th className="py-3 px-4 font-bold">Doctor Name &amp; Designation</th>
                    <th className="py-3 px-4 font-bold">BMDC Registration</th>
                    <th className="py-3 px-4 font-bold">Department</th>
                    <th className="py-3 px-4 font-bold">Consultation Fee</th>
                    <th className="py-3 px-4 font-bold">Chamber &amp; Room</th>
                    <th className="py-3 px-4 font-bold">Status</th>
                    <th className="py-3 px-4 font-bold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#ededed]">
                  {filteredDoctors.map((doc) => {
                    const dept = departments.find((d) => d.id === doc.departmentId);
                    const branchAssign = doc.branches[0];
                    return (
                      <tr key={doc.id} className="hover:bg-[#f8fafc]">
                        <td className="py-3.5 px-4">
                          <p className="font-bold text-[#080808]">{doc.nameEn}</p>
                          <p className="text-[11px] text-[#686868]">{doc.designationEn}</p>
                        </td>
                        <td className="py-3.5 px-4 font-mono font-bold text-[#0057b8]">
                          {doc.bmdcRegistrationNo}
                        </td>
                        <td className="py-3.5 px-4 font-medium text-[#080808]">
                          {dept?.nameEn || doc.departmentId}
                        </td>
                        <td className="py-3.5 px-4 font-mono">
                          <strong>৳{doc.consultationFeeBdt}</strong> (Follow-up: ৳{doc.followupFeeBdt})
                        </td>
                        <td className="py-3.5 px-4 text-[#484848]">
                          {branchAssign?.roomNumber || "Desk"}
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              doc.publicationState === "PUBLISHED"
                                ? "bg-[#dcfce7] text-[#15803d]"
                                : "bg-[#fef3c7] text-[#92400e]"
                            }`}
                          >
                            {doc.publicationState}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedDoctor(doc);
                                setSpecialistModalMode("EDIT");
                                setSpecialistModalOpen(true);
                              }}
                              className="text-xs font-bold text-[#0057b8] hover:underline"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedDoctor(doc);
                                setDeactivateAction(
                                  doc.publicationState === "ARCHIVED" ? "ACTIVATE" : "DEACTIVATE"
                                );
                                setDeactivateModalOpen(true);
                              }}
                              className="text-xs font-bold text-[#dc2626] hover:underline"
                            >
                              {doc.publicationState === "ARCHIVED" ? "Activate" : "Deactivate"}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ====================================================================
          TAB 6: DEPARTMENTS (Section 5 Specification)
         ==================================================================== */}
      {(activeTab === "doctors-cms" || activeTab === "departments") && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white rounded-2xl border border-[#d6d6d6] p-6 space-y-4">
              <h3 className="mc-serif text-xl text-[#080808]">Clinical Departments Directory</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-[#ededed] bg-[#f8fafc] text-[#595959] uppercase tracking-wider text-[11px]">
                      <th className="py-3 px-4 font-bold">Department Name</th>
                      <th className="py-3 px-4 font-bold">Slug</th>
                      <th className="py-3 px-4 font-bold">Assigned Doctors</th>
                      <th className="py-3 px-4 font-bold">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#ededed]">
                    {departments.map((dept) => {
                      const docCount = doctors.filter((d) => d.departmentId === dept.id).length;
                      return (
                        <tr key={dept.id} className="hover:bg-[#f8fafc]">
                          <td className="py-3 px-4">
                            <p className="font-bold text-[#080808]">{dept.nameEn}</p>
                            <p className="text-[11px] text-[#686868]">{dept.nameBn}</p>
                          </td>
                          <td className="py-3 px-4 font-mono text-[#0057b8]">{dept.slug}</td>
                          <td className="py-3 px-4 font-bold">{docCount} Specialists</td>
                          <td className="py-3 px-4">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#dcfce7] text-[#15803d]">
                              {dept.publicationState}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-[#d6d6d6] p-6 space-y-4">
              <h3 className="font-bold text-base text-[#080808]">Create Department</h3>
              <form onSubmit={handleCreateDeptSubmit} className="space-y-3 text-xs">
                <div className="space-y-1">
                  <label className="font-bold text-[#080808]">Name (English) *</label>
                  <input
                    type="text"
                    required
                    value={newDeptEn}
                    onChange={(e) => setNewDeptEn(e.target.value)}
                    placeholder="e.g. Ophthalmology"
                    className="w-full px-3 py-2 rounded-xl border border-[#949494]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-[#080808]">Name (Bangla) *</label>
                  <input
                    type="text"
                    required
                    value={newDeptBn}
                    onChange={(e) => setNewDeptBn(e.target.value)}
                    placeholder="e.g. চক্ষু বিভাগ"
                    className="w-full px-3 py-2 rounded-xl border border-[#949494]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-[#080808]">URL Slug *</label>
                  <input
                    type="text"
                    required
                    value={newDeptSlug}
                    onChange={(e) => setNewDeptSlug(e.target.value)}
                    placeholder="e.g. ophthalmology"
                    className="w-full px-3 py-2 rounded-xl border border-[#949494] font-mono"
                  />
                </div>
                <button
                  type="submit"
                  disabled={deptLoading}
                  className="w-full mc-btn-primary text-xs"
                >
                  {deptLoading ? "Creating..." : "Add Department"}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ====================================================================
          TAB 7: SPECIALTIES & TAB 8: BRANCHES (Section 5 Specification)
         ==================================================================== */}
      {activeTab === "specialties" && (
        <div className="bg-white rounded-2xl border border-[#d6d6d6] p-6 space-y-4">
          <h3 className="mc-serif text-xl text-[#080808]">Medical Specialties</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
            {specialties.map((spec) => (
              <div key={spec.id} className="p-4 rounded-xl border border-[#ededed] bg-[#f8fafc] space-y-1">
                <p className="font-bold text-sm text-[#080808]">{spec.nameEn}</p>
                <p className="text-[11px] text-[#0057b8]">{spec.nameBn}</p>
                <p className="text-[#686868] text-[11px] pt-1">{spec.descriptionEn}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === "branches" && (
        <div className="bg-white rounded-2xl border border-[#d6d6d6] p-6 space-y-4">
          <h3 className="mc-serif text-xl text-[#080808]">Hospital Branch Campuses</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            {branches.map((br) => (
              <div key={br.id} className="p-5 rounded-xl border border-[#ededed] bg-[#f8fafc] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-base text-[#080808]">{br.nameEn}</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#dcfce7] text-[#15803d]">
                    {br.publicationState}
                  </span>
                </div>
                <p className="text-xs text-[#686868]">{br.addressEn}</p>
                <p className="text-[11px] text-[#484848]">Emergency Phone: <strong>{br.emergencyPhone}</strong></p>
                <p className="text-[11px] text-[#484848]">Hours: {br.operatingHoursEn}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ====================================================================
          TAB 9: DOCTOR SCHEDULES (Section 5 Specification)
         ==================================================================== */}
      {activeTab === "schedules" && (
        <div className="bg-white rounded-2xl border border-[#d6d6d6] p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="mc-serif text-xl text-[#080808]">Weekly Chamber Schedule Rules</h3>
              <p className="text-xs text-[#686868]">
                Enforce weekday rules, consultation start/end hours, slot minutes, and maximum slot capacity.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[#ededed] bg-[#f8fafc] text-[#595959] uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4 font-bold">Specialist</th>
                  <th className="py-3 px-4 font-bold">Chamber Branch</th>
                  <th className="py-3 px-4 font-bold">Weekday</th>
                  <th className="py-3 px-4 font-bold">Consultation Hours</th>
                  <th className="py-3 px-4 font-bold">Slot Minutes</th>
                  <th className="py-3 px-4 font-bold">Capacity / Slot</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#ededed]">
                {doctors.flatMap((doc) =>
                  doc.branches.flatMap((b) =>
                    b.scheduleRules.map((sr) => (
                      <tr key={sr.id} className="hover:bg-[#f8fafc]">
                        <td className="py-3 px-4 font-bold text-[#080808]">{doc.nameEn}</td>
                        <td className="py-3 px-4 text-[#484848]">
                          {branches.find((br) => br.id === b.branchId)?.nameEn || b.branchId}
                        </td>
                        <td className="py-3 px-4 font-bold text-[#0057b8]">
                          {sr.weekdayLabelEn} ({sr.weekdayLabelBn})
                        </td>
                        <td className="py-3 px-4 font-mono">
                          {sr.startTime} – {sr.endTime}
                        </td>
                        <td className="py-3 px-4 font-mono">{sr.slotMinutes} mins</td>
                        <td className="py-3 px-4 font-mono font-bold">{sr.capacityPerSlot} Patients</td>
                      </tr>
                    ))
                  )
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ====================================================================
          TAB 10: LEAVE & AVAILABILITY (Section 5 Specification)
         ==================================================================== */}
      {activeTab === "leave" && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-[#d6d6d6] p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="mc-serif text-xl text-[#080808]">Leave &amp; Blocked Chamber Periods</h3>
                <p className="text-xs text-[#686868]">
                  Schedule exceptions that prevent booking during leave or conference periods.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setLeaveModalOpen(true)}
                className="mc-btn-primary text-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Log Leave Exception</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[#ededed] bg-[#f8fafc] text-[#595959] uppercase tracking-wider text-[11px]">
                    <th className="py-3 px-4 font-bold">Specialist</th>
                    <th className="py-3 px-4 font-bold">Branch</th>
                    <th className="py-3 px-4 font-bold">Blocked Date</th>
                    <th className="py-3 px-4 font-bold">Type</th>
                    <th className="py-3 px-4 font-bold">Reason</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#ededed]">
                  {allScheduleExceptions.map((ex) => (
                    <tr key={ex.id} className="hover:bg-[#f8fafc]">
                      <td className="py-3 px-4 font-bold text-[#080808]">{ex.doctorName}</td>
                      <td className="py-3 px-4 text-[#484848]">{ex.branchName}</td>
                      <td className="py-3 px-4 font-mono font-bold text-[#dc2626]">{ex.dateStr}</td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#fee2e2] text-[#991b1b]">
                          {ex.exceptionType}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-[#484848]">{ex.reasonEn}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ====================================================================
          TAB 11: STAFF & TAB 12: ROLES (Section 5 Specification)
         ==================================================================== */}
      {activeTab === "staff" && (
        <div className="bg-white rounded-2xl border border-[#d6d6d6] p-6 space-y-4">
          <h3 className="mc-serif text-xl text-[#080808]">Hospital Personnel &amp; Accounts</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[#ededed] bg-[#f8fafc] text-[#595959] uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4 font-bold">Full Name</th>
                  <th className="py-3 px-4 font-bold">Email &amp; Phone</th>
                  <th className="py-3 px-4 font-bold">Role</th>
                  <th className="py-3 px-4 font-bold">Branch Assignment</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#ededed]">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-[#f8fafc]">
                    <td className="py-3 px-4 font-bold text-[#080808]">{u.fullName}</td>
                    <td className="py-3 px-4 text-[#686868]">{u.email} • {u.phone || "—"}</td>
                    <td className="py-3 px-4 font-bold font-mono text-[#0057b8]">{u.role}</td>
                    <td className="py-3 px-4 text-[#484848]">
                      {u.scopedBranchId ? "Dhanmondi Flagship" : "Hospital Global"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {(activeTab === "staff" || activeTab === "roles") && (
        <div className="bg-white rounded-2xl border border-[#d6d6d6] p-6 space-y-4">
          <h3 className="mc-serif text-xl text-[#080808]">Hospital Role &amp; Permission Boundaries</h3>
          <div className="space-y-3 text-xs">
            <div className="p-4 rounded-xl border border-[#ededed] bg-[#f8fafc] space-y-1">
              <span className="font-bold text-[#0057b8]">HOSPITAL_ADMIN (Level 80)</span>
              <p className="text-[#686868]">
                Authorizes operational doctor records, consultation fees, chamber schedules, departments, and reviews CMS editorial change requests.
              </p>
            </div>
            <div className="p-4 rounded-xl border border-[#ededed] bg-[#f8fafc] space-y-1">
              <span className="font-bold text-[#059669]">RECEPTIONIST (Level 40)</span>
              <p className="text-[#686868]">
                Intake queue, verifies patient phone numbers, confirms bookings, marks walk-ins. Strictly blocked from clinical records or doctor fee modifications.
              </p>
            </div>
            <div className="p-4 rounded-xl border border-[#ededed] bg-[#f8fafc] space-y-1">
              <span className="font-bold text-[#d97706]">CONTENT_EDITOR (Level 40)</span>
              <p className="text-[#686868]">
                Manages public website articles, doctor photographs, and marketing copy. Cannot alter BMDC registrations or fees without Hospital Admin approval.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ====================================================================
          TAB 13: CONSULTATION FEES (Section 5 Specification)
         ==================================================================== */}
      {activeTab === "fees" && (
        <div className="bg-white rounded-2xl border border-[#d6d6d6] p-6 space-y-4">
          <h3 className="mc-serif text-xl text-[#080808]">Consultation &amp; Follow-up Fees Matrix</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[#ededed] bg-[#f8fafc] text-[#595959] uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4 font-bold">Specialist</th>
                  <th className="py-3 px-4 font-bold">Department</th>
                  <th className="py-3 px-4 font-bold">New Visit Consultation Fee</th>
                  <th className="py-3 px-4 font-bold">Follow-Up Visit Fee</th>
                  <th className="py-3 px-4 font-bold">Effective Since</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#ededed]">
                {doctors.map((doc) => {
                  const dept = departments.find((d) => d.id === doc.departmentId);
                  return (
                    <tr key={doc.id} className="hover:bg-[#f8fafc]">
                      <td className="py-3 px-4 font-bold text-[#080808]">{doc.nameEn}</td>
                      <td className="py-3 px-4 text-[#484848]">{dept?.nameEn || doc.departmentId}</td>
                      <td className="py-3 px-4 font-mono font-bold text-[#0057b8]">
                        ৳{doc.consultationFeeBdt}
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-[#059669]">
                        ৳{doc.followupFeeBdt}
                      </td>
                      <td className="py-3 px-4 font-mono text-[#686868]">{doc.feeEffectiveFrom}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ====================================================================
          TAB 14: REPORTS, 15: NOTIFICATIONS, 16: APPROVALS, 17: AUDIT, 18: SETTINGS
         ==================================================================== */}
      {activeTab === "reports" && (
        <div className="bg-white rounded-2xl border border-[#d6d6d6] p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="mc-serif text-xl text-[#080808]">Hospital Performance Reports</h3>
              <p className="text-xs text-[#686868]">Complete operational appointment history and telemetry export.</p>
            </div>
            <a
              href="/api/v1/admin/analytics?format=csv"
              className="mc-btn-primary text-xs"
            >
              <Download className="w-4 h-4" />
              <span>Download Appointments CSV</span>
            </a>
          </div>
        </div>
      )}

      {activeTab === "notifications" && (
        <div className="bg-white rounded-2xl border border-[#d6d6d6] p-6 space-y-4">
          <h3 className="mc-serif text-xl text-[#080808]">Hospital SMS &amp; Email Notifications Log</h3>
          <div className="divide-y divide-[#ededed] text-xs">
            {notifications.slice(0, 20).map((n) => (
              <div key={n.id} className="py-3 flex items-center justify-between">
                <div>
                  <p className="font-bold text-[#080808]">{n.subject || n.templateCode}</p>
                  <p className="text-[11px] text-[#686868]">To: {n.recipient} • Preview: {n.bodyPreview}</p>
                </div>
                <span className="font-mono text-[10px] text-[#059669] font-bold">{n.status}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {(activeTab === "staff" || activeTab === "approvals") && (
        <div className="bg-white rounded-2xl border border-[#d6d6d6] p-6 space-y-4">
          <h3 className="mc-serif text-xl text-[#080808]">CMS Editorial &amp; Schedule Approval Queue</h3>
          <p className="text-xs text-[#686868]">
            Review changes submitted by CMS Editors or AI update drafts.
          </p>

          <div className="space-y-3">
            {approvals.map((appr) => (
              <div
                key={appr.id}
                className="p-4 rounded-xl border border-[#ededed] bg-[#f8fafc] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-[#080808]">{appr.entityTitle}</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#fef3c7] text-[#92400e]">
                      {appr.status}
                    </span>
                  </div>
                  <p className="text-xs text-[#686868]">{appr.changeSummary}</p>
                  <p className="text-[11px] text-[#595959]">
                    Requested by: <strong>{appr.requestedByName}</strong> on {appr.createdAt}
                  </p>
                </div>

                {appr.status === "PENDING_APPROVAL" && (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        onReviewApproval(appr.id, "APPROVED_AND_PUBLISHED", "Verified by Hospital Admin")
                      }
                      className="px-3 py-1.5 rounded-lg bg-[#059669] text-white font-bold text-xs hover:bg-[#047857]"
                    >
                      Approve &amp; Publish
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        onReviewApproval(appr.id, "REJECTED", "Rejected by Hospital Admin")
                      }
                      className="px-3 py-1.5 rounded-lg border border-[#dc2626] text-[#dc2626] font-bold text-xs hover:bg-[#fee2e2]"
                    >
                      Reject
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {(activeTab === "staff" || activeTab === "audit") && (
        <div className="bg-white rounded-2xl border border-[#d6d6d6] p-6 space-y-4">
          <h3 className="mc-serif text-xl text-[#080808]">Hospital Facility Audit Log</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[#ededed] bg-[#f8fafc] text-[#595959] uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4 font-bold">Timestamp</th>
                  <th className="py-3 px-4 font-bold">Actor</th>
                  <th className="py-3 px-4 font-bold">Action</th>
                  <th className="py-3 px-4 font-bold">Summary</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#ededed]">
                {auditEvents.slice(0, 30).map((ev) => (
                  <tr key={ev.id} className="hover:bg-[#f8fafc]">
                    <td className="py-3 px-4 font-mono text-[#686868]">{new Date(ev.occurredAt).toLocaleString()}</td>
                    <td className="py-3 px-4 font-bold">{ev.actorName}</td>
                    <td className="py-3 px-4 font-mono text-[#0057b8]">{ev.action}</td>
                    <td className="py-3 px-4 text-[#484848]">{ev.summary}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === "settings" && (
        <div className="bg-white rounded-2xl border border-[#d6d6d6] p-6 space-y-5">
          <h3 className="mc-serif text-xl text-[#080808]">Hospital Facility Configuration</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="space-y-1.5">
              <label className="font-bold text-[#080808]">Hospital Name (English)</label>
              <input
                type="text"
                disabled
                value={hospital?.nameEn || "DeltaCare"}
                className="w-full px-3 py-2 rounded-xl border border-[#ededed] bg-[#f8fafc] text-[#686868]"
              />
            </div>
            <div className="space-y-1.5">
              <label className="font-bold text-[#080808]">Emergency Helpline Phone</label>
              <input
                type="text"
                disabled
                value={hospital?.emergencyPhone || "+8809612310666"}
                className="w-full px-3 py-2 rounded-xl border border-[#ededed] bg-[#f8fafc] text-[#686868]"
              />
            </div>
            <div className="space-y-1.5 md:col-span-2">
              <label className="font-bold text-[#080808]">Cancellation Policy Statement</label>
              <textarea
                disabled
                rows={3}
                value={hospital?.cancellationPolicyEn || ""}
                className="w-full px-3 py-2 rounded-xl border border-[#ededed] bg-[#f8fafc] text-[#686868]"
              />
            </div>
          </div>
        </div>
      )}

      {/* Specialist Modal */}
      {specialistModalOpen && (
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
      )}

      {/* Deactivate Modal */}
      {deactivateModalOpen && selectedDoctor && (
        <DeactivateSpecialistModal
          isOpen={deactivateModalOpen}
          doctor={selectedDoctor}
          action={deactivateAction}
          onClose={() => setDeactivateModalOpen(false)}
          onSuccess={onUpdateDoctorStatus}
        />
      )}

      {/* Appointment Transition Modal */}
      {selectedAptForTransition && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#ededed] pb-3">
              <div>
                <h4 className="font-bold text-base text-[#080808]">Update Appointment Status</h4>
                <p className="text-xs text-[#686868]">
                  Ref: <span className="font-mono font-bold text-[#0057b8]">{selectedAptForTransition.reference}</span> ({selectedAptForTransition.patientName})
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedAptForTransition(null)}
                className="text-[#686868] hover:text-[#080808]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleTransitionSubmit} className="space-y-3.5 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-[#080808]">Select Target Status *</label>
                <select
                  value={targetStatus}
                  onChange={(e) => setTargetStatus(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl border border-[#949494]"
                >
                  <option value="CONFIRMED">CONFIRMED (Ready for Chamber)</option>
                  <option value="COMPLETED">COMPLETED (Consultation Done)</option>
                  <option value="CANCELLED">CANCELLED (Patient / Clinic Request)</option>
                  <option value="NO_SHOW">NO_SHOW (Patient Did Not Arrive)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-[#080808]">Reason / Audit Note *</label>
                <input
                  type="text"
                  required
                  value={transitionReason}
                  onChange={(e) => setTransitionReason(e.target.value)}
                  placeholder="e.g. Verified by phone / In-person visit completed"
                  className="w-full px-3 py-2 rounded-xl border border-[#949494]"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-[#080808]">Chamber Internal Staff Note (Optional)</label>
                <textarea
                  rows={2}
                  value={transitionNote}
                  onChange={(e) => setTransitionNote(e.target.value)}
                  placeholder="Notes for reception or billing desk..."
                  className="w-full px-3 py-2 rounded-xl border border-[#949494]"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedAptForTransition(null)}
                  className="mc-btn-secondary text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={transitionLoading}
                  className="mc-btn-primary text-xs"
                >
                  {transitionLoading ? "Saving..." : "Save Status"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
