"use client";

import React, { useCallback, useEffect, useState } from "react";
import {
  Activity,
  AlertCircle,
  BarChart3,
  Building2,
  CheckCircle2,
  Download,
  Filter,
  Flame,
  RefreshCw,
  Sparkles,
  Star,
  Stethoscope,
  TrendingUp,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Legend,
  Line,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { HealthcareAnalyticsResult } from "@/server/services/analyticsService";

interface BranchOption {
  id: string;
  nameEn: string;
}

interface DepartmentOption {
  id: string;
  nameEn: string;
}

const PIE_COLORS = ["#012d61", "#0057b8", "#065f46", "#b45309", "#4f46e5"];

export interface AdminHealthcareAnalyticsProps {
  embedded?: boolean;
  onPromoteDoctor?: (doctorId: string) => void;
}

export function AdminHealthcareAnalytics({
  embedded = false,
  onPromoteDoctor,
}: AdminHealthcareAnalyticsProps) {
  const [range, setRange] = useState<"today" | "7d" | "30d" | "all">("30d");
  const [selectedBranch, setSelectedBranch] = useState<string>("ALL");
  const [selectedDept, setSelectedDept] = useState<string>("ALL");

  const [branches, setBranches] = useState<BranchOption[]>([]);
  const [departments, setDepartments] = useState<DepartmentOption[]>([]);
  const [analytics, setAnalytics] = useState<HealthcareAnalyticsResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const qBranch =
        selectedBranch !== "ALL" ? `&branchId=${encodeURIComponent(selectedBranch)}` : "";
      const qDept =
        selectedDept !== "ALL" ? `&departmentId=${encodeURIComponent(selectedDept)}` : "";
      const res = await fetch(`/api/v1/admin/analytics?range=${range}${qBranch}${qDept}`, {
        cache: "no-store",
      });
      const data = await res.json();
      if (data.ok) {
        setAnalytics(data.analytics);
      } else {
        setErrorMsg(data.error || "Failed to load healthcare analytics.");
      }
    } catch {
      setErrorMsg("Network error loading analytics.");
    } finally {
      setLoading(false);
    }
  }, [range, selectedBranch, selectedDept]);

  useEffect(() => {
    fetch("/api/v1/staff/overview")
      .then((r) => r.json())
      .then((d) => {
        if (d.branches) setBranches(d.branches);
        if (d.departments) setDepartments(d.departments);
      })
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    void fetchAnalytics();
  }, [fetchAnalytics]);

  const handleExportCsv = (
    type: "doctor_popularity" | "patient_feedback" | "appointment_register"
  ) => {
    const qBranch =
      selectedBranch !== "ALL" ? `&branchId=${encodeURIComponent(selectedBranch)}` : "";
    const qDept =
      selectedDept !== "ALL" ? `&departmentId=${encodeURIComponent(selectedDept)}` : "";
    window.open(
      `/api/v1/admin/analytics?exportType=${type}&range=${range}${qBranch}${qDept}`,
      "_blank"
    );
  };

  const kpis = analytics?.kpis;
  const totalEstimatedRevenueBdt = (analytics?.dataset1DoctorPopularity || []).reduce(
    (sum, d) => sum + d.estimatedRevenueBdt,
    0
  );

  return (
    <div className="space-y-8 bg-white text-[#080808]">
      {/* Executive Deep Navy Header Banner */}
      <section
        className={
          embedded
            ? "bg-[#012d61] text-white p-6 sm:p-8 border border-[#012d61]"
            : "w-full bg-[#012d61] text-white py-10 md:py-12 border-b border-[#0057b8]/30"
        }
      >
        <div className={embedded ? "" : "mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-10"}>
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-sky-300 flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-sky-300" />
                Hospital Management &amp; Clinical Operations Intelligence
              </p>
              <h2 className="mc-serif mt-2 text-2xl sm:text-3xl lg:text-4xl font-normal tracking-tight text-white">
                Executive Healthcare Data Analytics Suite
              </h2>
              <p className="mt-2 text-xs sm:text-sm text-slate-200 max-w-3xl leading-relaxed">
                Real-time chamber slot utilization, specialist popularity, bilingual patient wait-time sentiment, 11-department disease demand, and BDT (৳) revenue attribution across Dhaka campuses.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={() => handleExportCsv("doctor_popularity")}
                className="inline-flex min-h-[40px] items-center gap-2 bg-[#0057b8] hover:bg-[#004494] text-white font-semibold px-3.5 py-2 text-xs uppercase tracking-wider transition-colors cursor-pointer"
              >
                <Download className="h-3.5 w-3.5" />
                Doctor Popularity &amp; Utilization CSV
              </button>
              <button
                type="button"
                onClick={() => handleExportCsv("patient_feedback")}
                className="inline-flex min-h-[40px] items-center gap-2 border border-white/30 bg-white/10 hover:bg-white/20 text-white font-semibold px-3.5 py-2 text-xs uppercase tracking-wider transition-colors cursor-pointer"
              >
                <Download className="h-3.5 w-3.5" />
                Patient Feedback Audit CSV
              </button>
              <button
                type="button"
                onClick={() => handleExportCsv("appointment_register")}
                className="inline-flex min-h-[40px] items-center gap-2 border border-white/30 bg-white/10 hover:bg-white/20 text-white font-semibold px-3.5 py-2 text-xs uppercase tracking-wider transition-colors cursor-pointer"
              >
                <Download className="h-3.5 w-3.5" />
                Appointment Register CSV
              </button>
            </div>
          </div>
        </div>
      </section>

      <div
        className={
          embedded
            ? "space-y-8"
            : "mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-10 space-y-8 pb-12"
        }
      >
        {/* Global Interactive Filter Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 p-4 border border-[#e5e7eb] bg-[#f8fafc]">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
              <Filter className="h-4 w-4 text-[#0057b8]" />
              Scope Filters:
            </span>

            {/* Date Range Toggle */}
            <div className="flex items-center bg-white border border-[#e5e7eb] p-0.5">
              {(
                [
                  { key: "today", label: "Today" },
                  { key: "7d", label: "Last 7 Days" },
                  { key: "30d", label: "Last 30 Days" },
                  { key: "all", label: "All Time" },
                ] as const
              ).map((r) => (
                <button
                  key={r.key}
                  type="button"
                  onClick={() => setRange(r.key)}
                  className={`px-3 py-1.5 text-xs font-bold uppercase transition-colors cursor-pointer ${
                    range === r.key
                      ? "bg-[#012d61] text-white"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>

            {/* Branch Filter */}
            <select
              aria-label="Filter by Hospital Branch"
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
              className="min-h-[38px] border border-[#e5e7eb] bg-white px-3 text-xs font-semibold text-[#012d61]"
            >
              <option value="ALL">All Branches (Dhanmondi · Uttara · Mirpur)</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.nameEn}
                </option>
              ))}
            </select>

            {/* Department Filter */}
            <select
              aria-label="Filter by Clinical Department"
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="min-h-[38px] border border-[#e5e7eb] bg-white px-3 text-xs font-semibold text-[#012d61]"
            >
              <option value="ALL">All 11 Clinical Departments</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.nameEn}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-slate-600 tabular-nums">
              Est. Consultation Value:{" "}
              <strong className="text-[#012d61] font-bold">
                ৳{totalEstimatedRevenueBdt.toLocaleString("en-IN")}
              </strong>
            </span>
            <button
              type="button"
              onClick={fetchAnalytics}
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white border border-[#e5e7eb] text-xs font-bold uppercase tracking-wider text-[#012d61] hover:border-[#0057b8] hover:text-[#0057b8] cursor-pointer"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
              Refresh Data
            </button>
          </div>
        </div>

        {errorMsg && (
          <div className="border-l-4 border-red-600 bg-red-50 p-4 text-sm text-red-900 flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-red-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* 4 Executive KPI Cards */}
        <section aria-label="Executive KPI Cards">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 border border-[#e5e7eb] divide-y sm:divide-y-0 sm:divide-x divide-[#e5e7eb] bg-white">
            <div className="p-6">
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">
                1 · Total Appointments &amp; Confirmation Rate
              </p>
              <div className="mt-2.5 flex items-baseline gap-3">
                <span className="mc-serif text-4xl font-normal text-[#012d61] tabular-nums">
                  {kpis?.totalAppointments ?? 0}
                </span>
                <span className="inline-flex items-center text-xs font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 border border-emerald-200 tabular-nums">
                  <TrendingUp className="h-3.5 w-3.5 mr-1" />
                  {kpis?.confirmationRatePct ?? 0}% Confirmed
                </span>
              </div>
              <p className="mt-2 text-xs text-slate-600 tabular-nums">
                {kpis?.confirmedAndCompletedCount ?? 0} verified consultations · ৳
                {totalEstimatedRevenueBdt.toLocaleString("en-IN")} value
              </p>
            </div>

            <div className="p-6">
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#0057b8]">
                2 · Overall Chamber Slot Utilization %
              </p>
              <div className="mt-2.5 flex items-baseline gap-3">
                <span className="mc-serif text-4xl font-normal text-[#0057b8] tabular-nums">
                  {kpis?.overallSlotUtilizationPct ?? 0}%
                </span>
                <span className="text-xs font-semibold text-slate-500 tabular-nums">
                  {kpis?.bookedSlotsCount ?? 0} ÷ {kpis?.totalAvailableChamberSlots ?? 0} Slots
                </span>
              </div>
              <p className="mt-2 text-xs text-slate-600">
                Booked slots vs. total available multi-branch chamber slots
              </p>
            </div>

            <div className="p-6">
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-amber-700">
                3 · Patient Satisfaction Index (CSAT)
              </p>
              <div className="mt-2.5 flex items-baseline gap-2">
                <span className="mc-serif text-4xl font-normal text-amber-600 tabular-nums flex items-center gap-1">
                  {kpis?.patientSatisfactionScore ?? 4.8}
                  <Star className="h-6 w-6 fill-amber-500 text-amber-500 inline-block" />
                </span>
                <span className="text-xs text-slate-500 tabular-nums">
                  / 5.0 ({kpis?.totalReviewsCount ?? 0} reviews)
                </span>
              </div>
              <p className="mt-2 text-xs text-slate-700 font-medium tabular-nums">
                <span className="text-emerald-700 font-bold">
                  {kpis?.resolvedFeedbacksCount ?? 0} resolved
                </span>{" "}
                vs.{" "}
                <span className="text-amber-700 font-bold">
                  {kpis?.unresolvedComplaintsCount ?? 0} open feedback
                </span>
              </p>
            </div>

            <div className="p-6">
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-rose-700">
                4 · Cancellation, No-Show &amp; Leave Impact
              </p>
              <div className="mt-2.5 flex items-baseline gap-3">
                <span className="mc-serif text-4xl font-normal text-rose-700 tabular-nums">
                  {kpis?.cancellationAndNoShowRatePct ?? 0}%
                </span>
                <span className="text-xs font-semibold text-rose-800 bg-rose-50 px-2 py-0.5 border border-rose-200 tabular-nums">
                  {kpis?.doctorEmergencyLeaveImpactCount ?? 0} Leave Days
                </span>
              </div>
              <p className="mt-2 text-xs text-slate-600 tabular-nums">
                {kpis?.patientCancellationCount ?? 0} patient cancellations ·{" "}
                {kpis?.doctorEmergencyLeaveImpactCount ?? 0} emergency leave overrides
              </p>
            </div>
          </div>
        </section>

        {/* ===================================================================
            MODULE 1: Appointments vs. Doctor Popularity & Slot Utilization
           =================================================================== */}
        <section className="border border-[#e5e7eb] bg-white p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[#e5e7eb] pb-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#0057b8] flex items-center gap-1.5">
                <Stethoscope className="h-4 w-4" />
                Module 1 · Specialist Chamber Demand &amp; Capacity Leaderboard
              </p>
              <h3 className="mc-serif text-xl sm:text-2xl text-[#012d61] mt-1">
                Appointments vs. Doctor Popularity &amp; Slot Utilization
              </h3>
              <p className="text-xs text-slate-600 mt-1">
                Compare each doctor&apos;s available chamber slots, confirmed consultations, slot utilization %, average rating, and consultation revenue (৳). Doctors under 45% utilization include a 1-click shortcut to launch a Facebook spotlight post.
              </p>
            </div>
            <button
              type="button"
              onClick={() => handleExportCsv("doctor_popularity")}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 border border-[#012d61] text-[#012d61] hover:bg-slate-50 text-xs font-bold uppercase tracking-wider cursor-pointer shrink-0"
            >
              <Download className="h-3.5 w-3.5" />
              Export Leaderboard CSV
            </button>
          </div>

          {/* ComposedChart */}
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart
                data={analytics?.dataset1DoctorPopularity.slice(0, 8) || []}
                margin={{ top: 10, right: 20, left: -10, bottom: 25 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis
                  dataKey="nameEn"
                  tick={{ fontSize: 11, fill: "#012d61" }}
                  interval={0}
                  angle={-12}
                  textAnchor="end"
                  tickFormatter={(name) =>
                    String(name)
                      .replace(/^Prof\.\s*|^Dr\.\s*|^Brig\.\s*Gen\.\s*|^Assoc\.\s*Prof\.\s*/g, "")
                      .slice(0, 16)
                  }
                />
                <YAxis yAxisId="left" tick={{ fontSize: 11 }} />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  unit="%"
                  tick={{ fontSize: 11 }}
                  domain={[0, 100]}
                />
                <Tooltip
                  formatter={(val, name) => [
                    name === "utilizationPct" || name === "Slot Utilization %"
                      ? `${val}%`
                      : val,
                    name,
                  ]}
                />
                <Legend wrapperStyle={{ fontSize: 12, paddingTop: 12 }} />
                <Bar
                  yAxisId="left"
                  dataKey="totalAvailableSlots"
                  name="Available Chamber Slots"
                  fill="#cbd5e1"
                  radius={[2, 2, 0, 0]}
                />
                <Bar
                  yAxisId="left"
                  dataKey="confirmedAndCompletedCount"
                  name="Confirmed Consultations"
                  fill="#012d61"
                  radius={[2, 2, 0, 0]}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="utilizationPct"
                  name="Slot Utilization %"
                  stroke="#0057b8"
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: "#0057b8" }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          {/* Actionable Leaderboard Table */}
          <div className="overflow-x-auto border border-[#e5e7eb]">
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <thead>
                <tr className="bg-[#012d61] text-white text-[11px] font-bold uppercase tracking-wider">
                  <th className="py-3 px-4">Specialist Doctor</th>
                  <th className="py-3 px-3">Department &amp; Campus</th>
                  <th className="py-3 px-3 text-right tabular-nums">Fee (৳)</th>
                  <th className="py-3 px-3 text-right tabular-nums">Confirmed</th>
                  <th className="py-3 px-3 text-right tabular-nums">Avail. Slots</th>
                  <th className="py-3 px-3 text-right tabular-nums">Utilization</th>
                  <th className="py-3 px-3 text-right tabular-nums">Est. Revenue</th>
                  <th className="py-3 px-3 text-center tabular-nums">CSAT Rating</th>
                  <th className="py-3 px-4 text-right">Operational Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e5e7eb]">
                {(analytics?.dataset1DoctorPopularity || []).map((doc) => (
                  <tr key={doc.doctorId} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-semibold text-[#012d61]">
                      {doc.nameEn}
                      <span className="block text-xs font-normal text-slate-500 font-bangla">
                        {doc.nameBn}
                      </span>
                    </td>
                    <td className="py-3.5 px-3">
                      <span className="font-semibold text-slate-800 block">
                        {doc.departmentName}
                      </span>
                      <span className="text-xs text-slate-500">{doc.branchNames}</span>
                    </td>
                    <td className="py-3.5 px-3 text-right font-semibold tabular-nums text-slate-900">
                      ৳{doc.consultationFeeBdt.toLocaleString("en-IN")}
                    </td>
                    <td className="py-3.5 px-3 text-right font-bold tabular-nums text-emerald-800">
                      {doc.confirmedAndCompletedCount}
                    </td>
                    <td className="py-3.5 px-3 text-right tabular-nums text-slate-600">
                      {doc.totalAvailableSlots}
                    </td>
                    <td className="py-3.5 px-3 text-right font-bold tabular-nums text-[#0057b8]">
                      {doc.utilizationPct}%
                    </td>
                    <td className="py-3.5 px-3 text-right font-bold tabular-nums text-[#012d61]">
                      ৳{doc.estimatedRevenueBdt.toLocaleString("en-IN")}
                    </td>
                    <td className="py-3.5 px-3 text-center tabular-nums text-amber-700 font-semibold">
                      ★ {doc.averageRating}{" "}
                      <span className="text-xs text-slate-400">({doc.reviewsCount})</span>
                    </td>
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      {doc.statusTag === "HIGH_DEMAND" ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-rose-50 border border-rose-200 text-rose-900 text-[11px] font-bold uppercase tracking-wider">
                          <Flame className="h-3.5 w-3.5 text-rose-600" />
                          HIGH_DEMAND · Add Chamber Hours
                        </span>
                      ) : doc.statusTag === "NEEDS_PROMOTION" ? (
                        onPromoteDoctor ? (
                          <button
                            type="button"
                            onClick={() => onPromoteDoctor(doc.doctorId)}
                            className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#0057b8] hover:bg-[#004494] text-white text-[11px] font-bold uppercase tracking-wider transition-colors cursor-pointer"
                          >
                            <Sparkles className="h-3.5 w-3.5" />
                            NEEDS_PROMOTION · Spotlight on FB →
                          </button>
                        ) : (
                          <a
                            href={`/dashboard/admin/facebook-generator?doctor=${encodeURIComponent(
                              doc.doctorId
                            )}`}
                            className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#0057b8] hover:bg-[#004494] text-white text-[11px] font-bold uppercase tracking-wider transition-colors"
                          >
                            <Sparkles className="h-3.5 w-3.5" />
                            NEEDS_PROMOTION · Spotlight on FB →
                          </a>
                        )
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 border border-emerald-200 text-emerald-900 text-[11px] font-bold uppercase tracking-wider">
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-700" />
                          OPTIMAL (45%–79%)
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* ===================================================================
            MODULE 2: Appointments vs. Patient Feedback, Sentiment & Wait-Time Matrix
           =================================================================== */}
        <section className="border border-[#e5e7eb] bg-white p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[#e5e7eb] pb-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#0057b8]">
                Module 2 · Bilingual Patient Experience &amp; Wait-Time Correlation
              </p>
              <h3 className="mc-serif text-xl sm:text-2xl text-[#012d61] mt-1">
                Patient Feedback Sentiment &amp; Doctor Wait-Time Matrix
              </h3>
              <p className="text-xs text-slate-600 mt-1">
                Sentiment breakdown across all 5 Bangladeshi hospital operational categories alongside Doctor Appointment Volume vs. Average Rating &amp; Chamber Wait-Time score.
              </p>
            </div>
            <button
              type="button"
              onClick={() => handleExportCsv("patient_feedback")}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 border border-[#012d61] text-[#012d61] hover:bg-slate-50 text-xs font-bold uppercase tracking-wider cursor-pointer shrink-0"
            >
              <Download className="h-3.5 w-3.5" />
              Export Feedback Audit CSV
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left 6 cols: 5-Category BarChart + Bilingual Category Cards */}
            <div className="lg:col-span-6 space-y-4">
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={analytics?.dataset2FeedbackCategories || []}
                    margin={{ top: 10, right: 10, left: -15, bottom: 25 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis
                      dataKey="labelEn"
                      tick={{ fontSize: 10, fill: "#012d61" }}
                      interval={0}
                      angle={-15}
                      textAnchor="end"
                    />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Legend wrapperStyle={{ fontSize: 11, paddingTop: 10 }} />
                    <Bar
                      dataKey="positiveCount"
                      name="Positive (★4–5)"
                      fill="#065f46"
                      stackId="a"
                    />
                    <Bar
                      dataKey="neutralCount"
                      name="Neutral (★3)"
                      fill="#d97706"
                      stackId="a"
                    />
                    <Bar
                      dataKey="negativeCount"
                      name="Negative (★1–2)"
                      fill="#be123c"
                      stackId="a"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* 5 Operational Category Pills */}
              <div className="divide-y divide-[#e5e7eb] border border-[#e5e7eb]">
                {(analytics?.dataset2FeedbackCategories || []).map((cat) => (
                  <div
                    key={cat.category}
                    className="p-3 flex items-center justify-between text-xs hover:bg-slate-50"
                  >
                    <div>
                      <span className="font-bold text-[#012d61]">{cat.labelEn}</span>
                      <span className="block text-[11px] text-slate-500 font-bangla">
                        {cat.labelBn}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 tabular-nums">
                      <span className="text-slate-500">{cat.totalCount} reviews</span>
                      <span className="font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5">
                        ★ {cat.averageScore} / 5.0
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right 6 cols: Doctor Correlation Scorecard */}
            <div className="lg:col-span-6 space-y-3 lg:border-l border-[#e5e7eb] lg:pl-8">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#012d61]">
                Doctor Appointment Volume vs. Patient Rating &amp; Chamber Wait-Time Scorecard
              </h4>
              <div className="overflow-x-auto border border-[#e5e7eb]">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-100 text-[11px] font-bold uppercase tracking-wider text-slate-700 border-b border-[#e5e7eb]">
                      <th className="py-2.5 px-3">Specialist</th>
                      <th className="py-2.5 px-2 text-right tabular-nums">Volume</th>
                      <th className="py-2.5 px-2 text-right tabular-nums">Care ★</th>
                      <th className="py-2.5 px-2 text-right tabular-nums">Wait-Time ★</th>
                      <th className="py-2.5 px-3 text-right tabular-nums">Overall CSAT</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#e5e7eb]">
                    {(analytics?.dataset2SentimentCorrelation || []).map((row) => (
                      <tr key={row.doctorId} className="hover:bg-slate-50">
                        <td className="py-2.5 px-3">
                          <span className="font-semibold text-[#012d61] block">
                            {row.doctorName}
                          </span>
                          <span className="text-[11px] text-slate-500">
                            {row.departmentName}
                          </span>
                        </td>
                        <td className="py-2.5 px-2 text-right font-bold tabular-nums text-slate-800">
                          {row.appointmentVolume}
                        </td>
                        <td className="py-2.5 px-2 text-right font-semibold tabular-nums text-emerald-700">
                          ★ {row.careScore}
                        </td>
                        <td className="py-2.5 px-2 text-right font-semibold tabular-nums text-sky-800">
                          ★ {row.waitTimeScore}
                        </td>
                        <td className="py-2.5 px-3 text-right font-bold tabular-nums text-amber-700">
                          ★ {row.averageRating}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </section>

        {/* ===================================================================
            MODULE 3: Departmental & Popular Disease/Symptom Demand
           =================================================================== */}
        <section className="border border-[#e5e7eb] bg-white p-6 space-y-6">
          <div className="border-b border-[#e5e7eb] pb-4">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#0057b8] flex items-center gap-1.5">
              <Building2 className="h-4 w-4" />
              Module 3 · Clinical Specialty &amp; Disease / Symptom Epidemiology
            </p>
            <h3 className="mc-serif text-xl sm:text-2xl text-[#012d61] mt-1">
              Departmental Demand &amp; Popular Symptom / Condition Matrix
            </h3>
            <p className="text-xs text-slate-600 mt-1">
              Comparative appointment volume, patient inquiries, and dominant Bangladeshi clinical presentations across all 11 hospital departments.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-6 h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={analytics?.dataset3DepartmentDemand || []}
                  layout="vertical"
                  margin={{ top: 5, right: 20, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis
                    type="category"
                    dataKey="nameEn"
                    width={140}
                    tick={{ fontSize: 11, fill: "#012d61" }}
                  />
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar
                    dataKey="bookingsCount"
                    name="Confirmed Bookings"
                    fill="#012d61"
                    radius={[0, 2, 2, 0]}
                  />
                  <Bar
                    dataKey="inquiriesCount"
                    name="Patient Inquiries & Triage"
                    fill="#0057b8"
                    radius={[0, 2, 2, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="lg:col-span-6 overflow-x-auto border border-[#e5e7eb]">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100 text-[11px] font-bold uppercase tracking-wider text-slate-700 border-b border-[#e5e7eb]">
                    <th className="py-2.5 px-3">Department</th>
                    <th className="py-2.5 px-2 text-right tabular-nums">Bookings</th>
                    <th className="py-2.5 px-2 text-right tabular-nums">Util. %</th>
                    <th className="py-2.5 px-3">Top Symptom &amp; Disease Tags</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e5e7eb]">
                  {(analytics?.dataset3DepartmentDemand || []).map((dept) => (
                    <tr key={dept.departmentId} className="hover:bg-slate-50">
                      <td className="py-2.5 px-3">
                        <span className="font-bold text-[#012d61] block">{dept.nameEn}</span>
                        <span className="text-[11px] text-slate-500 font-bangla">
                          {dept.nameBn}
                        </span>
                      </td>
                      <td className="py-2.5 px-2 text-right font-bold tabular-nums text-[#012d61]">
                        {dept.bookingsCount}
                      </td>
                      <td className="py-2.5 px-2 text-right font-semibold tabular-nums text-[#0057b8]">
                        {dept.utilizationPct}%
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="flex flex-wrap gap-1">
                          {dept.topSymptomTags.map((tag) => (
                            <span
                              key={tag}
                              className="px-2 py-0.5 bg-[#f0f4f8] text-[#012d61] border border-[#d0e0f0] text-[10px] font-semibold"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* ===================================================================
            MODULE 4: 7×4 Peak Chamber Hours & Weekday Rush Heatmap
           =================================================================== */}
        <section className="border border-[#e5e7eb] bg-white p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 border-b border-[#e5e7eb] pb-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#0057b8]">
                Module 4 · Operational Density Heatmap (7 Days × 4 Time Bands)
              </p>
              <h3 className="mc-serif text-xl sm:text-2xl text-[#012d61] mt-1">
                Peak Chamber Hours &amp; Weekday Rush Matrix
              </h3>
              <p className="text-xs text-slate-600 mt-1">
                Highlights evening OPD chamber rush hours (17:00–21:00) across Sunday–Saturday to guide front-desk receptionist and nurse staffing.
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-500 font-semibold">Rush Intensity:</span>
              <span className="h-3 w-5 bg-sky-50 border border-sky-200 inline-block" /> Low
              <span className="h-3 w-5 bg-sky-200 border border-sky-300 inline-block" /> Moderate
              <span className="h-3 w-5 bg-[#0057b8] inline-block" /> Peak
              <span className="h-3 w-5 bg-[#012d61] inline-block" /> High Rush
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse border border-[#e5e7eb] text-xs sm:text-sm">
              <thead>
                <tr className="bg-[#012d61] text-white text-[11px] font-bold uppercase tracking-wider">
                  <th className="p-3 border border-[#e5e7eb]">Weekday / বার</th>
                  <th className="p-3 border border-[#e5e7eb]">Morning (09:00 – 13:00)</th>
                  <th className="p-3 border border-[#e5e7eb]">Afternoon (14:00 – 17:00)</th>
                  <th className="p-3 border border-[#e5e7eb]">Evening Peak (17:00 – 21:00)</th>
                  <th className="p-3 border border-[#e5e7eb]">Night (21:00 – 22:30)</th>
                </tr>
              </thead>
              <tbody>
                {[0, 1, 2, 3, 4, 5, 6].map((dayNum) => {
                  const dayCells = (analytics?.dataset4RushHeatmap || []).filter(
                    (c) => c.dayOfWeek === dayNum
                  );
                  const dayNameEn = dayCells[0]?.dayNameEn || "";
                  const dayNameBn = dayCells[0]?.dayNameBn || "";

                  return (
                    <tr key={dayNum} className="hover:bg-slate-50/70">
                      <td className="p-3 border border-[#e5e7eb] font-semibold text-[#012d61] bg-slate-50">
                        {dayNameEn}{" "}
                        <span className="text-xs text-slate-500 font-normal font-bangla">
                          ({dayNameBn})
                        </span>
                      </td>
                      {(["MORNING", "AFTERNOON", "EVENING_PEAK", "NIGHT"] as const).map(
                        (bandKey) => {
                          const cell = dayCells.find((c) => c.timeBandKey === bandKey);
                          const count = cell?.count ?? 0;
                          const cellBg =
                            count >= 8
                              ? "bg-[#012d61] text-white"
                              : count >= 5
                                ? "bg-[#0057b8] text-white"
                                : count >= 3
                                  ? "bg-sky-100 text-[#012d61]"
                                  : "bg-sky-50/50 text-slate-700";

                          return (
                            <td
                              key={bandKey}
                              className={`p-3 border border-[#e5e7eb] text-center font-bold tabular-nums ${cellBg}`}
                            >
                              {count} Bookings
                            </td>
                          );
                        }
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        {/* ===================================================================
            MODULE 5 & MODULE 6: Booking Funnel Velocity + Channel/Visit Revenue Split
           =================================================================== */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Module 5: Daily Booking Funnel & Status Velocity (AreaChart) */}
          <section className="lg:col-span-6 border border-[#e5e7eb] bg-white p-6 space-y-4">
            <div className="border-b border-[#e5e7eb] pb-3">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#0057b8] flex items-center gap-1.5">
                <Activity className="h-4 w-4" />
                Module 5 · Daily Booking Funnel &amp; Status Velocity
              </p>
              <h3 className="mc-serif text-xl text-[#012d61] mt-1">
                Requested → Confirmed → Completed vs. Cancelled
              </h3>
            </div>

            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={analytics?.dataset5BookingVelocity || []}
                  margin={{ top: 10, right: 10, left: -20, bottom: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 10 }}
                    tickFormatter={(d) => String(d).slice(5)}
                  />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: 11, paddingTop: 10 }} />
                  <Area
                    type="monotone"
                    dataKey="completed"
                    name="Completed"
                    stackId="1"
                    stroke="#012d61"
                    fill="#012d61"
                    fillOpacity={0.85}
                  />
                  <Area
                    type="monotone"
                    dataKey="confirmed"
                    name="Confirmed"
                    stackId="1"
                    stroke="#065f46"
                    fill="#065f46"
                    fillOpacity={0.75}
                  />
                  <Area
                    type="monotone"
                    dataKey="requested"
                    name="Requested (Pending)"
                    stackId="1"
                    stroke="#0057b8"
                    fill="#0057b8"
                    fillOpacity={0.6}
                  />
                  <Area
                    type="monotone"
                    dataKey="cancelledOrNoShow"
                    name="Cancelled / No-Show"
                    stackId="1"
                    stroke="#be123c"
                    fill="#be123c"
                    fillOpacity={0.55}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </section>

          {/* Module 6: Booking Channel & Visit Type Revenue Split */}
          <section className="lg:col-span-6 border border-[#e5e7eb] bg-white p-6 space-y-4">
            <div className="border-b border-[#e5e7eb] pb-3">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#0057b8]">
                Module 6 · Consultation Revenue Attribution (BDT ৳)
              </p>
              <h3 className="mc-serif text-xl text-[#012d61] mt-1">
                Booking Channel &amp; Visit Type Revenue Split
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="h-52">
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-600 text-center mb-1">
                  By Booking Channel
                </p>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={analytics?.dataset6ChannelSplit || []}
                      dataKey="count"
                      nameKey="labelEn"
                      cx="50%"
                      cy="50%"
                      innerRadius={36}
                      outerRadius={62}
                      label={(entry: any) =>
                        `${((entry.percent || 0) * 100).toFixed(0)}%`
                      }
                    >
                      {(analytics?.dataset6ChannelSplit || []).map((_, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={PIE_COLORS[index % PIE_COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip formatter={(val) => [`${val} Bookings`, "Channel"]} />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="h-52">
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-600 text-center mb-1">
                  By Visit Type (Revenue ৳)
                </p>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={analytics?.dataset6VisitTypeSplit || []}
                      dataKey="revenueBdt"
                      nameKey="labelEn"
                      cx="50%"
                      cy="50%"
                      innerRadius={36}
                      outerRadius={62}
                      label={(entry: any) =>
                        `${((entry.percent || 0) * 100).toFixed(0)}%`
                      }
                    >
                      {(analytics?.dataset6VisitTypeSplit || []).map((_, index) => (
                        <Cell
                          key={`cell-v-${index}`}
                          fill={PIE_COLORS[(index + 1) % PIE_COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(val) => [
                        `৳${Number(val).toLocaleString("en-IN")}`,
                        "Revenue",
                      ]}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Channel & Visit Type Tabular Breakdown */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div className="border border-[#e5e7eb] divide-y divide-[#e5e7eb] text-xs">
                {(analytics?.dataset6ChannelSplit || []).map((ch) => (
                  <div key={ch.source} className="p-2.5 flex items-center justify-between">
                    <span className="font-semibold text-[#012d61]">{ch.labelEn}</span>
                    <span className="tabular-nums font-bold text-slate-800">
                      {ch.count} ({ch.percentage}%) · ৳{ch.revenueBdt.toLocaleString("en-IN")}
                    </span>
                  </div>
                ))}
              </div>
              <div className="border border-[#e5e7eb] divide-y divide-[#e5e7eb] text-xs">
                {(analytics?.dataset6VisitTypeSplit || []).map((vt) => (
                  <div key={vt.visitType} className="p-2.5 flex items-center justify-between">
                    <span className="font-semibold text-[#012d61]">{vt.labelEn}</span>
                    <span className="tabular-nums font-bold text-emerald-800">
                      {vt.count} · ৳{vt.revenueBdt.toLocaleString("en-IN")}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
