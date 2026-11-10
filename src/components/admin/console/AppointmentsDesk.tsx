"use client";

import React, { Suspense, useCallback, useEffect, useMemo, useState } from "react";
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
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Loader2, Plus, Search, X } from "lucide-react";
import type { Appointment, AppointmentStatus, Branch, Department, Doctor } from "@/types/domain";
import { fuzzyRecordScore, FUZZY_THRESHOLD } from "@/lib/fuzzy";
import { PublicThreeStepBookingClient } from "@/components/appointments/PublicThreeStepBookingClient";

function dhakaToday(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Dhaka", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
}
const parseIso = (iso: string) => {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
};
const to12h = (t: string) => {
  const [h, m] = t.split(":").map(Number);
  return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${h >= 12 ? "PM" : "AM"}`;
};

const STATUS_STYLE: Record<string, { label: string; cls: string }> = {
  CONFIRMED: { label: "Confirmed", cls: "bg-emerald-50 text-emerald-700" },
  REQUESTED: { label: "Pending", cls: "bg-amber-50 text-amber-700" },
  PENDING_CONFIRMATION: { label: "Pending", cls: "bg-amber-50 text-amber-700" },
  RESCHEDULE_REQUESTED: { label: "Reschedule", cls: "bg-amber-50 text-amber-700" },
  COMPLETED: { label: "Seen", cls: "bg-sky-50 text-sky-700" },
  CANCELLED: { label: "Cancelled", cls: "bg-rose-50 text-rose-700" },
  NO_SHOW: { label: "No-show", cls: "bg-slate-100 text-slate-600" },
};
const ACTIVE = new Set(["REQUESTED", "PENDING_CONFIRMATION", "CONFIRMED", "RESCHEDULE_REQUESTED"]);

export function AppointmentsDesk({
  initialAppointments,
  doctors,
  departments,
  branches,
}: {
  initialAppointments?: Appointment[];
  doctors: Doctor[];
  departments: Department[];
  branches: Branch[];
}) {
  const today = dhakaToday();
  const [appointments, setAppointments] = useState<Appointment[]>(initialAppointments ?? []);
  const [loading, setLoading] = useState(!initialAppointments);
  const [selected, setSelected] = useState(today);
  const [month, setMonth] = useState(() => startOfMonth(parseIso(today)));
  const [doctorFilter, setDoctorFilter] = useState("");
  const [query, setQuery] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [panel, setPanel] = useState<null | "book" | "leave">(null);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/v1/admin/appointments", { cache: "no-store" });
      const data = await res.json();
      if (data.ok) setAppointments(data.appointments);
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(t);
  }, [toast]);

  const scoped = useMemo(
    () => appointments.filter((a) => !doctorFilter || a.doctorId === doctorFilter),
    [appointments, doctorFilter]
  );

  const countByDay = useMemo(() => {
    const m = new Map<string, number>();
    scoped.forEach((a) => ACTIVE.has(a.status) && m.set(a.preferredDate, (m.get(a.preferredDate) ?? 0) + 1));
    return m;
  }, [scoped]);

  const list = useMemo(() => {
    const q = query.trim();
    const base = q
      ? scoped.filter(
          (a) =>
            a.reference.toLowerCase().includes(q.toLowerCase()) ||
            a.patientPhone.includes(q) ||
            fuzzyRecordScore(q, [a.patientName]) >= FUZZY_THRESHOLD
        )
      : scoped.filter((a) => a.preferredDate === selected);
    return [...base].sort(
      (a, b) => a.preferredDate.localeCompare(b.preferredDate) || a.preferredTimeSlot.localeCompare(b.preferredTimeSlot)
    );
  }, [scoped, selected, query]);

  const days = useMemo(
    () => eachDayOfInterval({ start: startOfWeek(startOfMonth(month)), end: endOfWeek(endOfMonth(month)) }),
    [month]
  );

  const docName = (id: string) => doctors.find((d) => d.id === id)?.nameEn ?? id;
  const branchName = (id: string) => branches.find((b) => b.id === id)?.nameEn ?? id;

  async function transition(a: Appointment, toStatus: AppointmentStatus, label: string) {
    setBusyId(a.id);
    try {
      const res = await fetch("/api/v1/admin/appointments", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ appointmentId: a.id, toStatus, reason: `${label} from appointments desk` }),
      });
      const data = await res.json();
      if (data.ok) {
        setAppointments((prev) => prev.map((x) => (x.id === a.id ? data.appointment ?? { ...x, status: toStatus } : x)));
        setToast(`${a.patientName}: ${label.toLowerCase()}`);
      } else {
        setToast(data.error || "Could not update appointment.");
      }
    } catch {
      setToast("Network error.");
    } finally {
      setBusyId(null);
    }
  }

  const selectedLabel = format(parseIso(selected), "EEEE, d MMMM");

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[220px] max-w-md">
          <Search className="w-4 h-4 text-[#9ca3af] absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search patient, phone or reference"
            aria-label="Search appointments"
            className="w-full h-11 rounded-full bg-white pl-11 pr-4 text-sm ring-1 ring-[#e5e7eb] focus:ring-[#0057b8] outline-none"
          />
        </div>
        <select
          value={doctorFilter}
          onChange={(e) => setDoctorFilter(e.target.value)}
          aria-label="Filter by doctor"
          className="h-11 rounded-full bg-white px-4 text-sm ring-1 ring-[#e5e7eb] outline-none"
        >
          <option value="">All doctors</option>
          {doctors.map((d) => (
            <option key={d.id} value={d.id}>
              {d.nameEn}
            </option>
          ))}
        </select>
        <div className="ml-auto flex gap-2">
          <button
            type="button"
            onClick={() => setPanel("leave")}
            className="h-11 rounded-full px-4 text-sm text-[#0b1b33] ring-1 ring-[#e5e7eb] bg-white hover:bg-[#f9fafb]"
          >
            Doctor leave
          </button>
          <button
            type="button"
            onClick={() => setPanel("book")}
            className="h-11 rounded-full px-5 text-sm font-medium text-white bg-[#0057b8] hover:bg-[#004a9c] inline-flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" /> New booking
          </button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
        {/* Month calendar */}
        <div className="rounded-2xl bg-white p-5 ring-1 ring-[#eef0f3] h-fit">
          <div className="flex items-center justify-between mb-3">
            <button type="button" aria-label="Previous month" onClick={() => setMonth((m) => addMonths(m, -1))} className="p-2 rounded-full hover:bg-[#f3f4f6]">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <p className="font-medium text-[#0b1b33]">{format(month, "MMMM yyyy")}</p>
            <button type="button" aria-label="Next month" onClick={() => setMonth((m) => addMonths(m, 1))} className="p-2 rounded-full hover:bg-[#f3f4f6]">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-7 text-center text-xs text-[#9ca3af] mb-1">
            {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
              <span key={i} className="py-1">
                {d}
              </span>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {days.map((day) => {
              const iso = format(day, "yyyy-MM-dd");
              const count = countByDay.get(iso) ?? 0;
              const isSel = iso === selected && !query;
              const inMonth = isSameMonth(day, month);
              return (
                <button
                  key={iso}
                  type="button"
                  onClick={() => {
                    setSelected(iso);
                    setQuery("");
                  }}
                  className={`relative aspect-square rounded-xl text-sm transition-colors ${
                    isSel ? "bg-[#0b1b33] text-white" : inMonth ? "text-[#0b1b33] hover:bg-[#f3f4f6]" : "text-[#d1d5db]"
                  } ${iso === today && !isSel ? "ring-1 ring-[#0057b8]" : ""}`}
                >
                  {day.getDate()}
                  {count > 0 && (
                    <span
                      className={`absolute bottom-1 left-1/2 -translate-x-1/2 text-[10px] leading-none font-medium ${
                        isSel ? "text-white/80" : "text-[#0057b8]"
                      }`}
                    >
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
          <button
            type="button"
            onClick={() => {
              setSelected(today);
              setMonth(startOfMonth(parseIso(today)));
              setQuery("");
            }}
            className="mt-4 text-sm text-[#0057b8] hover:underline"
          >
            Jump to today
          </button>
        </div>

        {/* Day list */}
        <div className="rounded-2xl bg-white ring-1 ring-[#eef0f3]">
          <div className="flex items-center justify-between px-6 py-4 border-b border-[#f1f3f6]">
            <p className="font-medium text-[#0b1b33]">{query ? `Results for "${query}"` : selectedLabel}</p>
            <p className="text-sm text-[#9ca3af]">{list.length} appointment{list.length === 1 ? "" : "s"}</p>
          </div>
          {loading ? (
            <div className="py-20 flex justify-center text-[#9ca3af]">
              <Loader2 className="w-5 h-5 animate-spin" />
            </div>
          ) : list.length === 0 ? (
            <p className="py-20 text-center text-sm text-[#9ca3af]">Nothing booked.</p>
          ) : (
            <ul className="divide-y divide-[#f1f3f6]">
              {list.map((a) => {
                const st = STATUS_STYLE[a.status] ?? { label: a.status, cls: "bg-slate-100 text-slate-600" };
                const active = ACTIVE.has(a.status);
                return (
                  <li key={a.id} className="flex flex-wrap items-center gap-4 px-6 py-4">
                    <div className="w-20 shrink-0">
                      <p className="text-sm font-medium text-[#0b1b33]">{to12h(a.preferredTimeSlot)}</p>
                      {query && <p className="text-xs text-[#9ca3af]">{format(parseIso(a.preferredDate), "d MMM")}</p>}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-[#0b1b33] truncate">{a.patientName}</p>
                      <p className="text-xs text-[#6b7280] truncate">
                        {docName(a.doctorId)} · {branchName(a.branchId)} · {a.patientPhone}
                      </p>
                    </div>
                    <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${st.cls}`}>{st.label}</span>
                    {active && (
                      <div className="flex gap-1">
                        {busyId === a.id ? (
                          <Loader2 className="w-4 h-4 animate-spin text-[#9ca3af]" />
                        ) : (
                          <>
                            {a.status !== "CONFIRMED" && (
                              <button type="button" onClick={() => transition(a, "CONFIRMED", "Confirmed")} className="rounded-full px-3 py-1.5 text-xs text-emerald-700 hover:bg-emerald-50">
                                Confirm
                              </button>
                            )}
                            <button type="button" onClick={() => transition(a, "COMPLETED", "Marked seen")} className="rounded-full px-3 py-1.5 text-xs text-[#0057b8] hover:bg-[#eef4fb]">
                              Seen
                            </button>
                            <button type="button" onClick={() => transition(a, "NO_SHOW", "Marked no-show")} className="rounded-full px-3 py-1.5 text-xs text-[#6b7280] hover:bg-[#f3f4f6]">
                              No-show
                            </button>
                            <button
                              type="button"
                              onClick={() => window.confirm(`Cancel ${a.patientName}'s appointment? An SMS will be sent.`) && transition(a, "CANCELLED", "Cancelled")}
                              className="rounded-full px-3 py-1.5 text-xs text-rose-600 hover:bg-rose-50"
                            >
                              Cancel
                            </button>
                          </>
                        )}
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>

      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 rounded-full bg-[#0b1b33] px-5 py-3 text-sm text-white shadow-lg"
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {panel && (
          <motion.div
            className="fixed inset-0 z-40 bg-black/30 flex justify-end"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setPanel(null)}
          >
            <motion.div
              initial={{ x: 40 }}
              animate={{ x: 0 }}
              exit={{ x: 40 }}
              onClick={(e) => e.stopPropagation()}
              className="h-full w-full max-w-3xl overflow-y-auto bg-white p-8"
            >
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-xl font-semibold text-[#0b1b33]">{panel === "book" ? "New booking" : "Doctor leave"}</h2>
                <button type="button" aria-label="Close" onClick={() => setPanel(null)} className="p-2 rounded-full hover:bg-[#f3f4f6]">
                  <X className="w-5 h-5" />
                </button>
              </div>
              {panel === "book" ? (
                <Suspense fallback={null}>
                  <PublicThreeStepBookingClient embedded={false} branches={branches} departments={departments} doctors={doctors} />
                </Suspense>
              ) : (
                <LeaveForm
                  doctors={doctors}
                  branches={branches}
                  onDone={(msg) => {
                    setPanel(null);
                    setToast(msg);
                    void refresh();
                  }}
                />
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function LeaveForm({
  doctors,
  branches,
  onDone,
}: {
  doctors: Doctor[];
  branches: Branch[];
  onDone: (msg: string) => void;
}) {
  const [doctorId, setDoctorId] = useState(doctors[0]?.id ?? "");
  const doctor = doctors.find((d) => d.id === doctorId);
  const [branchId, setBranchId] = useState(doctor?.branches[0]?.branchId ?? "");
  const [date, setDate] = useState(dhakaToday());
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setBranchId(doctor?.branches[0]?.branchId ?? "");
  }, [doctor]);

  const field = "w-full h-12 rounded-lg border border-[#e5e7eb] px-4 text-[15px] outline-none focus:border-[#0057b8]";

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/v1/staff/schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "UPSERT_OVERRIDE",
          doctorId,
          branchId,
          date,
          overrideType: "FULL_DAY_LEAVE",
          blockedSlots: [],
          reasonEn: reason || "Doctor on leave",
          reasonBn: reason || "ডাক্তার ছুটিতে আছেন",
        }),
      });
      const data = await res.json();
      if (data.ok) {
        const affected = data.affectedAppointments?.length ?? 0;
        onDone(`Leave saved${affected ? ` · ${affected} patient(s) flagged for rescheduling` : ""}`);
      } else setError(data.error || "Could not save leave.");
    } catch {
      setError("Network error.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={save} className="space-y-5 max-w-md">
      <p className="text-sm text-[#6b7280]">The doctor&apos;s chamber will be closed for online booking on this date. Existing patients are flagged for rescheduling.</p>
      <label className="block">
        <span className="block text-sm font-medium text-[#374151] mb-1.5">Doctor</span>
        <select value={doctorId} onChange={(e) => setDoctorId(e.target.value)} className={field}>
          {doctors.map((d) => (
            <option key={d.id} value={d.id}>
              {d.nameEn}
            </option>
          ))}
        </select>
      </label>
      <label className="block">
        <span className="block text-sm font-medium text-[#374151] mb-1.5">Branch</span>
        <select value={branchId} onChange={(e) => setBranchId(e.target.value)} className={field}>
          {branches
            .filter((b) => doctor?.branches.some((a) => a.branchId === b.id))
            .map((b) => (
              <option key={b.id} value={b.id}>
                {b.nameEn}
              </option>
            ))}
        </select>
      </label>
      <label className="block">
        <span className="block text-sm font-medium text-[#374151] mb-1.5">Date</span>
        <input type="date" required value={date} min={dhakaToday()} onChange={(e) => setDate(e.target.value)} className={field} />
      </label>
      <label className="block">
        <span className="block text-sm font-medium text-[#374151] mb-1.5">Reason (optional)</span>
        <input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Conference" className={field} />
      </label>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button type="submit" disabled={saving} className="h-12 px-6 rounded-full bg-[#0b1b33] text-white font-medium disabled:opacity-60">
        {saving ? "Saving…" : "Save leave"}
      </button>
    </form>
  );
}
