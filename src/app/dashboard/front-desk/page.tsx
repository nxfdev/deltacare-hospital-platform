import type { Metadata } from "next";
import { redirect } from "next/navigation";
import {
  getCurrentSession,
  hasRolePermission,
  STAFF_ROLES,
} from "@/server/auth/session";
import { FrontDeskScheduleManager } from "@/components/staff/FrontDeskScheduleManager";
import { StaffPortalHeader } from "@/components/staff/StaffPortalHeader";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Front Desk & Doctor Assistant Schedule Manager | DeltaCare Hospital",
  description:
    "Operational Front Desk, Chamber Assistant 14-day fixed-slot calendar, 2-click extra chamber uploader, emergency leave blocker, and SMS confirmation queue.",
};

export default async function FrontDeskDashboardPage() {
  const session = await getCurrentSession();
  if (!session || !hasRolePermission(session, STAFF_ROLES)) {
    redirect("/login?redirect=/dashboard/front-desk");
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
        <FrontDeskScheduleManager />
      </main>
    </div>
  );
}

