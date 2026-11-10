"use client";

import React, { useMemo, useState } from "react";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameMonth,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { bn as bnLocale } from "date-fns/locale";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";

import { toBnDigits } from "@/lib/i18n/digits";
export { toBnDigits };

export function dhakaTodayIso(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Dhaka",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

/** Parses YYYY-MM-DD as a local calendar date (no timezone shift). */
export function parseIso(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

const toIso = (d: Date) => format(d, "yyyy-MM-dd");

const WEEKDAYS = {
  en: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
  bn: ["রবি", "সোম", "মঙ্গল", "বুধ", "বৃহঃ", "শুক্র", "শনি"],
};

export function BookingCalendar({
  locale,
  selected,
  onSelect,
  isAvailable,
  maxDaysAhead = 60,
}: {
  locale: "en" | "bn";
  selected: string;
  onSelect: (iso: string) => void;
  /** Return true when a chamber runs on this date (YYYY-MM-DD). */
  isAvailable: (iso: string, weekday: number) => boolean;
  maxDaysAhead?: number;
}) {
  const todayIso = dhakaTodayIso();
  const today = parseIso(todayIso);
  const lastDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + maxDaysAhead);
  const [month, setMonth] = useState(() => startOfMonth(selected ? parseIso(selected) : today));

  const days = useMemo(
    () =>
      eachDayOfInterval({
        start: startOfWeek(startOfMonth(month), { weekStartsOn: 0 }),
        end: endOfWeek(endOfMonth(month), { weekStartsOn: 0 }),
      }),
    [month]
  );

  const canPrev = startOfMonth(month) > startOfMonth(today);
  const canNext = startOfMonth(addMonths(month, 1)) <= lastDay;
  const title =
    locale === "bn"
      ? toBnDigits(format(month, "MMMM yyyy", { locale: bnLocale }))
      : format(month, "MMMM yyyy");

  return (
    <div className="w-full max-w-md">
      <div className="flex items-center justify-between mb-4">
        <button
          type="button"
          onClick={() => setMonth((m) => addMonths(m, -1))}
          disabled={!canPrev}
          aria-label={locale === "bn" ? "আগের মাস" : "Previous month"}
          className="p-2 rounded-full text-[#374151] hover:bg-[#f3f4f6] disabled:opacity-30 disabled:hover:bg-transparent"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <p className="text-base font-semibold text-[#0b1b33]">{title}</p>
        <button
          type="button"
          onClick={() => setMonth((m) => addMonths(m, 1))}
          disabled={!canNext}
          aria-label={locale === "bn" ? "পরের মাস" : "Next month"}
          className="p-2 rounded-full text-[#374151] hover:bg-[#f3f4f6] disabled:opacity-30 disabled:hover:bg-transparent"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      <div className="grid grid-cols-7 text-center text-xs font-medium text-[#9ca3af] mb-2">
        {WEEKDAYS[locale].map((w) => (
          <span key={w} className="py-1">
            {w}
          </span>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {days.map((day) => {
          const iso = toIso(day);
          const inMonth = isSameMonth(day, month);
          const inRange = day >= today && day <= lastDay;
          const available = inMonth && inRange && isAvailable(iso, day.getDay());
          const isSelected = iso === selected;
          const isToday = iso === todayIso;
          const label = locale === "bn" ? toBnDigits(day.getDate()) : day.getDate();

          if (!inMonth) return <span key={iso} />;

          return (
            <motion.button
              key={iso}
              type="button"
              disabled={!available}
              onClick={() => onSelect(iso)}
              whileTap={available ? { scale: 0.92 } : undefined}
              aria-pressed={isSelected}
              aria-label={iso}
              className={`relative aspect-square rounded-full text-sm transition-colors ${
                isSelected
                  ? "bg-[#0057b8] text-white font-semibold"
                  : available
                    ? "bg-[#eef4fb] text-[#0057b8] font-medium hover:bg-[#dbe8f7]"
                    : "text-[#cbd5e1] cursor-default"
              }`}
            >
              {label}
              {isToday && !isSelected && (
                <span className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-current" />
              )}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
