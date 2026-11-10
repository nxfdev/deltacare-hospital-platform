"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Lock,
  AlertCircle,
  ShieldCheck,
  BarChart3,
  Calendar,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import { STAFF_ROLES } from "@/lib/auth/roles";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const performLogin = async (loginEmail: string, loginPassword: string) => {
    setErrorMsg(null);
    setLoading(true);
    try {
      const res = await fetch("/api/v1/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: loginEmail, password: loginPassword }),
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await performLogin(email, password);
  };

  const handleQuickDemoSignIn = async (demoEmail: string, demoPassword: string) => {
    setEmail(demoEmail);
    setPassword(demoPassword);
    await performLogin(demoEmail, demoPassword);
  };

  return (
    <main className="min-h-screen bg-[#f2f2f2] flex flex-col justify-center py-12 px-4">
      <div className="max-w-md w-full mx-auto space-y-6">
        <div className="text-center space-y-2">
          <Link href="/" className="inline-block">
            <img
              src="/images/evercare-logo.svg"
              alt="Evercare Home"
              className="h-12 w-auto mx-auto"
            />
          </Link>
          <h1 className="mc-serif text-3xl text-[#080808]">
            Sign in to Evercare
          </h1>
          <p className="text-sm text-[#4a4a4a]">
            Access the Patient Portal or Evercare Staff Operations Console
          </p>
        </div>

        <div className="bg-white border border-[#d6d6d6] p-6 md:p-8 space-y-5">
          {errorMsg && (
            <div className="p-3.5 bg-[#fef2f2] border border-[#dc2626] text-xs text-[#7f1d1d] flex items-center gap-2">
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
                placeholder="name@evercare.bd"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full h-11 px-3.5 border border-[#757575] text-sm focus:border-[#0057b8] outline-none"
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
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full h-11 px-3.5 border border-[#757575] text-sm focus:border-[#0057b8] outline-none"
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

          {/* Demo Staff Quick Access Panel */}
          <div className="pt-5 border-t border-[#e5e7eb] space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#012d61]">
                Demo Staff Quick Access (1-Click Sign-In)
              </span>
              <span className="text-[10px] font-semibold text-[#0057b8] bg-[#e8f0f9] px-2 py-0.5">
                Role Preview
              </span>
            </div>

            <div className="space-y-2">
              <button
                type="button"
                disabled={loading}
                onClick={() =>
                  void handleQuickDemoSignIn("admin@evercare.bd", "Evercare#2026")
                }
                className="w-full text-left p-3 border border-[#e5e7eb] hover:border-[#0057b8] bg-slate-50/70 hover:bg-[#f0f7ff] transition-colors flex items-center justify-between gap-3 group cursor-pointer"
              >
                <div className="flex items-start gap-2.5">
                  <BarChart3 className="w-4 h-4 text-[#0057b8] shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-bold text-[#012d61] group-hover:text-[#0057b8]">
                      Hospital Admin
                    </p>
                    <p className="text-[11px] text-[#4a4a4a] leading-snug mt-0.5">
                      Analytics, All Schedules, Facebook Studio, CMS &amp; Staff
                    </p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-[#0057b8] shrink-0 transition-transform group-hover:translate-x-0.5" />
              </button>

              <button
                type="button"
                disabled={loading}
                onClick={() =>
                  void handleQuickDemoSignIn("frontdesk@evercare.bd", "Evercare#2026")
                }
                className="w-full text-left p-3 border border-[#e5e7eb] hover:border-[#059669] bg-slate-50/70 hover:bg-[#ecfdf5] transition-colors flex items-center justify-between gap-3 group cursor-pointer"
              >
                <div className="flex items-start gap-2.5">
                  <Calendar className="w-4 h-4 text-[#059669] shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-bold text-[#065f46] group-hover:text-[#059669]">
                      Front Desk / Doctor&apos;s Assistant
                    </p>
                    <p className="text-[11px] text-[#4a4a4a] leading-snug mt-0.5">
                      14-Day Slot Grid, Extra Chambers, Queue &amp; 10666 Booking
                    </p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-[#059669] shrink-0 transition-transform group-hover:translate-x-0.5" />
              </button>

              <button
                type="button"
                disabled={loading}
                onClick={() =>
                  void handleQuickDemoSignIn("editor@evercare.bd", "Evercare#2026")
                }
                className="w-full text-left p-3 border border-[#e5e7eb] hover:border-[#d97706] bg-slate-50/70 hover:bg-[#fffbeb] transition-colors flex items-center justify-between gap-3 group cursor-pointer"
              >
                <div className="flex items-start gap-2.5">
                  <Sparkles className="w-4 h-4 text-[#d97706] shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-bold text-[#92400e] group-hover:text-[#d97706]">
                      CMS &amp; Marketing Editor
                    </p>
                    <p className="text-[11px] text-[#4a4a4a] leading-snug mt-0.5">
                      Daily Facebook Spotlight Cards, Doctors &amp; Notices CMS
                    </p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-[#d97706] shrink-0 transition-transform group-hover:translate-x-0.5" />
              </button>
            </div>
          </div>

          <div className="pt-4 border-t border-[#d6d6d6] flex items-start gap-2.5 text-xs text-[#4a4a4a]">
            <ShieldCheck className="w-4 h-4 text-[#0057b8] shrink-0 mt-0.5" />
            <span>
              Staff accounts use bcrypt-hashed authentication and enforce mandatory password rotation on initial sign-in.
            </span>
          </div>

          <div className="pt-3 border-t border-[#d6d6d6] text-center text-xs text-[#686868]">
            New patient?{" "}
            <Link
              href="/register"
              className="font-bold text-[#004181] hover:underline"
            >
              Create a Evercare Patient Account
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
