import { NextResponse } from "next/server";
import { getDbState } from "@/server/db/store";
import { getSmsLogsForAppointment } from "@/lib/sms/sms-service";
import {
  getPublishedBranches,
  getPublishedDepartments,
  getPublishedDoctors,
} from "@/server/services/publicQueryService";

export const dynamic = "force-dynamic";

export async function GET() {
  const db = getDbState();
  const todayIso = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Dhaka",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());

  const enrichedAppointments = db.appointments.map((apt) => {
    const doctor = db.doctors.find((d) => d.id === apt.doctorId);
    const department = db.departments.find((d) => d.id === apt.departmentId);
    const branch = db.branches.find((b) => b.id === apt.branchId);
    const chamberSched = (db.chamberSchedules ?? []).find(
      (s) => s.doctorId === apt.doctorId && s.branchId === apt.branchId && s.isActive
    );

    return {
      ...apt,
      doctorNameEn: doctor?.nameEn ?? apt.doctorId,
      doctorNameBn: doctor?.nameBn ?? apt.doctorId,
      doctorQualificationsEn: doctor?.qualificationsEn ?? "",
      doctorDesignationEn: doctor?.designationEn ?? "",
      consultationFeeBdt: doctor?.consultationFeeBdt ?? 1000,
      followupFeeBdt: doctor?.followupFeeBdt ?? 700,
      departmentNameEn: department?.nameEn ?? apt.departmentId,
      departmentNameBn: department?.nameBn ?? apt.departmentId,
      branchNameEn: branch?.nameEn ?? apt.branchId,
      branchNameBn: branch?.nameBn ?? apt.branchId,
      chamberRoom: chamberSched?.chamberRoom ?? "Main Consultation Wing",
      smsLogs: getSmsLogsForAppointment(apt.id),
    };
  });

  const todayAppointments = enrichedAppointments.filter((a) => a.preferredDate === todayIso);
  const confirmedCount = enrichedAppointments.filter((a) => a.status === "CONFIRMED").length;
  const pendingCount = enrichedAppointments.filter(
    (a) => a.status === "REQUESTED" || a.status === "RESCHEDULE_REQUESTED"
  ).length;

  const cancelledAppointmentsCount = enrichedAppointments.filter(
    (a) => a.status === "CANCELLED"
  ).length;
  const blockedSlotCount = (db.scheduleOverrides ?? []).reduce((sum, ov) => {
    if (ov.overrideType === "FULL_DAY_LEAVE") return sum + 1;
    return sum + (ov.blockedSlots?.length ?? 0);
  }, 0);

  const flaggedRescheduleAppointments = enrichedAppointments.filter(
    (a) => a.status === "RESCHEDULE_REQUESTED"
  );

  return NextResponse.json({
    ok: true,
    todayIso,
    kpis: {
      todayTotal: todayAppointments.length || enrichedAppointments.length,
      confirmedBookings: confirmedCount,
      pendingRequests: pendingCount,
      cancelledOrBlocked: cancelledAppointmentsCount + blockedSlotCount,
    },
    branches: getPublishedBranches(),
    departments: getPublishedDepartments(),
    doctors: getPublishedDoctors(),
    chamberSchedules: db.chamberSchedules ?? [],
    scheduleOverrides: db.scheduleOverrides ?? [],
    appointments: enrichedAppointments,
    flaggedRescheduleAppointments,
    smsLogs: (db.smsLogs ?? []).slice(0, 50),
  });
}
