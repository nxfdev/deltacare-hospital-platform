import { NextResponse } from "next/server";
import { getCurrentSession } from "@/server/auth/session";
import { getDbState } from "@/server/db/store";

export async function GET() {
  const session = await getCurrentSession();
  if (!session) {
    return NextResponse.json({ ok: true, authenticated: false, user: null });
  }
  const db = getDbState();
  const user = db.users.find((u) => u.id === session.userId);
  return NextResponse.json({
    ok: true,
    authenticated: true,
    user: {
      id: session.userId,
      email: session.email,
      fullName: session.fullName,
      role: session.role,
      phone: user?.phone,
    },
  });
}

