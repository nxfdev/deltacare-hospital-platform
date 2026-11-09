"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Search,
  AlertCircle,
  ArrowLeft,
  Calendar,
} from "lucide-react";
import { useLocale } from "@/lib/i18n/LocaleContext";
import {
  DigitalAppointmentSlip,
  DigitalSlipAppointment,
} from "@/components/appointments/DigitalAppointmentSlip";

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
  const [appointment, setAppointment] = useState<DigitalSlipAppointment | null>(
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
        )}&phone=${encodeURIComponent(phoneVal.trim())}`,
        { cache: "no-store" }
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
      {/* Full-bleed Stretched Blue Hero Header (Hidden on Print) */}
      <div className="print:hidden w-full bg-[#012d61] text-white py-14 md:py-18 border-b border-[#001f44]">
        <div className="mc-container max-w-7xl mx-auto px-6 sm:px-10 lg:px-12 space-y-4">
          <p className="text-xs sm:text-sm font-bold uppercase tracking-widest text-[#93c5fd]">
            Care at DeltaCare • Real-Time Booking Verification & Digital Slip
          </p>
          <h1 className="mc-serif text-3xl sm:text-5xl lg:text-[54px] font-bold text-white tracking-tight leading-tight">
            {locale === "bn"
              ? "অ্যাপয়েন্টমেন্ট স্ট্যাটাস ও ডিজিটাল স্লিপ"
              : "Track Your Appointment & Digital Slip"}
          </h1>
          <p className="text-xl text-[#c5e2f9] font-medium">
            রিয়েল-টাইম রেফারেন্স, চেম্বার রুম ও এসএমএস কনফার্মেশন ট্র্যাকার
          </p>
          <p className="text-base sm:text-lg text-[#e8f0f9] max-w-3xl leading-relaxed">
            {locale === "bn"
              ? "আপনার রেফারেন্স কোড (যেমন: DC-2026-1041) এবং নিবন্ধিত মোবাইল নম্বর (যেমন: 01711223344) দিয়ে বর্তমান অবস্থা, চেম্বার রুম নম্বর এবং প্রিন্টযোগ্য ডিজিটাল অ্যাপয়েন্টমেন্ট স্লিপ দেখুন।"
              : "Enter your appointment reference code (demo: DC-2026-1041 or DC-2026-1042) and registered mobile number (01711223344) to inspect live verification status and print your Digital Appointment Slip."}
          </p>
        </div>
      </div>

      {/* Main Body */}
      <div className="w-full py-12 md:py-16">
        <div className="mc-container max-w-5xl mx-auto px-6 sm:px-10 lg:px-12 space-y-10">
          {/* Top Actions Link */}
          <div className="print:hidden flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-[#e5e7eb]">
            <Link
              href="/appointments"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#004181] hover:text-[#0057b8] hover:underline"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>
                {locale === "bn"
                  ? "অনলাইন অ্যাপয়েন্টমেন্ট বুকিংয়ে ফিরুন"
                  : "Back to Online Appointment Booking"}
              </span>
            </Link>
            <Link
              href="/appointments"
              className="inline-flex min-h-[44px] items-center gap-2 bg-[#0057b8] hover:bg-[#004494] text-white px-5 py-2.5 text-xs font-bold uppercase tracking-wider"
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>
                {locale === "bn"
                  ? "নতুন অ্যাপয়েন্টমেন্ট বুক করুন"
                  : "Book New Appointment"}
              </span>
            </Link>
          </div>

          {/* Search Form - Unboxed */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              lookup(reference, phone);
            }}
            className="print:hidden grid grid-cols-1 sm:grid-cols-3 gap-6 items-end"
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
                className="w-full h-12 px-3.5 border border-[#9ca3af] focus:border-[#0057b8] text-base outline-none tabular-nums"
              />
            </div>

            <div>
              <label
                htmlFor="track-phone"
                className="block text-sm font-bold text-[#080808] mb-2"
              >
                11-Digit BD Mobile Number *
              </label>
              <input
                id="track-phone"
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="01711223344"
                className="w-full h-12 px-3.5 border border-[#9ca3af] focus:border-[#0057b8] text-base outline-none tabular-nums"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="h-12 bg-[#0057b8] hover:bg-[#004494] text-white flex items-center justify-center gap-2 text-base font-semibold cursor-pointer"
            >
              <Search className="w-4 h-4" />
              <span>{loading ? "Checking..." : "View Digital Slip"}</span>
            </button>
          </form>

          {errorMsg && (
            <div className="print:hidden p-4 border-l-4 border-[#dc2626] bg-[#fef2f2] text-[#7f1d1d] flex items-center gap-2 text-sm">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {appointment && <DigitalAppointmentSlip appointment={appointment} />}
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
