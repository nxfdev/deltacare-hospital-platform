"use client";

import React from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import {
  BarChart3,
  Calendar,
  ExternalLink,
  LayoutDashboard,
  LogOut,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { RoleCode } from "@/types/domain";

interface StaffPortalHeaderProps {
  user: {
    userId: string;
    fullName: string;
    email: string;
    role: RoleCode;
  };
}

export function StaffPortalHeader({ user }: StaffPortalHeaderProps) {
  const router = useRouter();
  const pathname = usePathname();

  const handleLogout = async () => {
    try {
      await fetch("/api/v1/auth/logout", { method: "POST" });
    } catch {
      // ignore
    }
    router.push("/login");
    router.refresh();
  };

  return (
    <header className="sticky top-0 z-40 bg-[#012d61] text-white border-b border-white/15">
      <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-10 h-16 flex items-center justify-between gap-4">
        {/* Left: Brand & Portal Badge */}
        <div className="flex items-center gap-4">
          <Link href="/admin" className="flex items-center gap-2.5">
            <img
              src="/images/deltacare-logo-inverse.svg"
              alt="DeltaCare"
              className="h-8 w-auto"
            />
          </Link>
          <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 bg-white/10 border border-white/20 text-[11px] font-bold uppercase tracking-wider text-sky-200">
            <ShieldCheck className="h-3.5 w-3.5 text-sky-300" />
            DeltaCare Staff Portal
          </span>
        </div>

        {/* Center: Quick Workspace Switcher */}
        <nav className="hidden md:flex items-center gap-1.5 text-xs">
          <Link
            href="/admin"
            className={`px-3 py-1.5 font-bold inline-flex items-center gap-1.5 transition-colors ${
              pathname === "/admin"
                ? "bg-[#0057b8] text-white"
                : "text-slate-200 hover:bg-white/10"
            }`}
          >
            <LayoutDashboard className="h-3.5 w-3.5 text-sky-300" />
            Unified Admin Console
          </Link>
          <Link
            href="/dashboard/front-desk"
            className={`px-3 py-1.5 font-bold inline-flex items-center gap-1.5 transition-colors ${
              pathname?.startsWith("/dashboard/front-desk")
                ? "bg-[#0057b8] text-white"
                : "text-slate-200 hover:bg-white/10"
            }`}
          >
            <Calendar className="h-3.5 w-3.5 text-sky-300" />
            Front Desk &amp; Schedules
          </Link>
          <Link
            href="/dashboard/admin/analytics"
            className={`px-3 py-1.5 font-bold inline-flex items-center gap-1.5 transition-colors ${
              pathname?.startsWith("/dashboard/admin/analytics")
                ? "bg-[#0057b8] text-white"
                : "text-slate-200 hover:bg-white/10"
            }`}
          >
            <BarChart3 className="h-3.5 w-3.5 text-sky-300" />
            Analytics Suite
          </Link>
          <Link
            href="/dashboard/admin/facebook-generator"
            className={`px-3 py-1.5 font-bold inline-flex items-center gap-1.5 transition-colors ${
              pathname?.startsWith("/dashboard/admin/facebook-generator")
                ? "bg-[#0057b8] text-white"
                : "text-slate-200 hover:bg-white/10"
            }`}
          >
            <Sparkles className="h-3.5 w-3.5 text-sky-300" />
            Facebook Studio
          </Link>
        </nav>

        {/* Right: User Identity & Sign Out */}
        <div className="flex items-center gap-3 text-xs">
          <div className="hidden lg:block text-right">
            <p className="font-bold text-white leading-tight">{user.fullName}</p>
            <p className="text-[10px] font-mono text-sky-300 uppercase">{user.role}</p>
          </div>
          <Link
            href="/"
            className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1.5 border border-white/25 text-slate-200 hover:bg-white/10 font-semibold"
          >
            <span>Public Site</span>
            <ExternalLink className="h-3 w-3" />
          </Link>
          <button
            type="button"
            onClick={handleLogout}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-600/90 hover:bg-red-700 text-white font-bold uppercase tracking-wider text-[11px] cursor-pointer"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    </header>
  );
}

