"use client";

import React, { useState } from "react";
import {
  X,
  Download,
  Calendar,
  Clock,
  Building2,
  Stethoscope,
  Copy,
  Check,
  Award,
  Sparkles,
} from "lucide-react";
import { AvailableDoctorCardData } from "@/server/services/availabilityGeneratorService";
import { drawDoctorCardToCanvas } from "./cardCanvasRenderer";

interface DoctorCardInspectionModalProps {
  card: AvailableDoctorCardData | null;
  onClose: () => void;
  accompanyingCaption?: string;
}

export function DoctorCardInspectionModal({
  card,
  onClose,
  accompanyingCaption,
}: DoctorCardInspectionModalProps) {
  const [downloading, setDownloading] = useState(false);
  const [copiedCaption, setCopiedCaption] = useState(false);

  if (!card) return null;

  const defaultCaption =
    accompanyingCaption ||
    `🩺 Available Today at DeltaCare: ${card.nameEn} (${card.designationEn}) is taking patient consultations on ${card.consultationDateFormatted} from ${card.consultationHours} at ${card.branchNameEn} (${card.roomNumber}). Book online: https://deltacare.bd/request-appointment or call 24/7 Helpline: +8809612310666.`;

  const handleDownloadHighRes = async () => {
    try {
      setDownloading(true);
      const canvas = document.createElement("canvas");
      await drawDoctorCardToCanvas(card, canvas);

      canvas.toBlob((blob) => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `deltacare-card-${card.doctorSlug}-${card.consultationDate}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        setDownloading(false);
      }, "image/png");
    } catch (err) {
      console.error("High res download error:", err);
      setDownloading(false);
    }
  };

  const handleCopyCaption = () => {
    navigator.clipboard.writeText(defaultCaption);
    setCopiedCaption(true);
    setTimeout(() => setCopiedCaption(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-4xl w-full border border-slate-200 overflow-hidden shadow-2xl my-6 flex flex-col md:flex-row">
        {/* Left Side: Visual Card Preview */}
        <div className="md:w-1/2 bg-slate-900 p-6 flex flex-col items-center justify-center relative">
          <div
            className="w-full max-w-[360px] aspect-square rounded-2xl overflow-hidden shadow-2xl border border-sky-400/40 relative bg-gradient-to-br from-[#011c3d] via-[#012d61] to-[#001633] p-5 flex flex-col justify-between text-white"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <span className="font-serif font-bold text-lg">
                Delta<span className="text-[#38bdf8]">Care</span>
              </span>
              <span className="px-2 py-0.5 rounded-full bg-sky-500/20 text-[10px] font-bold text-sky-300">
                {card.consultationDateFormatted}
              </span>
            </div>

            {/* Ribbon */}
            <div className="my-1.5 px-2 py-1 rounded bg-teal-500/20 border border-teal-400/30 flex items-center justify-between text-[10px] font-bold text-emerald-300">
              <span>● CONSULTATION OPEN</span>
              <span>{card.totalAvailableSlots} SLOTS OPEN</span>
            </div>

            {/* Profile info */}
            <div className="flex items-center gap-3 my-2">
              <img
                src={card.photoUrl}
                alt={card.nameEn}
                className="w-16 h-16 rounded-full object-cover border-2 border-sky-400 bg-sky-100"
                style={{
                  objectPosition: card.imagePosition || "center",
                  transform: card.imageCrop ? `scale(${card.imageCrop.zoom || 1})` : undefined,
                }}
              />
              <div className="min-w-0 flex-1">
                <span className="text-[9px] uppercase font-bold text-sky-400 block truncate">
                  {card.departmentNameEn}
                </span>
                <h4 className="font-serif font-bold text-sm text-white truncate">{card.nameEn}</h4>
                <p className="text-[11px] text-blue-200 truncate">{card.designationEn}</p>
                <p className="text-[10px] text-slate-300 truncate">{card.qualificationsEn}</p>
                <p className="text-[10px] text-teal-300 truncate">Specialty: {card.primarySpecialtyEn}</p>
              </div>
            </div>

            {/* Chamber shift */}
            <div className="rounded-lg bg-slate-950/70 p-2 text-[10px] grid grid-cols-2 gap-2 border border-white/10">
              <div>
                <p className="text-slate-400 text-[8px] uppercase font-bold">Branch &amp; Chamber</p>
                <p className="font-bold text-white truncate">{card.branchNameEn}</p>
                <p className="text-sky-300 truncate">{card.roomNumber}</p>
              </div>
              <div className="border-l border-white/10 pl-2">
                <p className="text-slate-400 text-[8px] uppercase font-bold">Today's Hours</p>
                <p className="font-bold text-emerald-400 truncate">{card.consultationHours}</p>
                <p className="text-slate-300">Fee: ৳ {card.consultationFeeBdt} BDT</p>
              </div>
            </div>

            {/* Action */}
            <div className="border-t border-white/10 pt-2 flex items-center justify-between text-[9px] text-slate-300">
              <span>📞 +8809612310666</span>
              <span className="text-sky-300 font-bold">deltacare.bd/request-appointment</span>
            </div>
          </div>

          <div className="mt-4 text-center">
            <span className="text-xs text-slate-400">
              Rendered at 1080 × 1080 High-Resolution Square Facebook Post Format
            </span>
          </div>
        </div>

        {/* Right Side: Operational Details & Actions */}
        <div className="md:w-1/2 p-6 flex flex-col justify-between space-y-6">
          <div>
            <div className="flex items-start justify-between">
              <div>
                <span className="px-2 py-0.5 rounded-full bg-blue-100 text-[#0057b8] text-[11px] font-bold">
                  Verified Chamber Schedule
                </span>
                <h3 className="text-xl font-bold text-slate-900 mt-1">{card.nameEn}</h3>
                <p className="text-xs text-slate-600">{card.designationEn}</p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Operational details checklist */}
            <div className="mt-4 space-y-2 text-xs text-slate-700 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">BMDC Registration:</span>
                <span className="font-bold text-slate-900">{card.bmdcRegistrationNo}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Department:</span>
                <span className="font-bold text-slate-900">{card.departmentNameEn}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Consultation Date:</span>
                <span className="font-bold text-[#0057b8]">{card.consultationDateFormatted}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Chamber Hours:</span>
                <span className="font-bold text-emerald-700">{card.consultationHours}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Assigned Chamber:</span>
                <span className="font-bold text-slate-900">
                  {card.branchNameEn} — {card.roomNumber}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Remaining Slots:</span>
                <span className="font-bold text-emerald-600">
                  {card.totalAvailableSlots} / {card.totalChamberCapacity} capacity
                </span>
              </div>
            </div>

            {/* Post Caption Preview */}
            <div className="mt-4">
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-slate-700">Accompanying Facebook Post Caption</label>
                <button
                  type="button"
                  onClick={handleCopyCaption}
                  className="text-xs text-[#0057b8] hover:underline flex items-center gap-1 font-semibold"
                >
                  {copiedCaption ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-emerald-600">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Caption</span>
                    </>
                  )}
                </button>
              </div>
              <textarea
                readOnly
                rows={4}
                value={defaultCaption}
                className="w-full text-xs p-2.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-700 resize-none font-mono"
              />
            </div>
          </div>

          {/* Action buttons */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-100"
            >
              Close
            </button>
            <button
              type="button"
              disabled={downloading}
              onClick={handleDownloadHighRes}
              className="px-4 py-2 rounded-xl bg-[#0057b8] hover:bg-[#004181] text-white text-xs font-bold flex items-center gap-2 shadow"
            >
              <Download className="w-4 h-4" />
              <span>{downloading ? "Generating 1080p Image..." : "Download High-Res PNG (1080×1080)"}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

