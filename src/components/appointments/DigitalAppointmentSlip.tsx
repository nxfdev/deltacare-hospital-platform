"use client";

import React from "react";
import Link from "next/link";
import {
  CheckCircle2,
  Clock,
  MapPin,
  MessageSquare,
  Phone,
  Printer,
  ShieldCheck,
  Stethoscope,
} from "lucide-react";

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

export function DigitalAppointmentSlip({
  appointment,
  onResetBooking,
}: {
  appointment: DigitalSlipAppointment;
  onResetBooking?: () => void;
}) {
  const isFollowup =
    appointment.visitType === "FOLLOW_UP" || appointment.visitType === "REPORT_SHOW";
  const applicableFee = isFollowup
    ? appointment.followupFeeBdt ?? 700
    : appointment.consultationFeeBdt ?? 1200;

  return (
    <div className="bg-white border-2 border-[#012d61] p-6 sm:p-10 space-y-8 print:border-black print:p-6">
      {/* Top Hospital Slip Banner */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b-2 border-[#012d61] pb-6">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#0057b8]">
            DeltaCare Multispecialty Hospital Limited · Digital Appointment Slip
          </p>
          <h2 className="mc-serif mt-2 text-2xl sm:text-3xl font-normal text-[#012d61]">
            Outpatient Specialist Consultation Pass
          </h2>
          <p className="mt-1 text-xs sm:text-sm text-slate-600">
            ডেল্টাকেয়ার হাসপাতাল লিমিটেড · বিশেষজ্ঞ চেম্বার অ্যাপয়েন্টমেন্ট স্লিপ
          </p>
        </div>

        <div className="flex flex-col sm:items-end">
          <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">
            Booking Reference Code
          </span>
          <span className="mc-serif text-2xl sm:text-3xl font-bold text-[#012d61] tabular-nums mt-0.5">
            {appointment.reference}
          </span>
          <span
            className={`mt-2 inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold uppercase tracking-wider ${
              appointment.status === "CONFIRMED"
                ? "bg-emerald-100 text-emerald-900"
                : appointment.status === "CANCELLED"
                  ? "bg-rose-100 text-rose-900"
                  : "bg-amber-100 text-amber-900"
            }`}
          >
            {appointment.status === "CONFIRMED" ? (
              <CheckCircle2 className="h-3.5 w-3.5" />
            ) : (
              <Clock className="h-3.5 w-3.5" />
            )}
            {appointment.status === "REQUESTED"
              ? "PENDING (Front Desk Verification)"
              : appointment.status}
          </span>
        </div>
      </div>

      {/* Primary Specialist & Chamber Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 border-b border-[#e5e7eb] pb-8">
        <div className="md:col-span-7 space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.16em] text-[#0057b8]">
            <Stethoscope className="h-4 w-4" />
            Assigned Consultant & Qualifications
          </div>
          <h3 className="mc-serif text-2xl text-[#012d61]">
            {appointment.doctorNameEn}
          </h3>
          {appointment.doctorNameBn && (
            <p className="text-sm font-medium text-slate-700">{appointment.doctorNameBn}</p>
          )}
          {appointment.doctorQualificationsEn && (
            <p className="text-xs sm:text-sm font-semibold text-slate-800">
              {appointment.doctorQualificationsEn}
            </p>
          )}
          {appointment.doctorWorkplaceEn && (
            <p className="text-xs text-slate-600">{appointment.doctorWorkplaceEn}</p>
          )}
          <p className="text-xs text-slate-500 tabular-nums">
            Department: <strong>{appointment.departmentNameEn}</strong>
            {appointment.doctorBmdcNumber ? ` · BMDC Reg: ${appointment.doctorBmdcNumber}` : ""}
          </p>
        </div>

        <div className="md:col-span-5 md:border-l border-[#e5e7eb] md:pl-6 space-y-3">
          <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.16em] text-[#0057b8]">
            <MapPin className="h-4 w-4" />
            Branch Location & Chamber Room
          </div>
          <p className="font-bold text-base text-[#012d61]">{appointment.branchNameEn}</p>
          {appointment.branchAddressEn && (
            <p className="text-xs text-slate-600">{appointment.branchAddressEn}</p>
          )}
          <div className="inline-block bg-slate-100 border border-slate-300 px-3 py-1.5 text-xs font-bold text-[#012d61]">
            Chamber: {appointment.chamberRoom || "Room #402, 3rd Floor"}
          </div>
          <p className="text-xs text-slate-600 flex items-center gap-1.5 tabular-nums">
            <Phone className="h-3.5 w-3.5 text-[#0057b8]" />
            24/7 Reception Hotline: <strong>{appointment.branchHotline || "10666"}</strong>
          </p>
        </div>
      </div>

      {/* Patient & Fixed Slot Details Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 border-b border-[#e5e7eb] pb-8">
        <div>
          <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-500">
            Appointment Date
          </span>
          <span className="mt-1 block text-lg font-bold text-[#012d61] tabular-nums">
            {appointment.preferredDate}
          </span>
        </div>

        <div>
          <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-500">
            Fixed Time Slot
          </span>
          <span className="mt-1 block text-lg font-bold text-[#0057b8] tabular-nums">
            {appointment.preferredTimeSlot}
          </span>
        </div>

        <div>
          <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-500">
            Patient Name & Mobile
          </span>
          <span className="mt-1 block text-sm font-bold text-slate-900">
            {appointment.patientName}
          </span>
          <span className="block text-xs font-semibold text-slate-600 tabular-nums">
            {appointment.patientPhone}
            {appointment.patientAge ? ` · ${appointment.patientAge}y` : ""}
            {appointment.patientGender ? ` · ${appointment.patientGender}` : ""}
          </span>
        </div>

        <div>
          <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-500">
            Consultation Fee (BDT)
          </span>
          <span className="mt-1 block text-xl font-bold text-[#012d61] tabular-nums">
            ৳{applicableFee}
          </span>
          <span className="block text-[11px] text-slate-500">
            {appointment.visitType ?? "NEW_CONSULTATION"} (Pay at Chamber Desk)
          </span>
        </div>
      </div>

      {/* Mandatory Bilingual Reporting Instruction */}
      <div className="border-l-4 border-[#0057b8] bg-sky-50/80 p-4 sm:p-5 space-y-1">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#012d61]">
          <ShieldCheck className="h-4 w-4 text-[#0057b8]" />
          Mandatory Chamber Reporting Instruction / চেম্বার রিপোর্টিং নির্দেশনা
        </div>
        <p className="text-sm font-semibold text-[#012d61]">
          অনুগ্রহ করে নির্ধারিত সময়ের ১৫ মিনিট পূর্বে চেম্বার ডেস্কে রিপোর্ট করুন / Please report to the chamber desk 15 minutes before your slot.
        </p>
        <p className="text-xs text-slate-600">
          Present this Reference Code (<strong>{appointment.reference}</strong>) or your SMS confirmation at{" "}
          <strong>{appointment.chamberRoom || "the Chamber Reception Desk"}</strong>.
        </p>
      </div>

      {/* Recent SMS Notification Log & Audit Trail */}
      {((appointment.smsLogs && appointment.smsLogs.length > 0) ||
        (appointment.events && appointment.events.length > 0)) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2">
          {appointment.smsLogs && appointment.smsLogs.length > 0 && (
            <div className="space-y-2.5">
              <h4 className="text-xs font-bold uppercase tracking-[0.16em] text-[#012d61] flex items-center gap-1.5">
                <MessageSquare className="h-3.5 w-3.5 text-[#0057b8]" />
                Recent SMS Notification Log
              </h4>
              <div className="divide-y divide-[#e5e7eb] border-t border-[#e5e7eb]">
                {appointment.smsLogs.slice(0, 3).map((sms) => (
                  <div key={sms.id} className="py-2.5 text-xs space-y-1">
                    <div className="flex items-center justify-between font-bold text-[#012d61]">
                      <span>
                        {sms.eventType} ({sms.provider})
                      </span>
                      <span className="tabular-nums text-emerald-700">
                        {sms.deliveryStatus} · {sms.sentAt.replace("T", " ").slice(0, 16)}
                      </span>
                    </div>
                    <p className="text-slate-700 leading-relaxed">{sms.messageBody}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {appointment.events && appointment.events.length > 0 && (
            <div className="space-y-2.5">
              <h4 className="text-xs font-bold uppercase tracking-[0.16em] text-[#012d61]">
                Status Verification & Audit Trail
              </h4>
              <div className="divide-y divide-[#e5e7eb] border-t border-[#e5e7eb]">
                {appointment.events.map((ev) => (
                  <div
                    key={ev.id}
                    className="py-2.5 text-xs flex items-start justify-between gap-2"
                  >
                    <div>
                      <span className="font-bold text-[#012d61]">
                        {ev.fromStatus ? `${ev.fromStatus} → ` : ""}
                        {ev.toStatus}
                      </span>{" "}
                      — <span className="text-slate-700">{ev.reason}</span>
                      <div className="text-[11px] text-slate-500">By: {ev.actorName}</div>
                    </div>
                    <span className="text-[11px] text-slate-500 tabular-nums shrink-0">
                      {ev.createdAt.replace("T", " ").slice(0, 16)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Action Buttons (Hidden on Print) */}
      <div className="print:hidden flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-[#e5e7eb]">
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex min-h-[44px] items-center gap-2 bg-[#012d61] hover:bg-[#004494] text-white font-semibold px-5 py-2.5 text-sm transition-colors cursor-pointer"
          >
            <Printer className="h-4 w-4" />
            Print / Save Digital Slip (A4 / PDF)
          </button>

          <Link
            href={`/appointments/track?reference=${encodeURIComponent(
              appointment.reference
            )}&phone=${encodeURIComponent(appointment.patientPhone)}`}
            className="inline-flex min-h-[44px] items-center gap-2 border border-[#0057b8] text-[#0057b8] hover:bg-sky-50 font-semibold px-5 py-2.5 text-sm transition-colors"
          >
            Live Status Tracker →
          </Link>
        </div>

        {onResetBooking && (
          <button
            type="button"
            onClick={onResetBooking}
            className="text-xs font-bold uppercase tracking-wider text-slate-600 hover:text-[#012d61] underline cursor-pointer"
          >
            Book Another Appointment
          </button>
        )}
      </div>
    </div>
  );
}

