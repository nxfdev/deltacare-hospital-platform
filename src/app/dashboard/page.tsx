import React from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  Calendar,
  CheckCircle2,
  Clock,
  User,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";
import { getCurrentSession, STAFF_ROLES } from "@/server/auth/session";
import { getDbState } from "@/server/db/store";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";

export const dynamic = "force-dynamic";

export default async function PatientDashboardPage() {
  const session = await getCurrentSession();
  if (!session) {
    redirect("/login");
  }

  const db = getDbState();
  const userRecord = db.users.find((u) => u.id === session.userId);
  const myAppointments = db.appointments.filter(
    (a) =>
      a.patientUserId === session.userId ||
      (userRecord?.phone && a.patientPhone === userRecord.phone)
  );

  const isStaff = STAFF_ROLES.includes(session.role);

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
        <div className="mc-container space-y-8">
          <div className="bg-[#012d61] text-white rounded-3xl p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-1">
              <p className="text-xs font-bold uppercase tracking-widest text-[#c5e2f9]">
                DeltaCare Patient Portal
              </p>
              <h1 className="mc-serif text-3xl text-white">
                Welcome, {session.fullName}
              </h1>
              <p className="text-sm text-[#e8f0f9]">
                {session.email} • {userRecord?.phone || "Registered Patient"}
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              {isStaff && (
                <Link href="/admin" className="mc-btn-secondary-inverse">
                  <span>Open DeltaCare Admin</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              )}
              <Link href="/request-appointment" className="mc-btn-primary">
                <Calendar className="w-4 h-4" />
                <span>Request New Appointment</span>
              </Link>
            </div>
          </div>

          <section className="bg-white rounded-2xl border border-[#d6d6d6] p-6 md:p-8 space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="mc-serif text-2xl text-[#080808]">
                My Appointment Requests & Bookings ({myAppointments.length})
              </h2>
              <Link
                href="/track-appointment"
                className="text-xs font-bold text-[#004181] underline"
              >
                Lookup by Reference Code
              </Link>
            </div>

            {myAppointments.length === 0 ? (
              <div className="p-8 text-center rounded-xl bg-[#f8fafc] border border-[#d6d6d6] space-y-3">
                <p className="text-sm text-[#686868]">
                  You do not have any appointment requests linked to your account yet.
                </p>
                <Link href="/request-appointment" className="mc-btn-primary">
                  Request an Appointment
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {myAppointments.map((apt) => {
                  const doc = db.doctors.find((d) => d.id === apt.doctorId);
                  const dept = db.departments.find(
                    (d) => d.id === apt.departmentId
                  );
                  const br = db.branches.find((b) => b.id === apt.branchId);

                  return (
                    <div
                      key={apt.id}
                      className="p-5 rounded-2xl border border-[#d6d6d6] hover:border-[#0057b8] transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-4"
                    >
                      <div className="space-y-1.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-bold text-base text-[#004181]">
                            {apt.reference}
                          </span>
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                              apt.status === "CONFIRMED"
                                ? "bg-[#ecfdf5] text-[#065f46]"
                                : "bg-[#fef3c7] text-[#92400e]"
                            }`}
                          >
                            {apt.status === "CONFIRMED" ? (
                              <CheckCircle2 className="w-3.5 h-3.5" />
                            ) : (
                              <Clock className="w-3.5 h-3.5" />
                            )}
                            {apt.status}
                          </span>
                        </div>
                        <p className="font-bold text-lg text-[#080808]">
                          {doc?.nameEn} ({dept?.nameEn})
                        </p>
                        <p className="text-xs text-[#686868]">
                          Branch: {br?.nameEn} • Preferred Date:{" "}
                          <strong>{apt.preferredDate}</strong> at{" "}
                          <strong>{apt.preferredTimeSlot}</strong>
                        </p>
                      </div>

                      <div className="flex items-center gap-3">
                        <Link
                          href={`/appointments/track?reference=${encodeURIComponent(
                            apt.reference
                          )}&phone=${encodeURIComponent(apt.patientPhone)}`}
                          className="mc-btn-secondary text-xs !py-2 !px-4"
                        >
                          View Status History
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl border border-[#d6d6d6] p-6 space-y-2">
              <h3 className="font-bold text-base text-[#080808] flex items-center gap-2">
                <User className="w-5 h-5 text-[#0057b8]" />
                <span>Account Profile & Privacy</span>
              </h3>
              <p className="text-xs text-[#686868]">
                Your DeltaCare Patient Portal stores minimal scheduling contact
                details in accordance with our Data Minimization Policy.
              </p>
            </div>
            <div className="bg-white rounded-2xl border border-[#d6d6d6] p-6 space-y-2">
              <h3 className="font-bold text-base text-[#080808] flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-[#0057b8]" />
                <span>Private Feedback or Callback</span>
              </h3>
              <p className="text-xs text-[#686868]">
                Have feedback about a recent visit or need a staff callback?{" "}
                <Link
                  href="/contact"
                  className="font-bold text-[#004181] underline"
                >
                  Open Patient Relations Desk
                </Link>
              </p>
            </div>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}

