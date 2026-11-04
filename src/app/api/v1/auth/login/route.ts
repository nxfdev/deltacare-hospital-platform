import { NextRequest, NextResponse } from "next/server";
import { loginSchema } from "@/lib/validation/schemas";
import { getDbState, recordAuditEvent, runInTransaction } from "@/server/db/store";
import { createSessionToken, SESSION_COOKIE_NAME } from "@/server/auth/session";
import { verifyPassword } from "@/server/auth/passwordService";
import {
  buildRateLimitResponse,
  checkRateLimit,
  getClientIdentifier,
} from "@/server/security/rateLimiter";

export async function POST(request: NextRequest) {
  // Stricter rate limiting for authentication: 5 attempts per 15 minutes per IP
  const clientIp = getClientIdentifier(request);
  const rateLimit = checkRateLimit("auth_login", clientIp, {
    maxRequests: 5,
    windowMs: 15 * 60 * 1000,
  });

  if (!rateLimit.allowed) {
    return buildRateLimitResponse(rateLimit.retryAfterSeconds);
  }

  try {
    const body = await request.json();
    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          ok: false,
          error: parsed.error.issues[0]?.message ?? "Invalid email or password format.",
        },
        { status: 400 }
      );
    }

    const db = getDbState();
    const emailLower = parsed.data.email.toLowerCase();
    const user = db.users.find((u) => u.email.toLowerCase() === emailLower);

    const isPasswordValid = user
      ? await verifyPassword(parsed.data.password, user.passwordHash)
      : false;

    if (!user || !user.isActive || !isPasswordValid) {
      return NextResponse.json(
        {
          ok: false,
          error: "Invalid email or password, or account is inactive.",
        },
        { status: 401 }
      );
    }

    const token = createSessionToken(user);

    await runInTransaction((state) => {
      recordAuditEvent(state, {
        actorUserId: user.id,
        actorName: user.fullName,
        actorRole: user.role,
        action: "AUTH_LOGIN_SUCCESS",
        entityType: "UserAccount",
        entityId: user.id,
        summary: `User ${user.email} (${user.role}) signed in.`,
      });
    });

    const response = NextResponse.json({
      ok: true,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        phone: user.phone,
      },
    });

    response.cookies.set(SESSION_COOKIE_NAME, token, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
  } catch {
    return NextResponse.json(
      { ok: false, error: "Authentication service error." },
      { status: 500 }
    );
  }
}
