"use client";

import React, { useState, useEffect } from "react";
import { X, AlertCircle, CheckCircle2, User, Stethoscope } from "lucide-react";
import { Branch, Department, Doctor, PublicationState, Specialty } from "@/types/domain";

interface SpecialistModalProps {
  isOpen: boolean;
  mode: "CREATE" | "EDIT";
  doctor?: Doctor | null;
  departments: Department[];
  branches: Branch[];
  specialties: Specialty[];
  onClose: () => void;
  onSuccess: (savedDoctor: Doctor, isNew: boolean) => void;
}

export function SpecialistModal({
  isOpen,
  mode,
  doctor,
  departments,
  branches,
  specialties,
  onClose,
  onSuccess,
}: SpecialistModalProps) {
  const [nameEn, setNameEn] = useState("");
  const [nameBn, setNameBn] = useState("");
  const [slug, setSlug] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [specialtyId, setSpecialtyId] = useState("");
  const [branchId, setBranchId] = useState("");
  const [roomNumber, setRoomNumber] = useState("Room 302 (3rd Floor)");
  const [bmdcReg, setBmdcReg] = useState("");
  const [designationEn, setDesignationEn] = useState("Consultant Specialist");
  const [designationBn, setDesignationBn] = useState("কনসালট্যান্ট বিশেষজ্ঞ");
  const [qualificationsEn, setQualificationsEn] = useState("MBBS, FCPS");
  const [qualificationsBn, setQualificationsBn] = useState("এমবিবিএস, এফসিপিএস");
  const [experienceYears, setExperienceYears] = useState(10);
  const [consultationFee, setConsultationFee] = useState(1500);
  const [followupFee, setFollowupFee] = useState(1000);
  const [feeEffectiveFrom, setFeeEffectiveFrom] = useState("2026-01-01");
  const [bioEn, setBioEn] = useState("Verified clinical specialist consultant at Evercare Hospital Platform.");
  const [bioBn, setBioBn] = useState("এভারকেয়ার হাসপাতালের যাচাইকৃত বিশেষজ্ঞ চিকিৎসক।");
  const [publicationState, setPublicationState] = useState<PublicationState>("PUBLISHED");

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (mode === "EDIT" && doctor) {
      setNameEn(doctor.nameEn);
      setNameBn(doctor.nameBn);
      setSlug(doctor.slug);
      setDepartmentId(doctor.departmentId);
      setSpecialtyId(doctor.specialtyIds[0] || specialties[0]?.id || "");
      const primaryBranch = doctor.branches?.[0];
      setBranchId(primaryBranch?.branchId || branches[0]?.id || "");
      setRoomNumber(primaryBranch?.roomNumber || "Room 302 (3rd Floor)");
      setBmdcReg(doctor.bmdcRegistrationNo);
      setDesignationEn(doctor.designationEn);
      setDesignationBn(doctor.designationBn);
      setQualificationsEn(doctor.qualificationsEn);
      setQualificationsBn(doctor.qualificationsBn);
      setExperienceYears(doctor.experienceYears);
      setConsultationFee(doctor.consultationFeeBdt);
      setFollowupFee(doctor.followupFeeBdt);
      setFeeEffectiveFrom(doctor.feeEffectiveFrom || "2026-01-01");
      setBioEn(doctor.bioEn);
      setBioBn(doctor.bioBn);
      setPublicationState(doctor.publicationState);
    } else {
      setNameEn("");
      setNameBn("");
      setSlug("");
      setDepartmentId(departments[0]?.id || "");
      setSpecialtyId(specialties[0]?.id || "");
      setBranchId(branches[0]?.id || "");
      setRoomNumber("Room 302 (3rd Floor)");
      setBmdcReg("BMDC-A-");
      setDesignationEn("Consultant Specialist");
      setDesignationBn("কনসালট্যান্ট বিশেষজ্ঞ");
      setQualificationsEn("MBBS, FCPS");
      setQualificationsBn("এমবিবিএস, এফসিপিএস");
      setExperienceYears(10);
      setConsultationFee(1500);
      setFollowupFee(1000);
      setFeeEffectiveFrom("2026-01-01");
      setBioEn("Verified clinical specialist consultant at Evercare Hospital Platform.");
      setBioBn("এভারকেয়ার হাসপাতালের যাচাইকৃত বিশেষজ্ঞ চিকিৎসক।");
      setPublicationState("PUBLISHED");
    }
    setErrorMessage(null);
  }, [mode, doctor, departments, branches, specialties, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage(null);

    const generatedSlug =
      slug.trim() ||
      nameEn
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");

    const payload = {
      id: mode === "EDIT" && doctor ? doctor.id : undefined,
      departmentId,
      specialtyIds: [specialtyId || specialties[0]?.id || "spec-cardiology"],
      slug: generatedSlug,
      nameEn: nameEn.trim(),
      nameBn: nameBn.trim() || nameEn.trim(),
      designationEn: designationEn.trim(),
      designationBn: designationBn.trim(),
      qualificationsEn: qualificationsEn.trim(),
      qualificationsBn: qualificationsBn.trim(),
      experienceYears: Number(experienceYears),
      bmdcRegistrationNo: bmdcReg.trim(),
      bioEn: bioEn.trim(),
      bioBn: bioBn.trim(),
      consultationFeeBdt: Number(consultationFee),
      followupFeeBdt: Number(followupFee),
      feeEffectiveFrom,
      branchId,
      roomNumber: roomNumber.trim(),
      publicationState,
    };

    try {
      const res = await fetch("/api/v1/admin/doctors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        setErrorMessage(data.error || "Failed to save specialist record.");
        setLoading(false);
        return;
      }

      onSuccess(data.doctor, mode === "CREATE");
      onClose();
    } catch {
      setErrorMessage("Network error: Unable to reach specialist API.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="specialist-modal-title"
    >
      <div className="relative w-full max-w-3xl bg-white rounded-2xl border border-[#d6d6d6] shadow-2xl my-8 max-h-[90vh] flex flex-col">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-[#d6d6d6] flex items-center justify-between bg-[#f8fafc] rounded-t-2xl">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-[#e8f0f9] flex items-center justify-center text-[#0057b8]">
              <Stethoscope className="w-5 h-5" />
            </div>
            <div>
              <h2 id="specialist-modal-title" className="text-lg font-bold text-[#080808]">
                {mode === "CREATE" ? "Add New Specialist Record" : `Update Specialist: ${doctor?.nameEn}`}
              </h2>
              <p className="text-xs text-[#686868]">
                {mode === "CREATE"
                  ? "Register a verified physician profile with hospital branch, room, and fees."
                  : `Modify credentials, consultation fees, and publication status for BMDC: ${doctor?.bmdcRegistrationNo}`}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-[#686868] hover:text-[#080808] hover:bg-[#e2e8f0]"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          {errorMessage && (
            <div
              role="alert"
              className="p-3.5 rounded-xl bg-[#fef2f2] border border-[#dc2626] text-xs text-[#991b1b] flex items-center gap-2"
            >
              <AlertCircle className="w-4 h-4 shrink-0 text-[#dc2626]" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Section 1: Doctor Identity & Names */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#0057b8] mb-3">
              1. Professional Identity & BMDC
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#080808] mb-1">
                  Doctor Full Name (English) *
                </label>
                <input
                  type="text"
                  required
                  value={nameEn}
                  onChange={(e) => setNameEn(e.target.value)}
                  placeholder="e.g. Prof. Dr. Farhana Ahmed"
                  className="w-full h-9 px-3 rounded-lg border border-[#a1a1a1] text-xs focus:ring-2 focus:ring-[#0057b8] focus:border-[#0057b8]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#080808] mb-1">
                  Doctor Full Name (Bangla)
                </label>
                <input
                  type="text"
                  value={nameBn}
                  onChange={(e) => setNameBn(e.target.value)}
                  placeholder="e.g. অধ্যাপক ডা. ফারহানা আহমেদ"
                  className="w-full h-9 px-3 rounded-lg border border-[#a1a1a1] text-xs focus:ring-2 focus:ring-[#0057b8] focus:border-[#0057b8]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#080808] mb-1">
                  BMDC Registration Number *
                </label>
                <input
                  type="text"
                  required
                  value={bmdcReg}
                  onChange={(e) => setBmdcReg(e.target.value)}
                  placeholder="BMDC-A-78291"
                  className="w-full h-9 px-3 rounded-lg border border-[#a1a1a1] text-xs font-mono focus:ring-2 focus:ring-[#0057b8] focus:border-[#0057b8]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#080808] mb-1">
                  Years of Clinical Experience
                </label>
                <input
                  type="number"
                  min={0}
                  max={70}
                  value={experienceYears}
                  onChange={(e) => setExperienceYears(Number(e.target.value))}
                  className="w-full h-9 px-3 rounded-lg border border-[#a1a1a1] text-xs focus:ring-2 focus:ring-[#0057b8] focus:border-[#0057b8]"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Department, Specialty & Branch Assignment */}
          <div className="pt-2 border-t border-[#e2e8f0]">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#0057b8] mb-3">
              2. Clinical Department & Chamber
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#080808] mb-1">
                  Clinical Department *
                </label>
                <select
                  required
                  value={departmentId}
                  onChange={(e) => setDepartmentId(e.target.value)}
                  className="w-full h-9 px-3 rounded-lg border border-[#a1a1a1] text-xs bg-white focus:ring-2 focus:ring-[#0057b8]"
                >
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.nameEn} ({d.nameBn})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#080808] mb-1">
                  Sub-Specialty *
                </label>
                <select
                  required
                  value={specialtyId}
                  onChange={(e) => setSpecialtyId(e.target.value)}
                  className="w-full h-9 px-3 rounded-lg border border-[#a1a1a1] text-xs bg-white focus:ring-2 focus:ring-[#0057b8]"
                >
                  {specialties.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.nameEn}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#080808] mb-1">
                  Primary Hospital Branch *
                </label>
                <select
                  required
                  value={branchId}
                  onChange={(e) => setBranchId(e.target.value)}
                  className="w-full h-9 px-3 rounded-lg border border-[#a1a1a1] text-xs bg-white focus:ring-2 focus:ring-[#0057b8]"
                >
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.nameEn}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#080808] mb-1">
                  Chamber / Room Number *
                </label>
                <input
                  type="text"
                  required
                  value={roomNumber}
                  onChange={(e) => setRoomNumber(e.target.value)}
                  placeholder="Room 302 (3rd Floor)"
                  className="w-full h-9 px-3 rounded-lg border border-[#a1a1a1] text-xs focus:ring-2 focus:ring-[#0057b8]"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Designation & Qualifications */}
          <div className="pt-2 border-t border-[#e2e8f0]">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#0057b8] mb-3">
              3. Designation & Academic Credentials
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#080808] mb-1">
                  Designation (EN)
                </label>
                <input
                  type="text"
                  required
                  value={designationEn}
                  onChange={(e) => setDesignationEn(e.target.value)}
                  className="w-full h-9 px-3 rounded-lg border border-[#a1a1a1] text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#080808] mb-1">
                  Designation (BN)
                </label>
                <input
                  type="text"
                  value={designationBn}
                  onChange={(e) => setDesignationBn(e.target.value)}
                  className="w-full h-9 px-3 rounded-lg border border-[#a1a1a1] text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#080808] mb-1">
                  Qualifications (EN) *
                </label>
                <input
                  type="text"
                  required
                  value={qualificationsEn}
                  onChange={(e) => setQualificationsEn(e.target.value)}
                  placeholder="MBBS, FCPS, FRCS"
                  className="w-full h-9 px-3 rounded-lg border border-[#a1a1a1] text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#080808] mb-1">
                  Qualifications (BN)
                </label>
                <input
                  type="text"
                  value={qualificationsBn}
                  onChange={(e) => setQualificationsBn(e.target.value)}
                  placeholder="এমবিবিএস, এফসিপিএস"
                  className="w-full h-9 px-3 rounded-lg border border-[#a1a1a1] text-xs"
                />
              </div>
            </div>
          </div>

          {/* Section 4: Fees & Publication Status */}
          <div className="pt-2 border-t border-[#e2e8f0]">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#0057b8] mb-3">
              4. Consultation Fees & Publication Status
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#080808] mb-1">
                  New Consultation Fee (BDT) *
                </label>
                <input
                  type="number"
                  min={0}
                  required
                  value={consultationFee}
                  onChange={(e) => {
                    const fee = Number(e.target.value);
                    setConsultationFee(fee);
                    setFollowupFee(Math.round(fee * 0.7));
                  }}
                  className="w-full h-9 px-3 rounded-lg border border-[#a1a1a1] text-xs font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#080808] mb-1">
                  Follow-up Fee (BDT) *
                </label>
                <input
                  type="number"
                  min={0}
                  required
                  value={followupFee}
                  onChange={(e) => setFollowupFee(Number(e.target.value))}
                  className="w-full h-9 px-3 rounded-lg border border-[#a1a1a1] text-xs font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#080808] mb-1">
                  Publication State *
                </label>
                <select
                  value={publicationState}
                  onChange={(e) => setPublicationState(e.target.value as PublicationState)}
                  className="w-full h-9 px-3 rounded-lg border border-[#a1a1a1] text-xs bg-white font-semibold"
                >
                  <option value="PUBLISHED">PUBLISHED (Visible to Patients)</option>
                  <option value="PENDING_APPROVAL">PENDING_APPROVAL (Requires Sign-off)</option>
                  <option value="DRAFT">DRAFT (Internal Preparation)</option>
                  <option value="ARCHIVED">ARCHIVED (Deactivated)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 5: Public Biography */}
          <div className="pt-2 border-t border-[#e2e8f0]">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#0057b8] mb-3">
              5. Clinical Biography
            </h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-[#080808] mb-1">
                  Bio (English) *
                </label>
                <textarea
                  required
                  rows={2}
                  value={bioEn}
                  onChange={(e) => setBioEn(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-[#a1a1a1] text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#080808] mb-1">
                  Bio (Bangla)
                </label>
                <textarea
                  rows={2}
                  value={bioBn}
                  onChange={(e) => setBioBn(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-[#a1a1a1] text-xs"
                />
              </div>
            </div>
          </div>

          {/* Modal Footer Controls */}
          <div className="pt-4 border-t border-[#d6d6d6] flex items-center justify-end gap-3 sticky bottom-0 bg-white">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 rounded-lg border border-[#757575] text-xs font-semibold text-[#080808] hover:bg-[#f2f2f2]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="mc-btn-primary !h-9 !text-xs !px-5"
            >
              {loading ? "Saving Specialist..." : mode === "CREATE" ? "Create Specialist Record" : "Save Specialist Updates"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

