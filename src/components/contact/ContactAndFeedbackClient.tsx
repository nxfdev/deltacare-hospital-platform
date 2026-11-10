"use client";

import React, { useState } from "react";
import {
  PhoneCall,
  MessageSquare,
  CheckCircle2,
  AlertCircle,
  Lock,
} from "lucide-react";
import { Branch, Department } from "@/types/domain";
import { useLocale } from "@/lib/i18n/LocaleContext";

export function ContactAndFeedbackClient({
  branches,
  departments,
}: {
  branches: Branch[];
  departments: Department[];
}) {
  const { locale } = useLocale();

  // Contact / Callback Form State
  const [cbName, setCbName] = useState("");
  const [cbPhone, setCbPhone] = useState("");
  const [cbEmail, setCbEmail] = useState("");
  const [cbBranchId, setCbBranchId] = useState(branches[0]?.id ?? "");
  const [cbDeptId, setCbDeptId] = useState(departments[0]?.id ?? "");
  const [cbTime, setCbTime] = useState("Morning (09:00–12:00)");
  const [cbMessage, setCbMessage] = useState("");
  const [cbConsent, setCbConsent] = useState(false);
  const [cbResultRef, setCbResultRef] = useState<string | null>(null);
  const [cbError, setCbError] = useState<string | null>(null);
  const [cbLoading, setCbLoading] = useState(false);

  // Private Feedback / Complaint Form State
  const [fbType, setFbType] = useState<"FEEDBACK" | "COMPLAINT" | "SUGGESTION">(
    "FEEDBACK"
  );
  const [fbCategory, setFbCategory] = useState<
    | "WAIT_TIME"
    | "BILLING_FEE"
    | "STAFF_CONDUCT"
    | "FACILITY"
    | "APPOINTMENT"
    | "GENERAL"
  >("GENERAL");
  const [fbBranchId, setFbBranchId] = useState(branches[0]?.id ?? "");
  const [fbName, setFbName] = useState("");
  const [fbPhone, setFbPhone] = useState("");
  const [fbSubject, setFbSubject] = useState("");
  const [fbMessage, setFbMessage] = useState("");
  const [fbConsent, setFbConsent] = useState(false);
  const [fbResultRef, setFbResultRef] = useState<string | null>(null);
  const [fbError, setFbError] = useState<string | null>(null);
  const [fbLoading, setFbLoading] = useState(false);

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCbError(null);
    setCbLoading(true);
    try {
      const res = await fetch("/api/v1/public/contact-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: cbName,
          phone: cbPhone,
          email: cbEmail,
          branchId: cbBranchId,
          departmentId: cbDeptId,
          preferredCallTime: cbTime,
          message: cbMessage,
          consentAccepted: cbConsent,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setCbError(data.error || "Please check your callback request details.");
      } else {
        setCbResultRef(data.contactRequest.reference);
      }
    } catch {
      setCbError("Network error submitting callback request.");
    } finally {
      setCbLoading(false);
    }
  };

  const handleFeedbackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFbError(null);
    setFbLoading(true);
    try {
      const res = await fetch("/api/v1/public/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: fbType,
          category: fbCategory,
          branchId: fbBranchId,
          patientName: fbName,
          patientPhone: fbPhone,
          subject: fbSubject,
          message: fbMessage,
          consentAccepted: fbConsent,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setFbError(data.error || "Please check your feedback fields.");
      } else {
        setFbResultRef(data.feedback.reference);
      }
    } catch {
      setFbError("Network error submitting feedback.");
    } finally {
      setFbLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Full-bleed Stretched Blue Hero Header */}
      <div className="w-full bg-[#012d61] text-white py-14 md:py-20 border-b border-[#001f44]">
        <div className="mc-container max-w-7xl mx-auto px-6 sm:px-10 lg:px-12 space-y-4">
          <p className="text-xs sm:text-sm font-bold uppercase tracking-widest text-[#93c5fd]">
            Care at Evercare • Patient Communications &amp; Relations
          </p>
          <h1 className="mc-serif text-3xl sm:text-5xl lg:text-[54px] font-bold text-white tracking-tight leading-tight">
            {locale === "bn"
              ? "যোগাযোগ, কলব্যাক ও মতামত"
              : "Contact Us & Patient Relations"}
          </h1>
          <p className="text-xl text-[#c5e2f9] font-medium">
            ২৪/৭ পেশেন্ট ডেস্ক ও সরাসরি সহায়তা
          </p>
          <p className="text-base sm:text-lg text-[#e8f0f9] max-w-3xl leading-relaxed">
            {locale === "bn"
              ? "আমাদের পেশেন্ট ডেস্কের সাথে যোগাযোগ করুন, কলব্যাক অনুরোধ জমা দিন অথবা অভ্যন্তরীণ পর্যালোচনার জন্য গোপনীয় মতামত/অভিযোগ নিবন্ধন করুন।"
              : "Request a staff callback from our Patient Desk or submit a confidential service feedback/complaint record for internal Patient Relations review."}
          </p>
        </div>
      </div>

      {/* Main Body - Unboxed 2-Column Editorial Forms */}
      <div className="w-full py-12 md:py-16">
        <div className="mc-container max-w-7xl mx-auto px-6 sm:px-10 lg:px-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-start">
            {/* Left: Callback & Enquiry Form */}
            <div className="space-y-6 pb-12 lg:pb-0 lg:pr-8 lg:border-r border-[#e5e7eb]">
              <div className="space-y-2">
                <div className="flex items-center gap-2.5">
                  <PhoneCall className="w-6 h-6 text-[#0057b8]" />
                  <h2 className="mc-serif text-2xl md:text-3xl text-[#080808]">
                    {locale === "bn"
                      ? "কলব্যাক ও তথ্য অনুসন্ধান ফর্ম"
                      : "Request a Staff Callback"}
                  </h2>
                </div>
                <p className="text-sm text-[#4b5563]">
                  Leave your contact details and our team will reach out at your preferred time.
                </p>
              </div>

            {cbResultRef ? (
              <div className="p-5 rounded-xl bg-[#ecfdf5] border border-[#059669] text-[#065f46] space-y-2">
                <div className="flex items-center gap-2 font-bold">
                  <CheckCircle2 className="w-5 h-5" />
                  <span>Callback Request Logged: {cbResultRef}</span>
                </div>
                <p className="text-xs">
                  Our Patient Desk team has received your enquiry and will call
                  you at {cbPhone} during your preferred window.
                </p>
                <button
                  type="button"
                  onClick={() => setCbResultRef(null)}
                  className="text-xs font-bold underline"
                >
                  Submit another enquiry
                </button>
              </div>
            ) : (
              <form onSubmit={handleContactSubmit} className="space-y-4">
                {cbError && (
                  <div className="p-3 rounded-lg bg-[#fef2f2] border border-[#dc2626] text-xs text-[#7f1d1d] flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{cbError}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="cb-name"
                      className="block text-xs font-bold text-[#080808] mb-1"
                    >
                      Full Name *
                    </label>
                    <input
                      id="cb-name"
                      type="text"
                      required
                      value={cbName}
                      onChange={(e) => setCbName(e.target.value)}
                      placeholder="Your full name"
                      className="w-full h-11 px-3 rounded-lg border border-[#757575] text-sm"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="cb-phone"
                      className="block text-xs font-bold text-[#080808] mb-1"
                    >
                      Bangladesh Mobile *
                    </label>
                    <input
                      id="cb-phone"
                      type="tel"
                      required
                      value={cbPhone}
                      onChange={(e) => setCbPhone(e.target.value)}
                      placeholder="01711223344"
                      className="w-full h-11 px-3 rounded-lg border border-[#757575] text-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="cb-branch"
                      className="block text-xs font-bold text-[#080808] mb-1"
                    >
                      Hospital Branch
                    </label>
                    <select
                      id="cb-branch"
                      value={cbBranchId}
                      onChange={(e) => setCbBranchId(e.target.value)}
                      className="w-full h-11 px-3 rounded-lg border border-[#757575] text-sm bg-white"
                    >
                      {branches.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.nameEn}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label
                      htmlFor="cb-time"
                      className="block text-xs font-bold text-[#080808] mb-1"
                    >
                      Preferred Callback Window
                    </label>
                    <input
                      id="cb-time"
                      type="text"
                      value={cbTime}
                      onChange={(e) => setCbTime(e.target.value)}
                      className="w-full h-11 px-3 rounded-lg border border-[#757575] text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="cb-msg"
                    className="block text-xs font-bold text-[#080808] mb-1"
                  >
                    Enquiry Details *
                  </label>
                  <textarea
                    id="cb-msg"
                    rows={3}
                    required
                    value={cbMessage}
                    onChange={(e) => setCbMessage(e.target.value)}
                    placeholder="How can our Patient Desk assist you?"
                    className="w-full p-3 rounded-lg border border-[#757575] text-sm"
                  />
                </div>

                <label className="flex items-start gap-2 text-xs text-[#424242] cursor-pointer">
                  <input
                    type="checkbox"
                    required
                    checked={cbConsent}
                    onChange={(e) => setCbConsent(e.target.checked)}
                    className="mt-0.5 accent-[#0057b8]"
                  />
                  <span>
                    I consent to Evercare contacting me regarding this enquiry
                    in accordance with the Privacy Policy.
                  </span>
                </label>

                <button
                  type="submit"
                  disabled={cbLoading}
                  className="mc-btn-primary w-full"
                >
                  {cbLoading ? "Submitting..." : "Submit Callback Request"}
                </button>
              </form>
            )}
          </div>

          {/* Right: Private Feedback & Complaint Submission (FR-FB-01..06) */}
          <div
            id="feedback-form"
            className="space-y-6"
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <MessageSquare className="w-6 h-6 text-[#0057b8]" />
                <h2 className="mc-serif text-2xl text-[#080808]">
                  {locale === "bn"
                    ? "গোপনীয় মতামত ও অভিযোগ (অভ্যন্তরীণ)"
                    : "Private Feedback & Complaint Desk"}
                </h2>
              </div>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#e8f0f9] text-[#004181] text-[11px] font-bold">
                <Lock className="w-3 h-3" />
                Confidential
              </span>
            </div>

            <p className="text-xs text-[#686868]">
              Submissions are strictly private and routed directly to Evercare
              Patient Relations and Department Managers. They are never
              published as public website reviews.
            </p>

            {fbResultRef ? (
              <div className="p-5 rounded-xl bg-[#ecfdf5] border border-[#059669] text-[#065f46] space-y-2">
                <div className="flex items-center gap-2 font-bold">
                  <CheckCircle2 className="w-5 h-5" />
                  <span>Private Case Reference: {fbResultRef}</span>
                </div>
                <p className="text-xs">
                  Thank you. Your submission has been privately logged and
                  routed to our internal Patient Relations review queue.
                </p>
                <button
                  type="button"
                  onClick={() => setFbResultRef(null)}
                  className="text-xs font-bold underline"
                >
                  Submit another feedback record
                </button>
              </div>
            ) : (
              <form onSubmit={handleFeedbackSubmit} className="space-y-4">
                {fbError && (
                  <div className="p-3 rounded-lg bg-[#fef2f2] border border-[#dc2626] text-xs text-[#7f1d1d] flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{fbError}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="fb-type"
                      className="block text-xs font-bold text-[#080808] mb-1"
                    >
                      Submission Type *
                    </label>
                    <select
                      id="fb-type"
                      value={fbType}
                      onChange={(e) =>
                        setFbType(
                          e.target.value as
                            | "FEEDBACK"
                            | "COMPLAINT"
                            | "SUGGESTION"
                        )
                      }
                      className="w-full h-11 px-3 rounded-lg border border-[#757575] text-sm bg-white"
                    >
                      <option value="FEEDBACK">Feedback</option>
                      <option value="COMPLAINT">Service Complaint</option>
                      <option value="SUGGESTION">Improvement Suggestion</option>
                    </select>
                  </div>

                  <div>
                    <label
                      htmlFor="fb-cat"
                      className="block text-xs font-bold text-[#080808] mb-1"
                    >
                      Category *
                    </label>
                    <select
                      id="fb-cat"
                      value={fbCategory}
                      onChange={(e) =>
                        setFbCategory(
                          e.target.value as typeof fbCategory
                        )
                      }
                      className="w-full h-11 px-3 rounded-lg border border-[#757575] text-sm bg-white"
                    >
                      <option value="WAIT_TIME">OPD Wait Time</option>
                      <option value="BILLING_FEE">Billing & Fee Clarity</option>
                      <option value="STAFF_CONDUCT">Staff Conduct</option>
                      <option value="FACILITY">Facility & Cleanliness</option>
                      <option value="APPOINTMENT">Appointment Scheduling</option>
                      <option value="GENERAL">General Experience</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="fb-name"
                      className="block text-xs font-bold text-[#080808] mb-1"
                    >
                      Your Name (Optional)
                    </label>
                    <input
                      id="fb-name"
                      type="text"
                      value={fbName}
                      onChange={(e) => setFbName(e.target.value)}
                      placeholder="Leave blank for anonymous"
                      className="w-full h-11 px-3 rounded-lg border border-[#757575] text-sm"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="fb-phone"
                      className="block text-xs font-bold text-[#080808] mb-1"
                    >
                      Phone for Follow-up (Optional)
                    </label>
                    <input
                      id="fb-phone"
                      type="tel"
                      value={fbPhone}
                      onChange={(e) => setFbPhone(e.target.value)}
                      placeholder="01711223344"
                      className="w-full h-11 px-3 rounded-lg border border-[#757575] text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="fb-subject"
                    className="block text-xs font-bold text-[#080808] mb-1"
                  >
                    Subject Summary *
                  </label>
                  <input
                    id="fb-subject"
                    type="text"
                    required
                    value={fbSubject}
                    onChange={(e) => setFbSubject(e.target.value)}
                    placeholder="Brief summary of your feedback or complaint"
                    className="w-full h-11 px-3 rounded-lg border border-[#757575] text-sm"
                  />
                </div>

                <div>
                  <label
                    htmlFor="fb-msg"
                    className="block text-xs font-bold text-[#080808] mb-1"
                  >
                    Detailed Description *
                  </label>
                  <textarea
                    id="fb-msg"
                    rows={3}
                    required
                    value={fbMessage}
                    onChange={(e) => setFbMessage(e.target.value)}
                    placeholder="Describe the date, branch, and details so our team can investigate..."
                    className="w-full p-3 rounded-lg border border-[#757575] text-sm"
                  />
                </div>

                <label className="flex items-start gap-2 text-xs text-[#424242] cursor-pointer">
                  <input
                    type="checkbox"
                    required
                    checked={fbConsent}
                    onChange={(e) => setFbConsent(e.target.checked)}
                    className="mt-0.5 accent-[#0057b8]"
                  />
                  <span>
                    I understand this record is stored confidentially for
                    internal quality review and agrees with the Privacy Notice.
                  </span>
                </label>

                <button
                  type="submit"
                  disabled={fbLoading}
                  className="mc-btn-secondary w-full"
                >
                  {fbLoading
                    ? "Submitting Confidentially..."
                    : "Submit Private Feedback / Complaint"}
                </button>
              </form>
            )}
          </div>
          </div>
        </div>
      </div>
    </div>
  );
}

