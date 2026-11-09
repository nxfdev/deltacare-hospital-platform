"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  AlertCircle,
  ArrowRight,
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  MapPin,
  PhoneCall,
  ShieldCheck,
  Stethoscope,
  UserCheck,
} from "lucide-react";
import { Branch, Department, Doctor } from "@/types/domain";
import {
  DigitalAppointmentSlip,
  DigitalSlipAppointment,
} from "@/components/appointments/DigitalAppointmentSlip";

interface AvailabilitySlot {
  time: string;
  labelEn: string;
  labelBn: string;
  status: "AVAILABLE" | "BOOKED" | "BLOCKED" | "PAST";
}

interface AvailabilityData {
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

function build14DayStrip(): Array<{
  iso: string;
  dayName: string;
  dayNum: string;
  monthShort: string;
}> {
  const now = new Date();
  const list = [];
  for (let i = 0; i < 14; i++) {
    const d = new Date(now.getTime() + i * 86400000);
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
    list.push({
      iso,
      dayName: parts.find((p) => p.type === "weekday")?.value ?? "",
      dayNum: parts.find((p) => p.type === "day")?.value ?? "",
      monthShort: parts.find((p) => p.type === "month")?.value ?? "",
    });
  }
  return list;
}

export function PublicThreeStepBookingClient({
  branches,
  departments,
  doctors,
}: {
  branches: Branch[];
  departments: Department[];
  doctors: Doctor[];
}) {
  const searchParams = useSearchParams();
  const dateStrip = useMemo(() => build14DayStrip(), []);

  // Resolve initial selections from URL query (?doctor=slug&branch=slug or ?doctorId=...&branchId=...)
  const initialDoctor = useMemo(() => {
    const qDoc =
      searchParams.get("doctor") ||
      searchParams.get("doctorId") ||
      searchParams.get("slug");
    if (qDoc) {
      const found = doctors.find(
        (d) =>
          d.slug.toLowerCase() === qDoc.toLowerCase() ||
          d.id.toLowerCase() === qDoc.toLowerCase() ||
          d.slug.includes(qDoc.toLowerCase())
      );
      if (found) return found;
    }
    return doctors[0];
  }, [doctors, searchParams]);

  const initialBranchId = useMemo(() => {
    const qBranch = searchParams.get("branch") || searchParams.get("branchId");
    if (qBranch) {
      const found = branches.find(
        (b) =>
          b.slug.toLowerCase().includes(qBranch.toLowerCase()) ||
          b.id.toLowerCase().includes(qBranch.toLowerCase()) ||
          b.cityEn.toLowerCase().includes(qBranch.toLowerCase())
      );
      if (found) return found.id;
    }
    return initialDoctor?.branches[0]?.branchId || branches[0]?.id || "branch-dhanmondi";
  }, [branches, initialDoctor, searchParams]);

  const [selectedBranchId, setSelectedBranchId] = useState<string>(initialBranchId);
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<string>(
    initialDoctor?.departmentId || "ALL"
  );
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>(
    initialDoctor?.id || doctors[0]?.id || "doc-cardio-1"
  );

  // Step 2 state
  const [selectedDate, setSelectedDate] = useState<string>(
    dateStrip[1]?.iso || dateStrip[0]?.iso || "2026-03-10"
  );
  const [selectedSlot, setSelectedSlot] = useState<string>("");
  const [availability, setAvailability] = useState<AvailabilityData | null>(null);
  const [loadingSlots, setLoadingSlots] = useState<boolean>(false);

  // Step 3 state
  const [patientName, setPatientName] = useState("");
  const [patientPhone, setPatientPhone] = useState("");
  const [patientAge, setPatientAge] = useState("34");
  const [patientGender, setPatientGender] = useState<"MALE" | "FEMALE" | "OTHER">("MALE");
  const [visitType, setVisitType] = useState<
    "NEW_CONSULTATION" | "FOLLOW_UP" | "REPORT_SHOW"
  >("NEW_CONSULTATION");
  const [symptomsNote, setSymptomsNote] = useState("");
  const [consentAccepted, setConsentAccepted] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [completedSlip, setCompletedSlip] = useState<DigitalSlipAppointment | null>(null);

  const filteredDoctors = useMemo(() => {
    return doctors.filter((doc) => {
      if (selectedDepartmentId !== "ALL" && doc.departmentId !== selectedDepartmentId) {
        return false;
      }
      return true;
    });
  }, [doctors, selectedDepartmentId]);

  const selectedDoctor = useMemo(
    () => doctors.find((d) => d.id === selectedDoctorId) ?? doctors[0],
    [doctors, selectedDoctorId]
  );

  const selectedBranch = useMemo(
    () => branches.find((b) => b.id === selectedBranchId) ?? branches[0],
    [branches, selectedBranchId]
  );

  const selectedDepartment = useMemo(
    () => departments.find((d) => d.id === selectedDoctor?.departmentId),
    [departments, selectedDoctor]
  );

  const loadAvailability = useCallback(
    async (docId: string, brId: string, dateIso: string) => {
      if (!docId || !brId || !dateIso) return;
      setLoadingSlots(true);
      setSelectedSlot("");
      try {
        const res = await fetch(
          `/api/v1/public/availability?doctorId=${encodeURIComponent(docId)}&branchId=${encodeURIComponent(brId)}&date=${encodeURIComponent(dateIso)}`,
          { cache: "no-store" }
        );
        const data = await res.json();
        if (data.slots) {
          setAvailability(data);
          const firstAvail = data.slots.find(
            (s: AvailabilitySlot) => s.status === "AVAILABLE"
          );
          if (firstAvail) {
            setSelectedSlot(firstAvail.time);
          }
        }
      } catch {
        // ignore fetch error
      } finally {
        setLoadingSlots(false);
      }
    },
    []
  );

  useEffect(() => {
    void loadAvailability(selectedDoctorId, selectedBranchId, selectedDate);
  }, [selectedDoctorId, selectedBranchId, selectedDate, loadAvailability]);

  async function handleBookingSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg(null);

    const normalizedPhone = patientPhone.trim().replace(/^\+?88/, "");
    if (!/^01[3-9]\d{8}$/.test(normalizedPhone)) {
      setErrorMsg(
        "Please enter a valid 11-digit Bangladeshi mobile number (e.g., 01712345678)."
      );
      return;
    }

    if (!selectedSlot) {
      setErrorMsg("Please select an available fixed time slot in Step 2.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/v1/public/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientName: patientName.trim(),
          patientPhone: normalizedPhone,
          patientAge: Number(patientAge) || 32,
          patientGender,
          departmentId: selectedDoctor?.departmentId || "dept-cardiology",
          doctorId: selectedDoctorId,
          branchId: selectedBranchId,
          preferredDate: selectedDate,
          preferredTimeSlot: selectedSlot,
          visitType,
          bookingSource: "ONLINE_WEBSITE",
          reason: symptomsNote.trim() || `${visitType} specialist consultation`,
          symptomsNote: symptomsNote.trim() || undefined,
          consentAccepted,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setErrorMsg(
          data.error || "Unable to complete booking. Please choose another slot."
        );
      } else {
        setCompletedSlip(data.appointment);
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    } catch {
      setErrorMsg("Network error submitting appointment request.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-white text-slate-900">
      {/* Full-Bleed Deep Navy Header (#012d61) */}
      <section className="print:hidden w-full bg-[#012d61] text-white py-12 md:py-16 border-b border-[#0057b8]/30">
        <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-10">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-sky-300">
                Care at DeltaCare · Real-Time Multi-Branch Fixed-Slot Engine
              </p>
              <h1 className="mc-serif mt-2 text-3xl sm:text-5xl font-normal tracking-tight text-white">
                Book a Specialist Consultation
              </h1>
              <p className="mt-2 text-base sm:text-lg text-slate-200 max-w-3xl">
                বিশেষজ্ঞ ডাক্তারের অ্যাপয়েন্টমেন্ট · Select your preferred branch, verified BMDC consultant, and live 15/20-minute fixed chamber slot with instant SMS confirmation.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Link
                href="/appointments/track"
                className="inline-flex min-h-[44px] items-center gap-2 border border-white/30 bg-white/10 hover:bg-white/20 text-white font-semibold px-5 py-2.5 text-sm transition-colors"
              >
                Track Existing Booking / Digital Slip →
              </Link>
              <Link
                href="/dashboard/front-desk"
                className="inline-flex min-h-[44px] items-center gap-2 border border-sky-400/40 px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-sky-200 hover:text-white"
              >
                Staff / Assistant Desk
              </Link>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-10 py-10">
        {completedSlip ? (
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="print:hidden border-l-4 border-emerald-600 bg-emerald-50 p-5 flex items-start gap-3">
              <CheckCircle2 className="h-6 w-6 text-emerald-700 shrink-0 mt-0.5" />
              <div>
                <h2 className="font-bold text-base text-emerald-950">
                  Appointment Request Recorded & SMS Notification Dispatched!
                </h2>
                <p className="text-sm text-emerald-900 mt-0.5">
                  Your fixed chamber slot (<strong>{completedSlip.preferredTimeSlot}</strong> on{" "}
                  <strong>{completedSlip.preferredDate}</strong>) has been reserved under Reference{" "}
                  <strong className="tabular-nums">{completedSlip.reference}</strong>. Print or save your Digital Appointment Slip below.
                </p>
              </div>
            </div>

            <DigitalAppointmentSlip
              appointment={completedSlip}
              onResetBooking={() => {
                setCompletedSlip(null);
                void loadAvailability(selectedDoctorId, selectedBranchId, selectedDate);
              }}
            />
          </div>
        ) : (
          <div className="space-y-12">
            {/* Step Progress Strip */}
            <div className="grid grid-cols-1 md:grid-cols-3 border-y border-[#e5e7eb] divide-y md:divide-y-0 md:divide-x divide-[#e5e7eb]">
              <div className="py-4 md:pr-6 flex items-center gap-3">
                <span className="h-8 w-8 bg-[#012d61] text-white font-bold text-sm flex items-center justify-center tabular-nums">
                  1
                </span>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-[#0057b8]">
                    Step 1 · Specialist & Campus
                  </p>
                  <p className="text-sm font-semibold text-[#012d61]">
                    Select Branch, Department & Doctor
                  </p>
                </div>
              </div>

              <div className="py-4 md:px-6 flex items-center gap-3">
                <span className="h-8 w-8 bg-[#012d61] text-white font-bold text-sm flex items-center justify-center tabular-nums">
                  2
                </span>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-[#0057b8]">
                    Step 2 · Real-Time Chamber Schedule
                  </p>
                  <p className="text-sm font-semibold text-[#012d61]">
                    14-Day Date Strip & Fixed Time Slot
                  </p>
                </div>
              </div>

              <div className="py-4 md:pl-6 flex items-center gap-3">
                <span className="h-8 w-8 bg-[#012d61] text-white font-bold text-sm flex items-center justify-center tabular-nums">
                  3
                </span>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-[#0057b8]">
                    Step 3 · Patient Details & SMS Slip
                  </p>
                  <p className="text-sm font-semibold text-[#012d61]">
                    BD Mobile Verification & Instant Slip
                  </p>
                </div>
              </div>
            </div>

            {/* STEP 1: Select Branch, Department & Doctor */}
            <section aria-labelledby="step-1-heading" className="space-y-6">
              <div className="border-b border-[#e5e7eb] pb-4">
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#0057b8]">
                  Step 01 · Multi-Branch Specialist Selection
                </p>
                <h2
                  id="step-1-heading"
                  className="mc-serif mt-1 text-2xl sm:text-3xl font-normal text-[#012d61]"
                >
                  Choose Hospital Branch, Department & Consultant
                </h2>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Left 5 cols: Branch & Department Filters + Doctor Selector */}
                <div className="lg:col-span-5 space-y-5">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-[0.16em] text-slate-600 mb-2">
                      1A · Select Hospital Branch / Campus
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {branches.map((branch) => {
                        const active = branch.id === selectedBranchId;
                        return (
                          <button
                            key={branch.id}
                            type="button"
                            onClick={() => setSelectedBranchId(branch.id)}
                            className={`min-h-[54px] p-3 text-left border transition-colors cursor-pointer ${
                              active
                                ? "border-[#0057b8] bg-[#012d61] text-white"
                                : "border-[#e5e7eb] bg-white text-slate-900 hover:border-[#0057b8]"
                            }`}
                          >
                            <div className="text-xs font-bold truncate">
                              {branch.nameEn}
                            </div>
                            <div
                              className={`text-[11px] truncate mt-0.5 ${
                                active ? "text-sky-200" : "text-slate-500"
                              }`}
                            >
                              {branch.nameBn} · Hotline: {branch.emergencyPhone}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="public-dept-select"
                      className="block text-xs font-bold uppercase tracking-[0.16em] text-slate-600 mb-2"
                    >
                      1B · Filter by Clinical Department
                    </label>
                    <select
                      id="public-dept-select"
                      value={selectedDepartmentId}
                      onChange={(e) => {
                        const nextDept = e.target.value;
                        setSelectedDepartmentId(nextDept);
                        if (nextDept !== "ALL") {
                          const firstDoc = doctors.find((d) => d.departmentId === nextDept);
                          if (firstDoc) setSelectedDoctorId(firstDoc.id);
                        }
                      }}
                      className="w-full min-h-[48px] border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-[#012d61] focus:border-[#0057b8] focus:outline-none"
                    >
                      <option value="ALL">All Clinical Departments ({departments.length})</option>
                      {departments.map((dept) => (
                        <option key={dept.id} value={dept.id}>
                          {dept.nameEn} ({dept.nameBn})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label
                      htmlFor="public-doc-select"
                      className="block text-xs font-bold uppercase tracking-[0.16em] text-slate-600 mb-2"
                    >
                      1C · Select Specialist Consultant
                    </label>
                    <select
                      id="public-doc-select"
                      value={selectedDoctorId}
                      onChange={(e) => setSelectedDoctorId(e.target.value)}
                      className="w-full min-h-[48px] border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-[#012d61] focus:border-[#0057b8] focus:outline-none"
                    >
                      {filteredDoctors.map((doc) => (
                        <option key={doc.id} value={doc.id}>
                          {doc.nameEn} — {doc.designationEn} (৳{doc.consultationFeeBdt})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Right 7 cols: Selected Doctor Academic & Chamber Profile Card */}
                {selectedDoctor && (
                  <div className="lg:col-span-7 border border-[#e5e7eb] bg-slate-50/60 p-6 sm:p-8 flex flex-col justify-between">
                    <div className="flex flex-col sm:flex-row items-start gap-6">
                      {/* Doctor Portrait / Monogram */}
                      <div className="h-24 w-24 shrink-0 bg-[#012d61] text-white flex items-center justify-center mc-serif text-3xl font-normal border-2 border-[#0057b8]">
                        {selectedDoctor.nameEn
                          .replace(/^Prof\.\s*|^Dr\.\s*|^Brig\.\s*Gen\.\s*/gi, "")
                          .slice(0, 2)
                          .toUpperCase()}
                      </div>

                      <div className="space-y-2 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="px-2.5 py-0.5 bg-[#012d61] text-white text-[11px] font-bold uppercase tracking-wider">
                            {selectedDepartment?.nameEn || "Specialist"}
                          </span>
                          <span className="px-2.5 py-0.5 bg-sky-100 text-[#012d61] text-[11px] font-bold tabular-nums">
                            BMDC Reg: {selectedDoctor.bmdcRegistrationNo}
                          </span>
                        </div>

                        <h3 className="mc-serif text-2xl sm:text-3xl text-[#012d61]">
                          {selectedDoctor.nameEn}
                        </h3>
                        <p className="text-sm font-medium text-slate-700">
                          {selectedDoctor.nameBn}
                        </p>

                        <p className="text-sm font-bold text-[#0057b8]">
                          {selectedDoctor.qualificationsEn}
                        </p>

                        {selectedDoctor.workplaceEn && (
                          <p className="text-xs sm:text-sm text-slate-700">
                            <strong>Workplace:</strong> {selectedDoctor.workplaceEn}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="mt-6 pt-5 border-t border-[#e5e7eb] grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-500">
                          Chamber Room #
                        </span>
                        <span className="mt-0.5 block font-bold text-[#012d61]">
                          {availability?.chamberRoom || "Room #402, 3rd Floor"}
                        </span>
                        <span className="text-xs text-slate-500">
                          {selectedBranch?.nameEn}
                        </span>
                      </div>

                      <div>
                        <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-500">
                          New Consultation Fee
                        </span>
                        <span className="mt-0.5 block text-xl font-bold text-[#012d61] tabular-nums">
                          ৳{selectedDoctor.consultationFeeBdt}
                        </span>
                        <span className="text-xs text-slate-500">BDT (New Visit)</span>
                      </div>

                      <div>
                        <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-500">
                          Follow-Up / Report Fee
                        </span>
                        <span className="mt-0.5 block text-xl font-bold text-[#0057b8] tabular-nums">
                          ৳{selectedDoctor.followupFeeBdt ?? 700}
                        </span>
                        <span className="text-xs text-slate-500">Within 30 Days</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </section>

            {/* STEP 2: 14-Day Date Strip & Fixed Time Slot Grid */}
            <section aria-labelledby="step-2-heading" className="space-y-6 border-t border-[#e5e7eb] pt-10">
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[#e5e7eb] pb-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#0057b8]">
                    Step 02 · Live Chamber Slot Availability
                  </p>
                  <h2
                    id="step-2-heading"
                    className="mc-serif mt-1 text-2xl sm:text-3xl font-normal text-[#012d61]"
                  >
                    Select Appointment Date & Fixed Time Slot
                  </h2>
                </div>

                <div className="flex items-center gap-4 text-xs font-semibold">
                  <span className="inline-flex items-center gap-1.5 text-emerald-800">
                    <span className="h-3 w-3 bg-emerald-600 inline-block" /> Available
                  </span>
                  <span className="inline-flex items-center gap-1.5 text-[#012d61]">
                    <span className="h-3 w-3 bg-[#012d61] inline-block" /> Selected
                  </span>
                  <span className="inline-flex items-center gap-1.5 text-slate-400">
                    <span className="h-3 w-3 bg-slate-300 inline-block" /> Booked / Blocked
                  </span>
                </div>
              </div>

              {/* 14-Day Date Strip */}
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.15em] text-slate-500 mb-2.5">
                  14-Day Consultation Calendar (Asia/Dhaka)
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 lg:grid-cols-14 gap-2">
                  {dateStrip.map((d) => {
                    const active = d.iso === selectedDate;
                    return (
                      <button
                        key={d.iso}
                        type="button"
                        onClick={() => setSelectedDate(d.iso)}
                        className={`min-h-[66px] p-2.5 text-left border transition-colors flex flex-col justify-between cursor-pointer ${
                          active
                            ? "border-[#0057b8] bg-[#012d61] text-white"
                            : "border-[#e5e7eb] bg-white text-slate-800 hover:border-[#0057b8]"
                        }`}
                      >
                        <span
                          className={`text-[11px] font-bold uppercase ${
                            active ? "text-sky-300" : "text-slate-500"
                          }`}
                        >
                          {d.dayName}
                        </span>
                        <span className="text-base font-bold tabular-nums">
                          {d.dayNum} <span className="text-xs font-normal">{d.monthShort}</span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Fixed Time Slot Grid */}
              <div>
                {loadingSlots ? (
                  <div className="py-12 text-center text-sm text-slate-500 border border-[#e5e7eb]">
                    Checking live chamber slots for {selectedDate}...
                  </div>
                ) : availability && availability.isAvailableDay && availability.slots.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
                    {availability.slots.map((slot) => {
                      const isAvailable = slot.status === "AVAILABLE";
                      const isSelected = selectedSlot === slot.time && isAvailable;
                      return (
                        <button
                          key={slot.time}
                          type="button"
                          disabled={!isAvailable}
                          onClick={() => setSelectedSlot(slot.time)}
                          className={`min-h-[62px] p-3 text-left border transition-all flex flex-col justify-between ${
                            isSelected
                              ? "border-[#0057b8] bg-[#012d61] text-white shadow-sm cursor-pointer"
                              : isAvailable
                                ? "border-emerald-600/40 bg-emerald-50/40 hover:bg-emerald-100/70 text-emerald-950 cursor-pointer"
                                : "border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed opacity-75"
                          }`}
                        >
                          <div className="flex items-center justify-between w-full">
                            <span className="text-sm font-bold tabular-nums">
                              {slot.labelEn}
                            </span>
                            <span className="text-[10px] font-bold uppercase">
                              {isSelected ? "SELECTED" : slot.status}
                            </span>
                          </div>
                          <div className="mt-1 flex items-center justify-between text-xs opacity-90">
                            <span>{slot.labelBn}</span>
                            <span className="tabular-nums text-[11px]">{slot.time}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="border-l-4 border-amber-500 bg-amber-50/70 p-6 space-y-1.5">
                    <p className="font-bold text-base text-[#012d61]">
                      {availability?.unavailableReasonEn ||
                        "Doctor does not have an active chamber session on this date."}
                    </p>
                    {availability?.unavailableReasonBn && (
                      <p className="text-sm text-slate-700">
                        {availability.unavailableReasonBn}
                      </p>
                    )}
                    <p className="text-xs text-slate-600">
                      Please select another date on the 14-day strip above or switch to an alternate DeltaCare campus.
                    </p>
                  </div>
                )}
              </div>
            </section>

            {/* STEP 3: Patient Details & Atomic Submission */}
            <section aria-labelledby="step-3-heading" className="border-t border-[#e5e7eb] pt-10">
              <div className="border-b border-[#e5e7eb] pb-4 mb-6">
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#0057b8]">
                  Step 03 · Patient Registration & SMS Verification
                </p>
                <h2
                  id="step-3-heading"
                  className="mc-serif mt-1 text-2xl sm:text-3xl font-normal text-[#012d61]"
                >
                  Enter Patient Details & Complete Booking
                </h2>
              </div>

              {errorMsg && (
                <div className="mb-6 p-4 border-l-4 border-red-600 bg-red-50 text-red-900 flex items-center gap-3 text-sm font-medium">
                  <AlertCircle className="h-5 w-5 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <form onSubmit={handleBookingSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                <div className="lg:col-span-8 space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                      <label
                        htmlFor="patient-name"
                        className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2"
                      >
                        Patient Full Name / রোগীর নাম *
                      </label>
                      <input
                        id="patient-name"
                        type="text"
                        required
                        value={patientName}
                        onChange={(e) => setPatientName(e.target.value)}
                        placeholder="e.g. Tariqul Islam"
                        className="w-full min-h-[48px] border border-slate-300 px-4 py-2.5 text-sm focus:border-[#0057b8] focus:outline-none"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="patient-phone"
                        className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2"
                      >
                        BD Mobile Number (`01[3-9]XXXXXXXX`) *
                      </label>
                      <input
                        id="patient-phone"
                        type="tel"
                        required
                        value={patientPhone}
                        onChange={(e) => setPatientPhone(e.target.value)}
                        placeholder="01712345678"
                        className="w-full min-h-[48px] border border-slate-300 px-4 py-2.5 text-sm tabular-nums focus:border-[#0057b8] focus:outline-none"
                      />
                      <p className="mt-1 text-[11px] text-slate-500">
                        Bilingual SMS confirmation & Reference Code will be sent to this number.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                    <div>
                      <label
                        htmlFor="patient-age"
                        className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2"
                      >
                        Patient Age (Years) *
                      </label>
                      <input
                        id="patient-age"
                        type="number"
                        min={0}
                        max={120}
                        required
                        value={patientAge}
                        onChange={(e) => setPatientAge(e.target.value)}
                        className="w-full min-h-[48px] border border-slate-300 px-4 py-2.5 text-sm tabular-nums focus:border-[#0057b8] focus:outline-none"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="patient-gender"
                        className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2"
                      >
                        Gender / লিঙ্গ *
                      </label>
                      <select
                        id="patient-gender"
                        value={patientGender}
                        onChange={(e) =>
                          setPatientGender(e.target.value as "MALE" | "FEMALE" | "OTHER")
                        }
                        className="w-full min-h-[48px] border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold focus:border-[#0057b8] focus:outline-none"
                      >
                        <option value="MALE">Male / পুরুষ</option>
                        <option value="FEMALE">Female / মহিলা</option>
                        <option value="OTHER">Other / অন্যান্য</option>
                      </select>
                    </div>

                    <div>
                      <label
                        htmlFor="visit-type"
                        className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2"
                      >
                        Visit Type / ভিজিটের ধরন *
                      </label>
                      <select
                        id="visit-type"
                        value={visitType}
                        onChange={(e) =>
                          setVisitType(
                            e.target.value as
                              | "NEW_CONSULTATION"
                              | "FOLLOW_UP"
                              | "REPORT_SHOW"
                          )
                        }
                        className="w-full min-h-[48px] border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-[#012d61] focus:border-[#0057b8] focus:outline-none"
                      >
                        <option value="NEW_CONSULTATION">
                          New Consultation / নতুন রোগী
                        </option>
                        <option value="FOLLOW_UP">Follow-up / ফলো-আপ</option>
                        <option value="REPORT_SHOW">
                          Report Show / রিপোর্ট দেখানো
                        </option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="symptoms-note"
                      className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2"
                    >
                      Brief Symptoms or Clinical Note (Optional)
                    </label>
                    <textarea
                      id="symptoms-note"
                      rows={3}
                      value={symptomsNote}
                      onChange={(e) => setSymptomsNote(e.target.value)}
                      placeholder="Describe primary symptoms, duration, or referral notes..."
                      className="w-full border border-slate-300 p-4 text-sm focus:border-[#0057b8] focus:outline-none"
                    />
                  </div>

                  <label className="flex items-start gap-3 text-xs sm:text-sm text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={consentAccepted}
                      onChange={(e) => setConsentAccepted(e.target.checked)}
                      required
                      className="mt-1 h-4 w-4 accent-[#0057b8]"
                    />
                    <span>
                      I confirm the patient details above and understand that I should report to the chamber desk at least 15 minutes prior to the selected fixed time slot.
                    </span>
                  </label>
                </div>

                {/* Live Booking Summary Column */}
                <div className="lg:col-span-4 border border-[#e5e7eb] bg-slate-50 p-6 flex flex-col justify-between space-y-6">
                  <div className="space-y-4">
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#0057b8]">
                      Appointment Summary
                    </p>
                    <div className="border-b border-[#e5e7eb] pb-3">
                      <p className="mc-serif text-xl text-[#012d61]">
                        {selectedDoctor?.nameEn}
                      </p>
                      <p className="text-xs text-slate-600 mt-0.5">
                        {selectedDoctor?.qualificationsEn}
                      </p>
                    </div>

                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Branch:</span>
                        <span className="font-semibold text-[#012d61]">
                          {selectedBranch?.nameEn}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Chamber Room:</span>
                        <span className="font-semibold text-slate-900">
                          {availability?.chamberRoom || "Room #402, 3rd Floor"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Selected Date:</span>
                        <span className="font-bold text-[#012d61] tabular-nums">
                          {selectedDate}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Fixed Time Slot:</span>
                        <span className="font-bold text-[#0057b8] tabular-nums">
                          {selectedSlot || "Select a slot above"}
                        </span>
                      </div>
                      <div className="flex justify-between pt-2 border-t border-[#e5e7eb]">
                        <span className="text-slate-600 font-semibold">
                          Applicable Fee:
                        </span>
                        <span className="text-lg font-bold text-[#012d61] tabular-nums">
                          ৳
                          {visitType === "NEW_CONSULTATION"
                            ? selectedDoctor?.consultationFeeBdt ?? 1200
                            : selectedDoctor?.followupFeeBdt ?? 700}
                        </span>
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={submitting || !selectedSlot}
                    className="w-full min-h-[52px] bg-[#0057b8] hover:bg-[#004494] disabled:bg-slate-300 text-white font-bold text-sm uppercase tracking-wider flex items-center justify-center gap-2 transition-colors cursor-pointer"
                  >
                    <span>
                      {submitting
                        ? "Booking Fixed Slot..."
                        : "Confirm Appointment Request & Get Slip"}
                    </span>
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </form>
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
