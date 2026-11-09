"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  Calendar,
  CheckCircle2,
  Clock,
  FileSpreadsheet,
  MessageSquare,
  PhoneCall,
  Plus,
  Printer,
  RefreshCw,
  Search,
  Send,
  ShieldAlert,
  SlidersHorizontal,
  Sparkles,
  UserPlus,
  X,
  XCircle,
} from "lucide-react";

interface SmsLogItem {
  id: string;
  appointmentId: string;
  recipientPhone: string;
  messageBody: string;
  eventType: "REQUEST_RECEIVED" | "CONFIRMED" | "RESCHEDULED" | "CANCELLED";
  provider: string;
  deliveryStatus: "SENT" | "SIMULATED" | "FAILED";
  sentAt: string;
}

interface EnrichedAppointment {
  id: string;
  reference: string;
  patientName: string;
  patientPhone: string;
  patientAge?: number;
  patientGender?: "MALE" | "FEMALE" | "OTHER";
  visitType?: string;
  bookingSource?: "ONLINE_WEBSITE" | "FRONT_DESK_PHONE" | "WALK_IN_DESK";
  departmentId: string;
  departmentNameEn: string;
  departmentNameBn: string;
  doctorId: string;
  doctorNameEn: string;
  doctorNameBn: string;
  doctorQualificationsEn: string;
  doctorDesignationEn: string;
  consultationFeeBdt: number;
  followupFeeBdt: number;
  branchId: string;
  branchNameEn: string;
  branchNameBn: string;
  chamberRoom: string;
  preferredDate: string;
  preferredTimeSlot: string;
  reason?: string;
  symptomsNote?: string;
  status:
    | "REQUESTED"
    | "CONFIRMED"
    | "RESCHEDULE_REQUESTED"
    | "CANCELLED"
    | "COMPLETED"
    | "NO_SHOW";
  createdAt: string;
  updatedAt: string;
  smsLogs: SmsLogItem[];
}

interface BranchOption {
  id: string;
  slug: string;
  nameEn: string;
  nameBn: string;
  city: string;
  addressEn: string;
  emergencyPhone: string;
}

interface DoctorOption {
  id: string;
  slug: string;
  nameEn: string;
  nameBn: string;
  departmentId: string;
  designationEn?: string;
  qualificationsEn?: string;
  workplaceEn?: string;
  bmdcNumber: string;
  consultationFeeBdt: number;
  followupFeeBdt?: number;
  branches: Array<{
    branchId: string;
    scheduleRules: Array<{
      id: string;
      weekday: number;
      startTime: string;
      endTime: string;
      slotDurationMinutes: number;
    }>;
  }>;
}

interface ChamberScheduleRule {
  id: string;
  doctorId: string;
  branchId: string;
  chamberRoom: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  breakStartTime?: string;
  breakEndTime?: string;
  slotDurationMinutes: number;
  isActive: boolean;
}

interface ScheduleOverrideItem {
  id: string;
  doctorId: string;
  branchId: string;
  date: string;
  overrideType: "FULL_DAY_LEAVE" | "CUSTOM_HOURS" | "BLOCKED_SLOTS";
  customStartTime?: string;
  customEndTime?: string;
  blockedSlots?: string[];
  reasonEn?: string;
  reasonBn?: string;
}

interface AvailabilitySlot {
  time: string;
  labelEn: string;
  labelBn: string;
  status: "AVAILABLE" | "BOOKED" | "BLOCKED" | "PAST";
}

interface AvailabilityResponse {
  doctorId: string;
  branchId: string;
  date: string;
  chamberRoom: string;
  consultationFeeBdt: number;
  followupFeeBdt: number;
  isAvailableDay: boolean;
  unavailableReasonEn?: string;
  unavailableReasonBn?: string;
  slots: AvailabilitySlot[];
}

const WEEKDAY_NAMES = [
  { day: 0, short: "Sun", full: "Sunday / রবিবার" },
  { day: 1, short: "Mon", full: "Monday / সোমবার" },
  { day: 2, short: "Tue", full: "Tuesday / মঙ্গলবার" },
  { day: 3, short: "Wed", full: "Wednesday / বুধবার" },
  { day: 4, short: "Thu", full: "Thursday / বৃহস্পতিবার" },
  { day: 5, short: "Fri", full: "Friday / শুক্রবার" },
  { day: 6, short: "Sat", full: "Saturday / শনিবার" },
];

function buildNext14Days(baseIso?: string): Array<{
  iso: string;
  dayName: string;
  dayNum: string;
  monthShort: string;
  weekday: number;
}> {
  const start = baseIso ? new Date(`${baseIso}T00:00:00+06:00`) : new Date();
  const list = [];
  for (let i = 0; i < 14; i++) {
    const d = new Date(start.getTime() + i * 86400000);
    const iso = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Dhaka",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(d);
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: "Asia/Dhaka",
      weekday: "short",
      day: "2-digit",
      month: "short",
    }).formatToParts(d);
    const dayName = parts.find((p) => p.type === "weekday")?.value ?? "";
    const dayNum = parts.find((p) => p.type === "day")?.value ?? "";
    const monthShort = parts.find((p) => p.type === "month")?.value ?? "";
    const weekdayMap: Record<string, number> = {
      Sun: 0,
      Mon: 1,
      Tue: 2,
      Wed: 3,
      Thu: 4,
      Fri: 5,
      Sat: 6,
    };
    list.push({
      iso,
      dayName,
      dayNum,
      monthShort,
      weekday: weekdayMap[dayName] ?? d.getDay(),
    });
  }
  return list;
}

export function FrontDeskScheduleManager({ embedded = false }: { embedded?: boolean }) {
  const [loading, setLoading] = useState(true);
  const [todayIso, setTodayIso] = useState<string>("2026-03-10");
  const [kpis, setKpis] = useState({
    todayTotal: 0,
    confirmedBookings: 0,
    pendingRequests: 0,
    cancelledOrBlocked: 0,
  });
  const [branches, setBranches] = useState<BranchOption[]>([]);
  const [doctors, setDoctors] = useState<DoctorOption[]>([]);
  const [chamberSchedules, setChamberSchedules] = useState<ChamberScheduleRule[]>([]);
  const [scheduleOverrides, setScheduleOverrides] = useState<ScheduleOverrideItem[]>([]);
  const [appointments, setAppointments] = useState<EnrichedAppointment[]>([]);

  // Schedule & Free-Slot Manager state
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>("doc-cardio-1");
  const [selectedBranchId, setSelectedBranchId] = useState<string>("branch-dhanmondi");
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [availability, setAvailability] = useState<AvailabilityResponse | null>(null);
  const [loadingSlots, setLoadingSlots] = useState(false);

  // Ad-hoc custom hours form
  const [customStart, setCustomStart] = useState("16:00");
  const [customEnd, setCustomEnd] = useState("21:30");
  const [leaveReasonEn, setLeaveReasonEn] = useState("Emergency Surgery / OT Delay");
  const [leaveReasonBn, setLeaveReasonBn] = useState("জরুরি অপারেশন / ওটি ব্যস্ততা");

  // Weekly rule editor state
  const [showWeeklyEditor, setShowWeeklyEditor] = useState(false);
  const [ruleDayOfWeek, setRuleDayOfWeek] = useState<number>(0);
  const [ruleRoom, setRuleRoom] = useState("Room #402, 3rd Floor");
  const [ruleStart, setRuleStart] = useState("17:00");
  const [ruleEnd, setRuleEnd] = useState("21:00");
  const [ruleBreakStart, setRuleBreakStart] = useState("19:00");
  const [ruleBreakEnd, setRuleBreakEnd] = useState("19:30");
  const [ruleSlotMinutes, setRuleSlotMinutes] = useState<number>(15);
  const [ruleIsActive, setRuleIsActive] = useState<boolean>(true);

  // Incoming queue filters
  const [searchQuery, setSearchQuery] = useState("");
  const [queueBranchFilter, setQueueBranchFilter] = useState("ALL");
  const [queueDoctorFilter, setQueueDoctorFilter] = useState("ALL");
  const [queueDateMode, setQueueDateMode] = useState<"ALL" | "TODAY" | "TOMORROW" | "UPCOMING" | "CUSTOM">("ALL");
  const [queueCustomDate, setQueueCustomDate] = useState("");
  const [queueVisitFilter, setQueueVisitFilter] = useState("ALL");
  const [queueStatusFilter, setQueueStatusFilter] = useState("ALL");

  // Quick-Booking Drawer state
  const [showQuickBook, setShowQuickBook] = useState(false);
  const [qbDoctorId, setQbDoctorId] = useState("doc-cardio-1");
  const [qbBranchId, setQbBranchId] = useState("branch-dhanmondi");
  const [qbDate, setQbDate] = useState("");
  const [qbSlot, setQbSlot] = useState("");
  const [qbAvailability, setQbAvailability] = useState<AvailabilityResponse | null>(null);
  const [qbPatientName, setQbPatientName] = useState("");
  const [qbPatientPhone, setQbPatientPhone] = useState("");
  const [qbPatientAge, setQbPatientAge] = useState("38");
  const [qbPatientGender, setQbPatientGender] = useState<"MALE" | "FEMALE" | "OTHER">("MALE");
  const [qbVisitType, setQbVisitType] = useState<"NEW_VISIT" | "FOLLOW_UP" | "REPORT_SHOW">("NEW_VISIT");
  const [qbBookingSource, setQbBookingSource] = useState<"FRONT_DESK_PHONE" | "WALK_IN_DESK">("FRONT_DESK_PHONE");
  const [qbSymptomsNote, setQbSymptomsNote] = useState("");

  // Reschedule modal state
  const [rescheduleTarget, setRescheduleTarget] = useState<EnrichedAppointment | null>(null);
  const [rsBranchId, setRsBranchId] = useState("");
  const [rsDate, setRsDate] = useState("");
  const [rsSlot, setRsSlot] = useState("");
  const [rsNote, setRsNote] = useState("Rescheduled by Front Desk / Assistant");
  const [rsAvailability, setRsAvailability] = useState<AvailabilityResponse | null>(null);

  // SMS Log Drawer state
  const [smsLogTarget, setSmsLogTarget] = useState<EnrichedAppointment | null>(null);

  // Feedback banner
  const [bannerMsg, setBannerMsg] = useState<{
    type: "success" | "warning" | "error";
    text: string;
  } | null>(null);

  const dateStrip = useMemo(() => buildNext14Days(todayIso), [todayIso]);

  const fetchOverview = useCallback(async () => {
    try {
      const res = await fetch("/api/v1/staff/overview", { cache: "no-store" });
      const data = await res.json();
      if (data.ok) {
        setTodayIso(data.todayIso);
        setKpis(data.kpis);
        setBranches(data.branches);
        setDoctors(data.doctors);
        setChamberSchedules(data.chamberSchedules);
        setScheduleOverrides(data.scheduleOverrides);
        setAppointments(data.appointments);
        setSelectedDate((prev) => prev || data.todayIso);
        setQbDate((prev) => prev || data.todayIso);
      }
    } catch {
      // ignore network error on initial load
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchOverview();
  }, [fetchOverview]);

  const fetchLiveAvailability = useCallback(
    async (doctorId: string, branchId: string, date: string) => {
      if (!doctorId || !branchId || !date) return;
      setLoadingSlots(true);
      try {
        const res = await fetch(
          `/api/v1/public/availability?doctorId=${encodeURIComponent(doctorId)}&branchId=${encodeURIComponent(branchId)}&date=${encodeURIComponent(date)}`,
          { cache: "no-store" }
        );
        const data = await res.json();
        if (data.ok !== false && data.slots) {
          setAvailability(data);
        }
      } finally {
        setLoadingSlots(false);
      }
    },
    []
  );

  useEffect(() => {
    if (selectedDoctorId && selectedBranchId && selectedDate) {
      void fetchLiveAvailability(selectedDoctorId, selectedBranchId, selectedDate);
    }
  }, [selectedDoctorId, selectedBranchId, selectedDate, fetchLiveAvailability]);

  // Keep Weekly Rule Editor synced with selected doctor + branch + weekday
  useEffect(() => {
    const existingRule = chamberSchedules.find(
      (r) =>
        r.doctorId === selectedDoctorId &&
        r.branchId === selectedBranchId &&
        r.dayOfWeek === ruleDayOfWeek
    );
    if (existingRule) {
      setRuleRoom(existingRule.chamberRoom);
      setRuleStart(existingRule.startTime);
      setRuleEnd(existingRule.endTime);
      setRuleBreakStart(existingRule.breakStartTime ?? "");
      setRuleBreakEnd(existingRule.breakEndTime ?? "");
      setRuleSlotMinutes(existingRule.slotDurationMinutes);
      setRuleIsActive(existingRule.isActive);
    }
  }, [selectedDoctorId, selectedBranchId, ruleDayOfWeek, chamberSchedules]);

  // Quick-Booking availability loader
  useEffect(() => {
    if (!showQuickBook || !qbDoctorId || !qbBranchId || !qbDate) return;
    fetch(
      `/api/v1/public/availability?doctorId=${encodeURIComponent(qbDoctorId)}&branchId=${encodeURIComponent(qbBranchId)}&date=${encodeURIComponent(qbDate)}`,
      { cache: "no-store" }
    )
      .then((r) => r.json())
      .then((data) => {
        if (data.slots) {
          setQbAvailability(data);
          const firstAvail = data.slots.find((s: AvailabilitySlot) => s.status === "AVAILABLE");
          if (firstAvail) setQbSlot(firstAvail.time);
        }
      })
      .catch(() => undefined);
  }, [showQuickBook, qbDoctorId, qbBranchId, qbDate]);

  // Reschedule modal availability loader
  useEffect(() => {
    if (!rescheduleTarget || !rsBranchId || !rsDate) return;
    fetch(
      `/api/v1/public/availability?doctorId=${encodeURIComponent(rescheduleTarget.doctorId)}&branchId=${encodeURIComponent(rsBranchId)}&date=${encodeURIComponent(rsDate)}`,
      { cache: "no-store" }
    )
      .then((r) => r.json())
      .then((data) => {
        if (data.slots) {
          setRsAvailability(data);
          const firstAvail = data.slots.find((s: AvailabilitySlot) => s.status === "AVAILABLE");
          if (firstAvail) setRsSlot(firstAvail.time);
        }
      })
      .catch(() => undefined);
  }, [rescheduleTarget, rsBranchId, rsDate]);

  const selectedDoctor = useMemo(
    () => doctors.find((d) => d.id === selectedDoctorId) ?? doctors[0],
    [doctors, selectedDoctorId]
  );

  const selectedBranch = useMemo(
    () => branches.find((b) => b.id === selectedBranchId) ?? branches[0],
    [branches, selectedBranchId]
  );

  const activeOverrideForSelection = useMemo(
    () =>
      scheduleOverrides.find(
        (ov) =>
          ov.doctorId === selectedDoctorId &&
          ov.branchId === selectedBranchId &&
          ov.date === selectedDate
      ),
    [scheduleOverrides, selectedDoctorId, selectedBranchId, selectedDate]
  );

  const doctorWeeklyRules = useMemo(
    () =>
      chamberSchedules
        .filter((s) => s.doctorId === selectedDoctorId && s.branchId === selectedBranchId)
        .sort((a, b) => a.dayOfWeek - b.dayOfWeek),
    [chamberSchedules, selectedDoctorId, selectedBranchId]
  );

  const flaggedAppointments = useMemo(
    () => appointments.filter((a) => a.status === "RESCHEDULE_REQUESTED"),
    [appointments]
  );

  // 1-Tap Fixed Slot Toggle (AVAILABLE <-> BLOCKED)
  async function handleToggleSlotBlock(slot: AvailabilitySlot) {
    if (slot.status === "BOOKED") {
      // Find the booked appointment on this slot and offer immediate reschedule
      const bookedApt = appointments.find(
        (a) =>
          a.doctorId === selectedDoctorId &&
          a.branchId === selectedBranchId &&
          a.preferredDate === selectedDate &&
          a.preferredTimeSlot === slot.time &&
          a.status !== "CANCELLED"
      );
      if (bookedApt) {
        // Blocking a slot that has a booked patient triggers conflict detection
        const res = await fetch("/api/v1/staff/schedule", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "TOGGLE_SLOT_BLOCK",
            doctorId: selectedDoctorId,
            branchId: selectedBranchId,
            date: selectedDate,
            slotTime: slot.time,
            reasonEn: leaveReasonEn,
            reasonBn: leaveReasonBn,
          }),
        });
        const data = await res.json();
        if (data.ok) {
          setAvailability(data.availability);
          await fetchOverview();
          setBannerMsg({
            type: "warning",
            text: `Slot ${slot.time} blocked. Overlapping appointment (${bookedApt.reference} — ${bookedApt.patientName}) has been flagged for Reschedule!`,
          });
        }
        return;
      }
    }

    const res = await fetch("/api/v1/staff/schedule", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "TOGGLE_SLOT_BLOCK",
        doctorId: selectedDoctorId,
        branchId: selectedBranchId,
        date: selectedDate,
        slotTime: slot.time,
        reasonEn: leaveReasonEn,
        reasonBn: leaveReasonBn,
      }),
    });
    const data = await res.json();
    if (data.ok) {
      setAvailability(data.availability);
      await fetchOverview();
      const affectedCount = data.affectedAppointments?.length ?? 0;
      setBannerMsg({
        type: affectedCount > 0 ? "warning" : "success",
        text:
          affectedCount > 0
            ? `Slot ${slot.time} updated. ${affectedCount} overlapping patient(s) flagged for reschedule.`
            : `Fixed slot ${slot.time} (${slot.labelEn}) toggled ${slot.status === "BLOCKED" ? "AVAILABLE" : "BLOCKED"}.`,
      });
    }
  }

  // Open Ad-Hoc Extra Chamber / Custom Hours in 2 clicks
  async function handleOpenCustomHours() {
    const res = await fetch("/api/v1/staff/schedule", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "UPSERT_OVERRIDE",
        doctorId: selectedDoctorId,
        branchId: selectedBranchId,
        date: selectedDate,
        overrideType: "CUSTOM_HOURS",
        customStartTime: customStart,
        customEndTime: customEnd,
        blockedSlots: [],
        reasonEn: `Extra / Extended Chamber (${customStart} - ${customEnd})`,
        reasonBn: `বিশেষ চেম্বার সেশন (${customStart} - ${customEnd})`,
      }),
    });
    const data = await res.json();
    if (data.ok) {
      setAvailability(data.availability);
      await fetchOverview();
      setBannerMsg({
        type: "success",
        text: `Ad-hoc free slots (${customStart}–${customEnd}) opened on ${selectedDate} for ${selectedDoctor?.nameEn}. Immediately bookable online!`,
      });
    } else {
      setBannerMsg({ type: "error", text: data.error ?? "Failed to open custom hours." });
    }
  }

  // 1-Click Full Day Leave toggle
  async function handleToggleFullDayLeave() {
    const isCurrentlyFullLeave = activeOverrideForSelection?.overrideType === "FULL_DAY_LEAVE";
    const res = await fetch("/api/v1/staff/schedule", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "UPSERT_OVERRIDE",
        doctorId: selectedDoctorId,
        branchId: selectedBranchId,
        date: selectedDate,
        overrideType: isCurrentlyFullLeave ? "CLEAR" : "FULL_DAY_LEAVE",
        reasonEn: leaveReasonEn,
        reasonBn: leaveReasonBn,
      }),
    });
    const data = await res.json();
    if (data.ok) {
      setAvailability(data.availability);
      await fetchOverview();
      const affected = data.affectedAppointments?.length ?? 0;
      setBannerMsg({
        type: isCurrentlyFullLeave ? "success" : "warning",
        text: isCurrentlyFullLeave
          ? `Full-day leave cleared for ${selectedDate}. Regular chamber schedule restored.`
          : `Full-day leave marked on ${selectedDate} (${leaveReasonEn}). ${affected > 0 ? `${affected} patient(s) flagged for reschedule!` : "All slots blocked."}`,
      });
    }
  }

  // Save Recurring Weekly Chamber Schedule Rule
  async function handleSaveWeeklyRule(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/v1/staff/schedule", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "UPSERT_WEEKLY_RULE",
        doctorId: selectedDoctorId,
        branchId: selectedBranchId,
        dayOfWeek: ruleDayOfWeek,
        chamberRoom: ruleRoom,
        startTime: ruleStart,
        endTime: ruleEnd,
        breakStartTime: ruleBreakStart || undefined,
        breakEndTime: ruleBreakEnd || undefined,
        slotDurationMinutes: ruleSlotMinutes,
        isActive: ruleIsActive,
      }),
    });
    const data = await res.json();
    if (data.ok) {
      await fetchOverview();
      await fetchLiveAvailability(selectedDoctorId, selectedBranchId, selectedDate);
      setBannerMsg({
        type: "success",
        text: `Weekly chamber rule updated for ${WEEKDAY_NAMES[ruleDayOfWeek]?.full} (${ruleStart}–${ruleEnd}, ${ruleSlotMinutes}m slots).`,
      });
    } else {
      setBannerMsg({ type: "error", text: data.error ?? "Unable to update weekly rule." });
    }
  }

  // 1-Click Appointment Status Transition
  async function handleStatusAction(
    apt: EnrichedAppointment,
    nextStatus: EnrichedAppointment["status"],
    customNote?: string
  ) {
    const res = await fetch("/api/v1/staff/appointments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "TRANSITION_STATUS",
        appointmentId: apt.id,
        nextStatus,
        note: customNote ?? `Status changed to ${nextStatus} by Front Desk`,
      }),
    });
    const data = await res.json();
    if (data.ok) {
      await fetchOverview();
      await fetchLiveAvailability(selectedDoctorId, selectedBranchId, selectedDate);
      setBannerMsg({
        type: "success",
        text: `Appointment ${apt.reference} (${apt.patientName}) updated to ${nextStatus}. Automated SMS dispatched to ${apt.patientPhone}.`,
      });
    } else {
      setBannerMsg({ type: "error", text: data.error ?? "Status transition failed." });
    }
  }

  // Submit Reschedule Modal
  async function handleConfirmReschedule(e: React.FormEvent) {
    e.preventDefault();
    if (!rescheduleTarget || !rsDate || !rsSlot) return;

    const res = await fetch("/api/v1/staff/appointments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "TRANSITION_STATUS",
        appointmentId: rescheduleTarget.id,
        nextStatus: "CONFIRMED",
        newBranchId: rsBranchId || rescheduleTarget.branchId,
        newDate: rsDate,
        newTimeSlot: rsSlot,
        note: rsNote || `Rescheduled & confirmed for ${rsDate} at ${rsSlot}`,
      }),
    });
    const data = await res.json();
    if (data.ok) {
      setRescheduleTarget(null);
      await fetchOverview();
      await fetchLiveAvailability(selectedDoctorId, selectedBranchId, selectedDate);
      setBannerMsg({
        type: "success",
        text: `Appointment ${rescheduleTarget.reference} rescheduled to ${rsDate} at ${rsSlot} and confirmed. SMS sent!`,
      });
    } else {
      setBannerMsg({ type: "error", text: data.error ?? "Reschedule failed." });
    }
  }

  // Resend SMS
  async function handleResendSms(apt: EnrichedAppointment) {
    const res = await fetch("/api/v1/staff/appointments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "RESEND_SMS",
        appointmentId: apt.id,
      }),
    });
    const data = await res.json();
    if (data.ok) {
      await fetchOverview();
      setBannerMsg({
        type: "success",
        text: `SMS notification re-dispatched to ${apt.patientPhone} for ${apt.reference} (${data.smsLog?.deliveryStatus}).`,
      });
    }
  }

  // 15-Second Phone Hotline & Walk-In Quick Booking Submit
  async function handleQuickBookSubmit(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/v1/staff/appointments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "QUICK_BOOK",
        doctorId: qbDoctorId,
        branchId: qbBranchId,
        preferredDate: qbDate,
        preferredTimeSlot: qbSlot,
        patientName: qbPatientName,
        patientPhone: qbPatientPhone,
        patientAge: Number(qbPatientAge) || 35,
        patientGender: qbPatientGender,
        visitType: qbVisitType,
        bookingSource: qbBookingSource,
        symptomsNote: qbSymptomsNote,
      }),
    });
    const data = await res.json();
    if (data.ok) {
      setShowQuickBook(false);
      setQbPatientName("");
      setQbPatientPhone("");
      setQbSymptomsNote("");
      await fetchOverview();
      await fetchLiveAvailability(selectedDoctorId, selectedBranchId, selectedDate);
      setBannerMsg({
        type: "success",
        text: `Confirmed booking created (${data.appointment.reference}) for ${data.appointment.patientName} at ${data.appointment.preferredTimeSlot}. Confirmation SMS sent!`,
      });
    } else {
      setBannerMsg({ type: "error", text: data.error ?? "Quick booking failed." });
    }
  }

  const tomorrowIso = useMemo(() => {
    const d = new Date(`${todayIso}T00:00:00+06:00`);
    d.setDate(d.getDate() + 1);
    return new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Dhaka",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(d);
  }, [todayIso]);

  const filteredAppointments = useMemo(() => {
    return appointments
      .filter((apt) => {
        if (queueBranchFilter !== "ALL" && apt.branchId !== queueBranchFilter) return false;
        if (queueDoctorFilter !== "ALL" && apt.doctorId !== queueDoctorFilter) return false;
        if (queueStatusFilter !== "ALL" && apt.status !== queueStatusFilter) return false;
        if (queueVisitFilter !== "ALL" && (apt.visitType ?? "NEW_CONSULTATION") !== queueVisitFilter)
          return false;

        if (queueDateMode === "TODAY" && apt.preferredDate !== todayIso) return false;
        if (queueDateMode === "TOMORROW" && apt.preferredDate !== tomorrowIso) return false;
        if (queueDateMode === "UPCOMING" && apt.preferredDate < todayIso) return false;
        if (queueDateMode === "CUSTOM" && queueCustomDate && apt.preferredDate !== queueCustomDate)
          return false;

        if (searchQuery.trim()) {
          const q = searchQuery.trim().toLowerCase();
          const matchRef = apt.reference.toLowerCase().includes(q);
          const matchPhone = apt.patientPhone.toLowerCase().includes(q);
          const matchName = apt.patientName.toLowerCase().includes(q);
          if (!matchRef && !matchPhone && !matchName) return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (a.preferredDate !== b.preferredDate) return a.preferredDate.localeCompare(b.preferredDate);
        return a.preferredTimeSlot.localeCompare(b.preferredTimeSlot);
      });
  }, [
    appointments,
    queueBranchFilter,
    queueDoctorFilter,
    queueStatusFilter,
    queueVisitFilter,
    queueDateMode,
    queueCustomDate,
    todayIso,
    tomorrowIso,
    searchQuery,
  ]);

  // Daily roster for the selected doctor, branch, and date (used for Printable A4 Chamber Sheet)
  const printableRoster = useMemo(() => {
    const exactMatch = appointments
      .filter(
        (a) =>
          a.doctorId === selectedDoctorId &&
          a.branchId === selectedBranchId &&
          a.preferredDate === selectedDate &&
          a.status !== "CANCELLED"
      )
      .sort((a, b) => a.preferredTimeSlot.localeCompare(b.preferredTimeSlot));

    if (exactMatch.length > 0) return exactMatch;
    // Fallback to filteredAppointments if no bookings on the exact selectedDate so print preview always has rows
    return filteredAppointments.filter((a) => a.status !== "CANCELLED");
  }, [appointments, selectedDoctorId, selectedBranchId, selectedDate, filteredAppointments]);

  return (
    <div className="min-h-screen bg-white text-slate-900">
      {/* Screen Workspace (hidden during @media print) */}
      <div className="print:hidden">
        {/* Full-Bleed Deep Navy Operational Header */}
        {!embedded && (
          <section className="w-full bg-[#012d61] text-white py-10 md:py-12 border-b border-[#0057b8]/30">
            <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-10">
              <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.22em] text-sky-300">
                    DeltaCare Reception & Chamber Assistant Console · APK-Ready v1 API
                  </p>
                  <h1 className="mc-serif mt-2 text-3xl sm:text-4xl lg:text-5xl font-normal tracking-tight text-white">
                    Front Desk & Doctor Schedule Manager
                  </h1>
                  <p className="mt-2 text-sm sm:text-base text-slate-200 max-w-3xl">
                    Real-time 14-day fixed-slot calendar, 2-click extra chamber uploader, 1-tap emergency slot blocker, and instant SMS-backed patient confirmation queue.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setQbDoctorId(selectedDoctorId);
                      setQbBranchId(selectedBranchId);
                      setQbDate(selectedDate || todayIso);
                      setShowQuickBook(true);
                    }}
                    className="inline-flex min-h-[44px] items-center gap-2 bg-[#0057b8] hover:bg-[#004494] text-white font-semibold px-5 py-2.5 text-sm transition-colors cursor-pointer"
                  >
                    <PhoneCall className="h-4 w-4" />
                    15s Hotline / Walk-In Booking
                  </button>

                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="inline-flex min-h-[44px] items-center gap-2 border border-white/30 bg-white/10 hover:bg-white/20 text-white font-semibold px-5 py-2.5 text-sm transition-colors cursor-pointer"
                  >
                    <Printer className="h-4 w-4" />
                    Print Chamber Sheet (A4)
                  </button>

                  <Link
                    href="/appointments"
                    className="inline-flex min-h-[44px] items-center gap-2 border border-white/25 px-4 py-2.5 text-sm font-medium text-sky-200 hover:text-white hover:border-white"
                  >
                    Public Booking View →
                  </Link>
                </div>
              </div>
            </div>
          </section>
        )}

        <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-10 py-8 space-y-10">
          {/* Embedded Mode Action Bar */}
          {embedded && (
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#e5e7eb] pb-5">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#0057b8]">
                  Phase 2 · Chamber Assistant & Reception Desk
                </p>
                <h2 className="mc-serif text-2xl sm:text-3xl text-[#012d61] mt-1">
                  Doctor Schedule, Free-Slot Uploader & Live Booking Queue
                </h2>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setQbDoctorId(selectedDoctorId);
                    setQbBranchId(selectedBranchId);
                    setQbDate(selectedDate || todayIso);
                    setShowQuickBook(true);
                  }}
                  className="inline-flex min-h-[44px] items-center gap-2 bg-[#0057b8] hover:bg-[#004494] text-white font-semibold px-5 py-2.5 text-sm transition-colors cursor-pointer"
                >
                  <PhoneCall className="h-4 w-4" />
                  15s Hotline / Walk-In Booking
                </button>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="inline-flex min-h-[44px] items-center gap-2 border border-[#012d61] text-[#012d61] hover:bg-slate-50 font-semibold px-5 py-2.5 text-sm transition-colors cursor-pointer"
                >
                  <Printer className="h-4 w-4" />
                  Print Chamber Sheet (A4)
                </button>
              </div>
            </div>
          )}

          {/* Status Feedback Banner */}
          {bannerMsg && (
            <div
              className={`flex items-center justify-between gap-4 border-l-4 px-5 py-4 text-sm font-medium ${
                bannerMsg.type === "error"
                  ? "border-red-600 bg-red-50 text-red-900"
                  : bannerMsg.type === "warning"
                    ? "border-amber-500 bg-amber-50 text-amber-950"
                    : "border-[#0057b8] bg-sky-50/90 text-[#012d61]"
              }`}
            >
              <div className="flex items-center gap-3">
                {bannerMsg.type === "warning" ? (
                  <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />
                ) : (
                  <CheckCircle2 className="h-5 w-5 text-[#0057b8] shrink-0" />
                )}
                <span>{bannerMsg.text}</span>
              </div>
              <button
                type="button"
                onClick={() => setBannerMsg(null)}
                className="text-xs font-bold uppercase tracking-wider underline cursor-pointer"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* 1. Top Operational Summary Strip (4 KPI Cards) */}
          <section aria-label="Operational Summary KPIs">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 border-y border-[#e5e7eb] divide-y sm:divide-y-0 sm:divide-x divide-[#e5e7eb]">
              <div className="py-6 sm:px-6 first:pl-0">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
                  1 · Today&apos;s Total Appointments
                </p>
                <p className="mc-serif mt-2 text-4xl font-normal text-[#012d61] tabular-nums">
                  {kpis.todayTotal}
                </p>
                <p className="mt-1 text-xs text-slate-600">
                  Active chamber schedule across Dhanmondi, Uttara & Mirpur
                </p>
              </div>

              <div className="py-6 sm:px-6">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-700">
                  2 · Confirmed Bookings
                </p>
                <p className="mc-serif mt-2 text-4xl font-normal text-emerald-700 tabular-nums">
                  {kpis.confirmedBookings}
                </p>
                <p className="mt-1 text-xs text-slate-600">
                  Verified with SMS confirmation dispatched
                </p>
              </div>

              <div className="py-6 sm:px-6">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-amber-700">
                  3 · Pending Requests (Action Required)
                </p>
                <p className="mc-serif mt-2 text-4xl font-normal text-amber-600 tabular-nums">
                  {kpis.pendingRequests}
                </p>
                <p className="mt-1 text-xs text-slate-600">
                  Awaiting 1-click Front Desk confirmation or reschedule
                </p>
              </div>

              <div className="py-6 sm:px-6 last:pr-0">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-rose-700">
                  4 · Cancelled / Blocked Slots
                </p>
                <p className="mc-serif mt-2 text-4xl font-normal text-rose-700 tabular-nums">
                  {kpis.cancelledOrBlocked}
                </p>
                <p className="mt-1 text-xs text-slate-600">
                  Released cancellations & assistant-blocked chamber slots
                </p>
              </div>
            </div>
          </section>

          {/* Conflict Detection & Reschedule Alert Banner */}
          {flaggedAppointments.length > 0 && (
            <section
              aria-label="Flagged for Reschedule Alert"
              className="border-l-4 border-amber-500 bg-amber-50/80 p-5"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 text-amber-900 font-bold text-sm uppercase tracking-wider">
                    <ShieldAlert className="h-5 w-5 text-amber-600" />
                    Conflict Detection · {flaggedAppointments.length} Patient Appointment(s) Flagged for Reschedule
                  </div>
                  <p className="mt-1 text-sm text-amber-950">
                    A doctor slot block or emergency leave overlapped with existing patient bookings. Move these patients to a new open slot with 1 click:
                  </p>
                </div>
              </div>
              <div className="mt-4 divide-y divide-amber-200/80 border-t border-amber-200">
                {flaggedAppointments.map((apt) => (
                  <div
                    key={apt.id}
                    className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-sm"
                  >
                    <div>
                      <span className="font-bold text-[#012d61] tabular-nums">{apt.reference}</span>{" "}
                      · <span className="font-semibold text-slate-900">{apt.patientName}</span> (
                      <span className="tabular-nums font-medium">{apt.patientPhone}</span>) —{" "}
                      <span className="text-slate-700">
                        {apt.doctorNameEn} · {apt.branchNameEn} ·{" "}
                        <strong className="tabular-nums">
                          {apt.preferredDate} @ {apt.preferredTimeSlot}
                        </strong>
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setRescheduleTarget(apt);
                          setRsBranchId(apt.branchId);
                          setRsDate(apt.preferredDate);
                          setRsSlot(apt.preferredTimeSlot);
                        }}
                        className="inline-flex min-h-[40px] items-center gap-1.5 bg-[#0057b8] hover:bg-[#004494] text-white px-4 py-2 text-xs font-bold uppercase tracking-wider cursor-pointer"
                      >
                        <Calendar className="h-3.5 w-3.5" />
                        Move to Open Slot & Send SMS
                      </button>
                      <button
                        type="button"
                        onClick={() => handleResendSms(apt)}
                        className="inline-flex min-h-[40px] items-center gap-1.5 border border-amber-700 text-amber-900 hover:bg-amber-100 px-3 py-2 text-xs font-bold uppercase tracking-wider cursor-pointer"
                      >
                        <Send className="h-3.5 w-3.5" />
                        Notify SMS
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* 2. Rapid Doctor Calendar, Chamber Schedule & Free-Slot Uploader */}
          <section className="border-t border-[#e5e7eb] pt-8">
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 pb-6 border-b border-[#e5e7eb]">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#0057b8]">
                  Doctor&apos;s Assistant & Chamber Desk
                </p>
                <h2 className="mc-serif mt-1 text-2xl sm:text-3xl font-normal text-[#012d61]">
                  14-Day Interactive Fixed-Slot Grid & Free-Slot Uploader
                </h2>
                <p className="mt-1 text-sm text-slate-600">
                  Select a specialist and campus to tap-toggle individual fixed slots (`AVAILABLE` ↔ `BLOCKED`), open extra chamber hours (`CUSTOM_HOURS`), or mark full-day leave.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => setShowWeeklyEditor((prev) => !prev)}
                  className="inline-flex min-h-[44px] items-center gap-2 border border-[#012d61] px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-[#012d61] hover:bg-slate-50 cursor-pointer"
                >
                  <SlidersHorizontal className="h-4 w-4" />
                  {showWeeklyEditor ? "Hide Weekly Schedule Rules" : "Edit Recurring Weekly Rules"}
                </button>
                <button
                  type="button"
                  onClick={() =>
                    fetchLiveAvailability(selectedDoctorId, selectedBranchId, selectedDate)
                  }
                  className="inline-flex min-h-[44px] items-center gap-2 border border-[#e5e7eb] px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-slate-700 hover:border-[#0057b8] hover:text-[#0057b8] cursor-pointer"
                >
                  <RefreshCw className="h-4 w-4" />
                  Refresh Grid
                </button>
              </div>
            </div>

            {/* Doctor & Branch Selector Row */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 py-6 border-b border-[#e5e7eb]">
              <div className="lg:col-span-5">
                <label className="block text-xs font-bold uppercase tracking-[0.16em] text-slate-600 mb-2">
                  Select Specialist Doctor
                </label>
                <select
                  value={selectedDoctorId}
                  onChange={(e) => setSelectedDoctorId(e.target.value)}
                  className="w-full min-h-[48px] border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-[#012d61] focus:border-[#0057b8] focus:outline-none"
                >
                  {doctors.map((doc) => (
                    <option key={doc.id} value={doc.id}>
                      {doc.nameEn} ({doc.designationEn || "Consultant"}) — ৳{doc.consultationFeeBdt}
                    </option>
                  ))}
                </select>
                {selectedDoctor && (
                  <p className="mt-2 text-xs text-slate-600">
                    <span className="font-semibold text-[#012d61]">
                      {selectedDoctor.qualificationsEn}
                    </span>{" "}
                    · BMDC: <span className="tabular-nums">{selectedDoctor.bmdcNumber}</span> · Fee:{" "}
                    <span className="font-bold text-[#012d61] tabular-nums">
                      ৳{selectedDoctor.consultationFeeBdt}
                    </span>{" "}
                    (Follow-up: <span className="tabular-nums">৳{selectedDoctor.followupFeeBdt ?? 700}</span>)
                  </p>
                )}
              </div>

              <div className="lg:col-span-4">
                <label className="block text-xs font-bold uppercase tracking-[0.16em] text-slate-600 mb-2">
                  Select Hospital Branch / Chamber Campus
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {branches.slice(0, 6).map((b) => {
                    const active = b.id === selectedBranchId;
                    return (
                      <button
                        key={b.id}
                        type="button"
                        onClick={() => setSelectedBranchId(b.id)}
                        className={`min-h-[48px] px-3 py-2 text-left border transition-colors cursor-pointer ${
                          active
                            ? "border-[#0057b8] bg-[#012d61] text-white"
                            : "border-[#e5e7eb] bg-white text-slate-800 hover:border-[#0057b8]"
                        }`}
                      >
                        <div className="text-xs font-bold truncate">
                          {b.nameEn.replace("DeltaCare ", "").replace("Hospital — ", "")}
                        </div>
                        <div
                          className={`text-[11px] truncate ${
                            active ? "text-sky-200" : "text-slate-500"
                          }`}
                        >
                          {b.city}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="lg:col-span-3 flex flex-col justify-between border-l-0 lg:border-l border-[#e5e7eb] lg:pl-6">
                <div>
                  <span className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
                    Assigned Chamber Room
                  </span>
                  <p className="mt-1 text-base font-bold text-[#012d61]">
                    {availability?.chamberRoom ?? "Room #402, 3rd Floor"}
                  </p>
                </div>
                <div className="mt-3 text-xs text-slate-600">
                  Recurring Weekly Days:{" "}
                  {doctorWeeklyRules.length > 0 ? (
                    doctorWeeklyRules.map((r) => (
                      <span
                        key={r.id}
                        className="inline-block mr-1.5 font-semibold text-[#012d61] tabular-nums"
                      >
                        {WEEKDAY_NAMES[r.dayOfWeek]?.short} ({r.startTime}–{r.endTime})
                      </span>
                    ))
                  ) : (
                    <span className="text-amber-700 font-medium">
                      No recurring rule at this branch — use Extra Chamber Uploader below
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Collapsible Recurring Weekly Schedule Editor */}
            {showWeeklyEditor && (
              <form
                onSubmit={handleSaveWeeklyRule}
                className="my-6 bg-slate-50 border border-[#e5e7eb] p-6 space-y-4"
              >
                <div className="flex items-center justify-between border-b border-[#e5e7eb] pb-3">
                  <div>
                    <h3 className="mc-serif text-xl text-[#012d61]">
                      Recurring Weekly Chamber Schedule Editor (`DoctorChamberSchedule`)
                    </h3>
                    <p className="text-xs text-slate-600">
                      Configure recurring weekly visiting hours, chamber room, break window, and fixed slot duration (10 / 15 / 20 / 30 mins).
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowWeeklyEditor(false)}
                    className="text-xs font-bold uppercase text-slate-500 hover:text-slate-900"
                  >
                    Close
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                      Day of Week
                    </label>
                    <select
                      value={ruleDayOfWeek}
                      onChange={(e) => setRuleDayOfWeek(Number(e.target.value))}
                      className="w-full min-h-[44px] border border-slate-300 bg-white px-3 py-2 text-sm font-medium"
                    >
                      {WEEKDAY_NAMES.map((w) => (
                        <option key={w.day} value={w.day}>
                          {w.full}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                      Chamber Room #
                    </label>
                    <input
                      type="text"
                      value={ruleRoom}
                      onChange={(e) => setRuleRoom(e.target.value)}
                      className="w-full min-h-[44px] border border-slate-300 bg-white px-3 py-2 text-sm"
                      placeholder="Room #402, 3rd Floor"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                      Start Time
                    </label>
                    <input
                      type="time"
                      value={ruleStart}
                      onChange={(e) => setRuleStart(e.target.value)}
                      className="w-full min-h-[44px] border border-slate-300 bg-white px-3 py-2 text-sm tabular-nums"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                      End Time
                    </label>
                    <input
                      type="time"
                      value={ruleEnd}
                      onChange={(e) => setRuleEnd(e.target.value)}
                      className="w-full min-h-[44px] border border-slate-300 bg-white px-3 py-2 text-sm tabular-nums"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                      Break Start (Opt)
                    </label>
                    <input
                      type="time"
                      value={ruleBreakStart}
                      onChange={(e) => setRuleBreakStart(e.target.value)}
                      className="w-full min-h-[44px] border border-slate-300 bg-white px-3 py-2 text-sm tabular-nums"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                      Break End (Opt)
                    </label>
                    <input
                      type="time"
                      value={ruleBreakEnd}
                      onChange={(e) => setRuleBreakEnd(e.target.value)}
                      className="w-full min-h-[44px] border border-slate-300 bg-white px-3 py-2 text-sm tabular-nums"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                      Slot Duration
                    </label>
                    <select
                      value={ruleSlotMinutes}
                      onChange={(e) => setRuleSlotMinutes(Number(e.target.value))}
                      className="w-full min-h-[44px] border border-slate-300 bg-white px-3 py-2 text-sm tabular-nums font-semibold"
                    >
                      <option value={10}>10 Minutes</option>
                      <option value={15}>15 Minutes</option>
                      <option value={20}>20 Minutes</option>
                      <option value={30}>30 Minutes</option>
                    </select>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
                  <label className="inline-flex items-center gap-2 text-sm font-medium text-slate-800 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={ruleIsActive}
                      onChange={(e) => setRuleIsActive(e.target.checked)}
                      className="h-4 w-4 accent-[#0057b8]"
                    />
                    Active weekly chamber day for {selectedBranch?.nameEn}
                  </label>

                  <button
                    type="submit"
                    className="inline-flex min-h-[44px] items-center gap-2 bg-[#0057b8] hover:bg-[#004494] text-white font-semibold px-6 py-2.5 text-sm cursor-pointer"
                  >
                    Save Recurring Weekly Rule
                  </button>
                </div>
              </form>
            )}

            {/* 14-Day Horizontal Date Strip */}
            <div className="py-5 border-b border-[#e5e7eb]">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
                  14-Day Interactive Chamber Calendar (Asia/Dhaka)
                </span>
                <span className="text-xs font-semibold text-[#012d61] tabular-nums">
                  Selected Date: {selectedDate}
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 lg:grid-cols-14 gap-2">
                {dateStrip.map((d) => {
                  const isSelected = d.iso === selectedDate;
                  const hasOverride = scheduleOverrides.find(
                    (ov) =>
                      ov.doctorId === selectedDoctorId &&
                      ov.branchId === selectedBranchId &&
                      ov.date === d.iso
                  );
                  return (
                    <button
                      key={d.iso}
                      type="button"
                      onClick={() => setSelectedDate(d.iso)}
                      className={`min-h-[68px] p-2.5 text-left border transition-colors flex flex-col justify-between cursor-pointer ${
                        isSelected
                          ? "border-[#0057b8] bg-[#012d61] text-white"
                          : hasOverride?.overrideType === "FULL_DAY_LEAVE"
                            ? "border-rose-300 bg-rose-50/70 text-rose-900"
                            : hasOverride?.overrideType === "CUSTOM_HOURS"
                              ? "border-emerald-400 bg-emerald-50/60 text-emerald-950"
                              : "border-[#e5e7eb] bg-white text-slate-800 hover:border-[#0057b8]"
                      }`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span
                          className={`text-[11px] font-bold uppercase ${
                            isSelected ? "text-sky-300" : "text-slate-500"
                          }`}
                        >
                          {d.dayName}
                        </span>
                        {hasOverride && (
                          <span
                            className={`h-2 w-2 rounded-full ${
                              hasOverride.overrideType === "FULL_DAY_LEAVE"
                                ? "bg-rose-500"
                                : hasOverride.overrideType === "CUSTOM_HOURS"
                                  ? "bg-emerald-500"
                                  : "bg-amber-400"
                            }`}
                          />
                        )}
                      </div>
                      <div className="text-lg font-bold tabular-nums leading-tight">
                        {d.dayNum} <span className="text-xs font-normal">{d.monthShort}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Interactive Slot Grid + Fast Ad-Hoc Uploader & Leave Controls */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 py-6">
              {/* Left 8 Columns: Fixed Time Slot Grid */}
              <div className="lg:col-span-8">
                <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                  <div>
                    <h3 className="mc-serif text-xl text-[#012d61]">
                      Fixed Time Slots on <span className="tabular-nums">{selectedDate}</span>
                    </h3>
                    <p className="text-xs text-slate-600">
                      Tap any slot to toggle between{" "}
                      <span className="font-semibold text-emerald-700">AVAILABLE</span> and{" "}
                      <span className="font-semibold text-amber-800">BLOCKED</span> (e.g. when doctor is delayed in OT or traffic).
                    </p>
                  </div>

                  {/* Legend */}
                  <div className="flex flex-wrap items-center gap-3 text-xs font-semibold">
                    <span className="inline-flex items-center gap-1.5 text-emerald-800">
                      <span className="h-3 w-3 bg-emerald-600 inline-block" /> Available
                    </span>
                    <span className="inline-flex items-center gap-1.5 text-[#012d61]">
                      <span className="h-3 w-3 bg-[#012d61] inline-block" /> Booked
                    </span>
                    <span className="inline-flex items-center gap-1.5 text-amber-800">
                      <span className="h-3 w-3 bg-amber-500 inline-block" /> Blocked (Tap to Unblock)
                    </span>
                  </div>
                </div>

                {loadingSlots ? (
                  <div className="py-12 text-center text-sm text-slate-500 border border-[#e5e7eb]">
                    Loading real-time chamber slots...
                  </div>
                ) : availability && availability.slots.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {availability.slots.map((slot) => {
                      const bookedApt =
                        slot.status === "BOOKED"
                          ? appointments.find(
                              (a) =>
                                a.doctorId === selectedDoctorId &&
                                a.branchId === selectedBranchId &&
                                a.preferredDate === selectedDate &&
                                a.preferredTimeSlot === slot.time &&
                                a.status !== "CANCELLED"
                            )
                          : undefined;

                      return (
                        <button
                          key={slot.time}
                          type="button"
                          onClick={() => handleToggleSlotBlock(slot)}
                          className={`min-h-[64px] p-3 text-left border transition-all cursor-pointer flex flex-col justify-between ${
                            slot.status === "AVAILABLE"
                              ? "border-emerald-600/40 bg-emerald-50/50 hover:bg-emerald-100/70 text-emerald-950"
                              : slot.status === "BOOKED"
                                ? "border-[#012d61] bg-[#012d61] text-white"
                                : slot.status === "BLOCKED"
                                  ? "border-amber-500 bg-amber-50 text-amber-950 hover:bg-amber-100"
                                  : "border-slate-200 bg-slate-100 text-slate-400"
                          }`}
                        >
                          <div className="flex items-center justify-between w-full">
                            <span className="text-sm font-bold tabular-nums">{slot.labelEn}</span>
                            <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 bg-black/10">
                              {slot.status}
                            </span>
                          </div>
                          <div className="mt-1 flex items-center justify-between text-[11px] opacity-90">
                            <span>{slot.labelBn}</span>
                            <span className="tabular-nums">{slot.time}</span>
                          </div>
                          {bookedApt && (
                            <div className="mt-1.5 pt-1 border-t border-white/20 text-[11px] text-sky-200 truncate">
                              {bookedApt.patientName} ({bookedApt.reference})
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="border border-[#e5e7eb] bg-slate-50/70 p-8 text-center">
                    <p className="mc-serif text-xl text-[#012d61]">
                      {availability?.unavailableReasonEn ||
                        "No Recurring Chamber Session on This Date"}
                    </p>
                    {availability?.unavailableReasonBn && (
                      <p className="mt-1 text-sm text-slate-600">
                        {availability.unavailableReasonBn}
                      </p>
                    )}
                    <p className="mt-2 text-xs text-slate-500">
                      Want to open an ad-hoc extra chamber or extended visiting hours on{" "}
                      <strong className="tabular-nums">{selectedDate}</strong>? Use the{" "}
                      <strong>Fast Ad-Hoc Free-Slot Uploader</strong> on the right in 2 clicks.
                    </p>
                  </div>
                )}
              </div>

              {/* Right 4 Columns: 2-Click Ad-Hoc Free-Slot Uploader & 1-Click Full Day Leave */}
              <div className="lg:col-span-4 space-y-6 border-t lg:border-t-0 lg:border-l border-[#e5e7eb] pt-6 lg:pt-0 lg:pl-8">
                {/* Fast Ad-Hoc Free-Slot / Extra Chamber Uploader (CUSTOM_HOURS) */}
                <div className="border-b border-[#e5e7eb] pb-6">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-[#0057b8]">
                    <Sparkles className="h-4 w-4" />
                    Fast Ad-Hoc Free-Slot Uploader (`CUSTOM_HOURS`)
                  </div>
                  <h4 className="mc-serif mt-1 text-lg text-[#012d61]">
                    Open Extra Chamber Hours on <span className="tabular-nums">{selectedDate}</span>
                  </h4>
                  <p className="mt-1 text-xs text-slate-600">
                    Instantly publish fixed time slots for any date (even off-days) so patients and receptionists can book immediately.
                  </p>

                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">
                        Custom Start
                      </label>
                      <input
                        type="time"
                        value={customStart}
                        onChange={(e) => setCustomStart(e.target.value)}
                        className="w-full min-h-[44px] border border-slate-300 px-3 py-2 text-sm font-semibold tabular-nums"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">
                        Custom End
                      </label>
                      <input
                        type="time"
                        value={customEnd}
                        onChange={(e) => setCustomEnd(e.target.value)}
                        className="w-full min-h-[44px] border border-slate-300 px-3 py-2 text-sm font-semibold tabular-nums"
                      />
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleOpenCustomHours}
                    className="mt-3 w-full min-h-[44px] bg-[#0057b8] hover:bg-[#004494] text-white font-semibold px-4 py-2.5 text-sm transition-colors cursor-pointer"
                  >
                    + Open Extra Free Slots ({customStart} – {customEnd})
                  </button>
                </div>

                {/* 1-Click Full Day Emergency Leave Blocker */}
                <div>
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-rose-700">
                    <AlertTriangle className="h-4 w-4" />
                    Emergency Leave / OT Blocker (`FULL_DAY_LEAVE`)
                  </div>
                  <h4 className="mc-serif mt-1 text-lg text-[#012d61]">
                    Mark Full-Day Chamber Leave
                  </h4>
                  <div className="mt-3 space-y-2.5">
                    <div>
                      <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">
                        Leave Reason (English)
                      </label>
                      <input
                        type="text"
                        value={leaveReasonEn}
                        onChange={(e) => setLeaveReasonEn(e.target.value)}
                        className="w-full min-h-[40px] border border-slate-300 px-3 py-1.5 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">
                        Leave Reason (বাংলা)
                      </label>
                      <input
                        type="text"
                        value={leaveReasonBn}
                        onChange={(e) => setLeaveReasonBn(e.target.value)}
                        className="w-full min-h-[40px] border border-slate-300 px-3 py-1.5 text-xs"
                      />
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleToggleFullDayLeave}
                    className={`mt-3 w-full min-h-[44px] font-semibold px-4 py-2.5 text-sm transition-colors cursor-pointer ${
                      activeOverrideForSelection?.overrideType === "FULL_DAY_LEAVE"
                        ? "bg-emerald-700 hover:bg-emerald-800 text-white"
                        : "bg-rose-700 hover:bg-rose-800 text-white"
                    }`}
                  >
                    {activeOverrideForSelection?.overrideType === "FULL_DAY_LEAVE"
                      ? "Restore Chamber (Clear Full-Day Leave)"
                      : `Mark Full Day Leave on ${selectedDate}`}
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* 3. Live Incoming Appointments Queue & 1-Click Actions + Instant Lookup */}
          <section className="border-t border-[#e5e7eb] pt-8">
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 pb-6 border-b border-[#e5e7eb]">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#0057b8]">
                  Live Reception Queue & Instant Patient Lookup
                </p>
                <h2 className="mc-serif mt-1 text-2xl sm:text-3xl font-normal text-[#012d61]">
                  Incoming Appointments & 1-Click Confirmation Desk
                </h2>
              </div>

              {/* Instant Search Bar */}
              <div className="relative w-full lg:w-96">
                <Search className="h-4 w-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Lookup Mobile (017...), Name, or Ref (DC-2026-...)..."
                  className="w-full min-h-[44px] border border-slate-300 pl-10 pr-4 py-2 text-sm focus:border-[#0057b8] focus:outline-none tabular-nums"
                />
              </div>
            </div>

            {/* Filter Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 py-4 border-b border-[#e5e7eb] bg-slate-50/60 px-4">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Branch Filter
                </label>
                <select
                  value={queueBranchFilter}
                  onChange={(e) => setQueueBranchFilter(e.target.value)}
                  className="w-full min-h-[40px] border border-slate-300 bg-white px-3 text-xs font-semibold"
                >
                  <option value="ALL">All Hospital Branches</option>
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.nameEn}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Doctor Filter
                </label>
                <select
                  value={queueDoctorFilter}
                  onChange={(e) => setQueueDoctorFilter(e.target.value)}
                  className="w-full min-h-[40px] border border-slate-300 bg-white px-3 text-xs font-semibold"
                >
                  <option value="ALL">All Specialists</option>
                  {doctors.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.nameEn}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Date Window
                </label>
                <div className="flex gap-1">
                  <select
                    value={queueDateMode}
                    onChange={(e) =>
                      setQueueDateMode(
                        e.target.value as "ALL" | "TODAY" | "TOMORROW" | "UPCOMING" | "CUSTOM"
                      )
                    }
                    className="w-full min-h-[40px] border border-slate-300 bg-white px-2.5 text-xs font-semibold"
                  >
                    <option value="ALL">All Dates</option>
                    <option value="TODAY">Today ({todayIso})</option>
                    <option value="TOMORROW">Tomorrow ({tomorrowIso})</option>
                    <option value="UPCOMING">Upcoming</option>
                    <option value="CUSTOM">Custom Date</option>
                  </select>
                  {queueDateMode === "CUSTOM" && (
                    <input
                      type="date"
                      value={queueCustomDate}
                      onChange={(e) => setQueueCustomDate(e.target.value)}
                      className="min-h-[40px] border border-slate-300 bg-white px-2 text-xs tabular-nums"
                    />
                  )}
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Visit Type
                </label>
                <select
                  value={queueVisitFilter}
                  onChange={(e) => setQueueVisitFilter(e.target.value)}
                  className="w-full min-h-[40px] border border-slate-300 bg-white px-3 text-xs font-semibold"
                >
                  <option value="ALL">All Visit Types</option>
                  <option value="NEW_CONSULTATION">New Consultation</option>
                  <option value="NEW_VISIT">New Visit</option>
                  <option value="FOLLOW_UP">Follow-up</option>
                  <option value="REPORT_SHOW">Report Show</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Booking Status
                </label>
                <select
                  value={queueStatusFilter}
                  onChange={(e) => setQueueStatusFilter(e.target.value)}
                  className="w-full min-h-[40px] border border-slate-300 bg-white px-3 text-xs font-semibold"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="REQUESTED">Pending / Requested</option>
                  <option value="CONFIRMED">Confirmed</option>
                  <option value="RESCHEDULE_REQUESTED">Flagged for Reschedule</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="NO_SHOW">No-Show</option>
                  <option value="CANCELLED">Cancelled</option>
                </select>
              </div>
            </div>

            {/* Editorial Queue Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#e5e7eb] text-[11px] font-bold uppercase tracking-[0.15em] text-slate-500">
                    <th className="py-3.5 pr-4">Ref & Source</th>
                    <th className="py-3.5 px-4">Patient & Mobile</th>
                    <th className="py-3.5 px-4">Doctor & Chamber</th>
                    <th className="py-3.5 px-4">Date & Fixed Slot</th>
                    <th className="py-3.5 px-4">Status & SMS</th>
                    <th className="py-3.5 pl-4 text-right">1-Click Reception Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e5e7eb] text-sm">
                  {filteredAppointments.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-10 text-center text-slate-500">
                        No appointments match the current filter criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredAppointments.map((apt) => (
                      <tr key={apt.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-4 pr-4 align-top">
                          <div className="font-bold text-[#012d61] tabular-nums">
                            {apt.reference}
                          </div>
                          <div className="mt-0.5 text-[11px] font-medium text-slate-500">
                            {apt.bookingSource ?? "ONLINE_WEBSITE"}
                          </div>
                          <div className="text-[11px] text-slate-500">
                            {apt.visitType ?? "NEW_CONSULTATION"}
                          </div>
                        </td>

                        <td className="py-4 px-4 align-top">
                          <div className="font-bold text-slate-900">{apt.patientName}</div>
                          <div className="text-xs font-semibold text-[#0057b8] tabular-nums">
                            {apt.patientPhone}
                          </div>
                          {(apt.patientAge || apt.patientGender) && (
                            <div className="text-xs text-slate-500 tabular-nums">
                              {apt.patientAge ? `${apt.patientAge} yrs` : ""}{" "}
                              {apt.patientGender ? `· ${apt.patientGender}` : ""}
                            </div>
                          )}
                        </td>

                        <td className="py-4 px-4 align-top">
                          <div className="font-semibold text-[#012d61]">{apt.doctorNameEn}</div>
                          <div className="text-xs text-slate-600">{apt.branchNameEn}</div>
                          <div className="text-[11px] text-slate-500">{apt.chamberRoom}</div>
                        </td>

                        <td className="py-4 px-4 align-top">
                          <div className="font-bold text-slate-900 tabular-nums">
                            {apt.preferredDate}
                          </div>
                          <div className="inline-block mt-1 px-2 py-0.5 bg-sky-50 border border-sky-200 text-xs font-bold text-[#012d61] tabular-nums">
                            Slot: {apt.preferredTimeSlot}
                          </div>
                        </td>

                        <td className="py-4 px-4 align-top">
                          <span
                            className={`inline-block px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider ${
                              apt.status === "CONFIRMED"
                                ? "bg-emerald-100 text-emerald-900"
                                : apt.status === "REQUESTED"
                                  ? "bg-amber-100 text-amber-900"
                                  : apt.status === "RESCHEDULE_REQUESTED"
                                    ? "bg-rose-100 text-rose-900"
                                    : apt.status === "COMPLETED"
                                      ? "bg-sky-100 text-[#012d61]"
                                      : "bg-slate-200 text-slate-700"
                            }`}
                          >
                            {apt.status}
                          </span>
                          <div className="mt-1.5">
                            <button
                              type="button"
                              onClick={() => setSmsLogTarget(apt)}
                              className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#0057b8] hover:underline cursor-pointer tabular-nums"
                            >
                              <MessageSquare className="h-3 w-3" />
                              SMS Logs ({apt.smsLogs?.length ?? 0})
                            </button>
                          </div>
                        </td>

                        <td className="py-4 pl-4 align-top text-right">
                          <div className="flex flex-wrap items-center justify-end gap-1.5">
                            {(apt.status === "REQUESTED" ||
                              apt.status === "RESCHEDULE_REQUESTED") && (
                              <button
                                type="button"
                                onClick={() => handleStatusAction(apt, "CONFIRMED")}
                                className="min-h-[38px] px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold uppercase tracking-wider cursor-pointer"
                              >
                                Confirm
                              </button>
                            )}

                            {apt.status !== "CANCELLED" && apt.status !== "COMPLETED" && (
                              <button
                                type="button"
                                onClick={() => {
                                  setRescheduleTarget(apt);
                                  setRsBranchId(apt.branchId);
                                  setRsDate(apt.preferredDate);
                                  setRsSlot(apt.preferredTimeSlot);
                                }}
                                className="min-h-[38px] px-3 py-1.5 bg-[#0057b8] hover:bg-[#004494] text-white text-xs font-bold uppercase tracking-wider cursor-pointer"
                              >
                                Reschedule
                              </button>
                            )}

                            {apt.status === "CONFIRMED" && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => handleStatusAction(apt, "COMPLETED")}
                                  className="min-h-[38px] px-2.5 py-1.5 border border-[#012d61] text-[#012d61] hover:bg-slate-100 text-xs font-bold uppercase tracking-wider cursor-pointer"
                                >
                                  Complete
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleStatusAction(apt, "NO_SHOW")}
                                  className="min-h-[38px] px-2.5 py-1.5 border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-bold uppercase tracking-wider cursor-pointer"
                                >
                                  No-Show
                                </button>
                              </>
                            )}

                            {apt.status !== "CANCELLED" && apt.status !== "COMPLETED" && (
                              <button
                                type="button"
                                onClick={() =>
                                  handleStatusAction(
                                    apt,
                                    "CANCELLED",
                                    "Cancelled by Front Desk; fixed slot released"
                                  )
                                }
                                className="min-h-[38px] px-2.5 py-1.5 border border-rose-300 text-rose-700 hover:bg-rose-50 text-xs font-bold uppercase tracking-wider cursor-pointer"
                              >
                                Cancel
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() => handleResendSms(apt)}
                              title="Resend latest SMS notification"
                              className="min-h-[38px] px-2.5 py-1.5 border border-slate-300 text-slate-700 hover:border-[#0057b8] hover:text-[#0057b8] text-xs font-bold uppercase tracking-wider cursor-pointer"
                            >
                              Resend SMS
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </div>

        {/* 4. 15-Second Phone Hotline & Walk-In Quick Booking Drawer */}
        {showQuickBook && (
          <div className="fixed inset-0 z-50 bg-slate-950/60 flex justify-end">
            <div className="w-full max-w-xl bg-white h-full overflow-y-auto p-6 sm:p-8 shadow-2xl border-l border-[#e5e7eb] flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between border-b border-[#e5e7eb] pb-4">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#0057b8]">
                      15-Second Reception Desk Workflow
                    </p>
                    <h3 className="mc-serif text-2xl text-[#012d61] mt-1">
                      Phone Hotline (`10666`) & Walk-In Quick Booking
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowQuickBook(false)}
                    className="p-2 text-slate-500 hover:text-slate-900 cursor-pointer"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <form onSubmit={handleQuickBookSubmit} className="mt-6 space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                        Booking Source
                      </label>
                      <select
                        value={qbBookingSource}
                        onChange={(e) =>
                          setQbBookingSource(
                            e.target.value as "FRONT_DESK_PHONE" | "WALK_IN_DESK"
                          )
                        }
                        className="w-full min-h-[44px] border border-slate-300 px-3 py-2 text-sm font-semibold text-[#012d61]"
                      >
                        <option value="FRONT_DESK_PHONE">Phone Hotline (10666)</option>
                        <option value="WALK_IN_DESK">Walk-In Reception Desk</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                        Visit Type
                      </label>
                      <select
                        value={qbVisitType}
                        onChange={(e) =>
                          setQbVisitType(
                            e.target.value as "NEW_VISIT" | "FOLLOW_UP" | "REPORT_SHOW"
                          )
                        }
                        className="w-full min-h-[44px] border border-slate-300 px-3 py-2 text-sm font-semibold"
                      >
                        <option value="NEW_VISIT">New Consultation / নতুন রোগী</option>
                        <option value="FOLLOW_UP">Follow-Up / ফলো-আপ</option>
                        <option value="REPORT_SHOW">Report Show / রিপোর্ট দেখানো</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                        Hospital Branch
                      </label>
                      <select
                        value={qbBranchId}
                        onChange={(e) => setQbBranchId(e.target.value)}
                        className="w-full min-h-[44px] border border-slate-300 px-3 py-2 text-sm font-semibold"
                      >
                        {branches.map((b) => (
                          <option key={b.id} value={b.id}>
                            {b.nameEn}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                        Specialist Doctor
                      </label>
                      <select
                        value={qbDoctorId}
                        onChange={(e) => setQbDoctorId(e.target.value)}
                        className="w-full min-h-[44px] border border-slate-300 px-3 py-2 text-sm font-semibold"
                      >
                        {doctors.map((d) => (
                          <option key={d.id} value={d.id}>
                            {d.nameEn}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                      Appointment Date
                    </label>
                    <input
                      type="date"
                      value={qbDate}
                      onChange={(e) => setQbDate(e.target.value)}
                      className="w-full min-h-[44px] border border-slate-300 px-3 py-2 text-sm font-semibold tabular-nums"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-600 mb-2">
                      Select Green AVAILABLE Fixed Time Slot
                    </label>
                    {qbAvailability && qbAvailability.slots.length > 0 ? (
                      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-48 overflow-y-auto p-1">
                        {qbAvailability.slots.map((s) => {
                          const disabled = s.status !== "AVAILABLE";
                          const active = qbSlot === s.time;
                          return (
                            <button
                              key={s.time}
                              type="button"
                              disabled={disabled}
                              onClick={() => setQbSlot(s.time)}
                              className={`min-h-[44px] px-2 py-1.5 text-xs font-bold tabular-nums border transition-colors ${
                                active
                                  ? "border-[#0057b8] bg-[#012d61] text-white"
                                  : disabled
                                    ? "border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed"
                                    : "border-emerald-500 bg-emerald-50 text-emerald-950 hover:bg-emerald-100 cursor-pointer"
                              }`}
                            >
                              <div>{s.labelEn}</div>
                              <div className="text-[10px] font-normal">{s.status}</div>
                            </button>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-xs text-rose-700 bg-rose-50 p-3 border border-rose-200">
                        No open slots on {qbDate}. Pick another date or open Custom Hours in the Schedule Manager.
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                        Patient Full Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={qbPatientName}
                        onChange={(e) => setQbPatientName(e.target.value)}
                        placeholder="e.g. Mahmudul Hasan"
                        className="w-full min-h-[44px] border border-slate-300 px-3 py-2 text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                        11-Digit BD Mobile (`01[3-9]XXXXXXXX`) *
                      </label>
                      <input
                        type="tel"
                        required
                        value={qbPatientPhone}
                        onChange={(e) => setQbPatientPhone(e.target.value)}
                        placeholder="01712345678"
                        className="w-full min-h-[44px] border border-slate-300 px-3 py-2 text-sm tabular-nums"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                        Patient Age
                      </label>
                      <input
                        type="number"
                        value={qbPatientAge}
                        onChange={(e) => setQbPatientAge(e.target.value)}
                        className="w-full min-h-[44px] border border-slate-300 px-3 py-2 text-sm tabular-nums"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                        Gender
                      </label>
                      <select
                        value={qbPatientGender}
                        onChange={(e) =>
                          setQbPatientGender(e.target.value as "MALE" | "FEMALE" | "OTHER")
                        }
                        className="w-full min-h-[44px] border border-slate-300 px-3 py-2 text-sm"
                      >
                        <option value="MALE">Male / পুরুষ</option>
                        <option value="FEMALE">Female / মহিলা</option>
                        <option value="OTHER">Other / অন্যান্য</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                      Symptoms / Reception Note (Optional)
                    </label>
                    <input
                      type="text"
                      value={qbSymptomsNote}
                      onChange={(e) => setQbSymptomsNote(e.target.value)}
                      placeholder="Chest discomfort / blood pressure follow-up"
                      className="w-full min-h-[44px] border border-slate-300 px-3 py-2 text-sm"
                    />
                  </div>

                  <div className="pt-3 flex items-center justify-end gap-3 border-t border-[#e5e7eb]">
                    <button
                      type="button"
                      onClick={() => setShowQuickBook(false)}
                      className="min-h-[44px] px-4 py-2 border border-slate-300 text-sm font-semibold text-slate-700"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={!qbSlot}
                      className="min-h-[44px] px-6 py-2.5 bg-[#0057b8] hover:bg-[#004494] disabled:bg-slate-300 text-white text-sm font-bold cursor-pointer"
                    >
                      Book as CONFIRMED & Send SMS
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Interactive Reschedule Modal */}
        {rescheduleTarget && (
          <div className="fixed inset-0 z-50 bg-slate-950/60 flex items-center justify-center p-4">
            <div className="w-full max-w-lg bg-white border border-[#e5e7eb] p-6 sm:p-8 shadow-2xl space-y-5">
              <div className="flex items-center justify-between border-b border-[#e5e7eb] pb-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#0057b8]">
                    Atomic Slot Reschedule & SMS Dispatch
                  </p>
                  <h3 className="mc-serif text-2xl text-[#012d61] mt-1">
                    Reschedule {rescheduleTarget.reference} ({rescheduleTarget.patientName})
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setRescheduleTarget(null)}
                  className="p-1.5 text-slate-500 hover:text-slate-900"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleConfirmReschedule} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                    Hospital Branch
                  </label>
                  <select
                    value={rsBranchId}
                    onChange={(e) => setRsBranchId(e.target.value)}
                    className="w-full min-h-[44px] border border-slate-300 px-3 py-2 text-sm font-semibold"
                  >
                    {branches.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.nameEn}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                    New Date
                  </label>
                  <input
                    type="date"
                    value={rsDate}
                    onChange={(e) => setRsDate(e.target.value)}
                    className="w-full min-h-[44px] border border-slate-300 px-3 py-2 text-sm font-semibold tabular-nums"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-2">
                    Select Available Fixed Slot on {rsDate}
                  </label>
                  {rsAvailability && rsAvailability.slots.length > 0 ? (
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-44 overflow-y-auto">
                      {rsAvailability.slots.map((s) => {
                        const disabled = s.status !== "AVAILABLE";
                        const active = rsSlot === s.time;
                        return (
                          <button
                            key={s.time}
                            type="button"
                            disabled={disabled}
                            onClick={() => setRsSlot(s.time)}
                            className={`min-h-[42px] px-2 py-1 text-xs font-bold tabular-nums border ${
                              active
                                ? "border-[#0057b8] bg-[#012d61] text-white"
                                : disabled
                                  ? "border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed"
                                  : "border-emerald-500 bg-emerald-50 text-emerald-950 hover:bg-emerald-100 cursor-pointer"
                            }`}
                          >
                            {s.labelEn}
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-xs text-rose-700">
                      No available slots on {rsDate}. Select another date.
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                    Reschedule Note
                  </label>
                  <input
                    type="text"
                    value={rsNote}
                    onChange={(e) => setRsNote(e.target.value)}
                    className="w-full min-h-[40px] border border-slate-300 px-3 py-1.5 text-sm"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#e5e7eb]">
                  <button
                    type="button"
                    onClick={() => setRescheduleTarget(null)}
                    className="min-h-[44px] px-4 py-2 border border-slate-300 text-sm font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!rsSlot}
                    className="min-h-[44px] px-6 py-2 bg-[#0057b8] hover:bg-[#004494] disabled:bg-slate-300 text-white text-sm font-bold cursor-pointer"
                  >
                    Confirm New Slot & Send Reschedule SMS
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* SMS Log Drawer */}
        {smsLogTarget && (
          <div className="fixed inset-0 z-50 bg-slate-950/60 flex items-center justify-center p-4">
            <div className="w-full max-w-xl bg-white border border-[#e5e7eb] p-6 sm:p-8 shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-[#e5e7eb] pb-3">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#0057b8]">
                    Bangladesh SMS Gateway Audit Trail (`prisma.smsLog`)
                  </p>
                  <h3 className="mc-serif text-xl text-[#012d61]">
                    SMS Dispatches for {smsLogTarget.reference} ({smsLogTarget.patientPhone})
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setSmsLogTarget(null)}
                  className="p-1.5 text-slate-500 hover:text-slate-900"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-3 max-h-80 overflow-y-auto">
                {smsLogTarget.smsLogs && smsLogTarget.smsLogs.length > 0 ? (
                  smsLogTarget.smsLogs.map((log) => (
                    <div key={log.id} className="border border-[#e5e7eb] p-3.5 text-xs space-y-1.5">
                      <div className="flex items-center justify-between font-bold text-[#012d61]">
                        <span>
                          {log.eventType} · {log.provider}
                        </span>
                        <span className="tabular-nums text-emerald-700">{log.deliveryStatus}</span>
                      </div>
                      <p className="text-slate-800 leading-relaxed">{log.messageBody}</p>
                      <p className="text-[11px] text-slate-400 tabular-nums">
                        Dispatched: {new Date(log.sentAt).toLocaleString()}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-slate-500 py-4">
                    No SMS logs recorded yet for this appointment. Click &quot;Resend SMS&quot; below to trigger one now.
                  </p>
                )}
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-[#e5e7eb]">
                <button
                  type="button"
                  onClick={() => handleResendSms(smsLogTarget)}
                  className="min-h-[42px] px-4 py-2 bg-[#0057b8] text-white text-xs font-bold uppercase tracking-wider cursor-pointer"
                >
                  Trigger / Resend SMS Now
                </button>
                <button
                  type="button"
                  onClick={() => setSmsLogTarget(null)}
                  className="min-h-[42px] px-4 py-2 border border-slate-300 text-xs font-bold uppercase"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 5. Printable Daily Chamber Roster (A4 @media print view) */}
      <div className="hidden print:block p-8 text-black bg-white">
        <div className="border-b-2 border-[#012d61] pb-4 mb-6 flex items-start justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#012d61]">
              DeltaCare Multispecialty Hospital Limited · Daily Chamber Roster (A4)
            </p>
            <h1 className="mc-serif text-2xl font-bold text-[#012d61] mt-1">
              {selectedDoctor?.nameEn} ({selectedDoctor?.nameBn})
            </h1>
            <p className="text-xs text-slate-700 mt-0.5">
              {selectedDoctor?.qualificationsEn} · BMDC Reg: {selectedDoctor?.bmdcNumber}
            </p>
          </div>
          <div className="text-right text-xs tabular-nums">
            <p className="font-bold text-[#012d61]">{selectedBranch?.nameEn}</p>
            <p>Chamber Room: {availability?.chamberRoom ?? "Room #402, 3rd Floor"}</p>
            <p className="font-bold mt-1">Chamber Date: {selectedDate}</p>
          </div>
        </div>

        <table className="w-full border-collapse border border-slate-400 text-xs">
          <thead>
            <tr className="bg-slate-100 text-left">
              <th className="border border-slate-400 p-2">Serial #</th>
              <th className="border border-slate-400 p-2">Slot Time</th>
              <th className="border border-slate-400 p-2">Reference Code</th>
              <th className="border border-slate-400 p-2">Patient Name</th>
              <th className="border border-slate-400 p-2">Age / Gender</th>
              <th className="border border-slate-400 p-2">Visit Type</th>
              <th className="border border-slate-400 p-2">Mobile</th>
              <th className="border border-slate-400 p-2">Status</th>
              <th className="border border-slate-400 p-2">Remarks / Signature</th>
            </tr>
          </thead>
          <tbody>
            {printableRoster.map((apt, idx) => (
              <tr key={apt.id}>
                <td className="border border-slate-400 p-2 font-bold tabular-nums">#{idx + 1}</td>
                <td className="border border-slate-400 p-2 font-bold tabular-nums">
                  {apt.preferredTimeSlot}
                </td>
                <td className="border border-slate-400 p-2 tabular-nums">{apt.reference}</td>
                <td className="border border-slate-400 p-2 font-semibold">{apt.patientName}</td>
                <td className="border border-slate-400 p-2 tabular-nums">
                  {apt.patientAge ?? "—"} / {apt.patientGender ?? "—"}
                </td>
                <td className="border border-slate-400 p-2">
                  {apt.visitType ?? "NEW_CONSULTATION"}
                </td>
                <td className="border border-slate-400 p-2 tabular-nums">{apt.patientPhone}</td>
                <td className="border border-slate-400 p-2 font-bold">{apt.status}</td>
                <td className="border border-slate-400 p-2">{apt.symptomsNote ?? ""}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

