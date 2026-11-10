"use client";

import React, { useMemo } from "react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { Appointment, Department, Doctor, FeedbackRecord } from "@/types/domain";

function dhakaIso(offset = 0): string {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Dhaka", year: "numeric", month: "2-digit", day: "2-digit" }).format(d);
}

function to12h(t: string) {
  const [h, m] = t.split(":").map(Number);
  return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${h >= 12 ? "PM" : "AM"}`;
}

const ACTIVE = new Set(["REQUESTED", "PENDING_CONFIRMATION", "CONFIRMED", "RESCHEDULE_REQUESTED"]);

function Kpi({ label, value, hint }: { label: string; value: string | number; hint?: string }) {
  return (
    <div className="rounded-2xl bg-white p-6 ring-1 ring-[#eef0f3]">
      <p className="text-sm text-[#6b7280]">{label}</p>
      <p className="mt-2 text-3xl font-semibold tracking-tight text-[#0b1b33]">{value}</p>
      {hint && <p className="mt-1 text-sm text-[#9ca3af]">{hint}</p>}
    </div>
  );
}

export function AdminOverview({
  appointments,
  doctors,
  departments,
  feedbacks,
  onOpenAppointments,
}: {
  appointments: Appointment[];
  doctors: Doctor[];
  departments: Department[];
  feedbacks: FeedbackRecord[];
  onOpenAppointments: () => void;
}) {
  const today = dhakaIso();

  const { todayList, upcoming, last14, cancelRate } = useMemo(() => {
    const todayList = appointments
      .filter((a) => a.preferredDate === today && ACTIVE.has(a.status))
      .sort((a, b) => a.preferredTimeSlot.localeCompare(b.preferredTimeSlot));
    const weekEnd = dhakaIso(7);
    const upcoming = appointments.filter(
      (a) => a.preferredDate > today && a.preferredDate <= weekEnd && ACTIVE.has(a.status)
    ).length;
    const last14 = Array.from({ length: 14 }, (_, i) => {
      const iso = dhakaIso(i - 13);
      return {
        day: new Date(`${iso}T00:00:00`).toLocaleDateString("en-GB", { day: "numeric", month: "short" }),
        bookings: appointments.filter((a) => a.createdAt.slice(0, 10) === iso).length,
      };
    });
    const recent = appointments.filter((a) => a.preferredDate >= dhakaIso(-30) && a.preferredDate <= today);
    const cancelled = recent.filter((a) => a.status === "CANCELLED" || a.status === "NO_SHOW").length;
    const cancelRate = recent.length ? Math.round((cancelled / recent.length) * 100) : 0;
    return { todayList, upcoming, last14, cancelRate };
  }, [appointments, today]);

  const activeDoctors = doctors.filter((d) => d.publicationState === "PUBLISHED").length;
  const openFeedback = feedbacks.filter((f) => f.status !== "RESOLVED" && f.status !== "CLOSED").length;
  const docName = (id: string) => doctors.find((d) => d.id === id)?.nameEn ?? "";
  const deptName = (id: string) => departments.find((d) => d.id === id)?.nameEn ?? "";

  return (
    <div className="space-y-8">
      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi label="Today's appointments" value={todayList.length} />
        <Kpi label="Next 7 days" value={upcoming} hint="booked & confirmed" />
        <Kpi label="Active doctors" value={activeDoctors} />
        <Kpi label="Missed or cancelled" value={`${cancelRate}%`} hint={`last 30 days · ${openFeedback} open feedback`} />
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.6fr_1fr]">
        <div className="rounded-2xl bg-white p-6 ring-1 ring-[#eef0f3]">
          <p className="font-medium text-[#0b1b33]">New bookings</p>
          <p className="text-sm text-[#9ca3af]">Last 14 days</p>
          <div className="mt-6 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={last14} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
                <defs>
                  <linearGradient id="bk" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#0057b8" stopOpacity={0.18} />
                    <stop offset="100%" stopColor="#0057b8" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} stroke="#f1f3f6" />
                <XAxis dataKey="day" tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: "#9ca3af" }} interval={2} />
                <YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: "#9ca3af" }} />
                <Tooltip
                  cursor={{ stroke: "#e5e7eb" }}
                  contentStyle={{ borderRadius: 12, border: "1px solid #eef0f3", fontSize: 13 }}
                />
                <Area type="monotone" dataKey="bookings" stroke="#0057b8" strokeWidth={2} fill="url(#bk)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-2xl bg-white p-6 ring-1 ring-[#eef0f3]">
          <div className="flex items-center justify-between">
            <p className="font-medium text-[#0b1b33]">Today</p>
            <button type="button" onClick={onOpenAppointments} className="text-sm text-[#0057b8] hover:underline">
              Open calendar
            </button>
          </div>
          {todayList.length === 0 ? (
            <p className="mt-10 text-center text-sm text-[#9ca3af]">No appointments today.</p>
          ) : (
            <ul className="mt-4 divide-y divide-[#f1f3f6]">
              {todayList.slice(0, 7).map((a) => (
                <li key={a.id} className="flex items-center gap-4 py-3">
                  <span className="w-16 shrink-0 text-sm font-medium text-[#0b1b33]">{to12h(a.preferredTimeSlot)}</span>
                  <div className="min-w-0">
                    <p className="truncate text-sm text-[#0b1b33]">{a.patientName}</p>
                    <p className="truncate text-xs text-[#9ca3af]">
                      {docName(a.doctorId)} · {deptName(a.departmentId)}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
