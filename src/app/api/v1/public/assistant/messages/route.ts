import { NextRequest, NextResponse } from "next/server";
import { assistantMessageSchema } from "@/lib/validation/schemas";
import { processPatientAssistantQuery } from "@/server/services/assistantService";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = assistantMessageSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          ok: false,
          error: parsed.error.issues[0]?.message ?? "Please enter a valid question.",
        },
        { status: 400 }
      );
    }

    const reply = await processPatientAssistantQuery(parsed.data);
    return NextResponse.json({
      ok: true,
      reply,
    });
  } catch {
    return NextResponse.json(
      { ok: false, error: "DeltaCare Assistant encountered an error." },
      { status: 500 }
    );
  }
}

