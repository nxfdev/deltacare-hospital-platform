import { PrismaClient } from "@prisma/client";
import { getDbState, runInTransaction } from "@/server/db/store";
import {
  DoctorChamberSchedule,
  DoctorScheduleOverride,
  HospitalNotice,
  PatientFeedbackRecord,
  SmsLogRecord,
} from "@/types/domain";

// ============================================================================
// DeltaCare Prisma Client Singleton & Relational Engine
// Uses @prisma/client against PostgreSQL and provides a deterministic
// transactional fallback when local PostgreSQL (localhost:5432) is offline.
// ============================================================================

const globalForPrisma = globalThis as unknown as {
  prismaRaw?: PrismaClient;
};

export const prismaRaw =
  globalForPrisma.prismaRaw ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prismaRaw = prismaRaw;
}

const useLivePostgres = process.env.DELTACARE_USE_LIVE_POSTGRES === "true";

function matchesWhere<T extends Record<string, unknown>>(
  item: T,
  where?: Record<string, unknown>
): boolean {
  if (!where) return true;
  for (const [k, v] of Object.entries(where)) {
    if (v === undefined) continue;
    const actual = item[k];
    if (v !== null && typeof v === "object" && !Array.isArray(v)) {
      const cond = v as Record<string, unknown>;
      if ("in" in cond && Array.isArray(cond.in)) {
        if (!cond.in.includes(actual)) return false;
        continue;
      }
      if ("notIn" in cond && Array.isArray(cond.notIn)) {
        if (cond.notIn.includes(actual)) return false;
        continue;
      }
      if ("contains" in cond && typeof cond.contains === "string") {
        const hay = String(actual ?? "").toLowerCase();
        if (!hay.includes(cond.contains.toLowerCase())) return false;
        continue;
      }
    }
    if (actual !== v) return false;
  }
  return true;
}

export const prisma = {
  $client: prismaRaw,

  async $transaction<T>(fn: (tx: PrismaClient) => Promise<T>): Promise<T> {
    if (useLivePostgres) {
      return prismaRaw.$transaction(async (txClient) => fn(txClient as unknown as PrismaClient));
    }
    return runInTransaction(async () => fn(prismaRaw));
  },

  branch: {
    async findMany(args?: { where?: Record<string, unknown> }) {
      if (useLivePostgres) {
        return prismaRaw.branch.findMany(args as never);
      }
      const state = getDbState();
      return state.branches.filter((b) =>
        matchesWhere(b as unknown as Record<string, unknown>, args?.where)
      );
    },
    async findUnique(args: { where: { id?: string; slug?: string } }) {
      if (useLivePostgres) {
        return prismaRaw.branch.findUnique(args as never);
      }
      const state = getDbState();
      return (
        state.branches.find(
          (b) =>
            (args.where.id && b.id === args.where.id) ||
            (args.where.slug && b.slug === args.where.slug)
        ) ?? null
      );
    },
  },

  department: {
    async findMany(args?: { where?: Record<string, unknown> }) {
      if (useLivePostgres) {
        return prismaRaw.department.findMany(args as never);
      }
      const state = getDbState();
      return state.departments
        .filter((d) =>
          matchesWhere(d as unknown as Record<string, unknown>, args?.where)
        )
        .sort((a, b) => (a.displayOrder ?? 99) - (b.displayOrder ?? 99));
    },
    async findUnique(args: { where: { id?: string; slug?: string } }) {
      if (useLivePostgres) {
        return prismaRaw.department.findUnique(args as never);
      }
      const state = getDbState();
      return (
        state.departments.find(
          (d) =>
            (args.where.id && d.id === args.where.id) ||
            (args.where.slug && d.slug === args.where.slug)
        ) ?? null
      );
    },
  },

  doctor: {
    async findMany(args?: { where?: Record<string, unknown> }) {
      if (useLivePostgres) {
        return prismaRaw.doctor.findMany(args as never);
      }
      const state = getDbState();
      return state.doctors.filter((d) =>
        matchesWhere(d as unknown as Record<string, unknown>, args?.where)
      );
    },
    async findUnique(args: { where: { id?: string; slug?: string } }) {
      if (useLivePostgres) {
        return prismaRaw.doctor.findUnique(args as never);
      }
      const state = getDbState();
      return (
        state.doctors.find(
          (d) =>
            (args.where.id && d.id === args.where.id) ||
            (args.where.slug && d.slug === args.where.slug)
        ) ?? null
      );
    },
  },

  doctorChamberSchedule: {
    async findMany(args?: { where?: Record<string, unknown> }): Promise<DoctorChamberSchedule[]> {
      if (useLivePostgres) {
        return (await prismaRaw.doctorChamberSchedule.findMany(
          args as never
        )) as unknown as DoctorChamberSchedule[];
      }
      const state = getDbState();
      // Dynamically sync from doctor branch assignments as well as state.chamberSchedules
      const synced: DoctorChamberSchedule[] = [...state.chamberSchedules];
      for (const doc of state.doctors) {
        for (const br of doc.branches) {
          if (br.status !== "ACTIVE") continue;
          for (const sr of br.scheduleRules) {
            if (sr.publicationState !== "PUBLISHED") continue;
            const exists = synced.some(
              (cs) =>
                cs.doctorId === doc.id &&
                cs.branchId === br.branchId &&
                cs.dayOfWeek === sr.weekday &&
                cs.startTime === sr.startTime
            );
            if (!exists) {
              synced.push({
                id: `cs-${sr.id}`,
                doctorId: doc.id,
                branchId: br.branchId,
                chamberRoom: br.roomNumber,
                dayOfWeek: sr.weekday,
                startTime: sr.startTime,
                endTime: sr.endTime,
                breakStartTime: doc.id === "doc-9" ? "19:00" : null,
                breakEndTime: doc.id === "doc-9" ? "19:30" : null,
                slotDurationMinutes: sr.slotMinutes || 15,
                isActive: true,
              });
            }
          }
        }
      }
      return synced.filter((cs) =>
        matchesWhere(cs as unknown as Record<string, unknown>, args?.where)
      );
    },
    async create(args: { data: Omit<DoctorChamberSchedule, "id"> & { id?: string } }) {
      if (useLivePostgres) {
        return prismaRaw.doctorChamberSchedule.create(args as never);
      }
      const state = getDbState();
      const record: DoctorChamberSchedule = {
        id: args.data.id ?? `cs-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        doctorId: args.data.doctorId,
        branchId: args.data.branchId,
        chamberRoom: args.data.chamberRoom,
        dayOfWeek: args.data.dayOfWeek,
        startTime: args.data.startTime,
        endTime: args.data.endTime,
        breakStartTime: args.data.breakStartTime ?? null,
        breakEndTime: args.data.breakEndTime ?? null,
        slotDurationMinutes: args.data.slotDurationMinutes ?? 15,
        isActive: args.data.isActive ?? true,
      };
      state.chamberSchedules.push(record);
      return record;
    },
  },

  doctorScheduleOverride: {
    async findMany(args?: { where?: Record<string, unknown> }): Promise<DoctorScheduleOverride[]> {
      if (useLivePostgres) {
        return (await prismaRaw.doctorScheduleOverride.findMany(
          args as never
        )) as unknown as DoctorScheduleOverride[];
      }
      const state = getDbState();
      const combined: DoctorScheduleOverride[] = [...state.scheduleOverrides];
      // Also reflect any ScheduleException stored on doctor.branches
      for (const doc of state.doctors) {
        for (const br of doc.branches) {
          for (const ex of br.scheduleExceptions) {
            const already = combined.some(
              (o) => o.doctorId === doc.id && o.branchId === br.branchId && o.date === ex.dateStr
            );
            if (!already) {
              combined.push({
                id: `ovr-${ex.id}`,
                doctorId: doc.id,
                branchId: br.branchId,
                date: ex.dateStr,
                overrideType:
                  ex.exceptionType === "LEAVE" || ex.exceptionType === "BLOCKED"
                    ? "FULL_DAY_LEAVE"
                    : "CUSTOM_HOURS",
                customStartTime: ex.startsAt,
                customEndTime: ex.endsAt,
                blockedSlots: [],
                reasonEn: ex.reasonEn,
                reasonBn: ex.reasonBn,
                createdByUserId: ex.createdByUserId ?? null,
                createdAt: ex.createdAt,
              });
            }
          }
        }
      }
      return combined.filter((o) =>
        matchesWhere(o as unknown as Record<string, unknown>, args?.where)
      );
    },
    async findFirst(args?: { where?: Record<string, unknown> }): Promise<DoctorScheduleOverride | null> {
      const list = await this.findMany(args);
      return list[0] ?? null;
    },
    async upsert(args: {
      where: { doctorId_branchId_date: { doctorId: string; branchId: string; date: string } };
      create: Omit<DoctorScheduleOverride, "id" | "createdAt"> & { id?: string };
      update: Partial<DoctorScheduleOverride>;
    }): Promise<DoctorScheduleOverride> {
      if (useLivePostgres) {
        return (await prismaRaw.doctorScheduleOverride.upsert(
          args as never
        )) as unknown as DoctorScheduleOverride;
      }
      const state = getDbState();
      const { doctorId, branchId, date } = args.where.doctorId_branchId_date;
      const existing = state.scheduleOverrides.find(
        (o) => o.doctorId === doctorId && o.branchId === branchId && o.date === date
      );
      if (existing) {
        Object.assign(existing, args.update);
        return existing;
      }
      const created: DoctorScheduleOverride = {
        id: args.create.id ?? `ovr-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        doctorId: args.create.doctorId,
        branchId: args.create.branchId,
        date: args.create.date,
        overrideType: args.create.overrideType,
        customStartTime: args.create.customStartTime ?? null,
        customEndTime: args.create.customEndTime ?? null,
        blockedSlots: args.create.blockedSlots ?? [],
        reasonEn: args.create.reasonEn ?? null,
        reasonBn: args.create.reasonBn ?? null,
        createdByUserId: args.create.createdByUserId ?? null,
        createdAt: new Date().toISOString(),
      };
      state.scheduleOverrides.push(created);
      return created;
    },
  },

  appointment: {
    async findMany(args?: { where?: Record<string, unknown> }) {
      if (useLivePostgres) {
        return prismaRaw.appointment.findMany(args as never);
      }
      const state = getDbState();
      const normalized = state.appointments.map((a) => ({
        ...a,
        referenceCode: a.reference,
        appointmentDate: a.preferredDate,
        slotTime: a.preferredTimeSlot,
      }));
      return normalized.filter((a) =>
        matchesWhere(a as unknown as Record<string, unknown>, args?.where)
      );
    },
    async findUnique(args: { where: { id?: string; reference?: string; referenceCode?: string } }) {
      if (useLivePostgres) {
        return prismaRaw.appointment.findUnique(args as never);
      }
      const state = getDbState();
      const found = state.appointments.find(
        (a) =>
          (args.where.id && a.id === args.where.id) ||
          (args.where.reference && a.reference === args.where.reference) ||
          (args.where.referenceCode && a.reference === args.where.referenceCode)
      );
      if (!found) return null;
      return {
        ...found,
        referenceCode: found.reference,
        appointmentDate: found.preferredDate,
        slotTime: found.preferredTimeSlot,
      };
    },
  },

  smsLog: {
    async findMany(args?: { where?: Record<string, unknown> }): Promise<SmsLogRecord[]> {
      if (useLivePostgres) {
        return (await prismaRaw.smsLog.findMany(args as never)) as unknown as SmsLogRecord[];
      }
      const state = getDbState();
      return state.smsLogs.filter((s) =>
        matchesWhere(s as unknown as Record<string, unknown>, args?.where)
      );
    },
    async create(args: { data: Omit<SmsLogRecord, "id" | "sentAt"> & { id?: string; sentAt?: string } }) {
      if (useLivePostgres) {
        return prismaRaw.smsLog.create(args as never);
      }
      const state = getDbState();
      const record: SmsLogRecord = {
        id: args.data.id ?? `sms-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        appointmentId: args.data.appointmentId ?? null,
        recipientPhone: args.data.recipientPhone,
        messageBody: args.data.messageBody,
        eventType: args.data.eventType,
        providerStatus: args.data.providerStatus ?? "SIMULATED",
        sentAt: args.data.sentAt ?? new Date().toISOString(),
      };
      state.smsLogs.unshift(record);
      return record;
    },
  },

  patientFeedback: {
    async findMany(args?: { where?: Record<string, unknown> }): Promise<PatientFeedbackRecord[]> {
      if (useLivePostgres) {
        return (await prismaRaw.patientFeedback.findMany(
          args as never
        )) as unknown as PatientFeedbackRecord[];
      }
      const state = getDbState();
      return state.patientFeedbacks.filter((f) =>
        matchesWhere(f as unknown as Record<string, unknown>, args?.where)
      );
    },
    async create(args: {
      data: Omit<PatientFeedbackRecord, "id" | "createdAt" | "status"> & {
        id?: string;
        status?: "NEW" | "IN_REVIEW" | "RESOLVED";
      };
    }) {
      if (useLivePostgres) {
        return prismaRaw.patientFeedback.create(args as never);
      }
      const state = getDbState();
      const record: PatientFeedbackRecord = {
        id: args.data.id ?? `pfb-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        appointmentId: args.data.appointmentId ?? null,
        doctorId: args.data.doctorId ?? null,
        departmentId: args.data.departmentId ?? null,
        branchId: args.data.branchId ?? null,
        patientName: args.data.patientName,
        patientPhone: args.data.patientPhone,
        category: args.data.category,
        rating: args.data.rating,
        comment: args.data.comment,
        status: args.data.status ?? "NEW",
        adminResponse: args.data.adminResponse ?? null,
        createdAt: new Date().toISOString(),
      };
      state.patientFeedbacks.unshift(record);
      return record;
    },
  },

  hospitalNotice: {
    async findMany(args?: { where?: Record<string, unknown> }): Promise<HospitalNotice[]> {
      if (useLivePostgres) {
        return (await prismaRaw.hospitalNotice.findMany(
          args as never
        )) as unknown as HospitalNotice[];
      }
      const state = getDbState();
      return state.hospitalNotices.filter((n) =>
        matchesWhere(n as unknown as Record<string, unknown>, args?.where)
      );
    },
  },
};

export default prisma;
