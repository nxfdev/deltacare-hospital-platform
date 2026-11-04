import { NextRequest, NextResponse } from "next/server";
import { feedbackSubmissionSchema } from "@/lib/validation/schemas";
import { createFeedbackSubmission } from "@/server/services/communicationAndAnalyticsService";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = feedbackSubmissionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          ok: false,
          error: parsed.error.issues[0]?.message ?? "Please check your feedback submission fields.",
          issues: parsed.error.issues,
        },
        { status: 400 }
      );
    }

    const feedback = await createFeedbackSubmission(parsed.data);
    return NextResponse.json(
      {
        ok: true,
        notice:
          "Your feedback/complaint has been logged privately for internal Patient Relations review. It will never be displayed publicly.",
        feedback: {
          reference: feedback.reference,
          type: feedback.type,
          category: feedback.category,
          status: feedback.status,
          createdAt: feedback.createdAt,
        },
      },
      { status: 201 }
    );
  } catch {
    return NextResponse.json(
      { ok: false, error: "Unable to submit feedback." },
      { status: 500 }
    );
  }
}

