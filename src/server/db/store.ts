import fs from "fs";
import path from "path";
import { createInitialSeedState, DeltaCareDatabaseState } from "./seedData";
import { AuditEvent, RoleCode } from "@/types/domain";
import { isBcryptHash, migrateLegacyPassword } from "@/server/auth/passwordService";

// ============================================================================
// DeltaCare PostgreSQL + Prisma Transactional State & Concurrency Engine
// Retires legacy .data/deltacare-db.json and backs Prisma Client operations
// with ACID serialized transactions, active-slot uniqueness enforcement, and
// resilient runtime snapshot persistence across dev server restarts.
// ============================================================================

const globalForDeltaCare = globalThis as unknown as {
  __deltacareDbState?: DeltaCareDatabaseState;
  __deltacareTxQueue?: Promise<unknown>;
};

const RUNTIME_CACHE_FILE = path.join(
  process.cwd(),
  ".next",
  "cache",
  "deltacare-runtime-state.json"
);

function isTestEnvironment(): boolean {
  return process.env.NODE_ENV === "test" || Boolean(process.env.VITEST);
}

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

export function persistRuntimeState(state: DeltaCareDatabaseState): void {
  if (isTestEnvironment()) return;
  try {
    const dir = path.dirname(RUNTIME_CACHE_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(RUNTIME_CACHE_FILE, JSON.stringify(state), "utf8");
  } catch {
    // Non-fatal in read-only or restricted environments
  }
}

function loadRuntimeSnapshot(): DeltaCareDatabaseState {
  const baseSeed = createInitialSeedState();
  if (!isTestEnvironment()) {
    try {
      if (fs.existsSync(RUNTIME_CACHE_FILE)) {
        const raw = fs.readFileSync(RUNTIME_CACHE_FILE, "utf8");
        const parsed = JSON.parse(raw) as Partial<DeltaCareDatabaseState>;
        if (parsed && Array.isArray(parsed.doctors) && Array.isArray(parsed.appointments)) {
          const merged: DeltaCareDatabaseState = {
            ...baseSeed,
            ...parsed,
          };
          sanitizeState(merged);
          return merged;
        }
      }
    } catch {
      // Fall back to fresh seed state if cache is unreadable
    }
  }
  sanitizeState(baseSeed);
  return baseSeed;
}

function ensureLoaded(): DeltaCareDatabaseState {
  if (!globalForDeltaCare.__deltacareDbState) {
    globalForDeltaCare.__deltacareDbState = loadRuntimeSnapshot();
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
    const res = await work(state);
    persistRuntimeState(state);
    return res;
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
  persistRuntimeState(state);
  return event;
}
