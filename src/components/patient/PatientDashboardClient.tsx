"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Calendar,
  CheckCircle2,
  Clock,
  User,
  ArrowRight,
  ShieldCheck,
  Search,
  Plus,
  RefreshCw,
  Phone,
  Mail,
  MapPin,
  Bot,
  HelpCircle,
  Bell,
  Sliders,
  X,
  FileText,
  Copy,
  Check,
  CalendarDays,
  Sparkles,
  ExternalLink,
  ChevronRight,
  AlertCircle,
} from "lucide-react";
import {
  Appointment,
  Branch,
  Department,
  Doctor,
  NotificationRecord,
} from "@/types/domain";
import { DeltaCareAssistantWidget } from "@/components/assistant/DeltaCareAssistantWidget";

export type PatientTab =
  | "overview"
  | "book"
  | "appointments"
  | "history"
  | "track"
  | "profile"
  | "notifications"
  | "help"
  | "assistant"
  | "settings";

interface PatientDashboardClientProps {
  currentUser: {
    userId: string;
    fullName: string;
    email: string;
    phone?: string;
    role: string;
  };
  initialAppointments: Appointment[];
  doctors: Doctor[];
  departments: Department[];
  branches: Branch[];
  notifications?: NotificationRecord[];
  isStaff?: boolean;
}

export function PatientDashboardClient({
  currentUser,
  initialAppointments,
  doctors,
  departments,
  branches,
  notifications = [],
  isStaff = false,
}: PatientDashboardClientProps) {
  const [appointments, setAppointments] = useState<Appointment[]>(initialAppointments);
  const [activeTab, setActiveTab] = useState<PatientTab>("overview");
  const [locale, setLocale] = useState<"en" | "bn">("en");

  // Track reference search
  const [trackRefInput, setTrackRefInput] = useState("");
  const [trackedAppointment, setTrackedAppointment] = useState<Appointment | null>(null);

  // Reschedule / Cancel Modal State
  const [modalAction, setModalAction] = useState<"RESCHEDULE" | "CANCEL" | null>(null);
  const [selectedAptForAction, setSelectedAptForAction] = useState<Appointment | null>(null);
  const [actionReason, setActionReason] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // New Booking State
  const todayDateStr = new Date().toISOString().split("T")[0];
  const [bookDeptId, setBookDeptId] = useState(departments[0]?.id || "");
  const [bookDocId, setBookDocId] = useState("");
  const [bookBranchId, setBookBranchId] = useState(branches[0]?.id || "");
  const [bookDate, setBookDate] = useState(todayDateStr);
  const [bookSlot, setBookSlot] = useState("");
  const [bookReason, setBookReason] = useState("");
  const [bookVisitType, setBookVisitType] = useState<"NEW_CONSULTATION" | "FOLLOW_UP">("NEW_CONSULTATION");
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState<Appointment | null>(null);
  const [bookingError, setBookingError] = useState<string | null>(null);

  // Filter doctors for selected department
  const deptDoctors = doctors.filter(
    (d) => d.departmentId === bookDeptId && d.publicationState === "PUBLISHED"
  );

  useEffect(() => {
    if (deptDoctors.length > 0 && (!bookDocId || !deptDoctors.some((d) => d.id === bookDocId))) {
      setBookDocId(deptDoctors[0].id);
    }
  }, [bookDeptId, deptDoctors, bookDocId]);

  // Fetch slots
  useEffect(() => {
    if (!bookDocId || !bookBranchId || !bookDate) {
      setAvailableSlots([]);
      return;
    }

    let active = true;
    setSlotsLoading(true);

    fetch(
      `/api/v1/public/availability?doctorId=${encodeURIComponent(
        bookDocId
      )}&branchId=${encodeURIComponent(bookBranchId)}&date=${encodeURIComponent(bookDate)}`
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
          if (open.length > 0 && !open.includes(bookSlot)) {
            setBookSlot(open[0]);
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
  }, [bookDocId, bookBranchId, bookDate]);

  // Upcoming appointment (first future or today's confirmed/requested)
  const activeBookings = appointments.filter(
    (a) => a.status === "CONFIRMED" || a.status === "REQUESTED" || a.status === "PENDING_CONFIRMATION"
  );
  const pastBookings = appointments.filter(
    (a) => a.status === "COMPLETED" || a.status === "CANCELLED" || a.status === "NO_SHOW"
  );
  const nextUpcoming = activeBookings[0] || null;

  // Handle Booking Submit
  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBookingLoading(true);
    setBookingError(null);
    setBookingSuccess(null);

    try {
      const res = await fetch("/api/v1/public/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          departmentId: bookDeptId,
          doctorId: bookDocId,
          branchId: bookBranchId,
          preferredDate: bookDate,
          preferredTimeSlot: bookSlot,
          patientName: currentUser.fullName,
          patientPhone: currentUser.phone || "01711223344",
          patientEmail: currentUser.email,
          reasonNote: bookReason || "Patient self-service portal request",
          visitType: bookVisitType,
          consentAccepted: true,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        setBookingError(data.error || "Failed to submit appointment request.");
        return;
      }

      setBookingSuccess(data.appointment);
      setAppointments((prev) => [data.appointment, ...prev]);
      setStatusMessage(`Appointment request ${data.appointment.reference} created successfully.`);
      setTimeout(() => setStatusMessage(null), 5000);
    } catch {
      setBookingError("Network error while submitting appointment.");
    } finally {
      setBookingLoading(false);
    }
  };

  // Handle Reschedule or Cancel Request
  const handleModalActionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAptForAction || !modalAction) return;

    setActionLoading(true);
    const targetStatus = modalAction === "CANCEL" ? "CANCELLED" : "RESCHEDULE_REQUESTED";

    try {
      const res = await fetch("/api/v1/admin/appointments", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          appointmentId: selectedAptForAction.id,
          toStatus: targetStatus,
          reason: actionReason || `Patient requested ${modalAction.toLowerCase()}`,
        }),
      });

      const data = await res.json();
      if (res.ok && data.ok) {
        setAppointments((prev) =>
          prev.map((a) => (a.id === selectedAptForAction.id ? data.appointment : a))
        );
        setStatusMessage(`Appointment marked as ${targetStatus}.`);
        setModalAction(null);
        setSelectedAptForAction(null);
        setActionReason("");
        setTimeout(() => setStatusMessage(null), 5000);
      } else {
        alert(data.error || "Failed to process request.");
      }
    } catch {
      alert("Network error processing request.");
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Track Lookup
  const handleTrackLookup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackRefInput) return;
    const found = appointments.find(
      (a) =>
        a.reference.toLowerCase() === trackRefInput.trim().toLowerCase() ||
        a.id === trackRefInput.trim()
    );
    if (found) {
      setTrackedAppointment(found);
    } else {
      alert("Appointment reference not found in your account records.");
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {statusMessage && (
        <div className="p-4 rounded-xl bg-[#ecfdf5] border border-[#a7f3d0] text-[#065f46] text-xs font-bold flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#059669]" />
            <span>{statusMessage}</span>
          </div>
          <button type="button" onClick={() => setStatusMessage(null)}>
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ====================================================================
          PATIENT PORTAL WELCOME HERO
         ==================================================================== */}
      <div className="bg-[#012d61] text-white rounded-3xl p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-sm">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-widest text-[#c5e2f9] bg-white/10 px-2.5 py-0.5 rounded-full">
              DeltaCare Patient Self-Service Portal
            </span>
            <button
              type="button"
              onClick={() => setLocale(locale === "en" ? "bn" : "en")}
              className="text-[10px] font-bold text-white/80 hover:text-white px-2 py-0.5 rounded border border-white/20"
            >
              {locale === "en" ? "বাংলা" : "English"}
            </button>
          </div>
          <h1 className="mc-serif text-2xl md:text-3xl text-white">
            {locale === "en" ? `Welcome back, ${currentUser.fullName}` : `স্বাগতম, ${currentUser.fullName}`}
          </h1>
          <p className="text-xs md:text-sm text-[#e8f0f9]">
            {currentUser.email} • {currentUser.phone || "Registered Patient"}
          </p>
        </div>

        <div className="flex flex-wrap gap-2.5">
          {isStaff && (
            <Link href="/admin" className="mc-btn-secondary-inverse text-xs">
              <span>Admin Console</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          )}
          <button
            type="button"
            onClick={() => setActiveTab("book")}
            className="mc-btn-primary text-xs shadow-xs"
          >
            <Calendar className="w-4 h-4" />
            <span>Request Appointment</span>
          </button>
        </div>
      </div>

      {/* ====================================================================
          SUB-NAVIGATION TABS (Section 8 Specification)
         ==================================================================== */}
      <div className="flex items-center gap-1.5 border-b border-[#d6d6d6] pb-3 overflow-x-auto">
        {[
          { tab: "overview", label: "Overview", icon: <Calendar className="w-3.5 h-3.5" /> },
          { tab: "book", label: "Book Appointment", icon: <Plus className="w-3.5 h-3.5" /> },
          {
            tab: "appointments",
            label: `My Appointments (${activeBookings.length})`,
            icon: <Clock className="w-3.5 h-3.5" />,
          },
          { tab: "history", label: "Appointment History", icon: <CalendarDays className="w-3.5 h-3.5" /> },
          { tab: "track", label: "Track Reference", icon: <Search className="w-3.5 h-3.5" /> },
          { tab: "profile", label: "My Profile", icon: <User className="w-3.5 h-3.5" /> },
          { tab: "notifications", label: "Notifications", icon: <Bell className="w-3.5 h-3.5" /> },
          { tab: "help", label: "Help & Support", icon: <HelpCircle className="w-3.5 h-3.5" /> },
          { tab: "assistant", label: "DeltaCare Assistant", icon: <Bot className="w-3.5 h-3.5" /> },
          { tab: "settings", label: "Account Settings", icon: <Sliders className="w-3.5 h-3.5" /> },
        ].map((item) => (
          <button
            key={item.tab}
            type="button"
            onClick={() => setActiveTab(item.tab as PatientTab)}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === item.tab
                ? "bg-[#0057b8] text-white shadow-xs"
                : "text-[#484848] hover:bg-[#e2e8f0]"
            }`}
          >
            {item.icon}
            <span>{item.label}</span>
          </button>
        ))}
      </div>

      {/* ====================================================================
          TAB 1: PATIENT OVERVIEW
         ==================================================================== */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          {/* Next Upcoming Appointment Highlight Hero Card */}
          {nextUpcoming ? (
            <div className="bg-white rounded-2xl border-2 border-[#0057b8] p-6 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#ededed] pb-4">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#0057b8] bg-[#f0f7ff] px-2.5 py-0.5 rounded-md">
                    Next Upcoming Consultation
                  </span>
                  <div className="flex items-center gap-2">
                    <h2 className="mc-serif text-xl md:text-2xl text-[#080808]">
                      {doctors.find((d) => d.id === nextUpcoming.doctorId)?.nameEn || nextUpcoming.doctorId}
                    </h2>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                        nextUpcoming.status === "CONFIRMED"
                          ? "bg-[#dcfce7] text-[#15803d]"
                          : "bg-[#fef3c7] text-[#92400e]"
                      }`}
                    >
                      {nextUpcoming.status}
                    </span>
                  </div>
                  <p className="text-xs text-[#686868]">
                    {departments.find((d) => d.id === nextUpcoming.departmentId)?.nameEn} • Reference:{" "}
                    <strong className="font-mono text-[#0057b8]">{nextUpcoming.reference}</strong>
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedAptForAction(nextUpcoming);
                      setModalAction("RESCHEDULE");
                    }}
                    className="mc-btn-secondary !py-1.5 !px-3 text-xs"
                  >
                    Reschedule
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedAptForAction(nextUpcoming);
                      setModalAction("CANCEL");
                    }}
                    className="px-3 py-1.5 rounded-xl border border-[#dc2626] text-[#dc2626] font-bold text-xs hover:bg-[#fee2e2]"
                  >
                    Cancel
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div className="p-3.5 rounded-xl bg-[#f8fafc] border border-[#ededed] space-y-1">
                  <span className="text-[#686868] flex items-center gap-1.5 font-medium">
                    <Calendar className="w-3.5 h-3.5 text-[#0057b8]" />
                    <span>Scheduled Date</span>
                  </span>
                  <p className="font-extrabold text-sm text-[#080808] font-mono">
                    {nextUpcoming.preferredDate}
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-[#f8fafc] border border-[#ededed] space-y-1">
                  <span className="text-[#686868] flex items-center gap-1.5 font-medium">
                    <Clock className="w-3.5 h-3.5 text-[#0057b8]" />
                    <span>Time Slot</span>
                  </span>
                  <p className="font-extrabold text-sm text-[#080808] font-mono">
                    {nextUpcoming.preferredTimeSlot}
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-[#f8fafc] border border-[#ededed] space-y-1">
                  <span className="text-[#686868] flex items-center gap-1.5 font-medium">
                    <MapPin className="w-3.5 h-3.5 text-[#0057b8]" />
                    <span>Hospital Location</span>
                  </span>
                  <p className="font-bold text-xs text-[#080808]">
                    {branches.find((b) => b.id === nextUpcoming.branchId)?.nameEn || "Dhanmondi Flagship"}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-[#d6d6d6] p-8 text-center space-y-3">
              <Calendar className="w-10 h-10 text-[#0057b8] mx-auto opacity-70" />
              <h3 className="mc-serif text-xl text-[#080808]">No Active Upcoming Consultations</h3>
              <p className="text-xs text-[#686868] max-w-md mx-auto">
                You do not have any confirmed appointments right now. You can book an outpatient consultation with any specialist at DeltaCare.
              </p>
              <button
                type="button"
                onClick={() => setActiveTab("book")}
                className="mc-btn-primary text-xs"
              >
                Request an Appointment Now
              </button>
            </div>
          )}

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-2xl border border-[#d6d6d6] p-5 space-y-2">
              <h3 className="font-bold text-sm text-[#080808] flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#0057b8]" />
                <span>Active Bookings</span>
              </h3>
              <p className="text-2xl font-extrabold text-[#080808]">{activeBookings.length}</p>
              <p className="text-xs text-[#686868]">Provisional and confirmed chamber slots</p>
            </div>

            <div className="bg-white rounded-2xl border border-[#d6d6d6] p-5 space-y-2">
              <h3 className="font-bold text-sm text-[#080808] flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#059669]" />
                <span>Completed Visits</span>
              </h3>
              <p className="text-2xl font-extrabold text-[#080808]">{pastBookings.length}</p>
              <p className="text-xs text-[#686868]">Historical consultations at DeltaCare</p>
            </div>

            <div className="bg-white rounded-2xl border border-[#d6d6d6] p-5 space-y-2">
              <h3 className="font-bold text-sm text-[#080808] flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#4f46e5]" />
                <span>Patient Data Isolation</span>
              </h3>
              <p className="text-xs text-[#059669] font-bold">✓ Privacy Protected</p>
              <p className="text-xs text-[#686868]">Your account strictly isolates clinical records from unauthorized viewers.</p>
            </div>
          </div>
        </div>
      )}

      {/* ====================================================================
          TAB 2: BOOK APPOINTMENT
         ==================================================================== */}
      {activeTab === "book" && (
        <div className="bg-white rounded-2xl border border-[#d6d6d6] p-6 space-y-6">
          <div>
            <h3 className="mc-serif text-xl text-[#080808]">Request Outpatient Appointment</h3>
            <p className="text-xs text-[#686868]">
              Select department, specialist, date, and preferred chamber slot.
            </p>
          </div>

          {bookingSuccess ? (
            <div className="p-6 rounded-2xl border border-[#059669] bg-[#ecfdf5] space-y-3 text-xs">
              <div className="flex items-center gap-2 text-[#065f46] font-bold text-sm">
                <CheckCircle2 className="w-5 h-5 text-[#059669]" />
                <span>Appointment Request Logged Successfully!</span>
              </div>
              <p className="text-[#065f46]">
                Reference: <strong className="font-mono text-sm">{bookingSuccess.reference}</strong>. Our front desk will verify your slot within 4 hours.
              </p>
              <button
                type="button"
                onClick={() => setBookingSuccess(null)}
                className="mc-btn-primary text-xs"
              >
                Book Another Appointment
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
                <label className="font-bold text-[#080808]">Department *</label>
                <select
                  value={bookDeptId}
                  onChange={(e) => setBookDeptId(e.target.value)}
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
                  value={bookDocId}
                  onChange={(e) => setBookDocId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#949494]"
                >
                  {deptDoctors.map((doc) => (
                    <option key={doc.id} value={doc.id}>
                      {doc.nameEn} (Consultation Fee: ৳{doc.consultationFeeBdt})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-[#080808]">Preferred Date *</label>
                <input
                  type="date"
                  required
                  value={bookDate}
                  onChange={(e) => setBookDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#949494] font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-[#080808]">
                  Available Slot * {slotsLoading && <span className="text-[#0057b8]">(Checking...)</span>}
                </label>
                {availableSlots.length === 0 ? (
                  <div className="p-2 rounded-xl border border-[#ededed] bg-[#f8fafc] text-[#686868] text-xs">
                    {slotsLoading ? "Loading real-time availability..." : "No open chamber slots on this date."}
                  </div>
                ) : (
                  <select
                    value={bookSlot}
                    onChange={(e) => setBookSlot(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-[#949494] font-mono"
                  >
                    {availableSlots.map((slot) => (
                      <option key={slot} value={slot}>
                        {slot} (Chamber Available)
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div className="space-y-1">
                <label className="font-bold text-[#080808]">Visit Type</label>
                <select
                  value={bookVisitType}
                  onChange={(e) => setBookVisitType(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl border border-[#949494]"
                >
                  <option value="NEW_CONSULTATION">New Consultation</option>
                  <option value="FOLLOW_UP">Follow-Up Consultation</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-[#080808]">Brief Reason for Visit (Optional)</label>
                <input
                  type="text"
                  value={bookReason}
                  onChange={(e) => setBookReason(e.target.value)}
                  placeholder="e.g. Routine consultation, valve follow-up"
                  className="w-full px-3 py-2 rounded-xl border border-[#949494]"
                />
              </div>

              <div className="md:col-span-2 pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setActiveTab("overview")}
                  className="mc-btn-secondary text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={bookingLoading || availableSlots.length === 0}
                  className="mc-btn-primary text-xs"
                >
                  {bookingLoading ? "Submitting..." : "Submit Booking Request"}
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* ====================================================================
          TAB 3: MY APPOINTMENTS & TAB 4: HISTORY
         ==================================================================== */}
      {(activeTab === "appointments" || activeTab === "history") && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-[#d6d6d6] p-6 space-y-4">
            <h3 className="mc-serif text-xl text-[#080808]">
              {activeTab === "appointments" ? "Active Bookings & Requests" : "Past Appointment History"}
            </h3>

            {(activeTab === "appointments" ? activeBookings : pastBookings).length === 0 ? (
              <div className="p-8 text-center text-xs text-[#686868] border border-dashed border-[#d6d6d6] rounded-xl space-y-2">
                <p>No records found in this category.</p>
                {activeTab === "appointments" && (
                  <button
                    type="button"
                    onClick={() => setActiveTab("book")}
                    className="mc-btn-primary text-xs"
                  >
                    Request an Appointment
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {(activeTab === "appointments" ? activeBookings : pastBookings).map((apt) => {
                  const doc = doctors.find((d) => d.id === apt.doctorId);
                  const dept = departments.find((d) => d.id === apt.departmentId);
                  const branch = branches.find((b) => b.id === apt.branchId);

                  return (
                    <div
                      key={apt.id}
                      className="p-5 rounded-2xl border border-[#d6d6d6] hover:border-[#0057b8] transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
                    >
                      <div className="space-y-1.5 text-xs">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-sm text-[#0057b8]">
                            {apt.reference}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              apt.status === "CONFIRMED"
                                ? "bg-[#dcfce7] text-[#15803d]"
                                : apt.status === "COMPLETED"
                                ? "bg-[#ede9fe] text-[#6d28d9]"
                                : "bg-[#fef3c7] text-[#92400e]"
                            }`}
                          >
                            {apt.status}
                          </span>
                        </div>

                        <p className="font-bold text-base text-[#080808]">
                          {doc?.nameEn} ({dept?.nameEn})
                        </p>

                        <p className="text-[#686868]">
                          Branch: {branch?.nameEn} • Date:{" "}
                          <strong>{apt.preferredDate}</strong> at{" "}
                          <strong>{apt.preferredTimeSlot}</strong>
                        </p>
                      </div>

                      {activeTab === "appointments" && (
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedAptForAction(apt);
                              setModalAction("RESCHEDULE");
                            }}
                            className="mc-btn-secondary !py-1.5 !px-3 text-xs"
                          >
                            Reschedule
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedAptForAction(apt);
                              setModalAction("CANCEL");
                            }}
                            className="px-3 py-1.5 rounded-xl border border-[#dc2626] text-[#dc2626] font-bold text-xs hover:bg-[#fee2e2]"
                          >
                            Cancel
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ====================================================================
          TAB 5: TRACK APPOINTMENT
         ==================================================================== */}
      {activeTab === "track" && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-[#d6d6d6] p-6 space-y-5">
            <div>
              <h3 className="mc-serif text-xl text-[#080808]">Track Appointment by Reference</h3>
              <p className="text-xs text-[#686868]">
                Inspect real-time verification timeline and chamber readiness.
              </p>
            </div>

            <form onSubmit={handleTrackLookup} className="flex gap-2 max-w-md">
              <input
                type="text"
                required
                placeholder="e.g. DC-2026-1041"
                value={trackRefInput}
                onChange={(e) => setTrackRefInput(e.target.value)}
                className="flex-1 px-3 py-2 rounded-xl border border-[#949494] text-xs font-mono uppercase"
              />
              <button type="submit" className="mc-btn-primary text-xs">
                Track
              </button>
            </form>

            {trackedAppointment && (
              <div className="p-6 rounded-2xl border border-[#0057b8] bg-[#f0f7ff] space-y-4 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-mono font-extrabold text-base text-[#0057b8]">
                    {trackedAppointment.reference}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#0057b8] text-white">
                    {trackedAppointment.status}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-2">
                  {[
                    { step: 1, title: "Request Received", done: true },
                    {
                      step: 2,
                      title: "Desk Verified",
                      done: trackedAppointment.status !== "REQUESTED",
                    },
                    {
                      step: 3,
                      title: "Chamber Ready",
                      done: trackedAppointment.status === "CONFIRMED" || trackedAppointment.status === "COMPLETED",
                    },
                    {
                      step: 4,
                      title: "Visit Done",
                      done: trackedAppointment.status === "COMPLETED",
                    },
                  ].map((s) => (
                    <div
                      key={s.step}
                      className={`p-3 rounded-xl border ${
                        s.done
                          ? "bg-white border-[#059669] text-[#065f46]"
                          : "bg-white/60 border-[#d6d6d6] text-[#949494]"
                      } space-y-1 text-center`}
                    >
                      <p className="text-[10px] font-bold uppercase">Step {s.step}</p>
                      <p className="font-bold text-xs">{s.title}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ====================================================================
          TAB 6: PROFILE, 7: NOTIFICATIONS, 8: HELP, 9: ASSISTANT, 10: SETTINGS
         ==================================================================== */}
      {activeTab === "profile" && (
        <div className="bg-white rounded-2xl border border-[#d6d6d6] p-6 space-y-4 text-xs">
          <h3 className="mc-serif text-xl text-[#080808]">Patient Profile</h3>
          <div className="p-4 rounded-xl border border-[#ededed] bg-[#f8fafc] space-y-2">
            <p>Full Name: <strong>{currentUser.fullName}</strong></p>
            <p>Email: <strong>{currentUser.email}</strong></p>
            <p>Phone: <strong>{currentUser.phone || "01711223344"}</strong></p>
            <p>Account Role: <span className="font-mono text-[#0057b8]">PATIENT</span></p>
          </div>
        </div>
      )}

      {activeTab === "notifications" && (
        <div className="bg-white rounded-2xl border border-[#d6d6d6] p-6 space-y-4 text-xs">
          <h3 className="mc-serif text-xl text-[#080808]">SMS &amp; Email Notifications</h3>
          <div className="divide-y divide-[#ededed]">
            {notifications.slice(0, 10).map((n) => (
              <div key={n.id} className="py-3 flex items-center justify-between">
                <div>
                  <p className="font-bold text-[#080808]">{n.subject || n.templateCode}</p>
                  <p className="text-[#686868] text-[11px]">{n.bodyPreview}</p>
                </div>
                <span className="font-mono text-[10px] text-[#059669] font-bold">{n.status}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === "help" && (
        <div className="bg-white rounded-2xl border border-[#d6d6d6] p-6 space-y-4 text-xs">
          <h3 className="mc-serif text-xl text-[#080808]">Patient Relations &amp; Support</h3>
          <p className="text-[#686868]">
            Need assistance with your visit or have a question about chamber hours?
          </p>
          <div className="p-4 rounded-xl border border-[#ededed] bg-[#f8fafc] space-y-2">
            <p className="font-bold text-sm text-[#080808]">Central Outpatient Helpline</p>
            <p className="font-mono text-base font-extrabold text-[#0057b8]">10666</p>
            <p className="text-[#686868]">Available 8:00 AM – 10:00 PM (Every day)</p>
          </div>
        </div>
      )}

      {activeTab === "assistant" && (
        <div className="bg-white rounded-2xl border border-[#d6d6d6] p-6 space-y-4">
          <h3 className="mc-serif text-xl text-[#080808]">DeltaCare Grounded AI Assistant</h3>
          <p className="text-xs text-[#686868]">
            Ask questions about doctor schedules, departments, hospital fees, or branch locations.
          </p>
          <DeltaCareAssistantWidget />
        </div>
      )}

      {activeTab === "settings" && (
        <div className="bg-white rounded-2xl border border-[#d6d6d6] p-6 space-y-4 text-xs">
          <h3 className="mc-serif text-xl text-[#080808]">Account Settings &amp; Security</h3>
          <p className="text-[#686868]">Data minimization and session security safeguards.</p>
          <div className="p-4 rounded-xl border border-[#ededed] bg-[#f8fafc] space-y-2">
            <p className="font-bold text-[#059669]">✓ Password Hashed with Bcrypt</p>
            <p className="text-[11px] text-[#64748b]">
              Your account credentials are encrypted and never stored in plaintext.
            </p>
          </div>
        </div>
      )}

      {/* Reschedule / Cancel Modal */}
      {modalAction && selectedAptForAction && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#ededed] pb-3">
              <h4 className="font-bold text-base text-[#080808]">
                {modalAction === "CANCEL" ? "Cancel Appointment" : "Request Rescheduling"}
              </h4>
              <button
                type="button"
                onClick={() => setModalAction(null)}
                className="text-[#686868] hover:text-[#080808]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleModalActionSubmit} className="space-y-3.5 text-xs">
              <p className="text-[#484848]">
                Reference: <strong className="font-mono text-[#0057b8]">{selectedAptForAction.reference}</strong>
              </p>

              <div className="space-y-1">
                <label className="font-bold text-[#080808]">
                  Reason for {modalAction === "CANCEL" ? "Cancellation" : "Reschedule"} *
                </label>
                <textarea
                  required
                  rows={3}
                  value={actionReason}
                  onChange={(e) => setActionReason(e.target.value)}
                  placeholder="Please state the reason for this change..."
                  className="w-full px-3 py-2 rounded-xl border border-[#949494]"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalAction(null)}
                  className="mc-btn-secondary text-xs"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="mc-btn-primary text-xs"
                >
                  {actionLoading ? "Processing..." : "Confirm Request"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
