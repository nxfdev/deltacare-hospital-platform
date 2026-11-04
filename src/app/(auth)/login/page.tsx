"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Lock, AlertCircle, ShieldCheck, ArrowRight } from "lucide-react";
import { STAFF_ROLES } from "@/lib/auth/roles";

const DEMO_ACCOUNTS = [
  {
    label: "Super Admin",
    email: "superadmin@deltacare.bd",
    password: "DeltaCare#2026",
    role: "SUPER_ADMIN",
  },
  {
    label: "Hospital Admin (Approver)",
    email: "admin@deltacare.bd",
    password: "DeltaCare#2026",
    role: "HOSPITAL_ADMIN",
  },
  {
    label: "Receptionist / Front-Desk",
    email: "frontdesk@deltacare.bd",
    password: "DeltaCare#2026",
    role: "RECEPTIONIST",
  },
  {
    label: "Content Editor (CMS)",
    email: "editor@deltacare.bd",
    password: "DeltaCare#2026",
    role: "CONTENT_EDITOR",
  },
  {
    label: "Patient Account",
    email: "patient@deltacare.bd",
    password: "DeltaCare#2026",
    role: "PATIENT",
  },
];

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("admin@deltacare.bd");
  const [password, setPassword] = useState("DeltaCare#2026");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);
    try {
      const res = await fetch("/api/v1/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setErrorMsg(data.error || "Sign-in failed.");
      } else {
        const isStaff = STAFF_ROLES.includes(data.user.role);
        let redirectTarget = isStaff ? "/admin" : "/dashboard";
        if (typeof window !== "undefined") {
          const params = new URLSearchParams(window.location.search);
          const redirectParam = params.get("redirect");
          if (redirectParam && redirectParam.startsWith("/")) {
            redirectTarget = redirectParam;
          }
        }
        router.push(redirectTarget);
        router.refresh();
      }
    } catch {
      setErrorMsg("Network error signing in.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#f2f2f2] flex flex-col justify-center py-12 px-4">
      <div className="max-w-md w-full mx-auto space-y-6">
        <div className="text-center space-y-2">
          <Link href="/" className="inline-block">
            <img
              src="/images/deltacare-logo.svg"
              alt="DeltaCare Home"
              className="h-12 w-auto mx-auto"
            />
          </Link>
          <h1 className="mc-serif text-3xl text-[#080808]">
            Sign in to DeltaCare
          </h1>
          <p className="text-sm text-[#686868]">
            Access the Patient Portal or DeltaCare Admin Operations Console
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-[#d6d6d6] p-6 md:p-8 shadow-sm space-y-5">
          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-[#fef2f2] border border-[#dc2626] text-xs text-[#7f1d1d] flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="login-email"
                className="block text-xs font-bold text-[#080808] mb-1.5"
              >
                Email Address
              </label>
              <input
                id="login-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full h-11 px-3.5 rounded-lg border border-[#757575] text-sm"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor="login-password"
                  className="text-xs font-bold text-[#080808]"
                >
                  Password
                </label>
                <Link
                  href="/forgot-password"
                  className="text-xs font-semibold text-[#004181] hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
              <input
                id="login-password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full h-11 px-3.5 rounded-lg border border-[#757575] text-sm"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mc-btn-primary w-full"
            >
              <Lock className="w-4 h-4" />
              <span>{loading ? "Signing in..." : "Sign In"}</span>
            </button>
          </form>

          {/* One-Click Demo Role Switcher for Verification */}
          <div className="pt-4 border-t border-[#d6d6d6] space-y-2.5">
            <p className="text-xs font-bold text-[#004181] flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-[#0057b8]" />
              <span>Synthetic Demo Credentials (Click to autofill):</span>
            </p>
            <div className="grid grid-cols-1 gap-1.5">
              {DEMO_ACCOUNTS.map((acc) => (
                <button
                  key={acc.email}
                  type="button"
                  onClick={() => {
                    setEmail(acc.email);
                    setPassword(acc.password);
                  }}
                  className="text-left px-3 py-2 rounded-lg border border-[#d6d6d6] hover:border-[#0057b8] hover:bg-[#e8f0f9] text-xs flex items-center justify-between transition-colors"
                >
                  <span>
                    <strong>{acc.label}</strong> ({acc.email})
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 text-[#0057b8]" />
                </button>
              ))}
            </div>
          </div>

          <div className="pt-3 border-t border-[#d6d6d6] text-center text-xs text-[#686868]">
            New patient?{" "}
            <Link
              href="/register"
              className="font-bold text-[#004181] hover:underline"
            >
              Create a DeltaCare Patient Account
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
