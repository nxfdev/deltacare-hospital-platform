"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { UserPlus, AlertCircle } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [consentAccepted, setConsentAccepted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);
    try {
      const res = await fetch("/api/v1/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName,
          email,
          phone,
          password,
          consentAccepted,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setErrorMsg(data.error || "Registration failed.");
      } else {
        let redirectTarget = "/dashboard";
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
      setErrorMsg("Network error creating account.");
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
            Create Patient Account
          </h1>
          <p className="text-sm text-[#686868]">
            Track appointment requests and manage your DeltaCare visits
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
                htmlFor="reg-name"
                className="block text-xs font-bold text-[#080808] mb-1"
              >
                Full Name *
              </label>
              <input
                id="reg-name"
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Tanvir Ahmed"
                className="w-full h-11 px-3.5 rounded-lg border border-[#757575] text-sm"
              />
            </div>

            <div>
              <label
                htmlFor="reg-email"
                className="block text-xs font-bold text-[#080808] mb-1"
              >
                Email Address *
              </label>
              <input
                id="reg-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full h-11 px-3.5 rounded-lg border border-[#757575] text-sm"
              />
            </div>

            <div>
              <label
                htmlFor="reg-phone"
                className="block text-xs font-bold text-[#080808] mb-1"
              >
                Bangladesh Mobile Number *
              </label>
              <input
                id="reg-phone"
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="01711223344"
                className="w-full h-11 px-3.5 rounded-lg border border-[#757575] text-sm"
              />
            </div>

            <div>
              <label
                htmlFor="reg-password"
                className="block text-xs font-bold text-[#080808] mb-1"
              >
                Password (minimum 8 characters) *
              </label>
              <input
                id="reg-password"
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full h-11 px-3.5 rounded-lg border border-[#757575] text-sm"
              />
            </div>

            <label className="flex items-start gap-2 text-xs text-[#424242] cursor-pointer">
              <input
                type="checkbox"
                required
                checked={consentAccepted}
                onChange={(e) => setConsentAccepted(e.target.checked)}
                className="mt-0.5 accent-[#0057b8]"
              />
              <span>
                I agree to DeltaCare&apos;s Privacy Notice and Terms of Use.
              </span>
            </label>

            <button
              type="submit"
              disabled={loading}
              className="mc-btn-primary w-full"
            >
              <UserPlus className="w-4 h-4" />
              <span>{loading ? "Creating Account..." : "Register Account"}</span>
            </button>
          </form>

          <div className="pt-3 border-t border-[#d6d6d6] text-center text-xs text-[#686868]">
            Already registered?{" "}
            <Link
              href="/login"
              className="font-bold text-[#004181] hover:underline"
            >
              Sign in here
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}

