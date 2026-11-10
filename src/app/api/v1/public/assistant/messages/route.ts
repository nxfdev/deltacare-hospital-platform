import { NextRequest, NextResponse } from "next/server";
import { assistantMessageSchema } from "@/lib/validation/schemas";
import { processPatientAssistantQuery, AssistantReply } from "@/server/services/assistantService";
import { askAssistantLlm } from "@/server/services/assistantLlmClient";
import {
  buildRateLimitResponse,
  checkRateLimit,
  getClientIdentifier,
} from "@/server/security/rateLimiter";

export async function POST(request: NextRequest) {
  // Public AI assistant rate limiting: 20 queries per 1 minute per IP
  const clientIp = getClientIdentifier(request);
  const rateLimit = checkRateLimit("public_assistant_message", clientIp, {
    maxRequests: 20,
    windowMs: 60 * 1000,
  });

  if (!rateLimit.allowed) {
    return buildRateLimitResponse(rateLimit.retryAfterSeconds);
  }

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

    const { history, ...queryParams } = parsed.data;
    const llmAnswer = await askAssistantLlm({
      message: queryParams.message,
      locale: queryParams.locale,
      history,
    });

    let reply: AssistantReply;
    if (llmAnswer) {
      const bn = queryParams.locale === "bn";
      reply = {
        answer: llmAnswer,
        disclosure: bn
          ? "এভারকেয়ার সহায়ক — এটি চিকিৎসা পরামর্শ নয়। জরুরি প্রয়োজনে ১০৬৬৬ নম্বরে কল করুন।"
          : "Evercare Assistant — not medical advice. In an emergency call 10666.",
        intentCategory: "DOCTOR_LOOKUP",
        wasClinicalRefusal: false,
        wasAbstained: false,
        citations: [],
        suggestedActions: [{ label: bn ? "অ্যাপয়েন্টমেন্ট নিন" : "Book an appointment", href: "/appointments" }],
      };
    } else {
      reply = await processPatientAssistantQuery(queryParams);
    }
    return NextResponse.json({
      ok: true,
      reply,
    });
  } catch {
    return NextResponse.json(
      { ok: false, error: "Evercare Assistant encountered an error." },
      { status: 500 }
    );
  }
}

