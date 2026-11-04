import fs from "fs";
import path from "path";
import { createInitialSeedState, DeltaCareDatabaseState } from "./seedData";
import { AuditEvent, RoleCode } from "@/types/domain";
import { isBcryptHash, migrateLegacyPassword } from "@/server/auth/passwordService";

// ============================================================================
// DeltaCare Transactional Repository & Concurrency Engine
// Provides ACID-like serialized transactions for appointment capacity checks
// and persists state to .data/deltacare-db.json in local/test environments.
// ============================================================================

const DATA_DIR = path.join(process.cwd(), ".data");
const DB_FILE = path.join(DATA_DIR, "deltacare-db.json");

let memoryCache: DeltaCareDatabaseState | null = null;
let txQueue: Promise<unknown> = Promise.resolve();

function sanitizeLoadedState(state: DeltaCareDatabaseState): boolean {
  let modified = false;
  // Migrate any legacy plaintext or demo hashes
  if (Array.isArray(state.users)) {
    for (const u of state.users) {
      if (!isBcryptHash(u.passwordHash)) {
        u.passwordHash = migrateLegacyPassword(u.passwordHash);
        modified = true;
      }
    }
    // Ensure seeded doctor accounts are present
    const seed = createInitialSeedState();
    for (const seedUser of seed.users) {
      if (seedUser.role === "DOCTOR" && !state.users.some((u) => u.id === seedUser.id || u.email === seedUser.email)) {
        state.users.push(seedUser);
        modified = true;
      }
    }
  }
  return modified;
}

function ensureLoaded(): DeltaCareDatabaseState {
  if (memoryCache) {
    return memoryCache;
  }
  try {
    if (fs.existsSync(DB_FILE)) {
      const raw = fs.readFileSync(DB_FILE, "utf8");
      memoryCache = JSON.parse(raw) as DeltaCareDatabaseState;
      const modified = sanitizeLoadedState(memoryCache);
      if (modified) {
        persistToDisk(memoryCache);
      }
      return memoryCache;
    }
  } catch {
    // Fallback to fresh seed if corrupted
  }
  const initial = createInitialSeedState();
  memoryCache = initial;
  persistToDisk(initial);
  return initial;
}

function persistToDisk(state: DeltaCareDatabaseState): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DB_FILE, JSON.stringify(state, null, 2), "utf8");
  } catch {
    // Ignore write errors in read-only edge runtimes
  }
}

export function getDbState(): DeltaCareDatabaseState {
  return ensureLoaded();
}

export function resetDbStateForTests(): DeltaCareDatabaseState {
  const fresh = createInitialSeedState();
  memoryCache = fresh;
  persistToDisk(fresh);
  return fresh;
}

/**
 * Executes a serialized transaction over the database state so concurrent
 * appointment bookings for the final slot cannot double-book (T-APT-02 / R-04).
 */
export async function runInTransaction<T>(
  work: (state: DeltaCareDatabaseState) => Promise<T> | T
): Promise<T> {
  const next = txQueue.then(async () => {
    const state = ensureLoaded();
    const result = await work(state);
    persistToDisk(state);
    return result;
  });
  txQueue = next.catch(() => {});
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

