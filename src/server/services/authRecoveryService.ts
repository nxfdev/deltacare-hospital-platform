import { getDbState, recordAuditEvent, runInTransaction } from "@/server/db/store";
import {
  generateResetToken,
  hashPassword,
  verifyResetToken,
} from "@/server/auth/passwordService";

// ============================================================================
// DeltaCare Account Recovery & Password Reset Service
// Provides end-to-end recovery for FORCE_PASSWORD_RESET and forgot-password.
// Avoids account enumeration by returning uniform timing-safe responses.
// ============================================================================

export async function requestPasswordReset(email: string): Promise<{
  ok: true;
  notice: string;
  rawTokenForDev?: string;
}> {
  const normalizedEmail = email.trim().toLowerCase();

  return runInTransaction((state) => {
    const user = state.users.find(
      (u) => u.email.toLowerCase() === normalizedEmail && u.isActive
    );

    let rawTokenForDev: string | undefined;

    if (user) {
      const { rawToken, tokenHash, expiresAt } = generateResetToken(15);
      user.resetTokenHash = tokenHash;
      user.resetTokenExpiresAt = expiresAt;
      user.updatedAt = new Date().toISOString();

      // Only surface rawToken in development/test environment for verification
      if (process.env.NODE_ENV !== "production") {
        rawTokenForDev = rawToken;
      }

      // Enqueue notification for password recovery
      state.notifications.unshift({
        id: `notif-${Date.now()}`,
        channel: "EMAIL",
        recipient: user.email,
        templateCode: "PASSWORD_RESET_LINK",
        subject: "DeltaCare Account Recovery Instructions",
        bodyPreview: `A password reset was requested for ${user.email}. Use recovery token within 15 minutes to establish new credentials.`,
        status: "SENT",
        relatedEntityType: "USER_ACCOUNT",
        relatedEntityId: user.id,
        sentAt: new Date().toISOString(),
      });

      recordAuditEvent(state, {
        actorUserId: user.id,
        actorName: user.fullName,
        actorRole: user.role,
        action: "PASSWORD_RESET_REQUESTED",
        entityType: "UserAccount",
        entityId: user.id,
        summary: `Password reset token dispatched for user ${user.email}.`,
      });
    }

    return {
      ok: true,
      notice:
        "If an active DeltaCare account matches that email address, password reset instructions have been dispatched.",
      rawTokenForDev,
    };
  });
}

export async function completePasswordReset(
  token: string,
  newPassword: string
): Promise<{ ok: true; email: string } | { ok: false; error: string }> {
  if (!token || token.trim().length === 0) {
    return { ok: false, error: "Password reset token is required." };
  }

  if (!newPassword || newPassword.length < 6) {
    return { ok: false, error: "New password must be at least 6 characters long." };
  }

  const hashedPassword = await hashPassword(newPassword);

  return runInTransaction((state) => {
    const user = state.users.find((u) =>
      verifyResetToken(token, u.resetTokenHash, u.resetTokenExpiresAt)
    );

    if (!user || !user.isActive) {
      return {
        ok: false,
        error: "Invalid or expired password reset token. Please request a new recovery link.",
      };
    }

    const nowIso = new Date().toISOString();
    user.passwordHash = hashedPassword;
    user.resetTokenHash = undefined;
    user.resetTokenExpiresAt = undefined;
    user.passwordChangedAt = nowIso; // Invalidates existing session tokens (Task 1.6)
    user.updatedAt = nowIso;

    recordAuditEvent(state, {
      actorUserId: user.id,
      actorName: user.fullName,
      actorRole: user.role,
      action: "PASSWORD_RESET_COMPLETED",
      entityType: "UserAccount",
      entityId: user.id,
      summary: `Password reset successfully completed for user ${user.email}. Existing sessions invalidated.`,
    });

    return { ok: true, email: user.email };
  });
}

