"use client";

import React, { useState, useEffect } from "react";
import {
  FileText,
  Plus,
  Search,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Edit2,
  Calendar,
  Tag,
  ToggleLeft,
  ToggleRight,
  Pin,
  RefreshCw,
  X,
  FileDown,
} from "lucide-react";
import { HospitalNotice } from "@/types/domain";

interface WebsiteNoticesCMSProps {
  initialNotices?: HospitalNotice[];
}

export function WebsiteNoticesCMS({ initialNotices = [] }: WebsiteNoticesCMSProps) {
  const [notices, setNotices] = useState<HospitalNotice[]>(initialNotices);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingNotice, setEditingNotice] = useState<HospitalNotice | null>(null);
  const [formData, setFormData] = useState({
    titleEn: "",
    titleBn: "",
    slug: "",
    summaryEn: "",
    summaryBn: "",
    bodyEn: "",
    bodyBn: "",
    category: "CLINICAL_UPDATE",
    branchId: "",
    isPinned: false,
    isActive: true,
  });
  const [saving, setSaving] = useState(false);

  const fetchNotices = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/v1/admin/notices");
      const data = await res.json();
      if (res.ok && data.ok) {
        setNotices(data.notices || []);
      }
    } catch {
      setStatusMessage("Failed to refresh notices.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialNotices.length === 0) {
      fetchNotices();
    }
  }, []);

  const handleOpenCreate = () => {
    setEditingNotice(null);
    setFormData({
      titleEn: "",
      titleBn: "",
      slug: "",
      summaryEn: "",
      summaryBn: "",
      bodyEn: "",
      bodyBn: "",
      category: "CLINICAL_UPDATE",
      branchId: "",
      isPinned: false,
      isActive: true,
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (notice: HospitalNotice) => {
    setEditingNotice(notice);
    setFormData({
      titleEn: notice.titleEn,
      titleBn: notice.titleBn,
      slug: notice.slug,
      summaryEn: notice.summaryEn,
      summaryBn: notice.summaryBn,
      bodyEn: notice.bodyEn,
      bodyBn: notice.bodyBn,
      category: notice.category,
      branchId: notice.branchId || "",
      isPinned: notice.isPinned,
      isActive: notice.isActive,
    });
    setIsModalOpen(true);
  };

  const handleToggleStatus = async (noticeId: string) => {
    try {
      const res = await fetch("/api/v1/admin/notices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "TOGGLE_STATUS", noticeId }),
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        setNotices((prev) =>
          prev.map((n) => (n.id === noticeId ? data.notice : n))
        );
        setStatusMessage("Notice visibility updated successfully.");
        setTimeout(() => setStatusMessage(null), 4000);
      } else {
        setStatusMessage(data.error || "Failed to update notice status.");
      }
    } catch {
      setStatusMessage("Network error updating status.");
    }
  };

  const handleSaveNotice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.titleEn || !formData.titleBn) {
      setStatusMessage("Title (English and Bengali) is required.");
      return;
    }

    const slug =
      formData.slug ||
      formData.titleEn
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");

    setSaving(true);
    try {
      const res = await fetch("/api/v1/admin/notices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingNotice?.id,
          ...formData,
          slug,
        }),
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        if (editingNotice) {
          setNotices((prev) =>
            prev.map((n) => (n.id === editingNotice.id ? data.notice : n))
          );
          setStatusMessage("Notice updated successfully.");
        } else {
          setNotices((prev) => [data.notice, ...prev]);
          setStatusMessage("Notice published successfully.");
        }
        setIsModalOpen(false);
        setTimeout(() => setStatusMessage(null), 4000);
      } else {
        setStatusMessage(data.error || "Failed to save notice.");
      }
    } catch {
      setStatusMessage("Network error saving notice.");
    } finally {
      setSaving(false);
    }
  };

  const filteredNotices = notices.filter((n) => {
    const matchesSearch =
      n.titleEn.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.titleBn.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.slug.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      categoryFilter === "ALL" || n.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-[#012d61] text-white p-6 rounded-none flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 text-xs font-semibold text-[#82b4ff] tracking-wide uppercase mb-1">
            <FileText className="w-4 h-4" />
            <span>Editorial CMS · Hospital Notices &amp; Media</span>
          </div>
          <h2 className="mc-serif text-2xl font-normal text-white">
            Website Notices &amp; Public Circulars
          </h2>
          <p className="text-xs text-[#c5daf7] mt-1 max-w-2xl font-light">
            Publish clinical updates, tender circulars, academic notices, and holiday announcements across all Evercare public portals with bilingual support.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={fetchNotices}
            disabled={loading}
            className="px-3.5 py-2 text-xs font-medium text-white/90 bg-white/10 hover:bg-white/20 transition-colors flex items-center gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </button>
          <button
            type="button"
            onClick={handleOpenCreate}
            className="px-4 py-2 text-xs font-semibold bg-[#0057b8] text-white hover:bg-[#004694] transition-colors flex items-center gap-1.5 shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Publish New Notice</span>
          </button>
        </div>
      </div>

      {/* Status Alert Banner */}
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

      {/* Filter & Search Bar */}
      <div className="bg-white border border-[#e5e7eb] p-4 flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-[#666666] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search circulars by title or keyword..."
            className="w-full pl-9 pr-3 py-2 text-xs border border-[#e5e7eb] focus:outline-none focus:border-[#0057b8] bg-[#fcfcfc]"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <span className="text-xs text-[#666666] font-medium shrink-0">Category:</span>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="text-xs border border-[#e5e7eb] px-3 py-2 bg-white focus:outline-none focus:border-[#0057b8]"
          >
            <option value="ALL">All Categories</option>
            <option value="CLINICAL_UPDATE">Clinical Update</option>
            <option value="CAMPUS_NOTICE">Campus Notice</option>
            <option value="ACADEMIC">Academic / CME</option>
            <option value="TENDER">Tender / Procurement</option>
            <option value="GENERAL">General Notice</option>
          </select>

          <span className="text-xs text-[#666666] tabular-nums font-mono ml-auto">
            {filteredNotices.length} {filteredNotices.length === 1 ? "Notice" : "Notices"}
          </span>
        </div>
      </div>

      {/* Notices Table */}
      <div className="bg-white border border-[#e5e7eb] overflow-hidden">
        {filteredNotices.length === 0 ? (
          <div className="p-12 text-center text-[#666666] space-y-2">
            <FileText className="w-10 h-10 text-[#cccccc] mx-auto" />
            <p className="text-sm font-medium">No notices match your filter.</p>
            <p className="text-xs text-[#888888]">
              Publish circulars to display them on the public portal and website.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#f8fafc] border-b border-[#e5e7eb] text-[#333333] font-semibold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4">Title &amp; Bengali Heading</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Published Date</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e5e7eb]">
                {filteredNotices.map((n) => (
                  <tr key={n.id} className="hover:bg-[#f9fafb] transition-colors">
                    <td className="py-3.5 px-4 max-w-md">
                      <div className="flex items-start gap-2">
                        {n.isPinned && (
                          <span
                            title="Pinned Notice"
                            className="mt-0.5 inline-flex items-center text-[#0057b8]"
                          >
                            <Pin className="w-3.5 h-3.5 fill-[#0057b8]" />
                          </span>
                        )}
                        <div>
                          <p className="font-semibold text-[#111827] text-sm">
                            {n.titleEn}
                          </p>
                          <p className="text-xs text-[#555555] font-bangla mt-0.5">
                            {n.titleBn}
                          </p>
                          <p className="text-[11px] text-[#888888] font-mono mt-0.5">
                            Slug: /notices/{n.slug}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="px-2 py-0.5 bg-[#f0f4f8] text-[#004181] border border-[#d0e0f0] font-semibold text-[10px] tracking-wide uppercase">
                        {n.category.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap text-[#555555] tabular-nums font-mono">
                      {new Date(n.publishedAt).toLocaleDateString("en-GB", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => handleToggleStatus(n.id)}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-semibold transition-colors ${
                          n.isActive
                            ? "bg-[#ecfdf5] text-[#065f46] hover:bg-[#d1fae5]"
                            : "bg-[#fef2f2] text-[#991b1b] hover:bg-[#fee2e2]"
                        }`}
                      >
                        {n.isActive ? (
                          <>
                            <ToggleRight className="w-4 h-4 text-[#059669]" />
                            <span>Active / Live</span>
                          </>
                        ) : (
                          <>
                            <ToggleLeft className="w-4 h-4 text-[#dc2626]" />
                            <span>Hidden / Inactive</span>
                          </>
                        )}
                      </button>
                    </td>
                    <td className="py-3.5 px-4 text-right whitespace-nowrap space-x-2">
                      <a
                        href={`/notices#${n.slug}`}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1.5 text-[#0057b8] hover:bg-[#e8f0f9] transition-colors inline-flex items-center"
                        title="View Public Notice"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(n)}
                        className="p-1.5 text-[#333333] hover:text-[#0057b8] hover:bg-[#f0f4f8] transition-colors inline-flex items-center"
                        title="Edit Notice"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit / Create Notice Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white max-w-2xl w-full border border-[#012d61] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="bg-[#012d61] text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#82b4ff]" />
                <h3 className="font-semibold text-sm">
                  {editingNotice ? "Edit Hospital Circular" : "Publish New Hospital Circular"}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-white/70 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveNotice} className="p-6 space-y-4 overflow-y-auto flex-1 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-semibold text-[#333333] uppercase mb-1">
                    Title (English) *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.titleEn}
                    onChange={(e) => setFormData({ ...formData, titleEn: e.target.value })}
                    placeholder="e.g. Revised OPD Consultation Hours"
                    className="w-full p-2.5 border border-[#cccccc] focus:border-[#0057b8] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-[#333333] uppercase mb-1">
                    Title (বাংলা) *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.titleBn}
                    onChange={(e) => setFormData({ ...formData, titleBn: e.target.value })}
                    placeholder="e.g. ওপিডি কনসালটেশন সময়সূচি পরিবর্তন"
                    className="w-full p-2.5 border border-[#cccccc] focus:border-[#0057b8] focus:outline-none font-bangla"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-semibold text-[#333333] uppercase mb-1">
                    Notice Category
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full p-2.5 border border-[#cccccc] focus:border-[#0057b8] focus:outline-none bg-white"
                  >
                    <option value="CLINICAL_UPDATE">Clinical Update</option>
                    <option value="CAMPUS_NOTICE">Campus Notice</option>
                    <option value="ACADEMIC">Academic / CME Circular</option>
                    <option value="TENDER">Tender / Procurement</option>
                    <option value="GENERAL">General Announcement</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-[#333333] uppercase mb-1">
                    Custom Slug (Optional)
                  </label>
                  <input
                    type="text"
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    placeholder="auto-generated-from-title"
                    className="w-full p-2.5 border border-[#cccccc] focus:border-[#0057b8] focus:outline-none font-mono text-[11px]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#333333] uppercase mb-1">
                  Brief Summary (English)
                </label>
                <textarea
                  rows={2}
                  value={formData.summaryEn}
                  onChange={(e) => setFormData({ ...formData, summaryEn: e.target.value })}
                  placeholder="One sentence overview displayed in lists and cards..."
                  className="w-full p-2.5 border border-[#cccccc] focus:border-[#0057b8] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#333333] uppercase mb-1">
                  Brief Summary (বাংলা)
                </label>
                <textarea
                  rows={2}
                  value={formData.summaryBn}
                  onChange={(e) => setFormData({ ...formData, summaryBn: e.target.value })}
                  placeholder="বিজ্ঞপ্তির সংক্ষেপ..."
                  className="w-full p-2.5 border border-[#cccccc] focus:border-[#0057b8] focus:outline-none font-bangla"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#333333] uppercase mb-1">
                  Full Notice Content (English)
                </label>
                <textarea
                  rows={4}
                  value={formData.bodyEn}
                  onChange={(e) => setFormData({ ...formData, bodyEn: e.target.value })}
                  placeholder="Full circular text, guidelines, or instructions..."
                  className="w-full p-2.5 border border-[#cccccc] focus:border-[#0057b8] focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-6 pt-2 border-t border-[#e5e7eb]">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isPinned}
                    onChange={(e) => setFormData({ ...formData, isPinned: e.target.checked })}
                    className="rounded border-[#cccccc] text-[#0057b8] focus:ring-[#0057b8]"
                  />
                  <span className="text-xs font-semibold text-[#333333]">
                    Pin this notice to top of public directory
                  </span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="rounded border-[#cccccc] text-[#0057b8] focus:ring-[#0057b8]"
                  />
                  <span className="text-xs font-semibold text-[#333333]">
                    Publish as live on website
                  </span>
                </label>
              </div>

              <div className="pt-4 border-t border-[#e5e7eb] flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-[#cccccc] text-[#444444] hover:bg-[#f2f2f2] font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 bg-[#0057b8] text-white hover:bg-[#004694] font-semibold flex items-center gap-2 disabled:opacity-50"
                >
                  {saving && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>{editingNotice ? "Update Circular" : "Publish Circular"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

