"use client";

import React, { useState } from "react";
import {
  Calendar,
  Search,
  CheckCircle2,
  Clock,
  Phone,
  User,
  AlertCircle,
  MessageSquare,
  Stethoscope,
  Send,
  Plus,
  RefreshCw,
} from "lucide-react";
import { Appointment, Branch, Department, Doctor } from "@/types/domain";

interface ReceptionistViewProps {
  currentUser: {
    fullName: string;
    scopedBranchId?: string;
  };
  appointments: Appointment[];
  doctors: Doctor[];
  departments: Department[];
  branches: Branch[];
  activeTab?: ReceptionistTab;
  onTabChange?: (tab: ReceptionistTab) => void;
  onTransitionAppointment: (
    aptId: string,
    toStatus: Appointment["status"],
    reason: string,
    chamberNote?: string
  ) => Promise<void>;
  onSubmitFeedback: (data: {
    patientName: string;
    patientPhone: string;
    subject: string;
    message: string;
    type: "FEEDBACK" | "COMPLAINT" | "SUGGESTION";
  }) => Promise<void>;
}

export type ReceptionistTab = "today" | "appointments" | "schedules" | "register-feedback";

export function ReceptionistView({
  currentUser,
  appointments,
  doctors,
  departments,
  branches,
  activeTab: controlledTab,
  onTabChange,
  onTransitionAppointment,
  onSubmitFeedback,
}: ReceptionistViewProps) {
  const [internalTab, setInternalTab] = useState<ReceptionistTab>("today");
  const activeTab = controlledTab || internalTab;
  const setTab = (tab: ReceptionistTab) => {
    setInternalTab(tab);
    onTabChange?.(tab);
  };

  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [docFilter, setDocFilter] = useState("ALL");

  // Register feedback form state
  const [fbName, setFbName] = useState("");
  const [fbPhone, setFbPhone] = useState("");
  const [fbType, setFbType] = useState<"FEEDBACK" | "COMPLAINT" | "SUGGESTION">("FEEDBACK");
  const [fbSubject, setFbSubject] = useState("");
  const [fbMessage, setFbMessage] = useState("");
  const [fbSuccess, setFbSuccess] = useState(false);
  const [fbLoading, setFbLoading] = useState(false);

  // Filtered appointments
  const filteredAppointments = appointments.filter((apt) => {
    const matchesSearch =
      apt.reference.toLowerCase().includes(searchQuery.toLowerCase()) ||
      apt.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      apt.patientPhone.includes(searchQuery);
    const matchesStatus = statusFilter === "ALL" || apt.status === statusFilter;
    const matchesDoc = docFilter === "ALL" || apt.doctorId === docFilter;
    return matchesSearch && matchesStatus && matchesDoc;
  });

  // Today / Pending queue
  const pendingQueue = appointments.filter((a) => a.status === "REQUESTED");
  const confirmedToday = appointments.filter((a) => a.status === "CONFIRMED");

  const handleFeedbackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFbLoading(true);
    await onSubmitFeedback({
      patientName: fbName,
      patientPhone: fbPhone,
      subject: fbSubject,
      message: fbMessage,
      type: fbType,
    });
    setFbLoading(false);
    setFbSuccess(true);
    setFbName("");
    setFbPhone("");
    setFbSubject("");
    setFbMessage("");
    setTimeout(() => setFbSuccess(false), 4000);
  };

  return (
    <div className="space-y-6">
      {/* Sub-navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-[#d6d6d6] pb-3 overflow-x-auto">
        <button
          type="button"
          onClick={() => setTab("today")}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 ${
            activeTab === "today"
              ? "bg-[#0057b8] text-white shadow-sm"
              : "text-[#484848] hover:bg-[#e2e8f0]"
          }`}
        >
          <span>Today&apos;s Front Desk Queue</span>
          {pendingQueue.length > 0 && (
            <span className="px-1.5 py-0.2 rounded-full bg-[#dc2626] text-white text-[10px]">
              {pendingQueue.length}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setTab("appointments")}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors ${
            activeTab === "appointments"
              ? "bg-[#0057b8] text-white shadow-sm"
              : "text-[#484848] hover:bg-[#e2e8f0]"
          }`}
        >
          Search & Manage Appointments ({appointments.length})
        </button>

        <button
          type="button"
          onClick={() => setTab("schedules")}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 ${
            activeTab === "schedules"
              ? "bg-[#0057b8] text-white shadow-sm"
              : "text-[#484848] hover:bg-[#e2e8f0]"
          }`}
        >
          <Stethoscope className="w-3.5 h-3.5" />
          <span>Doctor Schedules (View-Only)</span>
        </button>

        <button
          type="button"
          onClick={() => setTab("register-feedback")}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 ${
            activeTab === "register-feedback"
              ? "bg-[#0057b8] text-white shadow-sm"
              : "text-[#484848] hover:bg-[#e2e8f0]"
          }`}
        >
          <MessageSquare className="w-3.5 h-3.5" />
          <span>Register Walk-in Feedback</span>
        </button>
      </div>

      {/* ====================================================================
          TAB 1: TODAY'S QUEUE & PENDING VERIFICATION
         ==================================================================== */}
      {activeTab === "today" && (
        <div className="space-y-6">
          {/* Quick Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div className="bg-white rounded-xl border border-[#d6d6d6] p-4 shadow-sm">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#dc2626]">
                Pending Phone Verification
              </span>
              <h3 className="text-2xl font-bold text-[#dc2626] mt-1">{pendingQueue.length}</h3>
              <p className="text-xs text-[#686868] mt-1">Requires front-desk confirmation</p>
            </div>

            <div className="bg-white rounded-xl border border-[#d6d6d6] p-4 shadow-sm">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#059669]">
                Confirmed Consultations
              </span>
              <h3 className="text-2xl font-bold text-[#059669] mt-1">{confirmedToday.length}</h3>
              <p className="text-xs text-[#686868] mt-1">Ready for patient check-in</p>
            </div>

            <div className="bg-white rounded-xl border border-[#d6d6d6] p-4 shadow-sm">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#0057b8]">
                Assigned Desk Campus
              </span>
              <h3 className="text-base font-bold text-[#080808] mt-1">
                {currentUser.scopedBranchId ? "Dhanmondi Main Desk" : "All Branch Desks"}
              </h3>
              <p className="text-xs text-[#686868] mt-1">Operator: {currentUser.fullName}</p>
            </div>
          </div>

          {/* Rapid Walk-in Lookup Box */}
          <div className="p-4 rounded-xl bg-[#e8f0f9] border border-[#0057b8] flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs text-[#004181] font-semibold">
              <Search className="w-4 h-4 text-[#0057b8] shrink-0" />
              <span>Patient at Counter? Search reference code (e.g. DC-2026-1041) or phone number:</span>
            </div>
            <div className="relative w-full sm:w-72">
              <input
                type="text"
                placeholder="Type reference or phone..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setTab("appointments");
                }}
                className="w-full h-8 pl-3 pr-8 rounded-lg border border-[#0057b8] text-xs bg-white focus:outline-none"
              />
            </div>
          </div>

          {/* Pending Queue List */}
          <div className="bg-white rounded-2xl border border-[#d6d6d6] p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#d6d6d6] pb-3">
              <div>
                <h3 className="text-base font-bold text-[#080808]">
                  Pending Online Requests Awaiting Verification ({pendingQueue.length})
                </h3>
                <p className="text-xs text-[#686868]">
                  Call the patient, verify preferred time slot, and confirm slot allocation with chamber receptionist.
                </p>
              </div>
            </div>

            <div className="divide-y divide-[#d6d6d6]">
              {pendingQueue.length === 0 ? (
                <div className="py-8 text-center text-[#059669] text-xs font-semibold flex flex-col items-center gap-1.5">
                  <CheckCircle2 className="w-6 h-6 text-[#059669]" />
                  <span>All online requests have been verified and processed!</span>
                </div>
              ) : (
                pendingQueue.map((apt) => {
                  const doc = doctors.find((d) => d.id === apt.doctorId);
                  return (
                    <div key={apt.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-[#0057b8] text-sm">{apt.reference}</span>
                          <span className="px-2 py-0.5 rounded-full font-bold text-[10px] bg-[#fef3c7] text-[#92400e]">
                            {apt.status}
                          </span>
                        </div>
                        <div className="text-sm font-semibold text-[#080808] mt-1">
                          {apt.patientName} • <span className="font-mono text-[#004181]">{apt.patientPhone}</span>
                        </div>
                        <div className="text-[#484848] mt-0.5">
                          Doctor: <strong>{doc?.nameEn}</strong> • Preferred Date: {apt.preferredDate} ({apt.preferredTimeSlot || "Evening"})
                        </div>
                        {apt.reasonNote && (
                          <p className="text-[#686868] mt-1 italic">&quot;{apt.reasonNote}&quot;</p>
                        )}
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => {
                            const chamber = prompt("Confirm chamber slot note:", "Chamber Room 302, 3rd Floor");
                            onTransitionAppointment(
                              apt.id,
                              "CONFIRMED",
                              "Front-desk phone verification completed",
                              chamber || "Verified Chamber Slot"
                            );
                          }}
                          className="px-3.5 py-1.5 rounded-lg bg-[#059669] text-white font-bold hover:bg-[#047857]"
                        >
                          Confirm &amp; Allocate
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const reason = prompt("Enter cancellation/decline reason:");
                            if (reason) onTransitionAppointment(apt.id, "CANCELLED", reason);
                          }}
                          className="px-3 py-1.5 rounded-lg border border-[#dc2626] text-[#dc2626] font-semibold hover:bg-[#fef2f2]"
                        >
                          Decline
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* ====================================================================
          TAB 2: SEARCH & MANAGE APPOINTMENTS
         ==================================================================== */}
      {activeTab === "appointments" && (
        <div className="bg-white rounded-2xl border border-[#d6d6d6] p-6 space-y-5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#d6d6d6]">
            <div>
              <h3 className="text-base font-bold text-[#080808]">
                Appointment Lookup &amp; Status Management ({filteredAppointments.length})
              </h3>
              <p className="text-xs text-[#686868]">
                Instant walk-in patient lookup, attendance check-in, rescheduling, and cancellation.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-[#686868] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Reference, patient name, phone..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-8 pl-8 pr-3 rounded-lg border border-[#a1a1a1] text-xs w-60"
                />
              </div>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="h-8 px-2.5 rounded-lg border border-[#a1a1a1] text-xs bg-white font-semibold"
              >
                <option value="ALL">All Statuses</option>
                <option value="REQUESTED">REQUESTED</option>
                <option value="CONFIRMED">CONFIRMED</option>
                <option value="CANCELLED">CANCELLED</option>
                <option value="COMPLETED">COMPLETED</option>
              </select>

              <select
                value={docFilter}
                onChange={(e) => setDocFilter(e.target.value)}
                className="h-8 px-2.5 rounded-lg border border-[#a1a1a1] text-xs bg-white font-semibold"
              >
                <option value="ALL">All Doctors</option>
                {doctors.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.nameEn}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="divide-y divide-[#d6d6d6]">
            {filteredAppointments.length === 0 ? (
              <div className="py-8 text-center text-[#686868] text-xs">
                No appointments match your search criteria.
              </div>
            ) : (
              filteredAppointments.map((apt) => {
                const doc = doctors.find((d) => d.id === apt.doctorId);
                return (
                  <div key={apt.id} className="py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-[#0057b8] text-sm">{apt.reference}</span>
                        <span
                          className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                            apt.status === "CONFIRMED"
                              ? "bg-[#ecfdf5] text-[#065f46]"
                              : apt.status === "REQUESTED"
                              ? "bg-[#fef3c7] text-[#92400e]"
                              : "bg-[#fef2f2] text-[#991b1b]"
                          }`}
                        >
                          {apt.status}
                        </span>
                      </div>
                      <div className="font-bold text-[#080808] mt-1">
                        {apt.patientName} • <span className="font-mono text-[#004181]">{apt.patientPhone}</span>
                      </div>
                      <div className="text-[#484848]">
                        Physician: <strong>{doc?.nameEn}</strong> • Date: {apt.preferredDate} ({apt.preferredTimeSlot || "Evening"})
                      </div>
                      {apt.staffNotes && (
                        <p className="text-[11px] text-[#059669] italic mt-0.5">Note: {apt.staffNotes}</p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {apt.status === "REQUESTED" && (
                        <button
                          type="button"
                          onClick={() =>
                            onTransitionAppointment(
                              apt.id,
                              "CONFIRMED",
                              "Front-desk verified by phone",
                              "Confirmed for Room 302"
                            )
                          }
                          className="px-3 py-1.5 rounded-lg bg-[#059669] text-white font-bold hover:bg-[#047857]"
                        >
                          Confirm
                        </button>
                      )}

                      {apt.status === "CONFIRMED" && (
                        <button
                          type="button"
                          onClick={() =>
                            onTransitionAppointment(apt.id, "COMPLETED", "Patient completed consultation check-out")
                          }
                          className="px-3 py-1.5 rounded-lg border border-[#0057b8] text-[#0057b8] font-bold hover:bg-[#e8f0f9]"
                        >
                          Mark Completed
                        </button>
                      )}

                      {apt.status !== "CANCELLED" && apt.status !== "COMPLETED" && (
                        <button
                          type="button"
                          onClick={() => {
                            const newDate = prompt("Enter rescheduled date (YYYY-MM-DD):", apt.preferredDate);
                            if (newDate) {
                              onTransitionAppointment(apt.id, "CONFIRMED", `Rescheduled to ${newDate}`);
                            }
                          }}
                          className="px-3 py-1.5 rounded-lg border border-[#757575] text-[#080808] hover:bg-[#f2f2f2]"
                        >
                          Reschedule
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* ====================================================================
          TAB 3: DOCTOR AVAILABILITY & SCHEDULES (VIEW-ONLY)
         ==================================================================== */}
      {activeTab === "schedules" && (
        <div className="bg-white rounded-2xl border border-[#d6d6d6] p-6 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#d6d6d6]">
            <div>
              <h3 className="text-base font-bold text-[#080808]">
                Physician Duty Schedules &amp; Consultation Chambers (View-Only)
              </h3>
              <p className="text-xs text-[#686868]">
                Front-desk reference for doctor consulting days, room numbers, and fees. Operational modifications require Hospital Admin authorization.
              </p>
            </div>
          </div>

          <div className="divide-y divide-[#d6d6d6]">
            {doctors.map((doc) => {
              const dept = departments.find((d) => d.id === doc.departmentId);
              const branchInfo = doc.branches?.[0];
              const branchObj = branches.find((b) => b.id === branchInfo?.branchId);

              return (
                <div key={doc.id} className="py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs">
                  <div>
                    <div className="flex items-center gap-2">
                      <strong className="text-sm text-[#080808]">{doc.nameEn}</strong>
                      <span className="text-[#686868]">({doc.nameBn})</span>
                      <span className="font-mono text-[#004181] font-semibold">{doc.bmdcRegistrationNo}</span>
                    </div>
                    <div className="text-[#484848] mt-1">
                      Department: <strong>{dept?.nameEn}</strong> • Campus: {branchObj?.nameEn || "Hospital Main"}
                    </div>
                    <div className="text-[#0057b8] font-semibold mt-0.5">
                      Chamber: {branchInfo?.roomNumber || "Chamber 302"} • Standard Fee: BDT {doc.consultationFeeBdt}
                    </div>
                  </div>

                  <div className="shrink-0 text-right">
                    <span className="px-2.5 py-1 rounded bg-[#ecfdf5] text-[#065f46] font-bold text-[11px]">
                      {doc.publicationState}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ====================================================================
          TAB 4: REGISTER WALK-IN FEEDBACK OR CALLBACK
         ==================================================================== */}
      {activeTab === "register-feedback" && (
        <div className="bg-white rounded-2xl border border-[#d6d6d6] p-6 space-y-5 max-w-2xl">
          <div>
            <h3 className="text-base font-bold text-[#080808]">Register Patient Feedback or Callback Request</h3>
            <p className="text-xs text-[#686868]">
              Record front-desk walk-in comments, complaints, or service requests. Triage is routed directly to Hospital Administration.
            </p>
          </div>

          {fbSuccess && (
            <div className="p-3.5 rounded-xl bg-[#ecfdf5] border border-[#059669] text-xs text-[#065f46] flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#059669]" />
              <span>Feedback submitted successfully and forwarded to Hospital Admin triage.</span>
            </div>
          )}

          <form onSubmit={handleFeedbackSubmit} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold mb-1">Patient Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rafiqul Islam"
                  value={fbName}
                  onChange={(e) => setFbName(e.target.value)}
                  className="w-full h-9 px-3 rounded-lg border border-[#a1a1a1]"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Patient Phone *</label>
                <input
                  type="text"
                  required
                  placeholder="017XXXXXXXX"
                  value={fbPhone}
                  onChange={(e) => setFbPhone(e.target.value)}
                  className="w-full h-9 px-3 rounded-lg border border-[#a1a1a1]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold mb-1">Category Type *</label>
                <select
                  value={fbType}
                  onChange={(e) => setFbType(e.target.value as "FEEDBACK" | "COMPLAINT" | "SUGGESTION")}
                  className="w-full h-9 px-3 rounded-lg border border-[#a1a1a1] bg-white font-semibold"
                >
                  <option value="FEEDBACK">Patient Feedback</option>
                  <option value="COMPLAINT">Service Complaint</option>
                  <option value="SUGGESTION">General Suggestion</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold mb-1">Subject / Summary *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Chamber wait time enquiry"
                  value={fbSubject}
                  onChange={(e) => setFbSubject(e.target.value)}
                  className="w-full h-9 px-3 rounded-lg border border-[#a1a1a1]"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold mb-1">Details &amp; Patient Remarks *</label>
              <textarea
                required
                rows={3}
                placeholder="Enter patient remarks or details..."
                value={fbMessage}
                onChange={(e) => setFbMessage(e.target.value)}
                className="w-full p-2.5 rounded-lg border border-[#a1a1a1]"
              />
            </div>

            <button
              type="submit"
              disabled={fbLoading}
              className="mc-btn-primary !h-9 !text-xs !px-5 inline-flex items-center gap-1.5"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{fbLoading ? "Submitting..." : "Forward to Hospital Admin"}</span>
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
