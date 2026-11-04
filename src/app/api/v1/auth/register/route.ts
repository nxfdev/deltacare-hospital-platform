import { NextRequest, NextResponse } from "next/server";
import { registerSchema } from "@/lib/validation/schemas";
import { recordAuditEvent, runInTransaction } from "@/server/db/store";
import { createSessionToken, SESSION_COOKIE_NAME } from "@/server/auth/session";
import { UserAccount } from "@/types/domain";
import { hashPassword } from "@/server/auth/passwordService";
import {
  buildRateLimitResponse,
  checkRateLimit,
  getClientIdentifier,
} from "@/server/security/rateLimiter";

export async function POST(request: NextRequest) {
  // Stricter rate limiting for registration: 5 attempts per 15 minutes per IP
  const clientIp = getClientIdentifier(request);
  const rateLimit = checkRateLimit("auth_register", clientIp, {
    maxRequests: 5,
    windowMs: 15 * 60 * 1000,
  });

  if (!rateLimit.allowed) {
    return buildRateLimitResponse(rateLimit.retryAfterSeconds);
  }

  try {
    const body = await request.json();
    const parsed = registerSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          ok: false,
          error: parsed.error.issues[0]?.message ?? "Please check your registration details.",
          issues: parsed.error.issues,
        },
        { status: 400 }
      );
    }

    const hashedPassword = await hashPassword(parsed.data.password);

    const result = await runInTransaction((state) => {
      const emailLower = parsed.data.email.toLowerCase();
      const exists = state.users.some((u) => u.email.toLowerCase() === emailLower);
      if (exists) {
        return { ok: false as const, error: "An account with this email already exists." };
      }

      const nowIso = new Date().toISOString();
      const newUser: UserAccount = {
        id: `usr-${Date.now()}`,
        email: emailLower,
        fullName: parsed.data.fullName,
        phone: parsed.data.phone,
        passwordHash: hashedPassword,
        role: "PATIENT",
        isActive: true,
        mfaEnabled: false,
        createdAt: nowIso,
        updatedAt: nowIso,
      };

      state.users.push(newUser);

      recordAuditEvent(state, {
        actorUserId: newUser.id,
        actorName: newUser.fullName,
        actorRole: "PATIENT",
        action: "PATIENT_REGISTERED",
        entityType: "UserAccount",
        entityId: newUser.id,
        summary: `Registered patient account ${newUser.email}`,
      });

      return { ok: true as const, user: newUser };
    });

    if (!result.ok) {
      return NextResponse.json({ ok: false, error: result.error }, { status: 409 });
    }

    const token = createSessionToken(result.user);
    const response = NextResponse.json(
      {
        ok: true,
        user: {
          id: result.user.id,
          email: result.user.email,
          fullName: result.user.fullName,
          role: result.user.role,
          phone: result.user.phone,
        },
      },
      { status: 201 }
    );

    response.cookies.set(SESSION_COOKIE_NAME, token, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
  } catch {
    return NextResponse.json(
      { ok: false, error: "Registration service error." },
      { status: 500 }
    );
  }
}

