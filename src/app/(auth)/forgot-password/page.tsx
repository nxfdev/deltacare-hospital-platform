"use client";

import React, { useState } from "react";
import Link from "next/link";
import { CheckCircle2, ArrowLeft } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

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
            Reset Your DeltaCare Password
          </h1>

          {submitted ? (
            <div className="p-4 rounded-xl bg-[#ecfdf5] border border-[#059669] text-xs text-[#065f46] space-y-2">
              <div className="flex items-center gap-1.5 font-bold">
                <CheckCircle2 className="w-4 h-4" />
                <span>Password Reset Instructions Logged</span>
              </div>
              <p>
                If an active DeltaCare account matches <strong>{email}</strong>,
                a password recovery link has been queued via the Notification
                Adapter. For staff MFA/account unlocks, contact Super Admin or IT
                Desk at ext. 10678.
              </p>
            </div>
          ) : (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                setSubmitted(true);
              }}
              className="space-y-4"
            >
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
              <button type="submit" className="mc-btn-primary w-full">
                Send Recovery Link
              </button>
            </form>
          )}
        </div>
      </div>
    </main>
  );
}

