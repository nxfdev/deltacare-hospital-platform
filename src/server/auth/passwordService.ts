import bcrypt from "bcryptjs";
import crypto from "crypto";

// ============================================================================
// Evercare Centralized Password Hashing & Verification Security Service
// Uses bcrypt (work factor 10) for secure, salted cryptographic hashing.
// Rejects all plaintext and insecure legacy demo hashes during verification.
// ============================================================================

const BCRYPT_SALT_ROUNDS = 10;
const BCRYPT_REGEX = /^\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53}$/;

/**
 * Validates if a string is a standard bcrypt hash.
 */
export function isBcryptHash(hash: unknown): boolean {
  return typeof hash === "string" && BCRYPT_REGEX.test(hash);
}

/**
 * Securely hashes a plaintext password using bcrypt.
 * Enforces a minimum password length of 6 characters.
 */
export async function hashPassword(plainPassword: string): Promise<string> {
  if (!plainPassword || plainPassword.length < 6) {
    throw new Error("Password must be at least 6 characters long.");
  }
  return bcrypt.hash(plainPassword, BCRYPT_SALT_ROUNDS);
}

/**
 * Synchronous variant for initialization / seeding.
 */
export function hashPasswordSync(plainPassword: string): string {
  if (!plainPassword || plainPassword.length < 6) {
    throw new Error("Password must be at least 6 characters long.");
  }
  return bcrypt.hashSync(plainPassword, BCRYPT_SALT_ROUNDS);
}

/**
 * Verifies a plaintext password against a stored bcrypt hash.
 * Insecure legacy credentials (plaintext, demo-hash:) are strictly rejected.
 * Never logs passwords or hashes.
 */
export async function verifyPassword(
  plainPassword: string,
  storedHash: string | undefined | null
): Promise<boolean> {
  if (!plainPassword || !storedHash) {
    return false;
  }

  // Strictly enforce that stored hash is a genuine bcrypt hash
  if (!isBcryptHash(storedHash)) {
    return false;
  }

  try {
    return await bcrypt.compare(plainPassword, storedHash);
  } catch {
    return false;
  }
}

/**
 * Migrates existing synthetic demo accounts safely to bcrypt.
 * If the value is already a bcrypt hash, it is returned untouched.
 * If it is an identifiable legacy demo format ("Evercare#2026" or "demo-hash:<password>"),
 * it is migrated to a secure bcrypt hash.
 * For unmigratable or unknown plaintext, a forced password reset token is assigned.
 */
export function migrateLegacyPassword(legacyHashOrPlaintext: string): string {
  if (isBcryptHash(legacyHashOrPlaintext)) {
    return legacyHashOrPlaintext;
  }

  if (legacyHashOrPlaintext === "Evercare#2026") {
    return hashPasswordSync("Evercare#2026");
  }

  if (legacyHashOrPlaintext.startsWith("demo-hash:")) {
    const raw = legacyHashOrPlaintext.slice("demo-hash:".length);
    if (raw.length >= 6) {
      return hashPasswordSync(raw);
    }
  }

  // Force password reset if legacy credential cannot be safely migrated
  return `FORCE_PASSWORD_RESET:${crypto.randomUUID()}`;
}

/**
 * Generates a cryptographically random password reset token and its SHA-256 hash.
 * Only the SHA-256 hash is persisted in database storage.
 */
export function generateResetToken(validityMinutes: number = 15): {
  rawToken: string;
  tokenHash: string;
  expiresAt: number;
} {
  const rawToken = crypto.randomBytes(32).toString("hex");
  const tokenHash = hashResetToken(rawToken);
  const expiresAt = Date.now() + validityMinutes * 60 * 1000;
  return { rawToken, tokenHash, expiresAt };
}

/**
 * Hashes a raw reset token with SHA-256 for secure comparison.
 */
export function hashResetToken(rawToken: string): string {
  return crypto.createHash("sha256").update(rawToken.trim()).digest("hex");
}

/**
 * Validates a raw reset token against a stored hash and expiration timestamp.
 */
export function verifyResetToken(
  rawToken: string,
  storedHash: string | undefined | null,
  expiresAt: number | undefined | null
): boolean {
  if (!rawToken || !storedHash || !expiresAt) return false;
  if (Date.now() > expiresAt) return false;
  const computedHash = hashResetToken(rawToken);
  // Constant-time buffer comparison to prevent timing attacks
  try {
    const a = Buffer.from(computedHash, "hex");
    const b = Buffer.from(storedHash, "hex");
    if (a.length !== b.length) return false;
    return crypto.timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

