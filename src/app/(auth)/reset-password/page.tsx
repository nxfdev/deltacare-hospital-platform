"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, ArrowLeft, Lock } from "lucide-react";

function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      setError("Missing or invalid password reset token.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/v1/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword: password }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setError(data.error || "Unable to reset password.");
        return;
      }
      setSuccess(true);
    } catch {
      setError("Network error. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-[#d6d6d6] p-8 shadow-sm space-y-5">
      <Link
        href="/login"
        className="inline-flex items-center gap-1 text-xs font-bold text-[#004181] hover:underline"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Back to Sign In</span>
      </Link>

      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-full bg-[#e8f0f9] flex items-center justify-center text-[#0057b8]">
          <Lock className="w-4 h-4" />
        </div>
        <h1 className="mc-serif text-2xl text-[#080808]">Set New Password</h1>
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700">
          {error}
        </div>
      )}

      {success ? (
        <div className="p-4 rounded-xl bg-[#ecfdf5] border border-[#059669] text-xs text-[#065f46] space-y-3">
          <div className="flex items-center gap-1.5 font-bold">
            <CheckCircle2 className="w-4 h-4" />
            <span>Password Reset Completed</span>
          </div>
          <p>
            Your DeltaCare password has been securely updated and all previous
            sessions have been invalidated.
          </p>
          <Link
            href="/login"
            className="mc-btn-primary inline-flex text-center justify-center w-full !text-xs !py-2.5"
          >
            Sign In with New Password
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="rp-password"
              className="block text-xs font-bold text-[#080808] mb-1"
            >
              New Secure Password (min 6 characters) *
            </label>
            <input
              id="rp-password"
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full h-11 px-3.5 rounded-lg border border-[#757575] text-sm"
            />
          </div>

          <div>
            <label
              htmlFor="rp-confirm"
              className="block text-xs font-bold text-[#080808] mb-1"
            >
              Confirm New Password *
            </label>
            <input
              id="rp-confirm"
              type="password"
              required
              minLength={6}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full h-11 px-3.5 rounded-lg border border-[#757575] text-sm"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mc-btn-primary w-full disabled:opacity-50"
          >
            {loading ? "Updating Password..." : "Set New Password"}
          </button>
        </form>
      )}
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <main className="min-h-screen bg-[#f2f2f2] flex flex-col justify-center py-12 px-4">
      <div className="max-w-md w-full mx-auto space-y-6">
        <Suspense fallback={<div className="p-8 text-center text-sm text-gray-500">Loading...</div>}>
          <ResetPasswordContent />
        </Suspense>
      </div>
    </main>
  );
}

