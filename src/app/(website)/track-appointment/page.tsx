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
    <div className="min-h-screen bg-white">
      {/* Full-bleed Stretched Blue Hero Header */}
      <div className="w-full bg-[#012d61] text-white py-14 md:py-20 border-b border-[#001f44]">
        <div className="mc-container max-w-7xl mx-auto px-6 sm:px-10 lg:px-12 space-y-4">
          <p className="text-xs sm:text-sm font-bold uppercase tracking-widest text-[#93c5fd]">
            Care at DeltaCare • Real-Time Booking Verification
          </p>
          <h1 className="mc-serif text-3xl sm:text-5xl lg:text-[54px] font-bold text-white tracking-tight leading-tight">
            {locale === "bn"
              ? "অ্যাপয়েন্টমেন্ট স্ট্যাটাস ট্র্যাক করুন"
              : "Track Your Appointment"}
          </h1>
          <p className="text-xl text-[#c5e2f9] font-medium">
            রিয়েল-টাইম রেফারেন্স ও অবস্থা অনুসন্ধান
          </p>
          <p className="text-base sm:text-lg text-[#e8f0f9] max-w-3xl leading-relaxed">
            {locale === "bn"
              ? "আপনার রেফারেন্স কোড (যেমন: DC-2026-1041) এবং নিবন্ধিত মোবাইল নম্বর (যেমন: 01711223344) দিয়ে বর্তমান অবস্থা ও অডিট টাইমলাইন দেখুন।"
              : "Enter your appointment reference code (demo: DC-2026-1041 or DC-2026-1042) and registered mobile number (01711223344) to inspect live status and confirmation history."}
          </p>
        </div>
      </div>

      {/* Main Body - Unboxed Editorial Form & Results */}
      <div className="w-full py-12 md:py-16">
        <div className="mc-container max-w-5xl mx-auto px-6 sm:px-10 lg:px-12 space-y-12">
          {/* Top Actions Link */}
          <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-[#e5e7eb]">
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
              className="mc-btn-primary text-xs !py-2.5 !px-5"
            >
              <Calendar className="w-3.5 h-3.5 mr-1.5" />
              <span>
                {locale === "bn"
                  ? "নতুন অনুরোধ জমা দিন"
                  : "Submit New Request"}
              </span>
            </Link>
          </div>

          {/* Search Form - Unboxed */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              lookup(reference, phone);
            }}
            className="grid grid-cols-1 sm:grid-cols-3 gap-6 items-end"
          >
            <div>
              <label
                htmlFor="track-ref"
                className="block text-sm font-bold text-[#080808] mb-2"
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
                className="w-full h-12 px-3.5 border border-[#9ca3af] focus:border-[#0057b8] text-base outline-none"
              />
            </div>

            <div>
              <label
                htmlFor="track-phone"
                className="block text-sm font-bold text-[#080808] mb-2"
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
                className="w-full h-12 px-3.5 border border-[#9ca3af] focus:border-[#0057b8] text-base outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mc-btn-primary h-12 flex items-center justify-center gap-2 text-base font-semibold"
            >
              <Search className="w-4 h-4" />
              <span>{loading ? "Checking..." : "Check Status"}</span>
            </button>
          </form>

          {errorMsg && (
            <div className="p-4 border-l-4 border-[#dc2626] bg-[#fef2f2] text-[#7f1d1d] flex items-center gap-2 text-sm">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {appointment && (
            <div className="pt-8 border-t border-[#e5e7eb] space-y-8">
              <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-[#e5e7eb]">
                <div>
                  <span className="text-xs uppercase tracking-wider text-[#6b7280] font-bold block mb-1">
                    Reference Code
                  </span>
                  <span className="font-bold text-3xl text-[#080808]">
                    {appointment.reference}
                  </span>
                </div>
                <div>
                  <span className="text-xs uppercase tracking-wider text-[#6b7280] font-bold block mb-1">
                    Current Lifecycle Status
                  </span>
                  <span
                    className={`inline-flex items-center gap-2 px-3.5 py-1 text-sm font-bold ${
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

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-base">
                <div className="space-y-1">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#6b7280] block">
                    Specialist
                  </span>
                  <span className="font-bold text-lg text-[#080808]">
                    {appointment.doctorNameEn}
                  </span>
                </div>
                <div className="space-y-1">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#6b7280] block">
                    Department &amp; Branch
                  </span>
                  <span className="font-bold text-lg text-[#080808]">
                    {appointment.departmentNameEn} • {appointment.branchNameEn}
                  </span>
                </div>
                <div className="space-y-1">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#6b7280] block">
                    Preferred Date &amp; Time Slot
                  </span>
                  <span className="font-bold text-lg text-[#080808]">
                    {appointment.preferredDate} at {appointment.preferredTimeSlot}
                  </span>
                </div>
              </div>

              {/* Status Event Audit Trail */}
              <div className="pt-6">
                <h3 className="font-bold text-lg text-[#080808] mb-4">
                  Appointment Status History &amp; Audit Trail
                </h3>
                <div className="divide-y divide-[#e5e7eb]">
                  {appointment.events.map((ev) => (
                    <div
                      key={ev.id}
                      className="py-3.5 text-sm flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                    >
                      <div>
                        <span className="font-bold text-[#004181]">
                          {ev.fromStatus ? `${ev.fromStatus} → ` : ""}
                          {ev.toStatus}
                        </span>{" "}
                        — <span className="text-[#374151]">{ev.reason}</span>
                        <p className="text-xs text-[#6b7280] mt-0.5">
                          Recorded by: {ev.actorName}
                        </p>
                      </div>
                      <span className="text-xs text-[#6b7280] shrink-0 font-mono">
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
    <Suspense fallback={<div className="p-12 text-center text-gray-500">Loading...</div>}>
      <TrackAppointmentInner />
    </Suspense>
  );
}
