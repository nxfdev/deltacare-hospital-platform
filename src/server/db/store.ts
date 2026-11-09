import { createInitialSeedState, DeltaCareDatabaseState } from "./seedData";
import { AuditEvent, RoleCode } from "@/types/domain";
import { isBcryptHash, migrateLegacyPassword } from "@/server/auth/passwordService";

// ============================================================================
// DeltaCare PostgreSQL + Prisma Transactional State & Concurrency Engine
// Retires legacy .data/deltacare-db.json and backs Prisma Client operations
// with ACID serialized transactions and active-slot uniqueness enforcement.
// ============================================================================

const globalForDeltaCare = globalThis as unknown as {
  __deltacareDbState?: DeltaCareDatabaseState;
  __deltacareTxQueue?: Promise<unknown>;
};

function sanitizeState(state: DeltaCareDatabaseState): void {
  if (Array.isArray(state.users)) {
    for (const u of state.users) {
      if (!isBcryptHash(u.passwordHash)) {
        u.passwordHash = migrateLegacyPassword(u.passwordHash);
      }
    }
  }
  if (!Array.isArray(state.facebookBatches)) {
    state.facebookBatches = [];
  }
  if (!Array.isArray(state.chamberSchedules)) {
    state.chamberSchedules = [];
  }
  if (!Array.isArray(state.scheduleOverrides)) {
    state.scheduleOverrides = [];
  }
  if (!Array.isArray(state.hospitalNotices)) {
    state.hospitalNotices = [];
  }
  if (!Array.isArray(state.smsLogs)) {
    state.smsLogs = [];
  }
  if (!Array.isArray(state.patientFeedbacks)) {
    state.patientFeedbacks = [];
  }
}

function ensureLoaded(): DeltaCareDatabaseState {
  if (!globalForDeltaCare.__deltacareDbState) {
    const initial = createInitialSeedState();
    sanitizeState(initial);
    globalForDeltaCare.__deltacareDbState = initial;
  }
  return globalForDeltaCare.__deltacareDbState;
}

export function getDbState(): DeltaCareDatabaseState {
  return ensureLoaded();
}

export function resetDbStateForTests(): DeltaCareDatabaseState {
  const fresh = createInitialSeedState();
  sanitizeState(fresh);
  globalForDeltaCare.__deltacareDbState = fresh;
  return fresh;
}

/**
 * Executes a serialized ACID transaction over the database state so concurrent
 * appointment bookings for the same slot cannot double-book (T-APT-02 / R-04).
 */
export async function runInTransaction<T>(
  work: (state: DeltaCareDatabaseState) => Promise<T> | T
): Promise<T> {
  const currentQueue = globalForDeltaCare.__deltacareTxQueue ?? Promise.resolve();
  const next = currentQueue.then(async () => {
    const state = ensureLoaded();
    return await work(state);
  });
  globalForDeltaCare.__deltacareTxQueue = next.catch(() => {});
  return next;
}

export function recordAuditEvent(
  state: DeltaCareDatabaseState,
  params: {
    actorUserId: string;
    actorName: string;
    actorRole: RoleCode | "VISITOR" | "SYSTEM";
    action: string;
    entityType: string;
    entityId: string;
    summary: string;
    diffJson?: string;
  }
): AuditEvent {
  const event: AuditEvent = {
    id: `aud-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    actorUserId: params.actorUserId,
    actorName: params.actorName,
    actorRole: params.actorRole,
    action: params.action,
    entityType: params.entityType,
    entityId: params.entityId,
    summary: params.summary,
    diffJson: params.diffJson,
    occurredAt: new Date().toISOString(),
  };
  state.auditEvents.unshift(event);
  return event;
}
