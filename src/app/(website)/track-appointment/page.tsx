"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Search,
  CheckCircle2,
  Clock,
  AlertCircle,
  ArrowLeft,
  Calendar,
} from "lucide-react";
import { Appointment } from "@/types/domain";
import { useLocale } from "@/lib/i18n/LocaleContext";

interface EnrichedAppointment extends Appointment {
  doctorNameEn: string;
  doctorNameBn: string;
  departmentNameEn: string;
  departmentNameBn: string;
  branchNameEn: string;
  branchNameBn: string;
}

function TrackAppointmentInner() {
  const { locale } = useLocale();
  const searchParams = useSearchParams();
  const [reference, setReference] = useState(
    searchParams.get("reference") || "DC-2026-1041"
  );
  const [phone, setPhone] = useState(
    searchParams.get("phone") || "01711223344"
  );
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [appointment, setAppointment] = useState<EnrichedAppointment | null>(
    null
  );

  const lookup = async (refVal: string, phoneVal: string) => {
    if (!refVal.trim() || !phoneVal.trim()) return;
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch(
        `/api/v1/public/appointments?reference=${encodeURIComponent(
          refVal.trim()
        )}&phone=${encodeURIComponent(phoneVal.trim())}`
      );
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setAppointment(null);
        setErrorMsg(
          data.error || "No appointment found matching those details."
        );
      } else {
        setAppointment(data.appointment);
      }
    } catch {
      setErrorMsg("Unable to check status right now.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const r = searchParams.get("reference");
    const p = searchParams.get("phone");
    if (r && p) {
      lookup(r, p);
    }
  }, [searchParams]);

  return (
    <div className="bg-[#f2f2f2] min-h-screen py-12">
      <div className="mc-container max-w-4xl space-y-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <Link
            href="/request-appointment"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#004181] hover:text-[#0057b8] hover:underline"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>
              {locale === "bn"
                ? "নতুন অ্যাপয়েন্টমেন্ট অনুরোধে ফিরুন"
                : "Back to Request Appointment"}
            </span>
          </Link>
          <Link
            href="/request-appointment"
            className="mc-btn-primary text-xs !py-2 !px-4"
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>
              {locale === "bn"
                ? "নতুন অনুরোধ জমা দিন"
                : "Submit New Request"}
            </span>
          </Link>
        </div>

        <div className="bg-white rounded-3xl border border-[#d6d6d6] p-8 shadow-sm space-y-6">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-[#0057b8]">
              Care at DeltaCare • Real-Time Booking Verification
            </p>
            <h1 className="mt-1 mc-serif text-3xl md:text-4xl text-[#080808]">
              {locale === "bn"
                ? "অ্যাপয়েন্টমেন্ট স্ট্যাটাস ট্র্যাক করুন"
                : "Track Your Appointment Request"}
            </h1>
            <p className="mt-2 text-sm text-[#686868]">
              {locale === "bn"
                ? "আপনার রেফারেন্স কোড (যেমন: DC-2026-1041) এবং নিবন্ধিত মোবাইল নম্বর (যেমন: 01711223344) দিয়ে বর্তমান অবস্থা ও অডিট টাইমলাইন দেখুন।"
                : "Enter your appointment reference code (demo: DC-2026-1041 or DC-2026-1042) and registered mobile number (01711223344) to inspect live status and front-desk confirmation history."}
            </p>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              lookup(reference, phone);
            }}
            className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end"
          >
            <div>
              <label
                htmlFor="track-ref"
                className="block text-sm font-semibold text-[#080808] mb-1.5"
              >
                Reference Code *
              </label>
              <input
                id="track-ref"
                type="text"
                required
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                placeholder="DC-2026-1041"
                className="w-full h-12 px-3.5 rounded-lg border border-[#757575] text-sm"
              />
            </div>

            <div>
              <label
                htmlFor="track-phone"
                className="block text-sm font-semibold text-[#080808] mb-1.5"
              >
                Mobile Number *
              </label>
              <input
                id="track-phone"
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="01711223344"
                className="w-full h-12 px-3.5 rounded-lg border border-[#757575] text-sm"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mc-btn-primary h-12"
            >
              <Search className="w-4 h-4" />
              <span>{loading ? "Checking..." : "Check Status"}</span>
            </button>
          </form>

          {errorMsg && (
            <div className="p-4 rounded-xl bg-[#fef2f2] border border-[#dc2626] text-[#7f1d1d] flex items-center gap-2 text-sm">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {appointment && (
            <div className="pt-6 border-t border-[#d6d6d6] space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4 p-5 rounded-2xl bg-[#f8fafc] border border-[#d6d6d6]">
                <div>
                  <span className="text-xs text-[#686868] block">
                    Reference Code
                  </span>
                  <span className="font-bold text-2xl text-[#080808]">
                    {appointment.reference}
                  </span>
                </div>
                <div>
                  <span className="text-xs text-[#686868] block">
                    Current Lifecycle Status
                  </span>
                  <span
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                      appointment.status === "CONFIRMED"
                        ? "bg-[#ecfdf5] text-[#065f46]"
                        : appointment.status === "CANCELLED"
                        ? "bg-[#fef2f2] text-[#991b1b]"
                        : "bg-[#fef3c7] text-[#92400e]"
                    }`}
                  >
                    {appointment.status === "CONFIRMED" ? (
                      <CheckCircle2 className="w-4 h-4" />
                    ) : (
                      <Clock className="w-4 h-4" />
                    )}
                    {appointment.status}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                <div className="p-4 rounded-xl border border-[#d6d6d6]">
                  <span className="text-xs text-[#686868] block">
                    Specialist
                  </span>
                  <span className="font-bold text-[#080808]">
                    {appointment.doctorNameEn}
                  </span>
                </div>
                <div className="p-4 rounded-xl border border-[#d6d6d6]">
                  <span className="text-xs text-[#686868] block">
                    Department & Branch
                  </span>
                  <span className="font-bold text-[#080808]">
                    {appointment.departmentNameEn} • {appointment.branchNameEn}
                  </span>
                </div>
                <div className="p-4 rounded-xl border border-[#d6d6d6]">
                  <span className="text-xs text-[#686868] block">
                    Preferred Date & Time Slot
                  </span>
                  <span className="font-bold text-[#080808]">
                    {appointment.preferredDate} at{" "}
                    {appointment.preferredTimeSlot}
                  </span>
                </div>
              </div>

              {/* Status Event Audit Trail */}
              <div>
                <h3 className="font-bold text-base text-[#080808] mb-3">
                  Appointment Status History & Audit Trail
                </h3>
                <div className="space-y-3">
                  {appointment.events.map((ev) => (
                    <div
                      key={ev.id}
                      className="p-3.5 rounded-xl bg-[#f2f2f2] border border-[#d6d6d6] text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                    >
                      <div>
                        <span className="font-bold text-[#004181]">
                          {ev.fromStatus ? `${ev.fromStatus} → ` : ""}
                          {ev.toStatus}
                        </span>{" "}
                        — <span>{ev.reason}</span>
                        <p className="text-[#686868] mt-0.5">
                          Recorded by: {ev.actorName}
                        </p>
                      </div>
                      <span className="text-[#686868] shrink-0">
                        {ev.createdAt.replace("T", " ").slice(0, 16)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function TrackAppointmentPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center">Loading...</div>}>
      <TrackAppointmentInner />
    </Suspense>
  );
}

