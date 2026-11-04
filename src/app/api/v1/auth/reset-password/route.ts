import { NextRequest, NextResponse } from "next/server";
import { completePasswordReset } from "@/server/services/authRecoveryService";
import {
  buildRateLimitResponse,
  checkRateLimit,
  getClientIdentifier,
} from "@/server/security/rateLimiter";

export async function POST(request: NextRequest) {
  // Rate limiting: 5 requests per 15 minutes per IP
  const clientIp = getClientIdentifier(request);
  const rateLimit = checkRateLimit("auth_reset_password", clientIp, {
    maxRequests: 5,
    windowMs: 15 * 60 * 1000,
  });

  if (!rateLimit.allowed) {
    return buildRateLimitResponse(rateLimit.retryAfterSeconds);
  }

  try {
    const body = await request.json();
    const token = body?.token;
    const newPassword = body?.newPassword;

    if (!token || typeof token !== "string") {
      return NextResponse.json(
        { ok: false, error: "Recovery token is required." },
        { status: 400 }
      );
    }

    if (!newPassword || typeof newPassword !== "string" || newPassword.length < 6) {
      return NextResponse.json(
        { ok: false, error: "New password must be at least 6 characters long." },
        { status: 400 }
      );
    }

    const result = await completePasswordReset(token, newPassword);
    if (!result.ok) {
      return NextResponse.json({ ok: false, error: result.error }, { status: 400 });
    }

    return NextResponse.json(
      {
        ok: true,
        message: "Your password has been successfully reset. Please sign in with your new credentials.",
      },
      { status: 200 }
    );
  } catch {
    return NextResponse.json(
      { ok: false, error: "Unable to complete password reset." },
      { status: 500 }
    );
  }
}

