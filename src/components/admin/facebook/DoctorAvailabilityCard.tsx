"use client";

import React, { useRef, useState, useEffect } from "react";
import {
  Calendar,
  Clock,
  Download,
  CheckCircle2,
  Phone,
  Building2,
  Stethoscope,
  ExternalLink,
  Sparkles,
} from "lucide-react";
import { AvailableDoctorCardData } from "@/server/services/availabilityGeneratorService";
import { drawDoctorCardToCanvas } from "./cardCanvasRenderer";

interface DoctorAvailabilityCardProps {
  data: AvailableDoctorCardData;
  onInspect?: (data: AvailableDoctorCardData) => void;
  hideDownloadButton?: boolean;
}

export function DoctorAvailabilityCard({
  data,
  onInspect,
  hideDownloadButton = false,
}: DoctorAvailabilityCardProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [downloading, setDownloading] = useState(false);

  const handleDownloadPng = async (e?: React.MouseEvent) => {
    e?.stopPropagation();
    try {
      setDownloading(true);
      const canvas = document.createElement("canvas");
      await drawDoctorCardToCanvas(data, canvas);

      canvas.toBlob((blob) => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `deltacare-card-${data.doctorSlug}-${data.consultationDate}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        setDownloading(false);
      }, "image/png");
    } catch (err) {
      console.error("Failed to render card canvas:", err);
      setDownloading(false);
    }
  };

  return (
    <div
      onClick={() => onInspect?.(data)}
      className="group relative rounded-2xl overflow-hidden bg-gradient-to-br from-[#011c3d] via-[#012d61] to-[#001633] text-white p-5 border border-[#38bdf8]/30 shadow-md hover:shadow-xl transition-all cursor-pointer flex flex-col justify-between"
      style={{ aspectRatio: "1 / 1" }}
    >
      {/* Background Decorative Rings */}
      <div className="absolute -top-12 -right-12 w-44 h-44 rounded-full border border-sky-400/10 pointer-events-none" />
      <div className="absolute -bottom-16 -left-16 w-52 h-52 rounded-full border border-teal-400/10 pointer-events-none" />

      {/* Header */}
      <div className="relative z-10 flex items-center justify-between gap-2 border-b border-white/10 pb-3">
        <div className="flex items-center gap-1.5">
          <span className="font-serif font-bold text-lg text-white">Delta</span>
          <span className="font-serif font-bold text-lg text-[#38bdf8]">Care</span>
        </div>

        <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-sky-500/15 border border-sky-400/40 text-[11px] font-bold text-[#38bdf8]">
          <Calendar className="w-3 h-3" />
          <span>{data.consultationDateFormatted}</span>
        </div>
      </div>

      {/* Ribbon: Available Today */}
      <div className="relative z-10 my-2 px-2.5 py-1 rounded-md bg-teal-500/15 border border-teal-400/40 flex items-center justify-between text-[11px] font-bold text-emerald-300">
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>CONSULTATION AVAILABLE</span>
        </span>
        <span className="text-white/80">{data.totalAvailableSlots} slots open</span>
      </div>

      {/* Doctor Info & Photo */}
      <div className="relative z-10 flex items-center gap-3.5 my-1">
        <div className="relative shrink-0">
          <img
            src={data.photoUrl}
            alt={data.nameEn}
            className="w-20 h-20 rounded-full object-cover border-2 border-[#0057b8] bg-[#e8f0f9] shadow-inner"
            style={{
              objectPosition: data.imagePosition || "center",
              transform: data.imageCrop ? `scale(${data.imageCrop.zoom || 1})` : undefined,
            }}
          />
          <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 px-1.5 py-0.2 rounded-full bg-slate-900 border border-sky-400 text-[9px] font-bold text-slate-200 whitespace-nowrap">
            BMDC: {data.bmdcRegistrationNo}
          </span>
        </div>

        <div className="min-w-0 flex-1">
          <span className="inline-block px-1.5 py-0.5 rounded bg-sky-500/20 text-[#7dd3fc] text-[10px] font-bold uppercase tracking-wider mb-0.5 truncate max-w-full">
            {data.departmentNameEn}
          </span>
          <h4 className="font-serif font-bold text-sm text-white truncate leading-tight">
            {data.nameEn}
          </h4>
          <p className="text-[11px] font-semibold text-blue-200 truncate">{data.designationEn}</p>
          <p className="text-[10px] text-slate-300 truncate">{data.qualificationsEn}</p>
          <p className="text-[10px] text-teal-300 font-medium truncate mt-0.5">
            Specialty: {data.primarySpecialtyEn}
          </p>
        </div>
      </div>

      {/* Chamber & Timing Box */}
      <div className="relative z-10 rounded-xl bg-slate-900/60 border border-white/10 p-2.5 text-xs grid grid-cols-2 gap-2 my-1">
        <div>
          <p className="text-[9px] uppercase tracking-wider text-slate-400 font-bold">Branch &amp; Chamber</p>
          <p className="font-bold text-slate-100 truncate text-[11px]">{data.branchNameEn}</p>
          <p className="text-[10px] text-sky-300 truncate">{data.roomNumber}</p>
        </div>

        <div className="border-l border-white/10 pl-2">
          <p className="text-[9px] uppercase tracking-wider text-slate-400 font-bold">Shift Hours</p>
          <p className="font-bold text-emerald-400 text-[11px] truncate">{data.consultationHours}</p>
          <p className="text-[10px] text-slate-300">Fee: ৳ {data.consultationFeeBdt} BDT</p>
        </div>
      </div>

      {/* Footer / Action */}
      <div className="relative z-10 pt-2 border-t border-white/10 flex items-center justify-between text-[11px]">
        <div className="text-slate-300 truncate text-[10px]">
          <span className="font-bold text-white">Call:</span> +8809612310666
        </div>

        {!hideDownloadButton && (
          <button
            type="button"
            disabled={downloading}
            onClick={handleDownloadPng}
            className="px-2.5 py-1 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-bold text-[10px] flex items-center gap-1 shadow transition-colors"
          >
            <Download className="w-3 h-3" />
            <span>{downloading ? "Exporting..." : "Download (PNG)"}</span>
          </button>
        )}
      </div>
    </div>
  );
}

