"use client";

import React, { useState, useEffect } from "react";
import {
  Calendar,
  Search,
  CheckCircle2,
  Clock,
  Phone,
  User,
  AlertCircle,
  MessageSquare,
  Stethoscope,
  Send,
  Plus,
  RefreshCw,
  UserCheck,
  UserX,
  AlertTriangle,
  ArrowRight,
  Copy,
  Check,
  CalendarDays,
  FileText,
  Bell,
  BarChart3,
  Building2,
  CheckSquare,
  Sparkles,
  X,
} from "lucide-react";
import {
  Appointment,
  Branch,
  Department,
  Doctor,
  NotificationRecord,
  OperationalInsight,
} from "@/types/domain";
import { KpiCard } from "./shared/KpiCard";
import { ActionableInsightsSection } from "./shared/ActionableInsightsSection";

export type ReceptionistTab =
  | "overview"
  | "requests"
  | "today"
  | "calendar"
  | "new-booking"
  | "walk-ins"
  | "patients"
  | "rescheduling"
  | "cancellations"
  | "follow-ups"
  | "notifications"
  | "reports"
  | "my-profile";

interface ReceptionistViewProps {
  currentUser: {
    fullName: string;
    email?: string;
    role?: string;
    scopedBranchId?: string;
  };
  appointments: Appointment[];
  doctors: Doctor[];
  departments: Department[];
  branches: Branch[];
  notifications?: NotificationRecord[];
  insights?: OperationalInsight[];
  activeTab?: ReceptionistTab;
  onTabChange?: (tab: ReceptionistTab) => void;
  onTransitionAppointment: (
    aptId: string,
    toStatus: Appointment["status"],
    reason: string,
    chamberNote?: string
  ) => Promise<void>;
  onSubmitFeedback: (data: {
    patientName: string;
    patientPhone: string;
    subject: string;
    message: string;
    type: "FEEDBACK" | "COMPLAINT" | "SUGGESTION";
  }) => Promise<void>;
  onAppointmentCreated?: (apt: Appointment) => void;
}

export function ReceptionistView({
  currentUser,
  appointments,
  doctors,
  departments,
  branches,
  notifications = [],
  insights = [],
  activeTab: controlledTab,
  onTabChange,
  onTransitionAppointment,
  onSubmitFeedback,
  onAppointmentCreated,
}: ReceptionistViewProps) {
  const [internalTab, setInternalTab] = useState<ReceptionistTab>("overview");
  const activeTab = controlledTab || internalTab;
  const setTab = (tab: ReceptionistTab) => {
    setInternalTab(tab);
    onTabChange?.(tab);
  };

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [docFilter, setDocFilter] = useState("ALL");
  const [copiedPhone, setCopiedPhone] = useState<string | null>(null);

  // Today calculations (Dhaka timezone YYYY-MM-DD)
  const todayDateStr = new Date().toISOString().split("T")[0];
  const todayAppointments = appointments.filter((a) => a.preferredDate === todayDateStr);
  const pendingRequests = appointments.filter(
    (a) => a.status === "REQUESTED" || a.status === "PENDING_CONFIRMATION"
  );
  const confirmedToday = todayAppointments.filter((a) => a.status === "CONFIRMED");
  const completedToday = todayAppointments.filter((a) => a.status === "COMPLETED");
  const cancelledToday = todayAppointments.filter((a) => a.status === "CANCELLED");
  const rescheduleRequests = appointments.filter((a) => a.status === "RESCHEDULE_REQUESTED");

  // Filtered appointments
  const filteredAppointments = appointments.filter((apt) => {
    const matchesSearch =
      apt.reference.toLowerCase().includes(searchQuery.toLowerCase()) ||
      apt.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      apt.patientPhone.includes(searchQuery);
    const matchesStatus = statusFilter === "ALL" || apt.status === statusFilter;
    const matchesDoc = docFilter === "ALL" || apt.doctorId === docFilter;
    return matchesSearch && matchesStatus && matchesDoc;
  });

  // Unique patient directory lookup
  const patientMap = new Map<string, { phone: string; name: string; email?: string; visits: number; lastDate: string }>();
  for (const a of appointments) {
    const existing = patientMap.get(a.patientPhone);
    if (!existing) {
      patientMap.set(a.patientPhone, {
        phone: a.patientPhone,
        name: a.patientName,
        email: a.patientEmail,
        visits: 1,
        lastDate: a.preferredDate,
      });
    } else {
      existing.visits += 1;
      if (a.preferredDate > existing.lastDate) existing.lastDate = a.preferredDate;
    }
  }
  const patientList = Array.from(patientMap.values()).filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.phone.includes(searchQuery)
  );

  // New Booking Stepper State
  const [bookingDeptId, setBookingDeptId] = useState(departments[0]?.id || "");
  const [bookingDocId, setBookingDocId] = useState("");
  const [bookingBranchId, setBookingBranchId] = useState(branches[0]?.id || "");
  const [bookingDate, setBookingDate] = useState(todayDateStr);
  const [bookingSlot, setBookingSlot] = useState("");
  const [bookingPatientName, setBookingPatientName] = useState("");
  const [bookingPatientPhone, setBookingPatientPhone] = useState("");
  const [bookingPatientEmail, setBookingPatientEmail] = useState("");
  const [bookingReason, setBookingReason] = useState("");
  const [bookingVisitType, setBookingVisitType] = useState<"NEW_CONSULTATION" | "FOLLOW_UP">("NEW_CONSULTATION");
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingSuccessApt, setBookingSuccessApt] = useState<Appointment | null>(null);
  const [bookingError, setBookingError] = useState<string | null>(null);

  // Available Slots State
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);

  // Reset / auto-pick doctors for department
  const deptDoctors = doctors.filter(
    (d) => d.departmentId === bookingDeptId && d.publicationState === "PUBLISHED"
  );

  useEffect(() => {
    if (deptDoctors.length > 0 && (!bookingDocId || !deptDoctors.some((d) => d.id === bookingDocId))) {
      setBookingDocId(deptDoctors[0].id);
    }
  }, [bookingDeptId, deptDoctors, bookingDocId]);

  // Fetch slots whenever doc, branch, or date changes
  useEffect(() => {
    if (!bookingDocId || !bookingBranchId || !bookingDate) {
      setAvailableSlots([]);
      return;
    }

    let active = true;
    setSlotsLoading(true);

    fetch(
      `/api/v1/public/availability?doctorId=${encodeURIComponent(
        bookingDocId
      )}&branchId=${encodeURIComponent(bookingBranchId)}&date=${encodeURIComponent(
        bookingDate
      )}`
    )
      .then((res) => res.json())
      .then((data) => {
        if (!active) return;
        setSlotsLoading(false);
        if (data.ok && Array.isArray(data.slots)) {
          const open = data.slots
            .filter((s: any) => s.isAvailable)
            .map((s: any) => s.time);
          setAvailableSlots(open);
          if (open.length > 0 && !open.includes(bookingSlot)) {
            setBookingSlot(open[0]);
          }
        } else {
          setAvailableSlots([]);
        }
      })
      .catch(() => {
        if (active) setSlotsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [bookingDocId, bookingBranchId, bookingDate]);

  // Handle Quick Booking Submit
  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBookingLoading(true);
    setBookingError(null);
    setBookingSuccessApt(null);

    try {
      const res = await fetch("/api/v1/admin/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          departmentId: bookingDeptId,
          doctorId: bookingDocId,
          branchId: bookingBranchId,
          preferredDate: bookingDate,
          preferredTimeSlot: bookingSlot,
          patientName: bookingPatientName,
          patientPhone: bookingPatientPhone,
          patientEmail: bookingPatientEmail || undefined,
          reasonNote: bookingReason || "Front-desk direct booking",
          visitType: bookingVisitType,
          consentAccepted: true,
          autoConfirm: true,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        setBookingError(data.error || "Failed to create appointment.");
        return;
      }

      setBookingSuccessApt(data.appointment);
      onAppointmentCreated?.(data.appointment);
      // Reset form
      setBookingPatientName("");
      setBookingPatientPhone("");
      setBookingPatientEmail("");
      setBookingReason("");
    } catch {
      setBookingError("Network error while submitting appointment.");
    } finally {
      setBookingLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedPhone(text);
    setTimeout(() => setCopiedPhone(null), 2500);
  };

  return (
    <div className="space-y-6">
      {/* ====================================================================
          SUB-NAVIGATION TABS (Section 6 Specification)
         ==================================================================== */}
      <div className="flex items-center gap-1.5 border-b border-[#d6d6d6] pb-3 overflow-x-auto">
        <button
          type="button"
          onClick={() => setTab("overview")}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === "overview"
              ? "bg-[#0057b8] text-white shadow-xs"
              : "text-[#484848] hover:bg-[#e2e8f0]"
          }`}
        >
          <Calendar className="w-3.5 h-3.5" />
          <span>Front Desk Overview</span>
        </button>

        <button
          type="button"
          onClick={() => setTab("requests")}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === "requests"
              ? "bg-[#0057b8] text-white shadow-xs"
              : "text-[#484848] hover:bg-[#e2e8f0]"
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>Appointment Requests</span>
          {pendingRequests.length > 0 && (
            <span className="px-1.5 py-0.2 rounded-full bg-[#dc2626] text-white text-[10px] font-bold">
              {pendingRequests.length}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setTab("today")}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === "today"
              ? "bg-[#0057b8] text-white shadow-xs"
              : "text-[#484848] hover:bg-[#e2e8f0]"
          }`}
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>Today&apos;s Queue ({todayAppointments.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setTab("calendar")}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === "calendar"
              ? "bg-[#0057b8] text-white shadow-xs"
              : "text-[#484848] hover:bg-[#e2e8f0]"
          }`}
        >
          <CalendarDays className="w-3.5 h-3.5" />
          <span>Calendar</span>
        </button>

        <button
          type="button"
          onClick={() => setTab("new-booking")}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === "new-booking"
              ? "bg-[#0057b8] text-white shadow-xs"
              : "text-[#484848] hover:bg-[#e2e8f0]"
          }`}
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Appointment</span>
        </button>

        <button
          type="button"
          onClick={() => setTab("walk-ins")}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === "walk-ins"
              ? "bg-[#0057b8] text-white shadow-xs"
              : "text-[#484848] hover:bg-[#e2e8f0]"
          }`}
        >
          <UserCheck className="w-3.5 h-3.5" />
          <span>Walk-in Patients</span>
        </button>

        <button
          type="button"
          onClick={() => setTab("patients")}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === "patients"
              ? "bg-[#0057b8] text-white shadow-xs"
              : "text-[#484848] hover:bg-[#e2e8f0]"
          }`}
        >
          <User className="w-3.5 h-3.5" />
          <span>Patient Directory</span>
        </button>

        <button
          type="button"
          onClick={() => setTab("rescheduling")}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === "rescheduling"
              ? "bg-[#0057b8] text-white shadow-xs"
              : "text-[#484848] hover:bg-[#e2e8f0]"
          }`}
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Rescheduling</span>
          {rescheduleRequests.length > 0 && (
            <span className="px-1.5 py-0.2 rounded-full bg-[#d97706] text-white text-[10px] font-bold">
              {rescheduleRequests.length}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setTab("cancellations")}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === "cancellations"
              ? "bg-[#0057b8] text-white shadow-xs"
              : "text-[#484848] hover:bg-[#e2e8f0]"
          }`}
        >
          <UserX className="w-3.5 h-3.5" />
          <span>Cancellations</span>
        </button>

        <button
          type="button"
          onClick={() => setTab("reports")}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === "reports"
              ? "bg-[#0057b8] text-white shadow-xs"
              : "text-[#484848] hover:bg-[#e2e8f0]"
          }`}
        >
          <BarChart3 className="w-3.5 h-3.5" />
          <span>Daily Reports</span>
        </button>

        <button
          type="button"
          onClick={() => setTab("my-profile")}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === "my-profile"
              ? "bg-[#0057b8] text-white shadow-xs"
              : "text-[#484848] hover:bg-[#e2e8f0]"
          }`}
        >
          <Building2 className="w-3.5 h-3.5" />
          <span>Front Desk Profile</span>
        </button>
      </div>

      {/* ====================================================================
          TAB 1: FRONT DESK OVERVIEW (Section 6 Specification)
         ==================================================================== */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          {/* Quick Front Desk KPI Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
            <KpiCard
              title="Today's Queue"
              value={todayAppointments.length}
              subtitle="All bookings today"
              icon={<Calendar className="w-4 h-4 text-[#0057b8]" />}
              onClick={() => setTab("today")}
            />
            <KpiCard
              title="Pending Intake"
              value={pendingRequests.length}
              subtitle="Needs phone verify"
              highlight={pendingRequests.length > 0}
              icon={<Clock className="w-4 h-4 text-[#dc2626]" />}
              iconBg="bg-[#fee2e2] text-[#dc2626]"
              onClick={() => setTab("requests")}
            />
            <KpiCard
              title="Confirmed"
              value={confirmedToday.length}
              subtitle="Ready for doctor"
              icon={<CheckCircle2 className="w-4 h-4 text-[#059669]" />}
              iconBg="bg-[#dcfce7] text-[#059669]"
              onClick={() => setTab("today")}
            />
            <KpiCard
              title="Completed"
              value={completedToday.length}
              subtitle="Visits finished"
              icon={<Check className="w-4 h-4 text-[#4f46e5]" />}
              iconBg="bg-[#ede9fe] text-[#4f46e5]"
            />
            <KpiCard
              title="Cancelled"
              value={cancelledToday.length}
              subtitle="Cancelled today"
              icon={<X className="w-4 h-4 text-[#64748b]" />}
              iconBg="bg-[#f1f5f9] text-[#64748b]"
            />
            <KpiCard
              title="Walk-Ins"
              value={todayAppointments.filter((a) => a.source === "FRONT_DESK").length}
              subtitle="Desk registrations"
              icon={<UserCheck className="w-4 h-4 text-[#0057b8]" />}
              onClick={() => setTab("walk-ins")}
            />
            <KpiCard
              title="Reschedules"
              value={rescheduleRequests.length}
              subtitle="Change requests"
              icon={<RefreshCw className="w-4 h-4 text-[#d97706]" />}
              iconBg="bg-[#fef3c7] text-[#d97706]"
              onClick={() => setTab("rescheduling")}
            />
          </div>

          {/* Actionable Insights for Reception */}
          <ActionableInsightsSection
            insights={insights.filter(
              (i) => i.category === "APPOINTMENTS" || i.category === "SCHEDULE"
            )}
            onActionClick={(tab) => setTab(tab as ReceptionistTab)}
            title="Front Desk Action Items"
            subtitle="Immediate verification tasks, pending phone call verifications, and chamber alerts"
          />

          {/* Quick Action Shortcuts */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white rounded-2xl border border-[#d6d6d6] p-5 space-y-3">
              <h3 className="font-bold text-sm text-[#080808] flex items-center justify-between">
                <span>Fast Patient Intake</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#f0f7ff] text-[#0057b8]">
                  Desk Actions
                </span>
              </h3>
              <p className="text-xs text-[#686868]">
                Instantly book an outpatient appointment or register a walk-in patient standing at the reception desk.
              </p>
              <div className="flex flex-wrap gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setTab("new-booking")}
                  className="mc-btn-primary !py-1.5 !px-3 text-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Book New Appointment</span>
                </button>
                <button
                  type="button"
                  onClick={() => setTab("walk-ins")}
                  className="mc-btn-secondary !py-1.5 !px-3 text-xs"
                >
                  <UserCheck className="w-3.5 h-3.5" />
                  <span>Register Walk-In</span>
                </button>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-[#d6d6d6] p-5 space-y-3">
              <h3 className="font-bold text-sm text-[#080808]">Appointment Reference Lookup</h3>
              <p className="text-xs text-[#686868]">
                Type reference code (e.g. <strong>DC-2026-1041</strong>) or phone number to verify patient details.
              </p>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Enter DC reference or mobile..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1 px-3 py-1.5 rounded-lg border border-[#949494] text-xs focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setTab("today")}
                  className="mc-btn-secondary !py-1.5 !px-3 text-xs"
                >
                  Search Queue
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ====================================================================
          TAB 2: APPOINTMENT REQUESTS INBOX (Section 6 Specification)
         ==================================================================== */}
      {activeTab === "requests" && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-[#d6d6d6] p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="mc-serif text-xl text-[#080808]">Appointment Requests Inbox</h3>
                <p className="text-xs text-[#686868]">
                  Website bookings awaiting front-desk verification and chamber slot confirmation.
                </p>
              </div>

              <span className="text-xs font-bold text-[#0057b8] bg-[#f0f7ff] px-3 py-1 rounded-full border border-[#0057b8]/20">
                {pendingRequests.length} Pending Verification
              </span>
            </div>

            {pendingRequests.length === 0 ? (
              <div className="p-8 text-center rounded-xl bg-[#f8fafc] border border-dashed border-[#d6d6d6] text-xs text-[#686868] space-y-1">
                <CheckCircle2 className="w-8 h-8 text-[#059669] mx-auto mb-2" />
                <p className="font-bold text-sm text-[#080808]">Inbox Zero! All Requests Verified.</p>
                <p>New website appointment bookings will appear here instantly for phone verification.</p>
              </div>
            ) : (
              <div className="divide-y divide-[#ededed]">
                {pendingRequests.map((req) => {
                  const doc = doctors.find((d) => d.id === req.doctorId);
                  const dept = departments.find((d) => d.id === req.departmentId);
                  return (
                    <div
                      key={req.id}
                      className="py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-[#f8fafc] p-3 rounded-xl transition-colors"
                    >
                      <div className="space-y-1.5 text-xs">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-sm text-[#0057b8]">
                            {req.reference}
                          </span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#fee2e2] text-[#991b1b]">
                            {req.status}
                          </span>
                          <span className="text-[11px] text-[#686868]">
                            Logged: {new Date(req.createdAt).toLocaleTimeString()}
                          </span>
                        </div>

                        <p className="font-bold text-sm text-[#080808]">
                          {req.patientName} •{" "}
                          <button
                            type="button"
                            onClick={() => copyToClipboard(req.patientPhone)}
                            className="font-mono text-[#0057b8] hover:underline inline-flex items-center gap-1"
                          >
                            <Phone className="w-3 h-3" />
                            <span>{req.patientPhone}</span>
                            {copiedPhone === req.patientPhone && (
                              <span className="text-[10px] text-[#059669] font-bold">(Copied)</span>
                            )}
                          </button>
                        </p>

                        <p className="text-[#484848]">
                          Doctor: <strong>{doc?.nameEn}</strong> ({dept?.nameEn})
                        </p>

                        <p className="text-[#686868] font-mono">
                          Requested Chamber Date: <strong>{req.preferredDate}</strong> at{" "}
                          <strong>{req.preferredTimeSlot}</strong>
                        </p>

                        {req.reasonNote && (
                          <p className="text-[11px] text-[#595959] italic bg-white p-2 rounded border border-[#ededed]">
                            Patient Note: &quot;{req.reasonNote}&quot;
                          </p>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            onTransitionAppointment(
                              req.id,
                              "CONFIRMED",
                              "Phone verified and slot assigned by Front Desk"
                            )
                          }
                          className="px-3.5 py-1.5 rounded-lg bg-[#059669] text-white font-bold text-xs hover:bg-[#047857] shadow-xs flex items-center gap-1"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Confirm Slot</span>
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            onTransitionAppointment(
                              req.id,
                              "CANCELLED",
                              "Cancelled at intake verification by patient request"
                            )
                          }
                          className="px-3 py-1.5 rounded-lg border border-[#dc2626] text-[#dc2626] font-bold text-xs hover:bg-[#fee2e2]"
                        >
                          Reject / Cancel
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ====================================================================
          TAB 3: TODAY'S QUEUE (Section 6 Specification)
         ==================================================================== */}
      {activeTab === "today" && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-[#d6d6d6] p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="mc-serif text-xl text-[#080808]">Today&apos;s Front Desk Queue</h3>
                <p className="text-xs text-[#686868]">
                  Date: <strong>{todayDateStr}</strong> • Check-in arrivals, chamber room calls, and visit completions.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <input
                  type="text"
                  placeholder="Filter queue by patient, ref..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="px-3 py-1.5 rounded-lg border border-[#949494] text-xs"
                />

                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-1.5 rounded-lg border border-[#949494] text-xs"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="REQUESTED">REQUESTED</option>
                  <option value="CONFIRMED">CONFIRMED</option>
                  <option value="COMPLETED">COMPLETED</option>
                  <option value="CANCELLED">CANCELLED</option>
                </select>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[#ededed] bg-[#f8fafc] text-[#595959] uppercase tracking-wider text-[11px]">
                    <th className="py-3 px-4 font-bold">Slot Time</th>
                    <th className="py-3 px-4 font-bold">Reference</th>
                    <th className="py-3 px-4 font-bold">Patient &amp; Contact</th>
                    <th className="py-3 px-4 font-bold">Specialist &amp; Chamber</th>
                    <th className="py-3 px-4 font-bold">Status</th>
                    <th className="py-3 px-4 font-bold text-right">Queue Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#ededed]">
                  {todayAppointments.map((apt) => {
                    const doc = doctors.find((d) => d.id === apt.doctorId);
                    const branchAssign = doc?.branches.find((b) => b.branchId === apt.branchId);
                    return (
                      <tr key={apt.id} className="hover:bg-[#f8fafc]">
                        <td className="py-3 px-4 font-mono font-extrabold text-sm text-[#0057b8]">
                          {apt.preferredTimeSlot}
                        </td>
                        <td className="py-3 px-4 font-mono font-bold text-[#080808]">
                          {apt.reference}
                        </td>
                        <td className="py-3 px-4">
                          <p className="font-bold text-[#080808]">{apt.patientName}</p>
                          <p className="text-[11px] text-[#686868] font-mono">{apt.patientPhone}</p>
                        </td>
                        <td className="py-3 px-4">
                          <p className="font-semibold text-[#080808]">{doc?.nameEn}</p>
                          <p className="text-[11px] text-[#686868]">
                            Chamber: {branchAssign?.roomNumber || "Desk"}
                          </p>
                        </td>
                        <td className="py-3 px-4">
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
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {apt.status === "REQUESTED" && (
                              <button
                                type="button"
                                onClick={() =>
                                  onTransitionAppointment(
                                    apt.id,
                                    "CONFIRMED",
                                    "Confirmed at front desk check-in"
                                  )
                                }
                                className="px-2.5 py-1 rounded bg-[#059669] text-white font-bold text-[11px] hover:bg-[#047857]"
                              >
                                Check In
                              </button>
                            )}

                            {apt.status === "CONFIRMED" && (
                              <button
                                type="button"
                                onClick={() =>
                                  onTransitionAppointment(
                                    apt.id,
                                    "COMPLETED",
                                    "Patient visit completed in chamber"
                                  )
                                }
                                className="px-2.5 py-1 rounded bg-[#4f46e5] text-white font-bold text-[11px] hover:bg-[#4338ca]"
                              >
                                Mark Completed
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() =>
                                onTransitionAppointment(
                                  apt.id,
                                  "NO_SHOW",
                                  "Patient failed to arrive at chamber slot"
                                )
                              }
                              className="px-2 py-1 rounded border border-[#949494] text-[#686868] font-bold text-[11px] hover:bg-[#fee2e2] hover:text-[#dc2626]"
                            >
                              No-Show
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
          TAB 4: CALENDAR (Section 6 Specification)
         ==================================================================== */}
      {activeTab === "calendar" && (
        <div className="bg-white rounded-2xl border border-[#d6d6d6] p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="mc-serif text-xl text-[#080808]">Front Desk Daily Calendar</h3>
              <p className="text-xs text-[#686868]">Schedule timeline view for today ({todayDateStr}).</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
            {todayAppointments.map((apt) => {
              const doc = doctors.find((d) => d.id === apt.doctorId);
              return (
                <div
                  key={apt.id}
                  className="p-3.5 rounded-xl border border-[#ededed] bg-[#f8fafc] space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-sm text-[#0057b8]">
                      {apt.preferredTimeSlot}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#dcfce7] text-[#15803d]">
                      {apt.status}
                    </span>
                  </div>
                  <p className="font-bold text-[#080808]">{apt.patientName}</p>
                  <p className="text-[#686868] text-[11px]">Doctor: {doc?.nameEn}</p>
                  <p className="text-[10px] text-[#949494] font-mono">Ref: {apt.reference}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ====================================================================
          TAB 5: NEW APPOINTMENT STEPPER & TAB 6: WALK-INS (Section 6 Specification)
         ==================================================================== */}
      {(activeTab === "new-booking" || activeTab === "walk-ins") && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-[#d6d6d6] p-6 space-y-6">
            <div>
              <h3 className="mc-serif text-xl text-[#080808]">
                {activeTab === "walk-ins" ? "Fast Walk-In Desk Registration" : "Front-Desk Appointment Booking"}
              </h3>
              <p className="text-xs text-[#686868]">
                Transactional slot reservation with live capacity checks and instant booking reference issuance.
              </p>
            </div>

            {bookingSuccessApt ? (
              <div className="p-6 rounded-2xl border border-[#059669] bg-[#ecfdf5] space-y-3 text-xs">
                <div className="flex items-center gap-2 text-[#065f46] font-bold text-sm">
                  <CheckCircle2 className="w-5 h-5 text-[#059669]" />
                  <span>Appointment Booked &amp; Confirmed Successfully!</span>
                </div>
                <div className="p-4 rounded-xl bg-white border border-[#a7f3d0] space-y-1.5">
                  <p className="font-mono font-extrabold text-lg text-[#0057b8]">
                    Tracking Reference: {bookingSuccessApt.reference}
                  </p>
                  <p className="text-sm font-bold text-[#080808]">
                    Patient: {bookingSuccessApt.patientName} ({bookingSuccessApt.patientPhone})
                  </p>
                  <p className="text-xs text-[#484848]">
                    Date: <strong>{bookingSuccessApt.preferredDate}</strong> at{" "}
                    <strong>{bookingSuccessApt.preferredTimeSlot}</strong>
                  </p>
                  <p className="text-[11px] text-[#059669] font-semibold">
                    ✓ SMS confirmation dispatched to recipient mobile.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setBookingSuccessApt(null)}
                  className="mc-btn-primary text-xs"
                >
                  Book Another Patient
                </button>
              </div>
            ) : (
              <form onSubmit={handleBookingSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                {bookingError && (
                  <div className="md:col-span-2 p-3 rounded-xl bg-[#fee2e2] text-[#991b1b] border border-[#fecaca] font-semibold">
                    {bookingError}
                  </div>
                )}

                <div className="space-y-1">
                  <label className="font-bold text-[#080808]">Patient Full Name *</label>
                  <input
                    type="text"
                    required
                    value={bookingPatientName}
                    onChange={(e) => setBookingPatientName(e.target.value)}
                    placeholder="e.g. Mohammad Rafiq"
                    className="w-full px-3 py-2 rounded-xl border border-[#949494]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-[#080808]">Mobile Phone (Bangladesh) *</label>
                  <input
                    type="text"
                    required
                    value={bookingPatientPhone}
                    onChange={(e) => setBookingPatientPhone(e.target.value)}
                    placeholder="e.g. 01711223344"
                    className="w-full px-3 py-2 rounded-xl border border-[#949494] font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-[#080808]">Clinical Department *</label>
                  <select
                    value={bookingDeptId}
                    onChange={(e) => setBookingDeptId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-[#949494]"
                  >
                    {departments.map((dept) => (
                      <option key={dept.id} value={dept.id}>
                        {dept.nameEn}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-[#080808]">Specialist Doctor *</label>
                  <select
                    value={bookingDocId}
                    onChange={(e) => setBookingDocId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-[#949494]"
                  >
                    {deptDoctors.map((doc) => (
                      <option key={doc.id} value={doc.id}>
                        {doc.nameEn} (Fee: ৳{doc.consultationFeeBdt})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-[#080808]">Preferred Date *</label>
                  <input
                    type="date"
                    required
                    value={bookingDate}
                    onChange={(e) => setBookingDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-[#949494] font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-[#080808]">
                    Available Consultation Time Slot *{" "}
                    {slotsLoading && <span className="text-[#0057b8]">(Checking...)</span>}
                  </label>
                  {availableSlots.length === 0 ? (
                    <div className="p-2 rounded-xl border border-[#ededed] bg-[#f8fafc] text-[#686868] text-xs">
                      {slotsLoading ? "Loading real-time availability..." : "No open chamber slots on this date."}
                    </div>
                  ) : (
                    <select
                      value={bookingSlot}
                      onChange={(e) => setBookingSlot(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-[#949494] font-mono"
                    >
                      {availableSlots.map((slot) => (
                        <option key={slot} value={slot}>
                          {slot} (Chamber Open)
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-[#080808]">Visit Classification</label>
                  <select
                    value={bookingVisitType}
                    onChange={(e) => setBookingVisitType(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-[#949494]"
                  >
                    <option value="NEW_CONSULTATION">New Consultation</option>
                    <option value="FOLLOW_UP">Follow-Up Consultation</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-[#080808]">Optional Intake Note</label>
                  <input
                    type="text"
                    value={bookingReason}
                    onChange={(e) => setBookingReason(e.target.value)}
                    placeholder="Chief complaint or referral note..."
                    className="w-full px-3 py-2 rounded-xl border border-[#949494]"
                  />
                </div>

                <div className="md:col-span-2 pt-2 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setTab("today")}
                    className="mc-btn-secondary text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={bookingLoading || availableSlots.length === 0}
                    className="mc-btn-primary text-xs"
                  >
                    {bookingLoading ? "Reserving Slot..." : "Confirm & Issue Reference"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ====================================================================
          TAB 7: PATIENT DIRECTORY (Section 6 Specification)
         ==================================================================== */}
      {activeTab === "patients" && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-[#d6d6d6] p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="mc-serif text-xl text-[#080808]">Front Desk Patient Lookup</h3>
                <p className="text-xs text-[#686868]">
                  Phone and identity directory strictly limited to appointment intake coordinates (Zero clinical notes).
                </p>
              </div>

              <input
                type="text"
                placeholder="Search patient by name or phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="px-3.5 py-1.5 rounded-lg border border-[#949494] text-xs"
              />
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[#ededed] bg-[#f8fafc] text-[#595959] uppercase tracking-wider text-[11px]">
                    <th className="py-3 px-4 font-bold">Patient Name</th>
                    <th className="py-3 px-4 font-bold">Phone Number</th>
                    <th className="py-3 px-4 font-bold">Total Bookings</th>
                    <th className="py-3 px-4 font-bold">Last Visit Date</th>
                    <th className="py-3 px-4 font-bold text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#ededed]">
                  {patientList.map((p) => (
                    <tr key={p.phone} className="hover:bg-[#f8fafc]">
                      <td className="py-3 px-4 font-bold text-[#080808]">{p.name}</td>
                      <td className="py-3 px-4 font-mono text-[#0057b8]">{p.phone}</td>
                      <td className="py-3 px-4 font-bold">{p.visits}</td>
                      <td className="py-3 px-4 text-[#686868]">{p.lastDate}</td>
                      <td className="py-3 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => {
                            setBookingPatientName(p.name);
                            setBookingPatientPhone(p.phone);
                            setTab("new-booking");
                          }}
                          className="text-xs font-bold text-[#0057b8] hover:underline"
                        >
                          Book Again →
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ====================================================================
          TAB 8: RESCHEDULING & TAB 9: CANCELLATIONS (Section 6 Specification)
         ==================================================================== */}
      {(activeTab === "rescheduling" || activeTab === "cancellations") && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-[#d6d6d6] p-6 space-y-4">
            <h3 className="mc-serif text-xl text-[#080808]">
              {activeTab === "rescheduling" ? "Reschedule Requests Queue" : "Appointment Cancellation Log"}
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[#ededed] bg-[#f8fafc] text-[#595959] uppercase tracking-wider text-[11px]">
                    <th className="py-3 px-4 font-bold">Reference</th>
                    <th className="py-3 px-4 font-bold">Patient</th>
                    <th className="py-3 px-4 font-bold">Doctor</th>
                    <th className="py-3 px-4 font-bold">Date &amp; Slot</th>
                    <th className="py-3 px-4 font-bold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#ededed]">
                  {appointments
                    .filter((a) =>
                      activeTab === "rescheduling"
                        ? a.status === "RESCHEDULE_REQUESTED"
                        : a.status === "CANCELLED"
                    )
                    .map((a) => (
                      <tr key={a.id} className="hover:bg-[#f8fafc]">
                        <td className="py-3 px-4 font-mono font-bold text-[#0057b8]">{a.reference}</td>
                        <td className="py-3 px-4 font-bold">{a.patientName}</td>
                        <td className="py-3 px-4 text-[#484848]">{a.doctorId}</td>
                        <td className="py-3 px-4 font-mono">{a.preferredDate} at {a.preferredTimeSlot}</td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#f1f5f9] text-[#475569]">
                            {a.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ====================================================================
          TAB 10: DAILY REPORTS & TAB 11: PROFILE (Section 6 Specification)
         ==================================================================== */}
      {activeTab === "reports" && (
        <div className="bg-white rounded-2xl border border-[#d6d6d6] p-6 space-y-4">
          <h3 className="mc-serif text-xl text-[#080808]">Front Desk Daily Summary Report</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
            <div className="p-4 rounded-xl border border-[#ededed] bg-[#f8fafc] space-y-1">
              <span className="text-[#686868]">Total Check-Ins Processed</span>
              <p className="text-xl font-bold text-[#080808]">{confirmedToday.length + completedToday.length}</p>
            </div>
            <div className="p-4 rounded-xl border border-[#ededed] bg-[#f8fafc] space-y-1">
              <span className="text-[#686868]">Walk-In Desk Registrations</span>
              <p className="text-xl font-bold text-[#0057b8]">
                {todayAppointments.filter((a) => a.source === "FRONT_DESK").length}
              </p>
            </div>
            <div className="p-4 rounded-xl border border-[#ededed] bg-[#f8fafc] space-y-1">
              <span className="text-[#686868]">Estimated Fees Collected</span>
              <p className="text-xl font-bold text-[#059669]">
                ৳{(completedToday.length * 1500).toLocaleString()}
              </p>
            </div>
            <div className="p-4 rounded-xl border border-[#ededed] bg-[#f8fafc] space-y-1">
              <span className="text-[#686868]">No-Show Registrations</span>
              <p className="text-xl font-bold text-[#dc2626]">
                {todayAppointments.filter((a) => a.status === "NO_SHOW").length}
              </p>
            </div>
          </div>
        </div>
      )}

      {activeTab === "my-profile" && (
        <div className="bg-white rounded-2xl border border-[#d6d6d6] p-6 space-y-4">
          <h3 className="mc-serif text-xl text-[#080808]">Reception Staff Station</h3>
          <div className="p-4 rounded-xl border border-[#ededed] bg-[#f8fafc] space-y-2 text-xs">
            <p>Staff Name: <strong>{currentUser.fullName}</strong></p>
            <p>Role: <strong className="font-mono text-[#0057b8]">RECEPTIONIST (Front Desk)</strong></p>
            <p>Campus Desk: <strong>Dhanmondi Flagship Outpatient Reception</strong></p>
            <p className="text-[11px] text-[#059669] font-bold">
              ✓ Active authorization: Appointment booking, telephone verification, and chamber check-in.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
