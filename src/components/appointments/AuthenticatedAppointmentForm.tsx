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
  ArrowLeft,
  ChevronRight,
  Stethoscope,
  MapPin,
  FileText,
  User,
} from "lucide-react";
import { Branch, Department, Doctor, Appointment } from "@/types/domain";
import { useLocale } from "@/lib/i18n/LocaleContext";
import { ComputedTimeSlot } from "@/server/services/appointmentService";

interface AuthenticatedAppointmentFormProps {
  currentUser: {
    userId: string;
    fullName: string;
    email: string;
    phone?: string;
  };
  departments: Department[];
  doctors: Doctor[];
  branches: Branch[];
}

export function AuthenticatedAppointmentForm({
  currentUser,
  departments,
  doctors,
  branches,
}: AuthenticatedAppointmentFormProps) {
  const { locale } = useLocale();

  const [departmentId, setDepartmentId] = useState(departments[0]?.id || "");
  const [doctorId, setDoctorId] = useState(doctors[0]?.id || "");
  const [branchId, setBranchId] = useState(branches[0]?.id || "");
  const [preferredDate, setPreferredDate] = useState("2026-11-08");
  const [preferredTimeSlot, setPreferredTimeSlot] = useState("16:40");
  const [visitType, setVisitType] = useState<"NEW_CONSULTATION" | "FOLLOW_UP">("NEW_CONSULTATION");
  const [patientName, setPatientName] = useState(currentUser.fullName);
  const [patientPhone, setPatientPhone] = useState(currentUser.phone || "01711223344");
  const [patientEmail, setPatientEmail] = useState(currentUser.email);
  const [reasonNote, setReasonNote] = useState("");
  const [consentAccepted, setConsentAccepted] = useState(false);

  const [slots, setSlots] = useState<ComputedTimeSlot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [submittedAppointment, setSubmittedAppointment] = useState<Appointment | null>(null);

  // Filter doctors by selected department
  const filteredDoctors = departmentId
    ? doctors.filter((d) => d.departmentId === departmentId)
    : doctors;

  const activeDoctor =
    doctors.find((d) => d.id === doctorId) ?? filteredDoctors[0];

  // Filter branches where active doctor is practicing
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

  // Fetch real-time available appointment slots
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
          data.error || "Unable to submit appointment request. Please check all fields."
        );
      } else {
        setSubmittedAppointment(data.appointment);
      }
    } catch {
      setErrorMsg("Network error submitting appointment request. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // SUCCESS CONFIRMATION STATE
  if (submittedAppointment) {
    const chosenDoctor = doctors.find((d) => d.id === submittedAppointment.doctorId);
    const chosenBranch = branches.find((b) => b.id === submittedAppointment.branchId);
    const chosenDept = departments.find((d) => d.id === submittedAppointment.departmentId);

    return (
      <div className="bg-white rounded-3xl border-2 border-[#0057b8] p-6 sm:p-10 shadow-xl space-y-6 animate-in fade-in duration-200">
        <div className="flex items-center gap-4 border-b border-[#e5e7eb] pb-6">
          <div className="w-14 h-14 rounded-2xl bg-[#e8f0f9] text-[#0057b8] flex items-center justify-center shrink-0 shadow-inner">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <div>
            <span className="inline-block px-3 py-1 rounded-full bg-[#fef3c7] text-[#92400e] text-xs font-bold uppercase tracking-wider">
              Status: REQUESTED (Pending Verification)
            </span>
            <h2 className="mc-serif text-2xl sm:text-3xl text-[#080808] mt-1 font-bold">
              Appointment Request Submitted Successfully
            </h2>
            <p className="text-xs sm:text-sm text-[#4b5563]">
              Associated with patient account <strong>{currentUser.email}</strong>
            </p>
          </div>
        </div>

        {/* Reference & Summary Box */}
        <div className="p-6 rounded-2xl bg-[#f0f7ff] border border-[#bfdbfe] space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#bfdbfe] pb-4">
            <div>
              <p className="text-xs uppercase tracking-wider font-bold text-[#0057b8]">
                Your Tracking Reference Code
              </p>
              <p className="font-mono text-2xl sm:text-3xl font-extrabold text-[#004181] tracking-wide mt-0.5">
                {submittedAppointment.reference}
              </p>
            </div>
            <span className="text-xs text-[#0057b8] font-semibold bg-white px-3 py-1.5 rounded-lg border border-[#bfdbfe]">
              Keep this code to track your consultation
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs sm:text-sm">
            <div>
              <span className="text-[#6b7280] block text-xs">Specialist Doctor:</span>
              <strong className="text-[#111827]">{chosenDoctor?.nameEn || submittedAppointment.doctorId}</strong>
              <p className="text-xs text-[#6b7280]">{chosenDoctor?.designationEn}</p>
            </div>
            <div>
              <span className="text-[#6b7280] block text-xs">Department:</span>
              <strong className="text-[#111827]">{chosenDept?.nameEn || submittedAppointment.departmentId}</strong>
            </div>
            <div>
              <span className="text-[#6b7280] block text-xs">Hospital Campus:</span>
              <strong className="text-[#111827]">{chosenBranch?.nameEn || submittedAppointment.branchId}</strong>
            </div>
            <div>
              <span className="text-[#6b7280] block text-xs">Requested Slot:</span>
              <strong className="text-[#111827]">
                {submittedAppointment.preferredDate} at {submittedAppointment.preferredTimeSlot}
              </strong>
            </div>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-[#ecfdf5] border border-[#a7f3d0] text-xs text-[#065f46] space-y-1">
          <p className="font-bold flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-[#059669]" />
            <span>Next Steps: Front-Desk Telephone Verification</span>
          </p>
          <p className="leading-relaxed">
            Our front desk receptionist will call your registered number (<strong>{submittedAppointment.patientPhone}</strong>) to confirm slot allocation and chamber timings. Once confirmed, you will receive an official confirmation SMS.
          </p>
        </div>

        {/* Action CTAs */}
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <Link
            href="/dashboard"
            className="flex-1 py-3.5 px-6 rounded-xl bg-[#0057b8] hover:bg-[#004181] text-white font-bold text-sm text-center shadow transition-colors flex items-center justify-center gap-2"
          >
            <span>View in Patient Portal</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/track-appointment"
            className="flex-1 py-3.5 px-6 rounded-xl border border-[#d1d5db] hover:border-[#0057b8] hover:bg-[#f9fafb] text-[#111827] font-semibold text-sm text-center transition-colors flex items-center justify-center gap-2"
          >
            <span>Track with Reference Code</span>
          </Link>
        </div>
      </div>
    );
  }

  // ACTIVE APPOINTMENT FORM
  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {errorMsg && (
        <div className="p-4 rounded-xl bg-[#fef2f2] border border-[#dc2626] text-xs sm:text-sm text-[#7f1d1d] flex items-center gap-3">
          <AlertCircle className="w-5 h-5 shrink-0 text-[#dc2626]" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* SECTION 1: Patient Identity (Pre-populated from Account) */}
      <div className="bg-white rounded-2xl border border-[#d1d5db] p-6 sm:p-8 space-y-4 shadow-sm">
        <div className="flex items-center justify-between border-b border-[#e5e7eb] pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-[#e8f0f9] text-[#0057b8] flex items-center justify-center font-bold text-xs">
              1
            </div>
            <h3 className="text-base sm:text-lg font-bold text-[#111827]">
              Patient Account & Contact Details
            </h3>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-[#ecfdf5] text-[#065f46] flex items-center gap-1">
            <UserCheck className="w-3.5 h-3.5 text-[#059669]" />
            <span>Verified Patient Account</span>
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label htmlFor="apt-name" className="block text-xs font-bold text-[#374151] mb-1">
              Patient Full Name *
            </label>
            <input
              id="apt-name"
              type="text"
              required
              value={patientName}
              onChange={(e) => setPatientName(e.target.value)}
              className="w-full h-11 px-3.5 rounded-xl border border-[#d1d5db] text-sm text-[#111827] focus:border-[#0057b8] focus:outline-none"
            />
          </div>

          <div>
            <label htmlFor="apt-phone" className="block text-xs font-bold text-[#374151] mb-1">
              Phone Number (for SMS & Verification) *
            </label>
            <input
              id="apt-phone"
              type="tel"
              required
              value={patientPhone}
              onChange={(e) => setPatientPhone(e.target.value)}
              className="w-full h-11 px-3.5 rounded-xl border border-[#d1d5db] text-sm text-[#111827] focus:border-[#0057b8] focus:outline-none"
            />
          </div>

          <div>
            <label htmlFor="apt-email" className="block text-xs font-bold text-[#374151] mb-1">
              Email Address *
            </label>
            <input
              id="apt-email"
              type="email"
              required
              value={patientEmail}
              onChange={(e) => setPatientEmail(e.target.value)}
              className="w-full h-11 px-3.5 rounded-xl border border-[#d1d5db] text-sm text-[#111827] focus:border-[#0057b8] focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* SECTION 2: Clinical Selection (Department, Doctor & Campus) */}
      <div className="bg-white rounded-2xl border border-[#d1d5db] p-6 sm:p-8 space-y-5 shadow-sm">
        <div className="flex items-center gap-2.5 border-b border-[#e5e7eb] pb-3">
          <div className="w-8 h-8 rounded-full bg-[#e8f0f9] text-[#0057b8] flex items-center justify-center font-bold text-xs">
            2
          </div>
          <h3 className="text-base sm:text-lg font-bold text-[#111827]">
            Clinical Specialty & Specialist Consultant
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {/* Department */}
          <div>
            <label htmlFor="apt-dept" className="block text-xs font-bold text-[#374151] mb-1">
              Clinical Department *
            </label>
            <select
              id="apt-dept"
              value={departmentId}
              onChange={(e) => setDepartmentId(e.target.value)}
              className="w-full h-12 px-3.5 rounded-xl border border-[#d1d5db] text-sm text-[#111827] bg-white focus:border-[#0057b8] focus:outline-none"
            >
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.nameEn} ({d.nameBn})
                </option>
              ))}
            </select>
          </div>

          {/* Doctor */}
          <div>
            <label htmlFor="apt-doc" className="block text-xs font-bold text-[#374151] mb-1">
              Specialist Consultant *
            </label>
            <select
              id="apt-doc"
              value={doctorId}
              onChange={(e) => {
                setDoctorId(e.target.value);
                const doc = doctors.find((d) => d.id === e.target.value);
                if (doc?.branches[0]) setBranchId(doc.branches[0].branchId);
              }}
              className="w-full h-12 px-3.5 rounded-xl border border-[#d1d5db] text-sm text-[#111827] bg-white focus:border-[#0057b8] focus:outline-none"
            >
              {filteredDoctors.map((doc) => (
                <option key={doc.id} value={doc.id}>
                  {doc.nameEn} — {doc.designationEn} (Fee: {doc.consultationFeeBdt} BDT)
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Selected Doctor Info Card */}
        {activeDoctor && (
          <div className="p-4 rounded-xl bg-[#f0f7ff] border border-[#bfdbfe] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-[#012d61] text-white flex items-center justify-center font-bold shrink-0">
                <Stethoscope className="w-6 h-6 text-[#93c5fd]" />
              </div>
              <div>
                <h4 className="font-bold text-[#080808] text-sm sm:text-base">
                  {activeDoctor.nameEn}
                </h4>
                <p className="text-xs text-[#0057b8] font-semibold">
                  BMDC Reg: {activeDoctor.bmdcRegistrationNo} • {activeDoctor.experienceYears} Years Exp.
                </p>
                <p className="text-xs text-[#4b5563] mt-0.5">
                  {activeDoctor.qualificationsEn}
                </p>
              </div>
            </div>

            <div className="text-right sm:border-l sm:border-[#bfdbfe] sm:pl-5 shrink-0">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#0057b8]">
                Consultation Fee
              </span>
              <p className="text-xl font-bold text-[#080808]">
                {activeDoctor.consultationFeeBdt} BDT
              </p>
              <p className="text-[11px] text-[#059669] font-medium">Follow-up: {activeDoctor.followupFeeBdt} BDT</p>
            </div>
          </div>
        )}

        {/* Campus Branch */}
        <div>
          <label htmlFor="apt-branch" className="block text-xs font-bold text-[#374151] mb-1">
            Hospital Campus Location *
          </label>
          <select
            id="apt-branch"
            value={branchId}
            onChange={(e) => setBranchId(e.target.value)}
            className="w-full h-12 px-3.5 rounded-xl border border-[#d1d5db] text-sm text-[#111827] bg-white focus:border-[#0057b8] focus:outline-none"
          >
            {availableBranchesForDoctor.map((b) => (
              <option key={b.id} value={b.id}>
                {b.nameEn} ({b.addressEn})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* SECTION 3: Date, Time & Visit Details */}
      <div className="bg-white rounded-2xl border border-[#d1d5db] p-6 sm:p-8 space-y-5 shadow-sm">
        <div className="flex items-center gap-2.5 border-b border-[#e5e7eb] pb-3">
          <div className="w-8 h-8 rounded-full bg-[#e8f0f9] text-[#0057b8] flex items-center justify-center font-bold text-xs">
            3
          </div>
          <h3 className="text-base sm:text-lg font-bold text-[#111827]">
            Preferred Date & Time Slot
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {/* Visit Type */}
          <div>
            <label className="block text-xs font-bold text-[#374151] mb-2">
              Visit Classification *
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setVisitType("NEW_CONSULTATION")}
                className={`p-3 rounded-xl border text-xs font-bold transition-all ${
                  visitType === "NEW_CONSULTATION"
                    ? "border-[#0057b8] bg-[#e8f0f9] text-[#004181] shadow-sm"
                    : "border-[#d1d5db] text-[#4b5563] hover:border-[#9ca3af]"
                }`}
              >
                New Consultation
              </button>
              <button
                type="button"
                onClick={() => setVisitType("FOLLOW_UP")}
                className={`p-3 rounded-xl border text-xs font-bold transition-all ${
                  visitType === "FOLLOW_UP"
                    ? "border-[#0057b8] bg-[#e8f0f9] text-[#004181] shadow-sm"
                    : "border-[#d1d5db] text-[#4b5563] hover:border-[#9ca3af]"
                }`}
              >
                Follow-up Visit
              </button>
            </div>
          </div>

          {/* Date Picker */}
          <div>
            <label htmlFor="apt-date" className="block text-xs font-bold text-[#374151] mb-1">
              Preferred Date *
            </label>
            <input
              id="apt-date"
              type="date"
              required
              min="2026-11-04"
              max="2026-12-31"
              value={preferredDate}
              onChange={(e) => setPreferredDate(e.target.value)}
              className="w-full h-12 px-3.5 rounded-xl border border-[#d1d5db] text-sm text-[#111827] bg-white focus:border-[#0057b8] focus:outline-none"
            />
          </div>
        </div>

        {/* Real-Time Slots */}
        <div>
          <label className="block text-xs font-bold text-[#374151] mb-2">
            Available Time Slots ({preferredDate}) *
          </label>

          {loadingSlots ? (
            <div className="p-4 rounded-xl bg-[#f9fafb] text-center text-xs text-[#6b7280]">
              Checking chamber slot capacity...
            </div>
          ) : slots.length === 0 ? (
            <div className="p-4 rounded-xl bg-[#fffbeb] border border-[#fef3c7] text-xs text-[#92400e]">
              No pre-allocated slots published for this date. Front desk will assign the nearest chamber slot.
            </div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2.5">
              {slots.map((slot) => {
                const isSelected = preferredTimeSlot === slot.time;
                return (
                  <button
                    key={slot.time}
                    type="button"
                    disabled={!slot.isAvailable}
                    onClick={() => setPreferredTimeSlot(slot.time)}
                    className={`py-2.5 px-3 rounded-xl text-xs font-semibold transition-all text-center ${
                      !slot.isAvailable
                        ? "bg-[#f3f4f6] text-[#9ca3af] cursor-not-allowed line-through"
                        : isSelected
                        ? "bg-[#0057b8] text-white font-bold shadow-md ring-2 ring-[#0057b8]"
                        : "bg-white border border-[#d1d5db] text-[#111827] hover:border-[#0057b8] hover:bg-[#f0f7ff]"
                    }`}
                  >
                    <span>{slot.time}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Symptoms / Note */}
        <div>
          <label htmlFor="apt-reason" className="block text-xs font-bold text-[#374151] mb-1">
            Brief Symptoms or Reason for Consultation (Optional)
          </label>
          <textarea
            id="apt-reason"
            rows={3}
            value={reasonNote}
            onChange={(e) => setReasonNote(e.target.value)}
            placeholder="e.g. Chest pain on exertion for 3 days, previous ECG report available..."
            className="w-full p-3.5 rounded-xl border border-[#d1d5db] text-sm text-[#111827] focus:border-[#0057b8] focus:outline-none"
          />
        </div>

        {/* Consent Checkbox */}
        <div className="pt-2">
          <label className="flex items-start gap-3 cursor-pointer text-xs text-[#4b5563] select-none">
            <input
              type="checkbox"
              required
              checked={consentAccepted}
              onChange={(e) => setConsentAccepted(e.target.checked)}
              className="mt-0.5 w-4 h-4 rounded text-[#0057b8] focus:ring-[#0057b8]"
            />
            <span>
              I confirm that the patient information provided is accurate and consent to DeltaCare hospital staff contacting me via phone/SMS to confirm slot allocation and clinic chamber instructions.
            </span>
          </label>
        </div>
      </div>

      {/* Submit Button */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
        <Link
          href="/request-appointment"
          className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-[#4b5563] hover:text-[#0057b8]"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Patient Options</span>
        </Link>

        <button
          type="submit"
          disabled={submitting}
          className="w-full sm:w-auto px-9 py-4 rounded-xl bg-[#0057b8] hover:bg-[#004181] active:bg-[#002d61] text-white font-bold text-base shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          <span>{submitting ? "Submitting Request..." : "Submit Appointment Request"}</span>
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </form>
  );
}

