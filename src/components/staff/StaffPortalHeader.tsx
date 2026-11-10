"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ExternalLink, LogOut } from "lucide-react";
import { RoleCode } from "@/types/domain";
import { ADMIN_CONSOLE_ROLES } from "@/lib/auth/roles";

interface StaffPortalHeaderProps {
  user: { userId: string; fullName: string; email: string; role: RoleCode };
}

export function StaffPortalHeader({ user }: StaffPortalHeaderProps) {
  const router = useRouter();

  const handleLogout = async () => {
    await fetch("/api/v1/auth/logout", { method: "POST" }).catch(() => undefined);
    router.push("/login");
    router.refresh();
  };

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-[#eef0f3]">
      <div className="mx-auto max-w-7xl px-5 sm:px-8 h-16 flex items-center justify-between gap-4">
        <Link href="/" aria-label="Evercare home">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/evercare-logo.svg" alt="Evercare" className="h-8 w-auto" />
        </Link>
        <div className="flex items-center gap-5 text-sm">
          {ADMIN_CONSOLE_ROLES.includes(user.role) && (
            <Link href="/admin" className="text-[#4b5563] hover:text-[#0b1b33]">
              Admin console
            </Link>
          )}
          <Link href="/" className="hidden sm:inline-flex items-center gap-1 text-[#4b5563] hover:text-[#0b1b33]">
            Website <ExternalLink className="w-3.5 h-3.5" />
          </Link>
          <span className="hidden md:inline text-[#9ca3af]">{user.fullName}</span>
          <button type="button" onClick={handleLogout} className="inline-flex items-center gap-1 text-[#4b5563] hover:text-[#0b1b33]">
            <LogOut className="w-4 h-4" /> Sign out
          </button>
        </div>
      </div>
    </header>
  );
}
