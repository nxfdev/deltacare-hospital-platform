"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Building2,
  UserCheck,
  ArrowRight,
} from "lucide-react";
import { Branch, Department, Doctor, Appointment } from "@/types/domain";
import { useLocale } from "@/lib/i18n/LocaleContext";
import { ComputedTimeSlot } from "@/server/services/appointmentService";

export function AppointmentBookingModule({
  departments,
  doctors,
  branches,
  preselectedDoctorId,
  preselectedDepartmentId,
  preselectedBranchId,
}: {
  departments: Department[];
  doctors: Doctor[];
  branches: Branch[];
  preselectedDoctorId?: string;
  preselectedDepartmentId?: string;
  preselectedBranchId?: string;
}) {
  const { locale, t } = useLocale();

  const initialDoctor =
    doctors.find((d) => d.id === preselectedDoctorId) ?? doctors[0];
  const initialDeptId =
    preselectedDepartmentId ??
    initialDoctor?.departmentId ??
    departments[0]?.id ??
    "";
  const initialBranchId =
    preselectedBranchId ??
    initialDoctor?.branches[0]?.branchId ??
    branches[0]?.id ??
    "";

  const [departmentId, setDepartmentId] = useState(initialDeptId);
  const [doctorId, setDoctorId] = useState(initialDoctor?.id ?? "");
  const [branchId, setBranchId] = useState(initialBranchId);
  const [preferredDate, setPreferredDate] = useState("2026-11-08");
  const [preferredTimeSlot, setPreferredTimeSlot] = useState("16:40");
  const [visitType, setVisitType] = useState<"NEW_CONSULTATION" | "FOLLOW_UP">(
    "NEW_CONSULTATION"
  );
  const [patientName, setPatientName] = useState("");
  const [patientPhone, setPatientPhone] = useState("");
  const [patientEmail, setPatientEmail] = useState("");
  const [reasonNote, setReasonNote] = useState("");
  const [consentAccepted, setConsentAccepted] = useState(false);

  const [slots, setSlots] = useState<ComputedTimeSlot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [submittedAppointment, setSubmittedAppointment] =
    useState<Appointment | null>(null);

  const filteredDoctors = departmentId
    ? doctors.filter((d) => d.departmentId === departmentId)
    : doctors;

  const activeDoctor =
    doctors.find((d) => d.id === doctorId) ?? filteredDoctors[0];

  const availableBranchesForDoctor = activeDoctor
    ? branches.filter((b) =>
        activeDoctor.branches.some(
          (db) => db.branchId === b.id && db.status === "ACTIVE"
        )
      )
    : branches;

  // Keep doctor & branch aligned when department changes
  useEffect(() => {
    if (
      filteredDoctors.length > 0 &&
      !filteredDoctors.some((d) => d.id === doctorId)
    ) {
      const nextDoc = filteredDoctors[0];
      setDoctorId(nextDoc.id);
      if (nextDoc.branches[0]) {
        setBranchId(nextDoc.branches[0].branchId);
      }
    }
  }, [departmentId, filteredDoctors, doctorId]);

  useEffect(() => {
    if (
      activeDoctor &&
      !activeDoctor.branches.some((b) => b.branchId === branchId)
    ) {
      if (activeDoctor.branches[0]) {
        setBranchId(activeDoctor.branches[0].branchId);
      }
    }
  }, [activeDoctor, branchId]);

  // Fetch real-time slot availability whenever doctor, branch, or date changes
  useEffect(() => {
    if (!doctorId || !branchId || !preferredDate) return;
    let cancelled = false;
    setLoadingSlots(true);
    fetch(
      `/api/v1/public/availability?doctorId=${encodeURIComponent(
        doctorId
      )}&branchId=${encodeURIComponent(branchId)}&date=${encodeURIComponent(
        preferredDate
      )}`
    )
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        const nextSlots: ComputedTimeSlot[] = data.slots ?? [];
        setSlots(nextSlots);
        const firstAvailable = nextSlots.find((s) => s.isAvailable);
        if (
          firstAvailable &&
          !nextSlots.some((s) => s.time === preferredTimeSlot && s.isAvailable)
        ) {
          setPreferredTimeSlot(firstAvailable.time);
        }
      })
      .catch(() => {
        if (!cancelled) setSlots([]);
      })
      .finally(() => {
        if (!cancelled) setLoadingSlots(false);
      });
    return () => {
      cancelled = true;
    };
  }, [doctorId, branchId, preferredDate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSubmitting(true);

    try {
      const res = await fetch("/api/v1/public/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          departmentId,
          doctorId,
          branchId,
          preferredDate,
          preferredTimeSlot,
          visitType,
          patientName,
          patientPhone,
          patientEmail,
          reasonNote,
          consentAccepted,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setErrorMsg(
          data.error || "Unable to submit appointment request. Please verify all fields."
        );
      } else {
        setSubmittedAppointment(data.appointment);
      }
    } catch {
      setErrorMsg("Network error submitting request. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (submittedAppointment) {
    return (
      <div className="rounded-2xl border-2 border-[#0057b8] bg-white p-6 md:p-8 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-full bg-[#e8f0f9] text-[#0057b8] flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-7 h-7" />
          </div>
          <div className="flex-1">
            <span className="inline-block px-3 py-1 rounded-full bg-[#fef3c7] text-[#92400e] text-xs font-bold uppercase tracking-wide">
              {locale === "bn"
                ? "অনুরোধ গৃহীত হয়েছে • স্ট্যাটাস: REQUESTED (চূড়ান্ত নিশ্চিতকরণের অপেক্ষায়)"
                : "Request Received • Status: REQUESTED (Pending Front-Desk Confirmation)"}
            </span>
            <h3 className="mt-2 mc-serif text-2xl md:text-3xl text-[#080808]">
              {locale === "bn"
                ? `রেফারেন্স কোড: ${submittedAppointment.reference}`
                : `Tracking Reference: ${submittedAppointment.reference}`}
            </h3>
            <p className="mt-2 text-sm text-[#424242]">
              {t.appointmentSection.unconfirmedNotice}
            </p>

            <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 p-4 rounded-xl bg-[#f2f2f2] border border-[#d6d6d6] text-sm">
              <div>
                <p className="text-xs text-[#686868]">
                  {locale === "bn" ? "রোগীর নাম" : "Patient Name"}
                </p>
                <p className="font-semibold text-[#080808]">
                  {submittedAppointment.patientName}
                </p>
              </div>
              <div>
                <p className="text-xs text-[#686868]">
                  {locale === "bn" ? "বিশেষজ্ঞ চিকিৎসক" : "Specialist"}
                </p>
                <p className="font-semibold text-[#080808]">
                  {activeDoctor
                    ? locale === "bn"
                      ? activeDoctor.nameBn
                      : activeDoctor.nameEn
                    : submittedAppointment.doctorId}
                </p>
              </div>
              <div>
                <p className="text-xs text-[#686868]">
                  {locale === "bn" ? "পছন্দের তারিখ ও স্লট" : "Preferred Date & Slot"}
                </p>
                <p className="font-semibold text-[#080808]">
                  {submittedAppointment.preferredDate} •{" "}
                  {submittedAppointment.preferredTimeSlot}
                </p>
              </div>
              <div>
                <p className="text-xs text-[#686868]">
                  {locale === "bn" ? "বর্তমান অবস্থা" : "Booking Status"}
                </p>
                <p className="font-bold text-[#b45309]">
                  {submittedAppointment.status}
                </p>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <Link
                href={`/track-appointment?reference=${encodeURIComponent(
                  submittedAppointment.reference
                )}&phone=${encodeURIComponent(submittedAppointment.patientPhone)}`}
                className="mc-btn-primary"
              >
                <span>
                  {locale === "bn"
                    ? "রিয়েল-টাইম স্ট্যাটাস ট্র্যাক করুন"
                    : "Track Request Status"}
                </span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <button
                type="button"
                onClick={() => setSubmittedAppointment(null)}
                className="mc-btn-secondary"
              >
                {locale === "bn"
                  ? "আরেকটি অনুরোধ জমা দিন"
                  : "Submit Another Request"}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-[#d6d6d6] bg-white p-6 md:p-8 shadow-sm">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-[#d6d6d6]">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-[#0057b8]">
            {t.appointmentSection.eyebrow}
          </p>
          <h2 className="mt-1 mc-serif text-3xl md:text-4xl text-[#080808]">
            {t.appointmentSection.title}
          </h2>
          <p className="mt-2 text-sm text-[#686868] max-w-3xl">
            {t.appointmentSection.subtitle}
          </p>
        </div>
        <div className="shrink-0">
          <Link
            href="/track-appointment"
            className="mc-btn-secondary text-sm py-2.5 px-4"
          >
            <span>{t.appointmentSection.trackExistingLink}</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {errorMsg && (
        <div
          role="alert"
          className="mt-5 p-4 rounded-xl bg-[#fef2f2] border border-[#dc2626] text-[#7f1d1d] flex items-start gap-3 text-sm"
        >
          <AlertCircle className="w-5 h-5 text-[#dc2626] shrink-0 mt-0.5" />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* 1. Department */}
          <div>
            <label
              htmlFor="apt-department"
              className="block text-sm font-semibold text-[#080808] mb-1.5"
            >
              {t.appointmentSection.departmentLabel}
            </label>
            <select
              id="apt-department"
              value={departmentId}
              onChange={(e) => setDepartmentId(e.target.value)}
              className="w-full h-12 px-3.5 rounded-lg border border-[#757575] bg-white text-sm text-[#080808]"
            >
              {departments.map((dept) => (
                <option key={dept.id} value={dept.id}>
                  {locale === "bn" ? dept.nameBn : dept.nameEn}
                </option>
              ))}
            </select>
          </div>

          {/* 2. Specialist Doctor */}
          <div>
            <label
              htmlFor="apt-doctor"
              className="block text-sm font-semibold text-[#080808] mb-1.5"
            >
              {t.appointmentSection.doctorLabel}
            </label>
            <select
              id="apt-doctor"
              value={doctorId}
              onChange={(e) => setDoctorId(e.target.value)}
              className="w-full h-12 px-3.5 rounded-lg border border-[#757575] bg-white text-sm text-[#080808]"
            >
              {filteredDoctors.map((doc) => (
                <option key={doc.id} value={doc.id}>
                  {locale === "bn" ? doc.nameBn : doc.nameEn} (BDT{" "}
                  {doc.consultationFeeBdt})
                </option>
              ))}
            </select>
          </div>

          {/* 3. Hospital Branch */}
          <div>
            <label
              htmlFor="apt-branch"
              className="block text-sm font-semibold text-[#080808] mb-1.5"
            >
              {t.appointmentSection.branchLabel}
            </label>
            <select
              id="apt-branch"
              value={branchId}
              onChange={(e) => setBranchId(e.target.value)}
              className="w-full h-12 px-3.5 rounded-lg border border-[#757575] bg-white text-sm text-[#080808]"
            >
              {availableBranchesForDoctor.map((br) => (
                <option key={br.id} value={br.id}>
                  {locale === "bn" ? br.nameBn : br.nameEn}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Selected Specialist Fee & Chamber Governance Strip */}
        {activeDoctor && (
          <div className="p-4 rounded-xl bg-[#e8f0f9] border border-[#c5e2f9] flex flex-wrap items-center justify-between gap-4 text-xs text-[#004181]">
            <div className="flex items-center gap-2.5">
              <UserCheck className="w-4 h-4 text-[#0057b8]" />
              <span className="font-semibold">
                {locale === "bn" ? activeDoctor.nameBn : activeDoctor.nameEn}
              </span>
              <span>•</span>
              <span>BMDC: {activeDoctor.bmdcRegistrationNo}</span>
            </div>
            <div className="flex flex-wrap items-center gap-4">
              <span>
                <strong>
                  {locale === "bn" ? "নতুন ফি:" : "Consultation Fee:"}
                </strong>{" "}
                BDT {activeDoctor.consultationFeeBdt}
              </span>
              <span>
                <strong>
                  {locale === "bn" ? "ফলো-আপ ফি:" : "Follow-up Fee:"}
                </strong>{" "}
                BDT {activeDoctor.followupFeeBdt}
              </span>
              <span className="inline-flex items-center gap-1 bg-white px-2 py-0.5 rounded border border-[#c5e2f9]">
                <Building2 className="w-3.5 h-3.5" />
                <span>
                  {locale === "bn" ? "চেম্বার:" : "Chamber:"}{" "}
                  {activeDoctor.branches.find((b) => b.branchId === branchId)
                    ?.roomNumber ?? "OPD"}
                </span>
              </span>
            </div>
          </div>
        )}

        {/* 4. Date & 5. Live Slot Picker */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-4 space-y-4">
            <div>
              <label
                htmlFor="apt-date"
                className="block text-sm font-semibold text-[#080808] mb-1.5"
              >
                <Calendar className="w-4 h-4 inline mr-1 text-[#0057b8]" />
                {t.appointmentSection.dateLabel}
              </label>
              <input
                id="apt-date"
                type="date"
                min="2026-11-03"
                max="2026-12-31"
                value={preferredDate}
                onChange={(e) => setPreferredDate(e.target.value)}
                className="w-full h-12 px-3.5 rounded-lg border border-[#757575] text-sm text-[#080808]"
              />
            </div>

            <div>
              <span className="block text-sm font-semibold text-[#080808] mb-1.5">
                {t.appointmentSection.visitTypeLabel}
              </span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setVisitType("NEW_CONSULTATION")}
                  className={`py-2.5 px-3 rounded-lg border text-xs font-semibold transition-colors ${
                    visitType === "NEW_CONSULTATION"
                      ? "bg-[#0057b8] text-white border-[#0057b8]"
                      : "bg-white text-[#080808] border-[#757575] hover:bg-[#f2f2f2]"
                  }`}
                >
                  {t.appointmentSection.visitNew}
                </button>
                <button
                  type="button"
                  onClick={() => setVisitType("FOLLOW_UP")}
                  className={`py-2.5 px-3 rounded-lg border text-xs font-semibold transition-colors ${
                    visitType === "FOLLOW_UP"
                      ? "bg-[#0057b8] text-white border-[#0057b8]"
                      : "bg-white text-[#080808] border-[#757575] hover:bg-[#f2f2f2]"
                  }`}
                >
                  {t.appointmentSection.visitFollowup}
                </button>
              </div>
            </div>
          </div>

          <div className="lg:col-span-8">
            <span className="block text-sm font-semibold text-[#080808] mb-2">
              <Clock className="w-4 h-4 inline mr-1 text-[#0057b8]" />
              {t.appointmentSection.slotLabel}
            </span>
            {loadingSlots ? (
              <p className="text-sm text-[#686868] py-4">
                {locale === "bn"
                  ? "স্লট ক্যাপাসিটি যাচাই করা হচ্ছে..."
                  : "Loading verified chamber time slots..."}
              </p>
            ) : slots.length === 0 ? (
              <div className="p-4 rounded-xl bg-[#fef3c7] border border-[#f59e0b] text-xs text-[#92400e]">
                {locale === "bn"
                  ? "নির্বাচিত তারিখে এই চেম্বারে কোনো স্লট খালি নেই বা চেম্বার বন্ধ রয়েছে। অনুগ্রহ করে অন্য তারিখ নির্বাচন করুন।"
                  : "No chamber slots available on this date (doctor leave or blocked schedule exception). Please choose another date."}
              </div>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2.5">
                {slots.map((slot) => {
                  const isSelected = preferredTimeSlot === slot.time;
                  return (
                    <button
                      key={slot.time}
                      type="button"
                      disabled={!slot.isAvailable}
                      onClick={() => setPreferredTimeSlot(slot.time)}
                      className={`py-2.5 px-2 rounded-lg border text-center transition-all ${
                        !slot.isAvailable
                          ? "bg-[#f2f2f2] border-[#d6d6d6] text-[#858585] cursor-not-allowed line-through"
                          : isSelected
                          ? "bg-[#0057b8] border-[#0057b8] text-white font-bold shadow-sm"
                          : "bg-white border-[#757575] text-[#080808] hover:border-[#0057b8] hover:bg-[#e8f0f9]"
                      }`}
                    >
                      <span className="block text-sm">{slot.time}</span>
                      <span
                        className={`block text-[10px] ${
                          isSelected ? "text-[#e8f0f9]" : "text-[#686868]"
                        }`}
                      >
                        {slot.isAvailable
                          ? `${slot.remainingCapacity} ${
                              locale === "bn" ? "খালি" : "open"
                            }`
                          : locale === "bn"
                          ? "পূর্ণ"
                          : "Full"}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Patient Contact & Minimal PII Inputs */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-2 border-t border-[#d6d6d6]">
          <div>
            <label
              htmlFor="apt-patient-name"
              className="block text-sm font-semibold text-[#080808] mb-1.5"
            >
              {t.appointmentSection.patientNameLabel} *
            </label>
            <input
              id="apt-patient-name"
              type="text"
              required
              value={patientName}
              onChange={(e) => setPatientName(e.target.value)}
              placeholder={t.appointmentSection.patientNamePlaceholder}
              className="w-full h-12 px-3.5 rounded-lg border border-[#757575] text-sm text-[#080808]"
            />
          </div>

          <div>
            <label
              htmlFor="apt-patient-phone"
              className="block text-sm font-semibold text-[#080808] mb-1.5"
            >
              {t.appointmentSection.patientPhoneLabel} *
            </label>
            <input
              id="apt-patient-phone"
              type="tel"
              required
              value={patientPhone}
              onChange={(e) => setPatientPhone(e.target.value)}
              placeholder={t.appointmentSection.patientPhonePlaceholder}
              className="w-full h-12 px-3.5 rounded-lg border border-[#757575] text-sm text-[#080808]"
            />
          </div>

          <div>
            <label
              htmlFor="apt-patient-email"
              className="block text-sm font-semibold text-[#080808] mb-1.5"
            >
              {t.appointmentSection.patientEmailLabel}
            </label>
            <input
              id="apt-patient-email"
              type="email"
              value={patientEmail}
              onChange={(e) => setPatientEmail(e.target.value)}
              placeholder={t.appointmentSection.patientEmailPlaceholder}
              className="w-full h-12 px-3.5 rounded-lg border border-[#757575] text-sm text-[#080808]"
            />
          </div>
        </div>

        <div>
          <label
            htmlFor="apt-reason"
            className="block text-sm font-semibold text-[#080808] mb-1.5"
          >
            {t.appointmentSection.reasonLabel}
          </label>
          <input
            id="apt-reason"
            type="text"
            maxLength={500}
            value={reasonNote}
            onChange={(e) => setReasonNote(e.target.value)}
            placeholder={t.appointmentSection.reasonPlaceholder}
            className="w-full h-12 px-3.5 rounded-lg border border-[#757575] text-sm text-[#080808]"
          />
        </div>

        {/* Consent & Submit Row */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-2">
          <label className="flex items-start gap-2.5 text-sm text-[#080808] cursor-pointer max-w-2xl">
            <input
              type="checkbox"
              required
              checked={consentAccepted}
              onChange={(e) => setConsentAccepted(e.target.checked)}
              className="mt-1 w-4 h-4 accent-[#0057b8]"
            />
            <span>{t.appointmentSection.consentText}</span>
          </label>

          <button
            type="submit"
            disabled={submitting || slots.length === 0}
            className="mc-btn-primary shrink-0 disabled:opacity-50"
          >
            <ShieldCheck className="w-5 h-5" />
            <span>
              {submitting
                ? t.appointmentSection.submittingButton
                : t.appointmentSection.submitButton}
            </span>
          </button>
        </div>
      </form>
    </div>
  );
}

