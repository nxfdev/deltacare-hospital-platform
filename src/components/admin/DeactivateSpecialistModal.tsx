"use client";

import React, { useState } from "react";
import { AlertTriangle, CheckCircle2, X } from "lucide-react";
import { Doctor } from "@/types/domain";

interface DeactivateSpecialistModalProps {
  isOpen: boolean;
  doctor: Doctor | null;
  action: "DEACTIVATE" | "ACTIVATE";
  onClose: () => void;
  onSuccess: (updatedDoctor: Doctor) => void;
}

export function DeactivateSpecialistModal({
  isOpen,
  doctor,
  action,
  onClose,
  onSuccess,
}: DeactivateSpecialistModalProps) {
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen || !doctor) return null;

  const isDeactivating = action === "DEACTIVATE";

  const handleConfirm = async () => {
    setLoading(true);
    setErrorMessage(null);

    try {
      const res = await fetch("/api/v1/admin/doctors", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          doctorId: doctor.id,
          action,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        setErrorMessage(data.error || "Failed to update specialist status.");
        setLoading(false);
        return;
      }

      onSuccess(data.doctor);
      onClose();
    } catch {
      setErrorMessage("Network error: Could not reach specialist API.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="deactivate-modal-title"
    >
      <div className="relative w-full max-w-md bg-white rounded-2xl border border-[#d6d6d6] shadow-2xl p-6 space-y-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center ${
                isDeactivating ? "bg-[#fef2f2] text-[#dc2626]" : "bg-[#ecfdf5] text-[#059669]"
              }`}
            >
              {isDeactivating ? <AlertTriangle className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
            </div>
            <div>
              <h3 id="deactivate-modal-title" className="text-base font-bold text-[#080808]">
                {isDeactivating ? "Deactivate Specialist Record?" : "Re-activate Specialist Record?"}
              </h3>
              <p className="text-xs text-[#686868]">BMDC: {doctor.bmdcRegistrationNo}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-full flex items-center justify-center text-[#686868] hover:bg-[#f2f2f2]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="text-xs text-[#484848] space-y-2 bg-[#f8fafc] p-3.5 rounded-xl border border-[#e2e8f0]">
          <p>
            Specialist: <strong className="text-[#080808]">{doctor.nameEn}</strong> ({doctor.nameBn})
          </p>
          {isDeactivating ? (
            <p className="leading-relaxed">
              Deactivating will change publication state to <code className="font-bold text-[#991b1b]">ARCHIVED</code> and remove this physician from the public doctor directory and online appointment slot booking.
              <span className="block mt-1 text-[#0057b8] font-semibold">
                Historical records and existing booked appointments remain fully preserved.
              </span>
            </p>
          ) : (
            <p className="leading-relaxed">
              Activating will change publication state to <code className="font-bold text-[#065f46]">PUBLISHED</code>, immediately restoring this physician to the public website, search index, and slot availability.
            </p>
          )}
        </div>

        {errorMessage && (
          <div className="p-3 rounded-lg bg-[#fef2f2] border border-[#dc2626] text-xs text-[#991b1b]">
            {errorMessage}
          </div>
        )}

        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 rounded-lg border border-[#757575] text-xs font-semibold text-[#080808] hover:bg-[#f2f2f2]"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={loading}
            className={`px-4 py-2 rounded-lg text-xs font-bold text-white transition-colors ${
              isDeactivating
                ? "bg-[#dc2626] hover:bg-[#b91c1c]"
                : "bg-[#059669] hover:bg-[#047857]"
            }`}
          >
            {loading ? "Processing..." : isDeactivating ? "Confirm Deactivation" : "Confirm Activation"}
          </button>
        </div>
      </div>
    </div>
  );
}

