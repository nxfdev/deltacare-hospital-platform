import { NextRequest, NextResponse } from "next/server";
import { contactRequestSchema } from "@/lib/validation/schemas";
import { createContactRequest } from "@/server/services/communicationAndAnalyticsService";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = contactRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          ok: false,
          error: parsed.error.issues[0]?.message ?? "Please check your contact form fields.",
          issues: parsed.error.issues,
        },
        { status: 400 }
      );
    }

    const contactRequest = await createContactRequest(parsed.data);
    return NextResponse.json(
      {
        ok: true,
        contactRequest,
      },
      { status: 201 }
    );
  } catch {
    return NextResponse.json(
      { ok: false, error: "Unable to submit contact request." },
      { status: 500 }
    );
  }
}

