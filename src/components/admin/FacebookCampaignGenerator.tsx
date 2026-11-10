"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { Check, Copy, Download, Loader2, Send } from "lucide-react";
import { toPng } from "html-to-image";
import type {
  DoctorFacebookSpotlight,
  FacebookCampaignResponse,
} from "@/server/services/facebookCampaignService";

type CardLanguage = "en" | "bn";

const BN_DIGITS = "০১২৩৪৫৬৭৮৯";
const toBnDigits = (s: string) => s.replace(/\d/g, (d) => BN_DIGITS[Number(d)]);

function dhakaIso(offsetDays = 0): string {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Dhaka",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
}

function formatCardDate(iso: string, lang: CardLanguage): string {
  const date = new Date(`${iso}T00:00:00+06:00`);
  const text = new Intl.DateTimeFormat(lang === "bn" ? "bn-BD" : "en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "Asia/Dhaka",
  }).format(date);
  return lang === "bn" ? toBnDigits(text) : text;
}

/**
 * Minimal 3-zone 4:5 photocard:
 *  - portrait block top-centre (70% × 60%, flush with top)
 *  - logo badge overlapping the portrait's upper-left corner
 *  - name / department / date & time centred in the open bottom 40%
 */
export const PhotoCard = React.forwardRef<
  HTMLDivElement,
  { doctor: DoctorFacebookSpotlight; date: string; lang: CardLanguage }
>(function PhotoCard({ doctor, date, lang }, ref) {
  const name = lang === "bn" ? doctor.nameBn : doctor.nameEn;
  const dept = lang === "bn" ? doctor.departmentNameBn : doctor.departmentNameEn;
  const hours = lang === "bn" ? doctor.visitingHoursBn : doctor.visitingHoursEn;
  const innerRef = useRef<HTMLDivElement | null>(null);
  const [w, setW] = useState(432);

  useEffect(() => {
    const el = innerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => setW(entry.contentRect.width || 432));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <div
      ref={(el) => {
        innerRef.current = el;
        if (typeof ref === "function") ref(el);
        else if (ref) ref.current = el;
      }}
      className="relative w-full overflow-hidden bg-[#f7f9fc]"
      style={{ aspectRatio: "4 / 5" }}
    >
      <div
        className="absolute top-0 overflow-hidden bg-[#e6ecf3]"
        style={{ left: "15%", width: "70%", height: "60%" }}
      >
        {doctor.photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={doctor.photoUrl}
            alt=""
            crossOrigin="anonymous"
            className="w-full h-full object-cover object-top"
          />
        ) : null}
      </div>

      <div
        className="absolute z-10 flex items-center justify-center bg-white shadow-sm"
        style={{ top: "2.5%", left: "5%", width: "34%", height: "11%" }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/images/evercare-logo.svg" alt="Evercare" className="w-[86%] h-auto" />
      </div>

      <div
        className="absolute inset-x-0 bottom-0 flex flex-col items-center justify-center text-center px-[8%]"
        style={{ height: "40%" }}
      >
        <p className="font-semibold text-[#0b1b33] leading-tight" style={{ fontSize: w * 0.064 }}>
          {name}
        </p>
        <p className="mt-[2.5%] text-[#0057b8] font-medium" style={{ fontSize: w * 0.042 }}>
          {dept}
        </p>
        <p className="mt-[4%] text-[#4b5563]" style={{ fontSize: w * 0.036 }}>
          {formatCardDate(date, lang)} · {hours}
        </p>
      </div>
    </div>
  );
});

export function FacebookCampaignGenerator({
  embedded = false,
  initialDoctorId = null,
}: {
  embedded?: boolean;
  initialDoctorId?: string | null;
}) {
  const [date, setDate] = useState<string>(() => dhakaIso());
  const [lang, setLang] = useState<CardLanguage>("bn");
  const [data, setData] = useState<FacebookCampaignResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<null | "download" | "post">(null);
  const [status, setStatus] = useState<{ tone: "ok" | "error"; text: string; href?: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const cardRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const load = useCallback(async () => {
    setLoading(true);
    setStatus(null);
    try {
      const res = await fetch(`/api/v1/admin/facebook-campaign?date=${date}`, { cache: "no-store" });
      const json: FacebookCampaignResponse = await res.json();
      setData(json.ok ? json : null);
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [date]);

  useEffect(() => {
    void load();
  }, [load]);

  const doctors = (data?.doctors ?? []).filter((d) => !initialDoctorId || d.doctorId === initialDoctorId);

  const renderPng = async (doctorId: string) => {
    const node = cardRefs.current[doctorId];
    if (!node) throw new Error("Card not rendered");
    const width = node.offsetWidth || 432;
    return toPng(node, { pixelRatio: 1080 / width, cacheBust: true, backgroundColor: "#f7f9fc" });
  };

  const fileNameFor = (d: DoctorFacebookSpotlight) => `evercare-${d.doctorSlug}-${date}.png`;

  const caption =
    lang === "bn"
      ? `আজ এভারকেয়ারে যে বিশেষজ্ঞ চিকিৎসকগণ রোগী দেখবেন — ${formatCardDate(date, "bn")}\n\n${doctors
          .map((d) => `• ${d.nameBn} — ${d.departmentNameBn} (${d.visitingHoursBn})`)
          .join("\n")}\n\nঅ্যাপয়েন্টমেন্ট: হটলাইন ১০৬৬৬ অথবা ওয়েবসাইটে অনলাইনে বুক করুন।`
      : `Specialists seeing patients at Evercare — ${formatCardDate(date, "en")}\n\n${doctors
          .map((d) => `• ${d.nameEn} — ${d.departmentNameEn} (${d.visitingHoursEn})`)
          .join("\n")}\n\nBook online or call 10666.`;

  const downloadAll = async () => {
    setBusy("download");
    try {
      for (const d of doctors) {
        const url = await renderPng(d.doctorId);
        const a = document.createElement("a");
        a.href = url;
        a.download = fileNameFor(d);
        a.click();
      }
    } catch {
      setStatus({ tone: "error", text: "Could not generate one of the images." });
    } finally {
      setBusy(null);
    }
  };

  const autoPost = async () => {
    if (!doctors.length) return;
    if (!window.confirm(`Publish ${doctors.length} photocard(s) to the Evercare Facebook page now?`)) return;
    setBusy("post");
    setStatus(null);
    try {
      const images = [];
      for (const d of doctors) {
        images.push({ doctorId: d.doctorId, fileName: fileNameFor(d), dataUrl: await renderPng(d.doctorId) });
      }
      const res = await fetch("/api/v1/admin/facebook/auto-post", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ caption, images }),
      });
      const json = await res.json();
      if (json.ok) {
        setStatus({
          tone: "ok",
          text: `Posted ${json.uploaded} photocard(s) to Facebook.`,
          href: json.postUrl,
        });
      } else {
        setStatus({ tone: "error", text: json.error || "Facebook rejected the post." });
      }
    } catch {
      setStatus({ tone: "error", text: "Network error while posting to Facebook." });
    } finally {
      setBusy(null);
    }
  };

  const copyCaption = async () => {
    await navigator.clipboard.writeText(caption).catch(() => undefined);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const tabBtn = (active: boolean) =>
    `px-3.5 py-1.5 rounded-full text-sm transition-colors ${
      active ? "bg-[#0b1b33] text-white" : "text-[#4b5563] hover:bg-[#eef0f3]"
    }`;

  return (
    <div className={embedded ? "" : "max-w-6xl mx-auto px-6 py-10"}>
      <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-[#0b1b33]">Facebook Post</h2>
          <p className="mt-1 text-sm text-[#6b7280]">
            {loading
              ? "Loading today's chambers…"
              : `${doctors.length} doctor${doctors.length === 1 ? "" : "s"} available on ${formatCardDate(date, "en")}`}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 rounded-full bg-[#f3f4f6] p-1">
            <button type="button" className={tabBtn(date === dhakaIso())} onClick={() => setDate(dhakaIso())}>
              Today
            </button>
            <button type="button" className={tabBtn(date === dhakaIso(1))} onClick={() => setDate(dhakaIso(1))}>
              Tomorrow
            </button>
            <input
              type="date"
              value={date}
              onChange={(e) => e.target.value && setDate(e.target.value)}
              aria-label="Pick date"
              className="bg-transparent text-sm text-[#4b5563] px-2 outline-none"
            />
          </div>
          <div className="flex items-center gap-1 rounded-full bg-[#f3f4f6] p-1">
            <button type="button" className={tabBtn(lang === "bn")} onClick={() => setLang("bn")}>
              বাংলা
            </button>
            <button type="button" className={tabBtn(lang === "en")} onClick={() => setLang("en")}>
              English
            </button>
          </div>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={autoPost}
          disabled={!doctors.length || busy !== null}
          className="inline-flex items-center gap-2 rounded-full bg-[#1877f2] px-5 py-2.5 text-sm font-medium text-white hover:bg-[#166fe5] disabled:opacity-50"
        >
          {busy === "post" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          Auto-Post on Facebook
        </button>
        <button
          type="button"
          onClick={downloadAll}
          disabled={!doctors.length || busy !== null}
          className="inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm text-[#0b1b33] ring-1 ring-[#e5e7eb] hover:bg-[#f9fafb] disabled:opacity-50"
        >
          {busy === "download" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
          Download PNGs
        </button>
        <button
          type="button"
          onClick={copyCaption}
          disabled={!doctors.length}
          className="inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm text-[#0b1b33] ring-1 ring-[#e5e7eb] hover:bg-[#f9fafb] disabled:opacity-50"
        >
          {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
          Copy caption
        </button>
        {status && (
          <p className={`text-sm ${status.tone === "ok" ? "text-emerald-700" : "text-red-600"}`}>
            {status.text}{" "}
            {status.href && (
              <a href={status.href} target="_blank" rel="noreferrer" className="underline">
                View post
              </a>
            )}
          </p>
        )}
      </div>

      {!loading && doctors.length === 0 && (
        <p className="mt-16 text-center text-[#6b7280]">No doctors have chambers on this date.</p>
      )}

      <div className="mt-8 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
        {doctors.map((d) => (
          <div key={d.doctorId} className="group">
            <div className="overflow-hidden rounded-xl ring-1 ring-[#eef0f3] transition-shadow group-hover:shadow-lg">
              <PhotoCard
                ref={(el) => {
                  cardRefs.current[d.doctorId] = el;
                }}
                doctor={d}
                date={date}
                lang={lang}
              />
            </div>
            <button
              type="button"
              onClick={async () => {
                const url = await renderPng(d.doctorId);
                const a = document.createElement("a");
                a.href = url;
                a.download = fileNameFor(d);
                a.click();
              }}
              className="mt-3 inline-flex items-center gap-1.5 text-sm text-[#0057b8] hover:underline"
            >
              <Download className="w-4 h-4" /> PNG
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
