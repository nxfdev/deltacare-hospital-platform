"use client";

import React, { useState } from "react";
import Link from "next/link";
import { CheckCircle2, ArrowLeft } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/v1/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json();
      if (!res.ok && res.status === 429) {
        setError("Too many recovery attempts. Please try again later.");
        return;
      }
      setSubmitted(true);
    } catch {
      setError("Network error. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#f2f2f2] flex flex-col justify-center py-12 px-4">
      <div className="max-w-md w-full mx-auto space-y-6">
        <div className="bg-white rounded-2xl border border-[#d6d6d6] p-8 shadow-sm space-y-5">
          <Link
            href="/login"
            className="inline-flex items-center gap-1 text-xs font-bold text-[#004181] hover:underline"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Sign In</span>
          </Link>

          <h1 className="mc-serif text-2xl text-[#080808]">
            Reset Your Evercare Password
          </h1>

          {error && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700">
              {error}
            </div>
          )}

          {submitted ? (
            <div className="p-4 rounded-xl bg-[#ecfdf5] border border-[#059669] text-xs text-[#065f46] space-y-2">
              <div className="flex items-center gap-1.5 font-bold">
                <CheckCircle2 className="w-4 h-4" />
                <span>Password Reset Instructions Logged</span>
              </div>
              <p>
                If an active Evercare account matches <strong>{email}</strong>,
                a password recovery link has been queued via the Notification
                Adapter. For staff MFA/account unlocks, contact Super Admin or IT
                Desk at ext. 10666.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="fp-email"
                  className="block text-xs font-bold text-[#080808] mb-1"
                >
                  Registered Email Address *
                </label>
                <input
                  id="fp-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full h-11 px-3.5 rounded-lg border border-[#757575] text-sm"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="mc-btn-primary w-full disabled:opacity-50"
              >
                {loading ? "Sending..." : "Send Recovery Link"}
              </button>
            </form>
          )}
        </div>
      </div>
    </main>
  );
}

