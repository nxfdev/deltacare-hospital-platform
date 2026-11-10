"use client";

import React from "react";
import Link from "next/link";
import { Printer } from "lucide-react";
import { useLocale } from "@/lib/i18n/LocaleContext";

export interface DigitalSlipAppointment {
  id: string;
  reference: string;
  patientName: string;
  patientPhone: string;
  patientAge?: number;
  patientGender?: string;
  visitType?: string;
  departmentNameEn?: string;
  departmentNameBn?: string;
  doctorNameEn?: string;
  doctorNameBn?: string;
  doctorDesignationEn?: string;
  doctorQualificationsEn?: string;
  doctorWorkplaceEn?: string;
  doctorBmdcNumber?: string;
  consultationFeeBdt?: number;
  followupFeeBdt?: number;
  branchNameEn?: string;
  branchNameBn?: string;
  branchAddressEn?: string;
  branchHotline?: string;
  chamberRoom?: string;
  preferredDate: string;
  preferredTimeSlot: string;
  status: string;
  events?: Array<{
    id: string;
    fromStatus: string | null;
    toStatus: string;
    reason: string;
    actorName: string;
    createdAt: string;
  }>;
  smsLogs?: Array<{
    id: string;
    eventType: string;
    messageBody: string;
    provider: string;
    deliveryStatus: string;
    sentAt: string;
  }>;
}

const BN = "০১২৩৪৫৬৭৮৯";
const bnNum = (s: string | number) => String(s).replace(/\d/g, (d) => BN[Number(d)]);

function slotLabel(time: string, locale: "en" | "bn"): string {
  const [h, m] = time.split(":").map(Number);
  if (Number.isNaN(h)) return time;
  if (locale === "bn") {
    const period = h >= 18 ? "রাত" : h >= 15 ? "বিকাল" : h >= 12 ? "দুপুর" : "সকাল";
    return `${period} ${bnNum(`${h % 12 || 12}:${String(m).padStart(2, "0")}`)}`;
  }
  return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${h >= 12 ? "PM" : "AM"}`;
}

function dateLabel(iso: string, locale: "en" | "bn"): string {
  const [y, m, d] = iso.split("-").map(Number);
  const text = new Intl.DateTimeFormat(locale === "bn" ? "bn-BD" : "en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(y, m - 1, d));
  return locale === "bn" ? bnNum(text) : text;
}

const STATUS = {
  en: { CONFIRMED: "Confirmed", CANCELLED: "Cancelled", COMPLETED: "Completed", REQUESTED: "Pending", RESCHEDULE_REQUESTED: "Being rescheduled", NO_SHOW: "Missed" },
  bn: { CONFIRMED: "নিশ্চিত", CANCELLED: "বাতিল", COMPLETED: "সম্পন্ন", REQUESTED: "অপেক্ষমাণ", RESCHEDULE_REQUESTED: "পুনঃনির্ধারণ চলছে", NO_SHOW: "উপস্থিত হননি" },
} as const;

const COPY = {
  en: {
    slip: "Appointment slip",
    reference: "Reference",
    doctor: "Doctor",
    department: "Department",
    branch: "Branch",
    room: "Room",
    date: "Date",
    time: "Time",
    patient: "Patient",
    fee: "Fee (pay at desk)",
    arrive: "Please arrive 15 minutes early and show this reference or your SMS at the chamber desk.",
    print: "Print slip",
    track: "Track status",
    another: "Book another",
    help: "Helpline",
  },
  bn: {
    slip: "অ্যাপয়েন্টমেন্ট স্লিপ",
    reference: "রেফারেন্স",
    doctor: "ডাক্তার",
    department: "বিভাগ",
    branch: "শাখা",
    room: "কক্ষ",
    date: "তারিখ",
    time: "সময়",
    patient: "রোগী",
    fee: "ফি (ডেস্কে পরিশোধ)",
    arrive: "অনুগ্রহ করে নির্ধারিত সময়ের ১৫ মিনিট আগে উপস্থিত হয়ে চেম্বার ডেস্কে এই রেফারেন্স বা এসএমএস দেখান।",
    print: "স্লিপ প্রিন্ট করুন",
    track: "স্ট্যাটাস দেখুন",
    another: "আরেকটি বুক করুন",
    help: "হেল্পলাইন",
  },
} as const;

export function DigitalAppointmentSlip({
  appointment,
  onResetBooking,
}: {
  appointment: DigitalSlipAppointment;
  onResetBooking?: () => void;
}) {
  const { locale: raw } = useLocale();
  const locale = raw === "bn" ? "bn" : "en";
  const t = COPY[locale];
  const n = (v: string | number) => (locale === "bn" ? bnNum(v) : String(v));
  const pick = (en?: string, bn?: string) => (locale === "bn" ? bn || en : en) || "—";
  const isFollowup = appointment.visitType === "FOLLOW_UP" || appointment.visitType === "REPORT_SHOW";
  const fee = isFollowup ? appointment.followupFeeBdt ?? 0 : appointment.consultationFeeBdt ?? 0;
  const statusText =
    (STATUS[locale] as Record<string, string>)[appointment.status] ?? appointment.status;
  const statusTone =
    appointment.status === "CONFIRMED" || appointment.status === "COMPLETED"
      ? "bg-emerald-50 text-emerald-700"
      : appointment.status === "CANCELLED"
        ? "bg-rose-50 text-rose-700"
        : "bg-amber-50 text-amber-700";

  const rows: Array<[string, string]> = [
    [t.doctor, pick(appointment.doctorNameEn, appointment.doctorNameBn)],
    [t.department, pick(appointment.departmentNameEn, appointment.departmentNameBn)],
    [t.branch, pick(appointment.branchNameEn, appointment.branchNameBn)],
    [t.room, appointment.chamberRoom ? n(appointment.chamberRoom) : "—"],
    [t.date, dateLabel(appointment.preferredDate, locale)],
    [t.time, slotLabel(appointment.preferredTimeSlot, locale)],
    [t.patient, `${appointment.patientName} · ${n(appointment.patientPhone)}`],
    [t.fee, `৳${n(fee)}`],
  ];

  return (
    <div className="rounded-2xl bg-white ring-1 ring-[#e5e7eb] p-6 sm:p-10 print:ring-0 print:p-0">
      <div className="flex items-start justify-between gap-4 pb-6 border-b border-[#eef0f3]">
        <div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/evercare-logo.svg" alt="Evercare" className="h-9 w-auto" />
          <p className="mt-3 text-sm text-[#6b7280]">{t.slip}</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-[#6b7280]">{t.reference}</p>
          <p className="text-2xl font-semibold tracking-tight text-[#0b1b33] tabular-nums">{appointment.reference}</p>
          <span className={`mt-2 inline-block rounded-full px-3 py-1 text-xs font-medium ${statusTone}`}>{statusText}</span>
        </div>
      </div>

      <dl className="grid sm:grid-cols-2 gap-x-10 gap-y-5 py-8">
        {rows.map(([k, v]) => (
          <div key={k}>
            <dt className="text-xs text-[#6b7280]">{k}</dt>
            <dd className="mt-0.5 text-[15px] font-medium text-[#0b1b33]">{v}</dd>
          </div>
        ))}
      </dl>

      <p className="rounded-xl bg-[#f7f9fc] px-5 py-4 text-sm text-[#374151]">
        {t.arrive} {t.help}: {n(appointment.branchHotline || "10666")}
      </p>

      <div className="print:hidden mt-8 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => window.print()}
          className="inline-flex items-center gap-2 rounded-full bg-[#0b1b33] px-5 py-2.5 text-sm font-medium text-white hover:bg-[#1f2f4a]"
        >
          <Printer className="h-4 w-4" />
          {t.print}
        </button>
        <Link
          href={`/track-appointment?reference=${encodeURIComponent(appointment.reference)}`}
          className="inline-flex items-center rounded-full px-5 py-2.5 text-sm font-medium text-[#0057b8] ring-1 ring-[#dbe3ee] hover:bg-[#f7f9fc]"
        >
          {t.track}
        </Link>
        {onResetBooking && (
          <button
            type="button"
            onClick={onResetBooking}
            className="ml-auto text-sm text-[#6b7280] hover:text-[#0b1b33] underline-offset-4 hover:underline"
          >
            {t.another}
          </button>
        )}
      </div>
    </div>
  );
}
