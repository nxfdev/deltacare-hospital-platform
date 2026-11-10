import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentSession, hasRolePermission, STAFF_ROLES } from "@/server/auth/session";
import { getDbState } from "@/server/db/store";
import { AppointmentsDesk } from "@/components/admin/console/AppointmentsDesk";
import { StaffPortalHeader } from "@/components/staff/StaffPortalHeader";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Front Desk | Evercare",
};

export default async function FrontDeskDashboardPage() {
  const session = await getCurrentSession();
  if (!session || !hasRolePermission(session, STAFF_ROLES)) {
    redirect("/login?redirect=/dashboard/front-desk");
  }

  const db = getDbState();
  const appointments =
    session.role === "RECEPTIONIST" && session.scopedBranchId
      ? db.appointments.filter((a) => a.branchId === session.scopedBranchId)
      : session.role === "DOCTOR" && session.doctorProfileId
        ? db.appointments.filter((a) => a.doctorId === session.doctorProfileId)
        : db.appointments;

  return (
    <div className="min-h-screen bg-[#f7f8fa] flex flex-col">
      <StaffPortalHeader
        user={{ userId: session.userId, fullName: session.fullName, email: session.email, role: session.role }}
      />
      <main className="flex-1 mx-auto w-full max-w-7xl px-5 sm:px-8 py-8">
        <h1 className="text-2xl font-semibold text-[#0b1b33] mb-6">Appointments</h1>
        <AppointmentsDesk
          initialAppointments={appointments}
          doctors={db.doctors.filter((d) => d.publicationState === "PUBLISHED")}
          departments={db.departments}
          branches={db.branches}
        />
      </main>
    </div>
  );
}
