import type { Metadata } from "next";
import { redirect } from "next/navigation";
import {
  getCurrentSession,
  hasRolePermission,
  STAFF_ROLES,
} from "@/server/auth/session";
import { AdminHealthcareAnalytics } from "@/components/admin/AdminHealthcareAnalytics";
import { StaffPortalHeader } from "@/components/staff/StaffPortalHeader";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Healthcare Data Analytics Suite | DeltaCare Hospital Management",
  description:
    "Real-time slot utilization, doctor popularity, patient wait-time sentiment, departmental rush heatmaps, and consultation revenue attribution across DeltaCare campuses.",
};

export default async function AnalyticsDashboardPage() {
  const session = await getCurrentSession();
  if (!session || !hasRolePermission(session, STAFF_ROLES)) {
    redirect("/login?redirect=/dashboard/admin/analytics");
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <StaffPortalHeader
        user={{
          userId: session.userId,
          fullName: session.fullName,
          email: session.email,
          role: session.role,
        }}
      />
      <main className="flex-1">
        <AdminHealthcareAnalytics />
      </main>
    </div>
  );
}

