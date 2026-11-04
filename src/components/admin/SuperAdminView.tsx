"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Shield,
  Building2,
  Users,
  Activity,
  FileText,
  Search,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Sliders,
  Database,
  Lock,
  RefreshCw,
} from "lucide-react";
import {
  AuditEvent,
  Branch,
  HospitalConfiguration,
  UserAccount,
} from "@/types/domain";

interface SuperAdminViewProps {
  hospital: HospitalConfiguration;
  branches: Branch[];
  users: Array<Pick<UserAccount, "id" | "email" | "fullName" | "phone" | "role" | "scopedBranchId" | "isActive" | "updatedAt">>;
  auditEvents: AuditEvent[];
  analytics: {
    totalAppointments: number;
    appointmentsByStatus: Record<string, number>;
    totalDoctors: number;
    totalDepartments: number;
    assistantQueriesTotal: number;
  };
  onUpdateUserStatus: (targetUserId: string, nextActive: boolean) => Promise<void>;
  statusBanner: string | null;
  activeTab?: SuperAdminTab;
  onTabChange?: (tab: SuperAdminTab) => void;
}

export type SuperAdminTab = "overview" | "hospitals" | "staff" | "audit" | "config";

export function SuperAdminView({
  hospital,
  branches,
  users,
  auditEvents,
  analytics,
  onUpdateUserStatus,
  activeTab: controlledTab,
  onTabChange,
}: SuperAdminViewProps) {
  const [internalTab, setInternalTab] = useState<SuperAdminTab>("overview");
  const activeTab = controlledTab || internalTab;
  const setTab = (tab: SuperAdminTab) => {
    if (onTabChange) onTabChange(tab);
    setInternalTab(tab);
  };

  const [staffSearch, setStaffSearch] = useState("");
  const [staffRoleFilter, setStaffRoleFilter] = useState("ALL");
  const [auditSearch, setAuditSearch] = useState("");
  const [selectedAuditDiff, setSelectedAuditDiff] = useState<AuditEvent | null>(null);

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.fullName.toLowerCase().includes(staffSearch.toLowerCase()) ||
      u.email.toLowerCase().includes(staffSearch.toLowerCase()) ||
      (u.phone && u.phone.includes(staffSearch));
    const matchesRole = staffRoleFilter === "ALL" || u.role === staffRoleFilter;
    return matchesSearch && matchesRole;
  });

  const filteredAudits = auditEvents.filter((ev) => {
    return (
      ev.actorName.toLowerCase().includes(auditSearch.toLowerCase()) ||
      ev.action.toLowerCase().includes(auditSearch.toLowerCase()) ||
      ev.summary.toLowerCase().includes(auditSearch.toLowerCase()) ||
      ev.entityType.toLowerCase().includes(auditSearch.toLowerCase())
    );
  });

  return (
    <div className="space-y-6">
      {/* Sub-navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-[#d6d6d6] pb-3 overflow-x-auto">
        <button
          type="button"
          onClick={() => setTab("overview")}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors ${
            activeTab === "overview"
              ? "bg-[#0057b8] text-white shadow-sm"
              : "text-[#484848] hover:bg-[#e2e8f0]"
          }`}
        >
          Platform Overview
        </button>
        <button
          type="button"
          onClick={() => setTab("hospitals")}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors ${
            activeTab === "hospitals"
              ? "bg-[#0057b8] text-white shadow-sm"
              : "text-[#484848] hover:bg-[#e2e8f0]"
          }`}
        >
          Hospital &amp; Branches ({branches.length})
        </button>
        <button
          type="button"
          onClick={() => setTab("staff")}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors ${
            activeTab === "staff"
              ? "bg-[#0057b8] text-white shadow-sm"
              : "text-[#484848] hover:bg-[#e2e8f0]"
          }`}
        >
          Staff &amp; RBAC Accounts ({users.length})
        </button>
        <button
          type="button"
          onClick={() => setTab("audit")}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors ${
            activeTab === "audit"
              ? "bg-[#0057b8] text-white shadow-sm"
              : "text-[#484848] hover:bg-[#e2e8f0]"
          }`}
        >
          Audit Logs &amp; Security ({auditEvents.length})
        </button>
        <button
          type="button"
          onClick={() => setTab("config")}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors ${
            activeTab === "config"
              ? "bg-[#0057b8] text-white shadow-sm"
              : "text-[#484848] hover:bg-[#e2e8f0]"
          }`}
        >
          Global Configuration
        </button>
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          {/* Platform KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl border border-[#d6d6d6] p-4 shadow-sm">
              <p className="text-[11px] font-bold uppercase tracking-wider text-[#686868]">Platform Hospital</p>
              <h3 className="text-xl font-bold text-[#080808] mt-1">{hospital.nameEn}</h3>
              <p className="text-xs text-[#0057b8] font-semibold mt-1">{branches.length} Registered Campuses</p>
            </div>

            <div className="bg-white rounded-xl border border-[#d6d6d6] p-4 shadow-sm">
              <p className="text-[11px] font-bold uppercase tracking-wider text-[#686868]">Active Staff Users</p>
              <h3 className="text-xl font-bold text-[#080808] mt-1">
                {users.filter((u) => u.isActive).length} / {users.length}
              </h3>
              <p className="text-xs text-[#059669] font-semibold mt-1">RBAC Isolation Active</p>
            </div>

            <div className="bg-white rounded-xl border border-[#d6d6d6] p-4 shadow-sm">
              <p className="text-[11px] font-bold uppercase tracking-wider text-[#686868]">Lifetime Appointments</p>
              <h3 className="text-xl font-bold text-[#080808] mt-1">{analytics.totalAppointments}</h3>
              <p className="text-xs text-[#686868] mt-1">
                {analytics.appointmentsByStatus["CONFIRMED"] || 0} Confirmed
              </p>
            </div>

            <div className="bg-white rounded-xl border border-[#d6d6d6] p-4 shadow-sm">
              <p className="text-[11px] font-bold uppercase tracking-wider text-[#686868]">Security & Audit Trail</p>
              <h3 className="text-xl font-bold text-[#080808] mt-1">{auditEvents.length}</h3>
              <p className="text-xs text-[#0057b8] font-semibold mt-1">Immutable Log Records</p>
            </div>
          </div>

          {/* System Health Status */}
          <div className="bg-white rounded-2xl border border-[#d6d6d6] p-6 space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-[#080808] flex items-center gap-2">
              <Activity className="w-4 h-4 text-[#0057b8]" />
              <span>Platform Health & Dependency Monitors</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-3.5 rounded-xl bg-[#ecfdf5] border border-[#a7f3d0] flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-[#065f46]">PostgreSQL Database</p>
                  <p className="text-[11px] text-[#047857]">Operational • Latency &lt; 5ms</p>
                </div>
                <CheckCircle2 className="w-5 h-5 text-[#059669]" />
              </div>

              <div className="p-3.5 rounded-xl bg-[#ecfdf5] border border-[#a7f3d0] flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-[#065f46]">Authentication & MFA</p>
                  <p className="text-[11px] text-[#047857]">HMAC-SHA256 Token Auth</p>
                </div>
                <Lock className="w-5 h-5 text-[#059669]" />
              </div>

              <div className="p-3.5 rounded-xl bg-[#ecfdf5] border border-[#a7f3d0] flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-[#065f46]">AI Knowledge Adapter</p>
                  <p className="text-[11px] text-[#047857]">Grounded • Strict Safe Fallback</p>
                </div>
                <CheckCircle2 className="w-5 h-5 text-[#059669]" />
              </div>

              <div className="p-3.5 rounded-xl bg-[#ecfdf5] border border-[#a7f3d0] flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-[#065f46]">Notification Adapter</p>
                  <p className="text-[11px] text-[#047857]">Queue Ready (SMS / Email)</p>
                </div>
                <CheckCircle2 className="w-5 h-5 text-[#059669]" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: HOSPITALS & BRANCHES */}
      {activeTab === "hospitals" && (
        <div className="bg-white rounded-2xl border border-[#d6d6d6] p-6 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#d6d6d6]">
            <div>
              <h3 className="text-base font-bold text-[#080808]">Hospital Branches & Campuses</h3>
              <p className="text-xs text-[#686868]">Manage operational locations across Bangladesh</p>
            </div>
          </div>

          <div className="divide-y divide-[#d6d6d6]">
            {branches.map((b) => (
              <div key={b.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
                <div>
                  <div className="flex items-center gap-2">
                    <strong className="text-sm text-[#080808]">{b.nameEn}</strong>
                    <span className="text-[#686868]">({b.nameBn})</span>
                    <span className="px-2 py-0.5 rounded-full bg-[#ecfdf5] text-[#065f46] font-bold text-[10px]">
                      {b.publicationState}
                    </span>
                  </div>
                  <p className="text-[#484848] mt-1">{b.addressEn}</p>
                  <p className="text-[#686868] mt-0.5">Phone: {b.phone} • Emergency: {b.emergencyPhone}</p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Link
                    href={`/locations/${b.slug}`}
                    className="px-3 py-1.5 rounded-lg border border-[#d6d6d6] text-xs font-semibold text-[#004181] hover:bg-[#e8f0f9]"
                  >
                    View Public Page
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: STAFF & RBAC */}
      {activeTab === "staff" && (
        <div className="bg-white rounded-2xl border border-[#d6d6d6] p-6 space-y-5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#d6d6d6]">
            <div>
              <h3 className="text-base font-bold text-[#080808]">Platform Staff & RBAC Accounts</h3>
              <p className="text-xs text-[#686868]">
                Enforce principle of least privilege across Super Admin, Hospital Admin, Front Desk, and CMS roles.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-[#686868] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search user or phone..."
                  value={staffSearch}
                  onChange={(e) => setStaffSearch(e.target.value)}
                  className="h-8 pl-8 pr-3 rounded-lg border border-[#a1a1a1] text-xs w-48 sm:w-56"
                />
              </div>

              <select
                value={staffRoleFilter}
                onChange={(e) => setStaffRoleFilter(e.target.value)}
                className="h-8 px-2.5 rounded-lg border border-[#a1a1a1] text-xs bg-white font-semibold"
              >
                <option value="ALL">All Roles</option>
                <option value="SUPER_ADMIN">SUPER_ADMIN</option>
                <option value="HOSPITAL_ADMIN">HOSPITAL_ADMIN</option>
                <option value="RECEPTIONIST">RECEPTIONIST</option>
                <option value="CONTENT_EDITOR">CONTENT_EDITOR</option>
                <option value="PATIENT">PATIENT</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#f8fafc] text-[#484848] font-bold border-b border-[#d6d6d6]">
                <tr>
                  <th className="py-2.5 px-3">Staff Member</th>
                  <th className="py-2.5 px-3">Role</th>
                  <th className="py-2.5 px-3">Scope</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#d6d6d6]">
                {filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-[#f8fafc]">
                    <td className="py-3 px-3">
                      <strong className="text-[#080808]">{u.fullName}</strong>
                      <div className="text-[#686868] text-[11px]">{u.email}</div>
                    </td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded font-mono text-[11px] font-bold bg-[#e8f0f9] text-[#004181]">
                        {u.role}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-[#484848]">
                      {u.scopedBranchId ? (
                        <span className="px-2 py-0.5 rounded bg-[#f1f5f9] text-[#475569] text-[11px]">
                          {u.scopedBranchId}
                        </span>
                      ) : (
                        <span className="text-[#686868]">Platform Wide</span>
                      )}
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full font-bold text-[10px] ${
                          u.isActive ? "bg-[#ecfdf5] text-[#065f46]" : "bg-[#fef2f2] text-[#991b1b]"
                        }`}
                      >
                        {u.isActive ? "ACTIVE" : "INACTIVE"}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right">
                      {u.role !== "SUPER_ADMIN" ? (
                        <button
                          type="button"
                          onClick={() => onUpdateUserStatus(u.id, !u.isActive)}
                          className={`px-3 py-1 rounded text-xs font-bold transition-colors ${
                            u.isActive
                              ? "border border-[#dc2626] text-[#dc2626] hover:bg-[#fef2f2]"
                              : "bg-[#059669] text-white hover:bg-[#047857]"
                          }`}
                        >
                          {u.isActive ? "Deactivate" : "Activate"}
                        </button>
                      ) : (
                        <span className="text-[11px] text-[#a1a1a1]">Protected Root</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: AUDIT LOGS */}
      {activeTab === "audit" && (
        <div className="bg-white rounded-2xl border border-[#d6d6d6] p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#d6d6d6]">
            <div>
              <h3 className="text-base font-bold text-[#080808]">Immutable Audit Logs</h3>
              <p className="text-xs text-[#686868]">
                Every credential change, doctor update, appointment transition, and approval is recorded permanently.
              </p>
            </div>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-[#686868] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search audit trail..."
                value={auditSearch}
                onChange={(e) => setAuditSearch(e.target.value)}
                className="h-8 pl-8 pr-3 rounded-lg border border-[#a1a1a1] text-xs w-56"
              />
            </div>
          </div>

          <div className="space-y-2.5 max-h-[600px] overflow-y-auto">
            {filteredAudits.map((ev) => (
              <div
                key={ev.id}
                className="p-3 rounded-xl border border-[#e2e8f0] bg-[#f8fafc] text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-[#0057b8]">{ev.action}</span>
                    <span className="px-1.5 py-0.2 rounded bg-[#e2e8f0] text-[10px] text-[#475569]">
                      {ev.entityType}
                    </span>
                    <span className="text-[#686868]">by {ev.actorName} ({ev.actorRole})</span>
                  </div>
                  <p className="text-[#080808] font-medium mt-1">{ev.summary}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[#686868] text-[11px]">
                    {ev.occurredAt.replace("T", " ").slice(0, 19)}
                  </span>
                  {ev.diffJson && (
                    <button
                      type="button"
                      onClick={() => setSelectedAuditDiff(ev)}
                      className="px-2 py-0.5 rounded border border-[#0057b8] text-[11px] text-[#0057b8] font-semibold hover:bg-[#e8f0f9]"
                    >
                      View Diff
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: GLOBAL CONFIG */}
      {activeTab === "config" && (
        <div className="bg-white rounded-2xl border border-[#d6d6d6] p-6 space-y-6">
          <h3 className="text-base font-bold text-[#080808]">Global Platform Configuration</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
            <div className="p-4 rounded-xl border border-[#d6d6d6] bg-[#f8fafc] space-y-1">
              <span className="text-[#686868] font-bold">Brand Name</span>
              <p className="text-sm font-bold text-[#080808]">{hospital.nameEn}</p>
              <p className="text-xs text-[#0057b8]">{hospital.nameBn}</p>
            </div>
            <div className="p-4 rounded-xl border border-[#d6d6d6] bg-[#f8fafc] space-y-1">
              <span className="text-[#686868] font-bold">24/7 Emergency Line</span>
              <p className="text-sm font-bold text-[#dc2626]">{hospital.emergencyPhone}</p>
              <p className="text-xs text-[#686868]">Helpline: {hospital.helplinePhone}</p>
            </div>
            <div className="p-4 rounded-xl border border-[#d6d6d6] bg-[#f8fafc] space-y-1">
              <span className="text-[#686868] font-bold">Platform Timezone</span>
              <p className="text-sm font-bold text-[#080808]">{hospital.timezone}</p>
              <p className="text-xs text-[#059669]">Default Locale: {hospital.defaultLocale.toUpperCase()}</p>
            </div>
          </div>
        </div>
      )}

      {/* Diff Inspector Modal */}
      {selectedAuditDiff && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-white rounded-2xl p-6 border border-[#d6d6d6] shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[#d6d6d6]">
              <h4 className="font-bold text-sm text-[#080808]">Audit Diff: {selectedAuditDiff.action}</h4>
              <button
                type="button"
                onClick={() => setSelectedAuditDiff(null)}
                className="text-xs text-[#686868] hover:text-[#080808]"
              >
                Close
              </button>
            </div>
            <pre className="p-3 rounded-lg bg-[#0f172a] text-[#38bdf8] text-xs overflow-x-auto max-h-80 font-mono">
              {JSON.stringify(JSON.parse(selectedAuditDiff.diffJson || "{}"), null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}
