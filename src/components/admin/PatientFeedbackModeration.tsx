"use client";

import React, { useState, useEffect } from "react";
import {
  MessageSquare,
  Star,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertCircle,
  RefreshCw,
  Send,
  User,
  Phone,
  ShieldCheck,
  Check,
  X,
  Stethoscope,
} from "lucide-react";
import { PatientFeedback } from "@/types/domain";

interface PatientFeedbackModerationProps {
  initialFeedbacks?: PatientFeedback[];
}

export function PatientFeedbackModeration({
  initialFeedbacks = [],
}: PatientFeedbackModerationProps) {
  const [feedbacks, setFeedbacks] = useState<PatientFeedback[]>(initialFeedbacks);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");
  const [ratingFilter, setRatingFilter] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Administrative Response Drafts per feedback id
  const [adminResponses, setAdminResponses] = useState<Record<string, string>>({});
  const [submittingId, setSubmittingId] = useState<string | null>(null);

  const fetchFeedbacks = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/v1/admin/feedback");
      const data = await res.json();
      if (res.ok && data.ok) {
        setFeedbacks(data.patientFeedbacks || []);
      }
    } catch {
      setStatusMessage("Failed to refresh feedback list.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialFeedbacks.length === 0) {
      fetchFeedbacks();
    }
  }, []);

  const handleUpdateStatus = async (
    feedbackId: string,
    nextStatus: PatientFeedback["status"],
    adminResponse?: string
  ) => {
    setSubmittingId(feedbackId);
    try {
      const res = await fetch("/api/v1/admin/feedback", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientFeedbackId: feedbackId,
          status: nextStatus,
          adminResponse: adminResponse || adminResponses[feedbackId] || undefined,
        }),
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        setFeedbacks((prev) =>
          prev.map((f) => (f.id === feedbackId ? data.feedback : f))
        );
        setStatusMessage(`Feedback updated to ${nextStatus}.`);
        setTimeout(() => setStatusMessage(null), 4000);
      } else {
        setStatusMessage(data.error || "Failed to update feedback.");
      }
    } catch {
      setStatusMessage("Network error updating feedback.");
    } finally {
      setSubmittingId(null);
    }
  };

  const filteredFeedbacks = feedbacks.filter((f) => {
    const matchesSearch =
      f.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.patientPhone.includes(searchQuery) ||
      (f.feedbackEn || f.comment || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (f.feedbackBn && f.feedbackBn.includes(searchQuery));
    const matchesCategory =
      categoryFilter === "ALL" || f.category === categoryFilter;
    const matchesRating =
      ratingFilter === "ALL" || f.rating.toString() === ratingFilter;
    const matchesStatus =
      statusFilter === "ALL" || f.status === statusFilter;
    return matchesSearch && matchesCategory && matchesRating && matchesStatus;
  });

  const totalReviews = feedbacks.length;
  const avgRating =
    totalReviews > 0
      ? (feedbacks.reduce((acc, f) => acc + f.rating, 0) / totalReviews).toFixed(1)
      : "5.0";
  const pendingCount = feedbacks.filter((f) => f.status === "NEW" || f.status === "IN_REVIEW").length;
  const resolvedCount = feedbacks.filter((f) => f.status === "RESOLVED").length;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-[#012d61] text-white p-6 rounded-none flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 text-xs font-semibold text-[#82b4ff] tracking-wide uppercase mb-1">
            <MessageSquare className="w-4 h-4" />
            <span>Patient Experience &amp; Governance</span>
          </div>
          <h2 className="mc-serif text-2xl font-normal text-white">
            Patient Feedback &amp; Complaints Moderation
          </h2>
          <p className="text-xs text-[#c5daf7] mt-1 max-w-2xl font-light">
            Monitor real-time patient ratings across Doctor Care, Wait Times, Front Desk, and Facilities. Moderate public responses and resolve complaints with clinical governance.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={fetchFeedbacks}
            disabled={loading}
            className="px-3.5 py-2 text-xs font-medium text-white/90 bg-white/10 hover:bg-white/20 transition-colors flex items-center gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white border border-[#e5e7eb] p-4">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-[#666666]">
            Total Patient Reviews
          </span>
          <p className="text-2xl font-bold text-[#111827] tabular-nums mt-1">
            {totalReviews}
          </p>
          <span className="text-[10px] text-[#059669] font-medium">Bilingual entries</span>
        </div>
        <div className="bg-white border border-[#e5e7eb] p-4">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-[#666666]">
            Average Overall Rating
          </span>
          <div className="flex items-center gap-1.5 mt-1">
            <span className="text-2xl font-bold text-[#0057b8] tabular-nums">
              {avgRating}
            </span>
            <div className="flex text-[#f59e0b]">
              <Star className="w-4 h-4 fill-[#f59e0b]" />
            </div>
            <span className="text-xs text-[#666666]">/ 5.0</span>
          </div>
          <span className="text-[10px] text-[#666666]">Patient satisfaction</span>
        </div>
        <div className="bg-white border border-[#e5e7eb] p-4">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-[#666666]">
            Pending Moderation
          </span>
          <p className="text-2xl font-bold text-[#d97706] tabular-nums mt-1">
            {pendingCount}
          </p>
          <span className="text-[10px] text-[#d97706] font-medium">Action required</span>
        </div>
        <div className="bg-white border border-[#e5e7eb] p-4">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-[#666666]">
            Resolved &amp; Published
          </span>
          <p className="text-2xl font-bold text-[#059669] tabular-nums mt-1">
            {resolvedCount}
          </p>
          <span className="text-[10px] text-[#059669] font-medium">
            {totalReviews > 0 ? `${Math.round((resolvedCount / totalReviews) * 100)}% resolution` : "0%"}
          </span>
        </div>
      </div>

      {/* Status Toast */}
      {statusMessage && (
        <div className="p-3.5 bg-[#e8f0f9] border-l-4 border-[#0057b8] text-xs text-[#004181] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#0057b8] shrink-0" />
            <span>{statusMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setStatusMessage(null)}
            className="text-xs font-bold hover:underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Filter Toolbar */}
      <div className="bg-white border border-[#e5e7eb] p-4 flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-[#666666] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search patient, phone, review..."
            className="w-full pl-9 pr-3 py-2 text-xs border border-[#e5e7eb] focus:outline-none focus:border-[#0057b8] bg-[#fcfcfc]"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="text-xs border border-[#e5e7eb] px-3 py-2 bg-white focus:outline-none focus:border-[#0057b8]"
          >
            <option value="ALL">All Categories</option>
            <option value="DOCTOR_CARE">Doctor Care</option>
            <option value="WAIT_TIME">Wait Time</option>
            <option value="FRONT_DESK_SERVICE">Front Desk Service</option>
            <option value="ONLINE_BOOKING">Online Booking</option>
            <option value="CLEANLINESS">Cleanliness &amp; Facility</option>
          </select>

          <select
            value={ratingFilter}
            onChange={(e) => setRatingFilter(e.target.value)}
            className="text-xs border border-[#e5e7eb] px-3 py-2 bg-white focus:outline-none focus:border-[#0057b8]"
          >
            <option value="ALL">All Star Ratings</option>
            <option value="5">5 Stars</option>
            <option value="4">4 Stars</option>
            <option value="3">3 Stars</option>
            <option value="2">2 Stars</option>
            <option value="1">1 Star</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs border border-[#e5e7eb] px-3 py-2 bg-white focus:outline-none focus:border-[#0057b8]"
          >
            <option value="ALL">All Statuses</option>
            <option value="NEW">New (Unreviewed)</option>
            <option value="IN_REVIEW">In Review</option>
            <option value="RESOLVED">Resolved</option>
            <option value="REJECTED">Rejected</option>
          </select>

          <span className="text-xs text-[#666666] tabular-nums font-mono ml-auto">
            {filteredFeedbacks.length} {filteredFeedbacks.length === 1 ? "review" : "reviews"}
          </span>
        </div>
      </div>

      {/* Feedbacks Editorial List */}
      <div className="space-y-4">
        {filteredFeedbacks.length === 0 ? (
          <div className="bg-white border border-[#e5e7eb] p-12 text-center text-[#666666] space-y-2">
            <MessageSquare className="w-10 h-10 text-[#cccccc] mx-auto" />
            <p className="text-sm font-medium">No patient feedback matches your filter.</p>
            <p className="text-xs text-[#888888]">
              Try resetting your category or rating filters.
            </p>
          </div>
        ) : (
          filteredFeedbacks.map((item) => {
            const currentReply = adminResponses[item.id] !== undefined ? adminResponses[item.id] : (item.adminResponse || "");
            const isSubmitting = submittingId === item.id;

            return (
              <div
                key={item.id}
                className="bg-white border border-[#e5e7eb] p-5 space-y-4 hover:border-[#b0c4de] transition-colors"
              >
                {/* Review Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#f0f0f0] pb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-[#e8f0f9] text-[#0057b8] flex items-center justify-center font-bold text-sm shrink-0">
                      {item.patientName.charAt(0)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-[#111827]">
                          {item.patientName}
                        </span>
                        <span className="text-xs text-[#666666] font-mono tabular-nums">
                          ({item.patientPhone})
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="px-2 py-0.5 bg-[#f0f4f8] text-[#004181] font-semibold text-[10px] tracking-wide uppercase border border-[#d0e0f0]">
                          {item.category.replace(/_/g, " ")}
                        </span>
                        {item.doctorName && (
                          <span className="text-xs text-[#555555] inline-flex items-center gap-1">
                            <Stethoscope className="w-3 h-3 text-[#0057b8]" />
                            <span>Dr. {item.doctorName}</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {/* Stars */}
                    <div className="flex items-center gap-0.5 text-[#f59e0b]">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          className={`w-4 h-4 ${
                            s <= item.rating
                              ? "fill-[#f59e0b] text-[#f59e0b]"
                              : "text-[#d1d5db]"
                          }`}
                        />
                      ))}
                    </div>

                    {/* Status Badge */}
                    <span
                      className={`px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide ${
                        item.status === "RESOLVED"
                          ? "bg-[#ecfdf5] text-[#065f46] border border-[#a7f3d0]"
                          : item.status === "IN_REVIEW"
                          ? "bg-[#fffbeb] text-[#92400e] border border-[#fde68a]"
                          : item.status === "REJECTED"
                          ? "bg-[#fef2f2] text-[#991b1b] border border-[#fecaca]"
                          : "bg-[#eff6ff] text-[#1e40af] border border-[#bfdbfe]"
                      }`}
                    >
                      {item.status}
                    </span>

                    <span className="text-xs text-[#888888] tabular-nums font-mono">
                      {new Date(item.createdAt).toLocaleDateString("en-GB", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                </div>

                {/* Review Content */}
                <div className="space-y-1.5 text-xs">
                  <p className="text-[#222222] leading-relaxed text-sm">
                    "{item.feedbackEn || item.comment || ""}"
                  </p>
                  {item.feedbackBn && (
                    <p className="text-[#555555] font-bangla text-xs">
                      "{item.feedbackBn}"
                    </p>
                  )}
                </div>

                {/* Existing Admin Response (if already resolved) */}
                {item.adminResponse && item.status === "RESOLVED" && (
                  <div className="bg-[#f8fafc] border-l-4 border-[#059669] p-3 text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-[#065f46] flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Official Hospital Administration Response</span>
                      </span>
                      {item.respondedAt && (
                        <span className="text-[10px] text-[#666666] font-mono tabular-nums">
                          {new Date(item.respondedAt).toLocaleDateString("en-GB", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })}
                        </span>
                      )}
                    </div>
                    <p className="text-[#333333] italic">
                      "{item.adminResponse}"
                    </p>
                  </div>
                )}

                {/* Action & Response Area */}
                <div className="pt-3 border-t border-[#f0f0f0] space-y-3">
                  <div className="flex items-start gap-3">
                    <textarea
                      rows={2}
                      value={currentReply}
                      onChange={(e) =>
                        setAdminResponses({
                          ...adminResponses,
                          [item.id]: e.target.value,
                        })
                      }
                      placeholder="Draft clinical administration reply to patient..."
                      className="flex-1 p-2.5 text-xs border border-[#cccccc] focus:border-[#0057b8] focus:outline-none bg-[#fdfdfd]"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-2 text-xs">
                    {item.status !== "IN_REVIEW" && item.status !== "RESOLVED" && (
                      <button
                        type="button"
                        disabled={isSubmitting}
                        onClick={() => handleUpdateStatus(item.id, "IN_REVIEW")}
                        className="px-3 py-1.5 border border-[#d97706] text-[#d97706] hover:bg-[#fffbeb] font-semibold transition-colors disabled:opacity-50"
                      >
                        Mark In Review
                      </button>
                    )}

                    <button
                      type="button"
                      disabled={isSubmitting}
                      onClick={() => handleUpdateStatus(item.id, "RESOLVED", currentReply)}
                      className="px-4 py-1.5 bg-[#059669] text-white hover:bg-[#047857] font-semibold transition-colors flex items-center gap-1.5 disabled:opacity-50"
                    >
                      {isSubmitting && <RefreshCw className="w-3 h-3 animate-spin" />}
                      <Check className="w-3.5 h-3.5" />
                      <span>Resolve &amp; Publish Response</span>
                    </button>

                    {item.status !== "REJECTED" && (
                      <button
                        type="button"
                        disabled={isSubmitting}
                        onClick={() => handleUpdateStatus(item.id, "REJECTED")}
                        className="px-2.5 py-1.5 text-[#dc2626] hover:bg-[#fef2f2] font-semibold transition-colors disabled:opacity-50"
                      >
                        Reject
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
