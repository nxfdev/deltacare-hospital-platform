import { NextRequest, NextResponse } from "next/server";
import { requestPasswordReset } from "@/server/services/authRecoveryService";
import {
  buildRateLimitResponse,
  checkRateLimit,
  getClientIdentifier,
} from "@/server/security/rateLimiter";

export async function POST(request: NextRequest) {
  // Rate limiting: 5 requests per 15 minutes per IP
  const clientIp = getClientIdentifier(request);
  const rateLimit = checkRateLimit("auth_forgot_password", clientIp, {
    maxRequests: 5,
    windowMs: 15 * 60 * 1000,
  });

  if (!rateLimit.allowed) {
    return buildRateLimitResponse(rateLimit.retryAfterSeconds);
  }

  try {
    const body = await request.json();
    const email = body?.email;
    if (!email || typeof email !== "string" || !email.includes("@")) {
      return NextResponse.json(
        { ok: false, error: "Please enter a valid registered email address." },
        { status: 400 }
      );
    }

    const result = await requestPasswordReset(email);
    return NextResponse.json(result, { status: 200 });
  } catch {
    return NextResponse.json(
      { ok: false, error: "Unable to process password reset request." },
      { status: 500 }
    );
  }
}

