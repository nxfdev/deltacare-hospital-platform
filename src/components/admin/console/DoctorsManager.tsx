"use client";

import React, { useState } from "react";
import { Plus, Search } from "lucide-react";
import type { Branch, Department, Doctor, Specialty } from "@/types/domain";
import { fuzzyRecordScore, FUZZY_THRESHOLD } from "@/lib/fuzzy";
import { SpecialistModal } from "@/components/admin/SpecialistModal";
import { DeactivateSpecialistModal } from "@/components/admin/DeactivateSpecialistModal";

export function DoctorsManager({
  doctors,
  departments,
  branches,
  specialties,
  onSaved,
  onPromote,
}: {
  doctors: Doctor[];
  departments: Department[];
  branches: Branch[];
  specialties: Specialty[];
  onSaved: (doc: Doctor, isNew: boolean) => void;
  onPromote: (doctorId: string) => void;
}) {
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<{ mode: "CREATE" | "EDIT"; doctor: Doctor | null } | null>(null);
  const [toggling, setToggling] = useState<Doctor | null>(null);

  const list = query.trim()
    ? doctors.filter((d) => {
        const dept = departments.find((x) => x.id === d.departmentId);
        return fuzzyRecordScore(query, [d.nameEn, d.nameBn, dept?.nameEn], [d.bmdcRegistrationNo]) >= FUZZY_THRESHOLD;
      })
    : doctors;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[220px] max-w-md">
          <Search className="w-4 h-4 text-[#9ca3af] absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search doctors"
            aria-label="Search doctors"
            className="w-full h-11 rounded-full bg-white pl-11 pr-4 text-sm ring-1 ring-[#e5e7eb] focus:ring-[#0057b8] outline-none"
          />
        </div>
        <button
          type="button"
          onClick={() => setEditing({ mode: "CREATE", doctor: null })}
          className="ml-auto h-11 rounded-full px-5 text-sm font-medium text-white bg-[#0057b8] hover:bg-[#004a9c] inline-flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" /> Add doctor
        </button>
      </div>

      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {list.map((d) => {
          const dept = departments.find((x) => x.id === d.departmentId);
          const live = d.publicationState === "PUBLISHED";
          return (
            <div key={d.id} className="rounded-2xl bg-white p-5 ring-1 ring-[#eef0f3] flex gap-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={d.imageUrl} alt="" className="w-16 h-16 rounded-full object-cover object-top bg-[#eef2f6] shrink-0" />
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-medium text-[#0b1b33] truncate">{d.nameEn}</p>
                  <span
                    className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium ${
                      live ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {live ? "Live" : "Hidden"}
                  </span>
                </div>
                <p className="text-sm text-[#6b7280] truncate">{dept?.nameEn}</p>
                <p className="text-sm text-[#6b7280]">৳{d.consultationFeeBdt.toLocaleString("en-IN")}</p>
                <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm">
                  <button type="button" onClick={() => setEditing({ mode: "EDIT", doctor: d })} className="text-[#0057b8] hover:underline">
                    Edit
                  </button>
                  <button type="button" onClick={() => onPromote(d.id)} className="text-[#0057b8] hover:underline">
                    Photocard
                  </button>
                  <button type="button" onClick={() => setToggling(d)} className="text-[#6b7280] hover:underline">
                    {d.publicationState === "ARCHIVED" ? "Show" : "Hide"}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {editing && (
        <SpecialistModal
          isOpen
          mode={editing.mode}
          doctor={editing.doctor}
          departments={departments}
          branches={branches}
          specialties={specialties}
          onClose={() => setEditing(null)}
          onSuccess={(doc: Doctor, isNew: boolean) => {
            onSaved(doc, isNew);
            setEditing(null);
          }}
        />
      )}
      {toggling && (
        <DeactivateSpecialistModal
          isOpen
          doctor={toggling}
          action={toggling.publicationState === "ARCHIVED" ? "ACTIVATE" : "DEACTIVATE"}
          onClose={() => setToggling(null)}
          onSuccess={(doc: Doctor) => {
            onSaved(doc, false);
            setToggling(null);
          }}
        />
      )}
    </div>
  );
}
