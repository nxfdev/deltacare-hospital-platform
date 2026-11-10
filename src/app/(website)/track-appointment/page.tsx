"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { AlertCircle, Loader2 } from "lucide-react";
import { useLocale } from "@/lib/i18n/LocaleContext";
import { DigitalAppointmentSlip, DigitalSlipAppointment } from "@/components/appointments/DigitalAppointmentSlip";

const COPY = {
  en: {
    title: "Track your appointment",
    intro: "Enter the reference code from your SMS and the mobile number you booked with.",
    ref: "Reference code",
    phone: "Mobile number",
    submit: "Find appointment",
    checking: "Checking…",
    notFound: "We couldn't find an appointment with those details.",
    error: "Unable to check right now. Please try again.",
    book: "Book a new appointment",
  },
  bn: {
    title: "অ্যাপয়েন্টমেন্ট ট্র্যাক করুন",
    intro: "এসএমএসে পাওয়া রেফারেন্স কোড ও বুকিংয়ের মোবাইল নম্বর দিন।",
    ref: "রেফারেন্স কোড",
    phone: "মোবাইল নম্বর",
    submit: "খুঁজুন",
    checking: "খোঁজা হচ্ছে…",
    notFound: "এই তথ্যে কোনো অ্যাপয়েন্টমেন্ট পাওয়া যায়নি।",
    error: "এই মুহূর্তে যাচাই করা যাচ্ছে না। আবার চেষ্টা করুন।",
    book: "নতুন অ্যাপয়েন্টমেন্ট নিন",
  },
} as const;

const fieldCls =
  "w-full h-12 rounded-lg border border-[#e5e7eb] bg-white px-4 text-[15px] text-[#0b1b33] focus:border-[#0057b8] focus:ring-2 focus:ring-[#0057b8]/15 outline-none transition";

function TrackAppointmentInner() {
  const { locale } = useLocale();
  const t = COPY[locale === "bn" ? "bn" : "en"];
  const searchParams = useSearchParams();
  const [reference, setReference] = useState(searchParams.get("reference") || "");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [appointment, setAppointment] = useState<DigitalSlipAppointment | null>(null);

  const lookup = async () => {
    if (!reference.trim() || !phone.trim()) return;
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch(
        `/api/v1/public/appointments?reference=${encodeURIComponent(reference.trim())}&phone=${encodeURIComponent(phone.trim())}`,
        { cache: "no-store" }
      );
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setAppointment(null);
        setErrorMsg(t.notFound);
      } else {
        setAppointment(data.appointment);
      }
    } catch {
      setErrorMsg(t.error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white">
      <section className="print:hidden w-full bg-[#012d61] text-white">
        <div className="mc-container max-w-7xl mx-auto px-6 sm:px-10 lg:px-12 py-16 md:py-24">
          <h1 className="mc-serif text-4xl sm:text-5xl lg:text-6xl font-normal tracking-tight">{t.title}</h1>
          <p className="mt-5 max-w-2xl text-lg text-white/80">{t.intro}</p>
        </div>
      </section>

      <div className="mc-container max-w-4xl mx-auto px-6 sm:px-10 py-16 space-y-10">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void lookup();
          }}
          className="print:hidden grid gap-5 sm:grid-cols-[1fr_1fr_auto] items-end"
        >
          <div>
            <label htmlFor="track-ref" className="block text-sm font-medium text-[#374151] mb-1.5">
              {t.ref}
            </label>
            <input
              id="track-ref"
              required
              value={reference}
              onChange={(e) => setReference(e.target.value.toUpperCase())}
              placeholder="EC-2026-1041"
              className={fieldCls}
            />
          </div>
          <div>
            <label htmlFor="track-phone" className="block text-sm font-medium text-[#374151] mb-1.5">
              {t.phone}
            </label>
            <input
              id="track-phone"
              type="tel"
              inputMode="numeric"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="01XXXXXXXXX"
              className={fieldCls}
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="h-12 px-6 rounded-full bg-[#0057b8] hover:bg-[#004a9c] text-white font-medium inline-flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {loading ? t.checking : t.submit}
          </button>
        </form>

        {errorMsg && (
          <p className="print:hidden flex items-center gap-2 text-red-600">
            <AlertCircle className="w-5 h-5 shrink-0" />
            {errorMsg}
          </p>
        )}

        {appointment ? (
          <DigitalAppointmentSlip appointment={appointment} />
        ) : (
          <Link href="/appointments" className="print:hidden inline-block text-[#0057b8] hover:underline">
            {t.book}
          </Link>
        )}
      </div>
    </div>
  );
}

export default function TrackAppointmentPage() {
  return (
    <Suspense fallback={null}>
      <TrackAppointmentInner />
    </Suspense>
  );
}
