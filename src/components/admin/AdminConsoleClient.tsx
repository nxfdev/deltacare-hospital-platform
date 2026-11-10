"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  CalendarDays,
  ExternalLink,
  FileText,
  LayoutGrid,
  LogOut,
  Menu,
  MessageSquare,
  Send,
  Stethoscope,
  X,
} from "lucide-react";
import type {
  AIUpdateDraft,
  Appointment,
  ApprovalRequest,
  AuditEvent,
  Branch,
  ContactRequest,
  Department,
  DiseaseCondition,
  Doctor,
  FacebookPostBatch,
  FeedbackRecord,
  HospitalConfiguration,
  NotificationRecord,
  OperationalInsight,
  RoleCode,
  Specialty,
  UserAccount,
} from "@/types/domain";
import type { OperationalAnalyticsReport } from "@/server/services/communicationAndAnalyticsService";
import { AdminOverview } from "./console/AdminOverview";
import { AppointmentsDesk } from "./console/AppointmentsDesk";
import { DoctorsManager } from "./console/DoctorsManager";
import { FacebookCampaignGenerator } from "./FacebookCampaignGenerator";
import { WebsiteNoticesCMS } from "./WebsiteNoticesCMS";
import { PatientFeedbackModeration } from "./PatientFeedbackModeration";

export type AdminTab = "overview" | "appointments" | "doctors" | "facebook" | "content" | "feedback";

interface AdminConsoleClientProps {
  currentUser: { userId: string; email: string; fullName: string; role: RoleCode; scopedBranchId?: string };
  initialHospital: HospitalConfiguration;
  initialAppointments: Appointment[];
  initialDoctors: Doctor[];
  initialDepartments: Department[];
  initialBranches: Branch[];
  initialSpecialties: Specialty[];
  initialConditions?: DiseaseCondition[];
  initialApprovals?: ApprovalRequest[];
  initialAIUpdates?: AIUpdateDraft[];
  initialFeedbacks: FeedbackRecord[];
  initialCallbacks?: ContactRequest[];
  initialNotifications?: NotificationRecord[];
  initialAnalytics?: OperationalAnalyticsReport;
  initialUsers?: Array<Pick<UserAccount, "id" | "email" | "fullName" | "phone" | "role" | "scopedBranchId" | "isActive" | "updatedAt">>;
  initialAuditEvents?: AuditEvent[];
  initialFacebookBatches?: FacebookPostBatch[];
  initialInsights?: OperationalInsight[];
}

const TABS: Array<{ id: AdminTab; label: string; icon: React.ComponentType<{ className?: string }> }> = [
  { id: "overview", label: "Overview", icon: LayoutGrid },
  { id: "appointments", label: "Appointments & Calendar", icon: CalendarDays },
  { id: "doctors", label: "Doctors", icon: Stethoscope },
  { id: "facebook", label: "Facebook Post", icon: Send },
  { id: "content", label: "Website Content", icon: FileText },
  { id: "feedback", label: "Feedback", icon: MessageSquare },
];

// Older ?tab= values keep working.
const LEGACY: Record<string, AdminTab> = {
  analytics: "overview",
  reports: "overview",
  "front-desk": "appointments",
  calendar: "appointments",
  schedules: "appointments",
  today: "appointments",
  requests: "appointments",
  "facebook-studio": "facebook",
  generator: "facebook",
  "doctors-cms": "doctors",
  specialists: "doctors",
  profiles: "doctors",
  "notices-cms": "content",
  "feedback-moderation": "feedback",
};

const CONTENT_ROLES: RoleCode[] = ["SUPER_ADMIN", "HOSPITAL_ADMIN", "DEPT_MANAGER", "CONTENT_EDITOR", "CMS_EDITOR"];
const DESK_ROLES: RoleCode[] = ["SUPER_ADMIN", "HOSPITAL_ADMIN", "DEPT_MANAGER", "RECEPTIONIST", "FRONT_DESK", "APPOINTMENT_MANAGER"];

function tabsForRole(role: RoleCode): AdminTab[] {
  const tabs: AdminTab[] = [];
  if (DESK_ROLES.includes(role) || CONTENT_ROLES.includes(role)) tabs.push("overview");
  if (DESK_ROLES.includes(role)) tabs.push("appointments");
  if (CONTENT_ROLES.includes(role)) tabs.push("doctors", "facebook", "content");
  tabs.push("feedback");
  return tabs;
}

function normalize(raw: string | null, allowed: AdminTab[]): AdminTab {
  const t = (raw && (LEGACY[raw] ?? raw)) as AdminTab | undefined;
  return t && allowed.includes(t) ? t : allowed[0];
}

export function AdminConsoleClient({
  currentUser,
  initialAppointments,
  initialDoctors,
  initialDepartments,
  initialBranches,
  initialSpecialties,
  initialFeedbacks,
}: AdminConsoleClientProps) {
  const router = useRouter();
  const allowed = tabsForRole(currentUser.role);
  const [tab, setTab] = useState<AdminTab>(allowed[0]);
  const [navOpen, setNavOpen] = useState(false);
  const [doctors, setDoctors] = useState<Doctor[]>(initialDoctors);
  const [promotedDoctorId, setPromotedDoctorId] = useState<string | null>(null);

  useEffect(() => {
    const read = () => setTab(normalize(new URLSearchParams(window.location.search).get("tab"), allowed));
    read();
    window.addEventListener("popstate", read);
    return () => window.removeEventListener("popstate", read);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const go = (next: AdminTab) => {
    setTab(next);
    setNavOpen(false);
    const url = new URL(window.location.href);
    url.searchParams.set("tab", next);
    window.history.pushState({}, "", url.toString());
  };

  const logout = async () => {
    await fetch("/api/v1/auth/logout", { method: "POST" }).catch(() => undefined);
    router.push("/login");
    router.refresh();
  };

  const current = TABS.find((t) => t.id === tab)!;

  return (
    <div className="min-h-screen flex bg-[#f7f8fa]">
      {navOpen && (
        <div role="presentation" onClick={() => setNavOpen(false)} className="fixed inset-0 z-30 bg-black/30 md:hidden" />
      )}

      <aside
        className={`fixed md:sticky top-0 left-0 z-40 h-screen w-64 shrink-0 bg-white border-r border-[#eef0f3] flex flex-col transition-transform md:translate-x-0 ${
          navOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="px-6 h-16 flex items-center justify-between border-b border-[#eef0f3]">
          <Link href="/" aria-label="Evercare home">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/images/evercare-logo.svg" alt="Evercare" className="h-8 w-auto" />
          </Link>
          <button type="button" aria-label="Close menu" onClick={() => setNavOpen(false)} className="md:hidden p-1">
            <X className="w-5 h-5" />
          </button>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {TABS.filter((t) => allowed.includes(t.id)).map((t) => {
            const Icon = t.icon;
            const active = t.id === tab;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => go(t.id)}
                className={`w-full flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm transition-colors ${
                  active ? "bg-[#eef4fb] text-[#0057b8] font-medium" : "text-[#4b5563] hover:bg-[#f7f8fa]"
                }`}
              >
                <Icon className="w-4.5 h-4.5 w-[18px] h-[18px]" />
                {t.label}
              </button>
            );
          })}
        </nav>
        <div className="p-4 border-t border-[#eef0f3]">
          <p className="text-sm font-medium text-[#0b1b33] truncate">{currentUser.fullName}</p>
          <p className="text-xs text-[#9ca3af] truncate">{currentUser.email}</p>
          <div className="mt-3 flex items-center gap-4 text-sm">
            <Link href="/" className="inline-flex items-center gap-1 text-[#6b7280] hover:text-[#0b1b33]">
              Website <ExternalLink className="w-3.5 h-3.5" />
            </Link>
            <button type="button" onClick={logout} className="inline-flex items-center gap-1 text-[#6b7280] hover:text-[#0b1b33]">
              <LogOut className="w-3.5 h-3.5" /> Sign out
            </button>
          </div>
        </div>
      </aside>

      <div className="flex-1 min-w-0">
        <header className="sticky top-0 z-20 h-16 bg-[#f7f8fa]/90 backdrop-blur flex items-center gap-3 px-5 sm:px-8">
          <button type="button" aria-label="Open menu" onClick={() => setNavOpen(true)} className="md:hidden p-2 -ml-2">
            <Menu className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-semibold text-[#0b1b33]">{current.label}</h1>
        </header>

        <main className="px-5 sm:px-8 pb-16 pt-2">
          {tab === "overview" && (
            <AdminOverview
              appointments={initialAppointments}
              doctors={doctors}
              departments={initialDepartments}
              feedbacks={initialFeedbacks}
              onOpenAppointments={() => go("appointments")}
            />
          )}
          {tab === "appointments" && (
            <AppointmentsDesk
              initialAppointments={initialAppointments}
              doctors={doctors}
              departments={initialDepartments}
              branches={initialBranches}
            />
          )}
          {tab === "doctors" && (
            <DoctorsManager
              doctors={doctors}
              departments={initialDepartments}
              branches={initialBranches}
              specialties={initialSpecialties}
              onSaved={(doc, isNew) =>
                setDoctors((prev) => (isNew ? [doc, ...prev] : prev.map((d) => (d.id === doc.id ? doc : d))))
              }
              onPromote={(id) => {
                setPromotedDoctorId(id);
                go("facebook");
              }}
            />
          )}
          {tab === "facebook" && <FacebookCampaignGenerator embedded initialDoctorId={promotedDoctorId} />}
          {tab === "content" && <WebsiteNoticesCMS />}
          {tab === "feedback" && <PatientFeedbackModeration />}
        </main>
      </div>
    </div>
  );
}
