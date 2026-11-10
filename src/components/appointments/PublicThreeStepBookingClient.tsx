"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { AlertCircle, ArrowRight, CheckCircle2, Loader2 } from "lucide-react";
import { Branch, Department, Doctor } from "@/types/domain";
import { useLocale } from "@/lib/i18n/LocaleContext";
import {
  DigitalAppointmentSlip,
  DigitalSlipAppointment,
} from "@/components/appointments/DigitalAppointmentSlip";
import { BookingCalendar, parseIso, toBnDigits } from "@/components/appointments/BookingCalendar";

interface AvailabilitySlot {
  time: string;
  labelEn: string;
  labelBn: string;
  status: "AVAILABLE" | "BOOKED" | "BLOCKED" | "PAST";
}

interface AvailabilityData {
  date: string;
  chamberRoom: string;
  isAvailableDay: boolean;
  unavailableReasonEn?: string;
  unavailableReasonBn?: string;
  slots: AvailabilitySlot[];
}

const COPY = {
  en: {
    title: "Book an appointment",
    subtitle: "Choose a doctor, pick a date on the calendar and a time — you'll get an SMS confirmation instantly.",
    track: "Track a booking",
    step1: "Doctor",
    step2: "Date & time",
    step3: "Your details",
    allDepartments: "All departments",
    department: "Department",
    doctor: "Doctor",
    branch: "Branch",
    fee: "Consultation fee",
    pickDate: "Highlighted dates have open chamber slots.",
    noDates: "No open dates in the next two months. Please call 10666.",
    loadingSlots: "Loading time slots…",
    noSlots: "No time slots left on this date. Please choose another date.",
    chooseDate: "Select a date to see time slots.",
    name: "Patient name",
    phone: "Mobile number",
    phoneHint: "11 digits, e.g. 01712345678",
    age: "Age",
    gender: "Gender",
    male: "Male",
    female: "Female",
    other: "Other",
    visit: "Visit type",
    newVisit: "New consultation",
    followUp: "Follow-up",
    report: "Report review",
    note: "Symptoms (optional)",
    consent: "I will arrive 15 minutes before my appointment time.",
    summary: "Summary",
    date: "Date",
    time: "Time",
    room: "Room",
    submit: "Confirm appointment",
    submitting: "Booking…",
    phoneError: "Please enter a valid 11-digit Bangladeshi mobile number.",
    slotError: "Please choose a time slot.",
    networkError: "Network error. Please try again.",
    doneTitle: "Your appointment is confirmed",
    doneBody: "A confirmation SMS has been sent to",
  },
  bn: {
    title: "অ্যাপয়েন্টমেন্ট নিন",
    subtitle: "ডাক্তার বেছে নিন, ক্যালেন্ডার থেকে তারিখ ও সময় নির্বাচন করুন — সঙ্গে সঙ্গে এসএমএসে নিশ্চিতকরণ পাবেন।",
    track: "বুকিং ট্র্যাক করুন",
    step1: "ডাক্তার",
    step2: "তারিখ ও সময়",
    step3: "আপনার তথ্য",
    allDepartments: "সকল বিভাগ",
    department: "বিভাগ",
    doctor: "ডাক্তার",
    branch: "শাখা",
    fee: "কনসালটেশন ফি",
    pickDate: "চিহ্নিত তারিখগুলোতে চেম্বারে সিরিয়াল খালি আছে।",
    noDates: "আগামী দুই মাসে কোনো খালি তারিখ নেই। অনুগ্রহ করে ১০৬৬৬ নম্বরে কল করুন।",
    loadingSlots: "সময়সূচী লোড হচ্ছে…",
    noSlots: "এই তারিখে কোনো সময় খালি নেই। অন্য তারিখ বেছে নিন।",
    chooseDate: "সময় দেখতে একটি তারিখ নির্বাচন করুন।",
    name: "রোগীর নাম",
    phone: "মোবাইল নম্বর",
    phoneHint: "১১ ডিজিট, যেমন ০১৭১২৩৪৫৬৭৮",
    age: "বয়স",
    gender: "লিঙ্গ",
    male: "পুরুষ",
    female: "মহিলা",
    other: "অন্যান্য",
    visit: "ভিজিটের ধরন",
    newVisit: "নতুন রোগী",
    followUp: "ফলো-আপ",
    report: "রিপোর্ট দেখানো",
    note: "উপসর্গ (ঐচ্ছিক)",
    consent: "আমি নির্ধারিত সময়ের ১৫ মিনিট আগে উপস্থিত হব।",
    summary: "সারসংক্ষেপ",
    date: "তারিখ",
    time: "সময়",
    room: "কক্ষ",
    submit: "অ্যাপয়েন্টমেন্ট নিশ্চিত করুন",
    submitting: "বুকিং হচ্ছে…",
    phoneError: "অনুগ্রহ করে সঠিক ১১ ডিজিটের মোবাইল নম্বর দিন।",
    slotError: "অনুগ্রহ করে একটি সময় নির্বাচন করুন।",
    networkError: "নেটওয়ার্ক সমস্যা। আবার চেষ্টা করুন।",
    doneTitle: "আপনার অ্যাপয়েন্টমেন্ট নিশ্চিত হয়েছে",
    doneBody: "নিশ্চিতকরণ এসএমএস পাঠানো হয়েছে",
  },
} as const;

function formatLongDate(iso: string, locale: "en" | "bn"): string {
  const text = new Intl.DateTimeFormat(locale === "bn" ? "bn-BD" : "en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(parseIso(iso));
  return locale === "bn" ? toBnDigits(text) : text;
}

const fieldCls =
  "w-full h-12 rounded-lg border border-[#e5e7eb] bg-white px-4 text-[15px] text-[#0b1b33] focus:border-[#0057b8] focus:ring-2 focus:ring-[#0057b8]/15 outline-none transition";
const labelCls = "block text-sm font-medium text-[#374151] mb-1.5";

function StepHeading({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 mb-6">
      <span className="w-8 h-8 rounded-full bg-[#0b1b33] text-white text-sm font-semibold flex items-center justify-center">
        {n}
      </span>
      <h2 className="text-xl font-semibold text-[#0b1b33]">{children}</h2>
    </div>
  );
}

export function PublicThreeStepBookingClient({
  branches,
  departments,
  doctors,
  preselectedDoctorId,
  preselectedDepartmentId,
  preselectedBranchId,
  embedded = false,
}: {
  branches: Branch[];
  departments: Department[];
  doctors: Doctor[];
  preselectedDoctorId?: string;
  preselectedDepartmentId?: string;
  preselectedBranchId?: string;
  embedded?: boolean;
}) {
  const { locale: rawLocale } = useLocale();
  const locale = rawLocale === "bn" ? "bn" : "en";
  const t = COPY[locale];
  const L = <T extends { nameEn: string; nameBn: string }>(x?: T) => (x ? (locale === "bn" ? x.nameBn : x.nameEn) : "");
  const num = (v: string | number) => (locale === "bn" ? toBnDigits(v) : String(v));

  const searchParams = useSearchParams();

  const initialDoctor = useMemo(() => {
    const q =
      searchParams.get("doctor") || searchParams.get("doctorId") || searchParams.get("slug") || preselectedDoctorId;
    if (q) {
      const ql = q.toLowerCase();
      const found = doctors.find((d) => d.slug.toLowerCase() === ql || d.id.toLowerCase() === ql);
      if (found) return found;
    }
    const qDept = searchParams.get("department") || searchParams.get("departmentId") || preselectedDepartmentId;
    if (qDept) {
      const dept = departments.find((d) => d.slug === qDept || d.id === qDept);
      const found = dept && doctors.find((d) => d.departmentId === dept.id);
      if (found) return found;
    }
    return doctors[0];
  }, [doctors, departments, preselectedDoctorId, preselectedDepartmentId, searchParams]);

  const [departmentId, setDepartmentId] = useState<string>(() => {
    const qDept = searchParams.get("department") || searchParams.get("departmentId") || preselectedDepartmentId;
    const dept = qDept && departments.find((d) => d.slug === qDept || d.id === qDept);
    return dept ? dept.id : initialDoctor?.departmentId || "ALL";
  });
  const [doctorId, setDoctorId] = useState<string>(initialDoctor?.id || "");
  const doctor = useMemo(() => doctors.find((d) => d.id === doctorId), [doctors, doctorId]);

  const doctorBranches = useMemo(
    () => branches.filter((b) => doctor?.branches.some((a) => a.branchId === b.id)),
    [branches, doctor]
  );
  const [branchId, setBranchId] = useState<string>(() => {
    const q = searchParams.get("branch") || searchParams.get("branchId") || preselectedBranchId;
    const match = q && branches.find((b) => b.slug === q || b.id === q);
    return match ? match.id : initialDoctor?.branches[0]?.branchId || branches[0]?.id || "";
  });

  useEffect(() => {
    if (doctor && !doctor.branches.some((a) => a.branchId === branchId)) {
      setBranchId(doctor.branches[0]?.branchId || "");
    }
  }, [doctor, branchId]);

  const filteredDoctors = useMemo(
    () => doctors.filter((d) => departmentId === "ALL" || d.departmentId === departmentId),
    [doctors, departmentId]
  );

  // Calendar availability
  const [availableDates, setAvailableDates] = useState<Set<string> | null>(null);
  const [date, setDate] = useState<string>("");
  useEffect(() => {
    if (!doctorId || !branchId) return;
    let cancelled = false;
    setAvailableDates(null);
    setDate("");
    fetch(
      `/api/v1/public/availability/dates?doctorId=${encodeURIComponent(doctorId)}&branchId=${encodeURIComponent(branchId)}&days=60`,
      { cache: "no-store" }
    )
      .then((r) => r.json())
      .then((d) => {
        if (cancelled) return;
        const set = new Set<string>(d.dates ?? []);
        setAvailableDates(set);
        const first = (d.dates ?? [])[0];
        if (first) setDate(first);
      })
      .catch(() => !cancelled && setAvailableDates(new Set()));
    return () => {
      cancelled = true;
    };
  }, [doctorId, branchId]);

  // Slots for selected date
  const [availability, setAvailability] = useState<AvailabilityData | null>(null);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [slot, setSlot] = useState("");
  const loadSlots = useCallback(async () => {
    if (!doctorId || !branchId || !date) {
      setAvailability(null);
      return;
    }
    setLoadingSlots(true);
    setSlot("");
    try {
      const res = await fetch(
        `/api/v1/public/availability?doctorId=${encodeURIComponent(doctorId)}&branchId=${encodeURIComponent(branchId)}&date=${date}`,
        { cache: "no-store" }
      );
      const data = await res.json();
      setAvailability(data.slots ? data : null);
    } catch {
      setAvailability(null);
    } finally {
      setLoadingSlots(false);
    }
  }, [doctorId, branchId, date]);
  useEffect(() => {
    void loadSlots();
  }, [loadSlots]);

  // Patient form
  const [patientName, setPatientName] = useState("");
  const [patientPhone, setPatientPhone] = useState("");
  const [patientAge, setPatientAge] = useState("");
  const [patientGender, setPatientGender] = useState<"MALE" | "FEMALE" | "OTHER">("MALE");
  const [visitType, setVisitType] = useState<"NEW_CONSULTATION" | "FOLLOW_UP" | "REPORT_SHOW">("NEW_CONSULTATION");
  const [symptomsNote, setSymptomsNote] = useState("");
  const [consent, setConsent] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [completed, setCompleted] = useState<DigitalSlipAppointment | null>(null);

  const fee =
    visitType === "NEW_CONSULTATION" ? doctor?.consultationFeeBdt ?? 0 : doctor?.followupFeeBdt ?? 0;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const phone = patientPhone.trim().replace(/^\+?88/, "");
    if (!/^01[3-9]\d{8}$/.test(phone)) return setError(t.phoneError);
    if (!slot || !date) return setError(t.slotError);

    setSubmitting(true);
    try {
      const res = await fetch("/api/v1/public/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientName: patientName.trim(),
          patientPhone: phone,
          patientAge: Number(patientAge) || undefined,
          patientGender,
          departmentId: doctor?.departmentId,
          doctorId,
          branchId,
          preferredDate: date,
          preferredTimeSlot: slot,
          visitType,
          bookingSource: "ONLINE_WEBSITE",
          symptomsNote: symptomsNote.trim() || undefined,
          consentAccepted: consent,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setError(data.error || t.networkError);
      } else {
        setCompleted(data.appointment);
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    } catch {
      setError(t.networkError);
    } finally {
      setSubmitting(false);
    }
  }

  if (completed) {
    return (
      <div className={embedded ? "py-4" : "mx-auto max-w-3xl px-6 py-16"}>
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="print:hidden mb-8 flex items-start gap-4"
        >
          <CheckCircle2 className="w-8 h-8 text-emerald-600 shrink-0" />
          <div>
            <h2 className="text-2xl font-semibold text-[#0b1b33]">{t.doneTitle}</h2>
            <p className="mt-1 text-[#4b5563]">
              {t.doneBody} {num(completed.patientPhone)}.
            </p>
          </div>
        </motion.div>
        <DigitalAppointmentSlip
          appointment={completed}
          onResetBooking={() => {
            setCompleted(null);
            void loadSlots();
          }}
        />
      </div>
    );
  }

  const slots = availability?.isAvailableDay ? availability.slots : [];

  return (
    <div className={embedded ? "" : "bg-white"}>
      {!embedded && (
        <section className="print:hidden w-full bg-[#012d61] text-white">
          <div className="mx-auto max-w-6xl px-6 py-14 md:py-20 flex flex-col md:flex-row md:items-end md:justify-between gap-6">
            <div>
              <h1 className="mc-serif text-4xl md:text-5xl font-normal">{t.title}</h1>
              <p className="mt-3 max-w-xl text-lg text-white/80">{t.subtitle}</p>
            </div>
            <Link
              href="/track-appointment"
              className="inline-flex items-center gap-2 text-sm font-medium text-white/90 hover:text-white underline-offset-4 hover:underline"
            >
              {t.track} <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </section>
      )}

      <div className={embedded ? "space-y-14" : "mx-auto max-w-6xl px-6 py-14 space-y-16"}>
        {/* Step 1 */}
        <section>
          <StepHeading n={1}>{t.step1}</StepHeading>
          <div className="grid gap-5 md:grid-cols-3">
            {!embedded && (
              <div>
                <label htmlFor="bk-dept" className={labelCls}>
                  {t.department}
                </label>
                <select
                  id="bk-dept"
                  value={departmentId}
                  onChange={(e) => {
                    setDepartmentId(e.target.value);
                    const first = doctors.find((d) => e.target.value === "ALL" || d.departmentId === e.target.value);
                    if (first) setDoctorId(first.id);
                  }}
                  className={fieldCls}
                >
                  <option value="ALL">{t.allDepartments}</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {L(d)}
                    </option>
                  ))}
                </select>
              </div>
            )}
            {!embedded && (
              <div>
                <label htmlFor="bk-doc" className={labelCls}>
                  {t.doctor}
                </label>
                <select id="bk-doc" value={doctorId} onChange={(e) => setDoctorId(e.target.value)} className={fieldCls}>
                  {filteredDoctors.map((d) => (
                    <option key={d.id} value={d.id}>
                      {L(d)}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <div>
              <label htmlFor="bk-branch" className={labelCls}>
                {t.branch}
              </label>
              <select id="bk-branch" value={branchId} onChange={(e) => setBranchId(e.target.value)} className={fieldCls}>
                {doctorBranches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {L(b)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {doctor && !embedded && (
            <motion.div
              key={doctor.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-6 flex items-center gap-4"
            >
              {doctor.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={doctor.imageUrl} alt="" className="w-14 h-14 rounded-full object-cover object-top" />
              ) : null}
              <div>
                <p className="font-semibold text-[#0b1b33]">{L(doctor)}</p>
                <p className="text-sm text-[#6b7280]">
                  {locale === "bn" ? doctor.designationBn : doctor.designationEn} · {t.fee} ৳{num(doctor.consultationFeeBdt)}
                </p>
              </div>
            </motion.div>
          )}
        </section>

        {/* Step 2 */}
        <section>
          <StepHeading n={2}>{t.step2}</StepHeading>
          <div className="grid gap-10 md:grid-cols-[minmax(0,420px)_1fr]">
            <div>
              {availableDates === null ? (
                <div className="h-80 flex items-center justify-center text-[#9ca3af]">
                  <Loader2 className="w-5 h-5 animate-spin" />
                </div>
              ) : (
                <>
                  <BookingCalendar
                    key={`${doctorId}-${branchId}`}
                    locale={locale}
                    selected={date}
                    onSelect={setDate}
                    isAvailable={(iso) => availableDates.has(iso)}
                  />
                  <p className="mt-4 text-sm text-[#6b7280]">
                    {availableDates.size ? t.pickDate : t.noDates}
                  </p>
                </>
              )}
            </div>

            <div>
              {date && <p className="text-base font-semibold text-[#0b1b33] mb-4">{formatLongDate(date, locale)}</p>}
              <AnimatePresence mode="wait">
                {!date ? (
                  <motion.p key="none" className="text-[#6b7280]">
                    {t.chooseDate}
                  </motion.p>
                ) : loadingSlots ? (
                  <motion.p key="loading" className="text-[#6b7280]">
                    {t.loadingSlots}
                  </motion.p>
                ) : slots.length === 0 || slots.every((s) => s.status !== "AVAILABLE") ? (
                  <motion.p key="empty" className="text-[#6b7280]">
                    {t.noSlots}
                  </motion.p>
                ) : (
                  <motion.div
                    key={date}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="grid grid-cols-3 sm:grid-cols-4 gap-2.5"
                  >
                    {slots.map((s) => {
                      const open = s.status === "AVAILABLE";
                      const active = slot === s.time;
                      return (
                        <button
                          key={s.time}
                          type="button"
                          disabled={!open}
                          onClick={() => setSlot(s.time)}
                          className={`h-11 rounded-lg text-sm transition-colors ${
                            active
                              ? "bg-[#0057b8] text-white font-semibold"
                              : open
                                ? "ring-1 ring-[#e5e7eb] text-[#0b1b33] hover:ring-[#0057b8] hover:text-[#0057b8]"
                                : "bg-[#f9fafb] text-[#cbd5e1] line-through cursor-not-allowed"
                          }`}
                        >
                          {locale === "bn" ? s.labelBn : s.labelEn}
                        </button>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </section>

        {/* Step 3 */}
        <section>
          <StepHeading n={3}>{t.step3}</StepHeading>
          <form onSubmit={submit} className="grid gap-10 lg:grid-cols-[1fr_340px]">
            <div className="space-y-5">
              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label htmlFor="patient-name" className={labelCls}>
                    {t.name}
                  </label>
                  <input
                    id="patient-name"
                    required
                    value={patientName}
                    onChange={(e) => setPatientName(e.target.value)}
                    className={fieldCls}
                  />
                </div>
                <div>
                  <label htmlFor="patient-phone" className={labelCls}>
                    {t.phone}
                  </label>
                  <input
                    id="patient-phone"
                    type="tel"
                    inputMode="numeric"
                    required
                    value={patientPhone}
                    onChange={(e) => setPatientPhone(e.target.value)}
                    placeholder={t.phoneHint}
                    className={fieldCls}
                  />
                </div>
              </div>
              <div className="grid gap-5 sm:grid-cols-3">
                <div>
                  <label htmlFor="patient-age" className={labelCls}>
                    {t.age}
                  </label>
                  <input
                    id="patient-age"
                    type="number"
                    min={0}
                    max={120}
                    required
                    value={patientAge}
                    onChange={(e) => setPatientAge(e.target.value)}
                    className={fieldCls}
                  />
                </div>
                <div>
                  <label htmlFor="patient-gender" className={labelCls}>
                    {t.gender}
                  </label>
                  <select
                    id="patient-gender"
                    value={patientGender}
                    onChange={(e) => setPatientGender(e.target.value as typeof patientGender)}
                    className={fieldCls}
                  >
                    <option value="MALE">{t.male}</option>
                    <option value="FEMALE">{t.female}</option>
                    <option value="OTHER">{t.other}</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="visit-type" className={labelCls}>
                    {t.visit}
                  </label>
                  <select
                    id="visit-type"
                    value={visitType}
                    onChange={(e) => setVisitType(e.target.value as typeof visitType)}
                    className={fieldCls}
                  >
                    <option value="NEW_CONSULTATION">{t.newVisit}</option>
                    <option value="FOLLOW_UP">{t.followUp}</option>
                    <option value="REPORT_SHOW">{t.report}</option>
                  </select>
                </div>
              </div>
              <div>
                <label htmlFor="symptoms-note" className={labelCls}>
                  {t.note}
                </label>
                <textarea
                  id="symptoms-note"
                  rows={3}
                  value={symptomsNote}
                  onChange={(e) => setSymptomsNote(e.target.value)}
                  className={`${fieldCls} h-auto py-3`}
                />
              </div>
              <label className="flex items-center gap-3 text-sm text-[#374151] cursor-pointer">
                <input
                  type="checkbox"
                  checked={consent}
                  onChange={(e) => setConsent(e.target.checked)}
                  required
                  className="h-4 w-4 accent-[#0057b8]"
                />
                {t.consent}
              </label>
            </div>

            <aside className="rounded-2xl bg-[#f7f9fc] p-6 h-fit space-y-4">
              <p className="text-sm font-medium text-[#6b7280]">{t.summary}</p>
              <div>
                <p className="font-semibold text-[#0b1b33]">{L(doctor)}</p>
                <p className="text-sm text-[#6b7280]">{L(departments.find((d) => d.id === doctor?.departmentId))}</p>
              </div>
              <dl className="space-y-2 text-sm">
                {[
                  [t.branch, L(branches.find((b) => b.id === branchId))],
                  [t.date, date ? formatLongDate(date, locale) : "—"],
                  [
                    t.time,
                    slot
                      ? (locale === "bn"
                          ? slots.find((s) => s.time === slot)?.labelBn
                          : slots.find((s) => s.time === slot)?.labelEn) ?? slot
                      : "—",
                  ],
                  [t.room, availability?.chamberRoom ? num(availability.chamberRoom) : "—"],
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between gap-4">
                    <dt className="text-[#6b7280]">{k}</dt>
                    <dd className="text-right font-medium text-[#0b1b33]">{v}</dd>
                  </div>
                ))}
                <div className="flex justify-between gap-4 pt-3 border-t border-[#e5e7eb]">
                  <dt className="text-[#6b7280]">{t.fee}</dt>
                  <dd className="text-lg font-semibold text-[#0b1b33]">৳{num(fee)}</dd>
                </div>
              </dl>

              {error && (
                <p className="flex items-start gap-2 text-sm text-red-600">
                  <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={submitting || !slot}
                className="w-full h-12 rounded-full bg-[#0057b8] hover:bg-[#004a9c] disabled:bg-[#cbd5e1] text-white font-medium flex items-center justify-center gap-2 transition-colors"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                {submitting ? t.submitting : t.submit}
              </button>
            </aside>
          </form>
        </section>
      </div>
    </div>
  );
}
