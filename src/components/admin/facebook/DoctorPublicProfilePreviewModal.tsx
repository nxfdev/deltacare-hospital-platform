"use client";

import React from "react";
import { X, Award, CheckCircle2, Clock, MapPin, DollarSign, ExternalLink } from "lucide-react";
import { Doctor, Department, Branch } from "@/types/domain";
import Link from "next/link";

interface DoctorPublicProfilePreviewModalProps {
  doctor: Doctor | null;
  department?: Department;
  branches: Branch[];
  onClose: () => void;
}

export function DoctorPublicProfilePreviewModal({
  doctor,
  department,
  branches,
  onClose,
}: DoctorPublicProfilePreviewModalProps) {
  if (!doctor) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-[#f8fafc] rounded-3xl max-w-4xl w-full border border-slate-300 overflow-hidden shadow-2xl my-6">
        {/* Top bar indicating preview mode */}
        <div className="bg-[#012d61] px-6 py-3 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-bold uppercase tracking-wider text-sky-200">
              Live Website Appearance Preview — /doctors/{doctor.slug}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href={`/doctors/${doctor.slug}`}
              target="_blank"
              className="text-xs text-sky-300 hover:text-white flex items-center gap-1 font-semibold underline"
            >
              <span>Open Public Page</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded-lg hover:bg-white/10 text-white/80 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content body matching public website */}
        <div className="p-6 md:p-8 space-y-6 max-h-[80vh] overflow-y-auto">
          {/* Hero Profile Card */}
          <div className="bg-white rounded-3xl border border-[#d6d6d6] p-6 md:p-8 shadow-sm">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
              {/* Doctor Avatar */}
              <div className="md:col-span-4 flex flex-col items-center text-center space-y-3">
                <div className="w-36 h-36 rounded-full overflow-hidden border-4 border-[#0057b8] bg-[#e8f0f9] shadow relative">
                  <img
                    src={doctor.imageUrl}
                    alt={doctor.nameEn}
                    className="w-full h-full object-cover"
                    style={{
                      objectPosition: doctor.imagePosition || "center",
                      transform: doctor.imageCrop ? `scale(${doctor.imageCrop.zoom || 1})` : undefined,
                    }}
                  />
                </div>

                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[#e8f0f9] text-[#004181] text-xs font-bold">
                  <Award className="w-3.5 h-3.5 text-[#0057b8]" />
                  BMDC: {doctor.bmdcRegistrationNo}
                </span>

                <span
                  className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${
                    doctor.publicationState === "PUBLISHED"
                      ? "bg-[#ecfdf5] text-[#065f46]"
                      : "bg-[#fef3c7] text-[#92400e]"
                  }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {doctor.publicationState}
                </span>
              </div>

              {/* Bio & Details */}
              <div className="md:col-span-8 space-y-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-[#0057b8]">
                    {department?.nameEn || "Clinical Department"} • {department?.nameBn || ""}
                  </p>
                  <h1 className="mc-serif text-2xl md:text-3xl text-[#080808] font-bold mt-1">
                    {doctor.nameEn}
                  </h1>
                  <p className="text-base font-semibold text-[#004181] mt-0.5">{doctor.nameBn}</p>
                  <p className="text-sm font-semibold text-[#424242] mt-1">{doctor.designationEn}</p>
                  <p className="text-xs text-[#686868] mt-0.5">
                    {doctor.qualificationsEn} • {doctor.experienceYears} Years Clinical Experience
                  </p>
                </div>

                {doctor.publicTaglineEn && (
                  <p className="text-xs italic font-medium text-slate-700 bg-sky-50 border-l-4 border-sky-500 p-2 rounded">
                    "{doctor.publicTaglineEn}"
                  </p>
                )}

                <div className="border-t border-slate-200 pt-3">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-1">
                    About Specialist / চিকিৎসক সম্পর্কে
                  </h4>
                  <p className="text-xs text-slate-700 whitespace-pre-line leading-relaxed">
                    {doctor.bioEn || "No public biography provided yet."}
                  </p>
                  {doctor.bioBn && (
                    <p className="text-xs text-slate-600 whitespace-pre-line leading-relaxed mt-2 pt-2 border-t border-slate-100 font-bengali">
                      {doctor.bioBn}
                    </p>
                  )}
                </div>

                {/* Consultation Fee & Location */}
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                    <span className="text-slate-500 font-medium">Consultation Fee:</span>
                    <p className="text-sm font-bold text-[#0057b8] mt-0.5">
                      ৳ {doctor.consultationFeeBdt} BDT
                    </p>
                    <span className="text-[10px] text-slate-500">
                      Follow-up: ৳ {doctor.followupFeeBdt} BDT
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                    <span className="text-slate-500 font-medium">Primary Chamber:</span>
                    <p className="text-sm font-bold text-slate-900 mt-0.5 truncate">
                      {branches.find((b) => b.id === doctor.branches?.[0]?.branchId)?.nameEn ||
                        "DeltaCare Hospital"}
                    </p>
                    <span className="text-[10px] text-slate-500">
                      {doctor.branches?.[0]?.roomNumber || "Chamber Desk"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-100 px-6 py-3 border-t border-slate-200 flex items-center justify-between">
          <span className="text-xs text-slate-500">
            Previewing presentation layout and copywriting rendered on DeltaCare public site.
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-800 text-white font-bold text-xs hover:bg-slate-700"
          >
            Close Preview
          </button>
        </div>
      </div>
    </div>
  );
}

