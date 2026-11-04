import { NextRequest, NextResponse } from "next/server";
import { loginSchema } from "@/lib/validation/schemas";
import { getDbState, recordAuditEvent, runInTransaction } from "@/server/db/store";
import { createSessionToken, SESSION_COOKIE_NAME } from "@/server/auth/session";

export async function POST(request: NextRequest) {
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

    const isPasswordValid =
      user &&
      (user.passwordHash === parsed.data.password ||
        user.passwordHash === `demo-hash:${parsed.data.password}`);

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
