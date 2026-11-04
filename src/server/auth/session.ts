import crypto from "crypto";
import { cookies } from "next/headers";
import { RoleCode, UserAccount } from "@/types/domain";
import { getDbState } from "@/server/db/store";
import { APPROVER_ROLES, STAFF_ROLES, ADMIN_CONSOLE_ROLES } from "@/lib/auth/roles";

export { APPROVER_ROLES, STAFF_ROLES, ADMIN_CONSOLE_ROLES };

// ============================================================================
// DeltaCare Authentication & Server-Side RBAC Guard (Single Auth System)
// Enforces server-side permissions on all admin mutations & routes (NFR-06)
// ============================================================================

export const SESSION_COOKIE_NAME = "deltacare_session";

const SECRET_KEY =
  process.env.AUTH_SECRET || "deltacare-dev-secret-key-at-least-32-bytes-long";

export interface SessionPayload {
  userId: string;
  email: string;
  fullName: string;
  role: RoleCode;
  doctorProfileId?: string;
  scopedBranchId?: string;
  scopedDepartmentId?: string;
  iat?: number;
  exp: number;
}

export function createSessionToken(user: UserAccount): string {
  const now = Date.now();
  const payload: SessionPayload = {
    userId: user.id,
    email: user.email,
    fullName: user.fullName,
    role: user.role,
    doctorProfileId: user.doctorProfileId,
    scopedBranchId: user.scopedBranchId,
    scopedDepartmentId: user.scopedDepartmentId,
    iat: now,
    exp: now + 1000 * 60 * 60 * 24 * 7, // 7 days
  };
  const data = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
  const sig = crypto
    .createHmac("sha256", SECRET_KEY)
    .update(data)
    .digest("base64url");
  return `${data}.${sig}`;
}

export function verifySessionToken(token: string | undefined): SessionPayload | null {
  if (!token || !token.includes(".")) return null;
  const [data, sig] = token.split(".");
  if (!data || !sig) return null;
  const expectedSig = crypto
    .createHmac("sha256", SECRET_KEY)
    .update(data)
    .digest("base64url");
  if (sig !== expectedSig) return null;
  try {
    const payload = JSON.parse(
      Buffer.from(data, "base64url").toString("utf8")
    ) as SessionPayload;
    if (Date.now() > payload.exp) return null;
    // Verify user is still active in store
    const db = getDbState();
    const user = db.users.find((u) => u.id === payload.userId);
    if (!user || !user.isActive) return null;

    // Password change session revocation (Task 1.6)
    if (user.passwordChangedAt && payload.iat) {
      const changedMs = new Date(user.passwordChangedAt).getTime();
      if (payload.iat < changedMs) {
        return null; // Session invalidated due to password change
      }
    }

    return {
      ...payload,
      role: user.role,
      doctorProfileId: user.doctorProfileId,
      scopedBranchId: user.scopedBranchId,
      scopedDepartmentId: user.scopedDepartmentId,
    };
  } catch {
    return null;
  }
}

export async function getCurrentSession(): Promise<SessionPayload | null> {
  try {
    const cookieStore = await cookies();
    const raw = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    return verifySessionToken(raw);
  } catch {
    return null;
  }
}

export function hasRolePermission(
  session: SessionPayload | null,
  allowedRoles: RoleCode[]
): boolean {
  if (!session) return false;
  return allowedRoles.includes(session.role);
}
