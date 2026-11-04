import React from "react";
import { redirect } from "next/navigation";
import {
  getCurrentSession,
  hasRolePermission,
  ADMIN_CONSOLE_ROLES,
} from "@/server/auth/session";
import { getDbState } from "@/server/db/store";
import { getOperationalAnalytics } from "@/server/services/communicationAndAnalyticsService";
import { AdminConsoleClient } from "@/components/admin/AdminConsoleClient";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const session = await getCurrentSession();
  if (!session) {
    redirect("/login");
  }
  if (!hasRolePermission(session, ADMIN_CONSOLE_ROLES)) {
    redirect("/dashboard");
  }

  const db = getDbState();
  const analytics = getOperationalAnalytics();

  // Enforce branch-level appointment isolation for receptionist
  const scopedAppointments =
    session.role === "RECEPTIONIST" && session.scopedBranchId
      ? db.appointments.filter((a) => a.branchId === session.scopedBranchId)
      : db.appointments;

  return (
    <AdminConsoleClient
      currentUser={{
        userId: session.userId,
        email: session.email,
        fullName: session.fullName,
        role: session.role,
        scopedBranchId: session.scopedBranchId,
      }}
      initialHospital={db.hospital}
      initialAppointments={scopedAppointments}
      initialDoctors={db.doctors}
      initialDepartments={db.departments}
      initialBranches={db.branches}
      initialSpecialties={db.specialties}
      initialConditions={db.conditions}
      initialApprovals={db.approvalRequests}
      initialAIUpdates={db.aiUpdateDrafts}
      initialFeedbacks={db.feedbacks}
      initialCallbacks={db.contactRequests}
      initialNotifications={db.notifications}
      initialAnalytics={analytics}
      initialUsers={db.users.map((u) => ({
        id: u.id,
        email: u.email,
        fullName: u.fullName,
        phone: u.phone,
        role: u.role,
        scopedBranchId: u.scopedBranchId,
        isActive: u.isActive,
        updatedAt: u.updatedAt,
      }))}
      initialAuditEvents={db.auditEvents}
      initialFacebookBatches={db.facebookBatches || []}
    />
  );
}
