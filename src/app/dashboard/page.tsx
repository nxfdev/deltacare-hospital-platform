import React from "react";
import { redirect } from "next/navigation";
import { getCurrentSession, STAFF_ROLES } from "@/server/auth/session";
import { getDbState } from "@/server/db/store";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { PatientDashboardClient } from "@/components/patient/PatientDashboardClient";

export const dynamic = "force-dynamic";

export default async function PatientDashboardPage() {
  const session = await getCurrentSession();
  if (!session) {
    redirect("/login");
  }

  const db = getDbState();
  const userRecord = db.users.find((u) => u.id === session.userId);

  // Strict patient data isolation: only their own appointments
  const myAppointments = db.appointments.filter(
    (a) =>
      a.patientUserId === session.userId ||
      (userRecord?.phone && a.patientPhone === userRecord.phone)
  );

  const isStaff = STAFF_ROLES.includes(session.role);

  // Filter personal notifications for this patient
  const myNotifications = db.notifications.filter(
    (n) =>
      n.recipient === session.email ||
      (userRecord?.phone && n.recipient === userRecord.phone)
  );

  return (
    <div className="min-h-screen flex flex-col bg-[#f2f2f2]">
      <SiteHeader
        initialUser={{
          id: session.userId,
          email: session.email,
          fullName: session.fullName,
          role: session.role,
        }}
      />

      <main className="flex-1 py-10">
        <div className="mc-container">
          <PatientDashboardClient
            currentUser={{
              userId: session.userId,
              fullName: session.fullName,
              email: session.email,
              phone: userRecord?.phone,
              role: session.role,
            }}
            initialAppointments={myAppointments}
            doctors={db.doctors}
            departments={db.departments}
            branches={db.branches}
            notifications={myNotifications}
            isStaff={isStaff}
          />
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
