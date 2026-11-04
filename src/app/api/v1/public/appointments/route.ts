import { NextRequest, NextResponse } from "next/server";
import { appointmentRequestSchema } from "@/lib/validation/schemas";
import { createAppointmentRequest } from "@/server/services/appointmentService";
import { getCurrentSession } from "@/server/auth/session";
import { getDbState } from "@/server/db/store";
import {
  buildRateLimitResponse,
  checkRateLimit,
  getClientIdentifier,
} from "@/server/security/rateLimiter";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const reference = searchParams.get("reference")?.trim().toUpperCase();
  const phone = searchParams.get("phone")?.trim();

  if (!reference || !phone) {
    return NextResponse.json(
      {
        ok: false,
        error: "Both reference code (e.g. DC-2026-1041) and registered phone number are required.",
      },
      { status: 400 }
    );
  }

  const db = getDbState();
  const normalizedPhone = phone.replace(/^\+?88/, "");
  const apt = db.appointments.find(
    (a) =>
      a.reference.toUpperCase() === reference &&
      a.patientPhone.replace(/^\+?88/, "") === normalizedPhone
  );

  if (!apt) {
    return NextResponse.json(
      {
        ok: false,
        error: "No appointment record found matching that reference code and phone number.",
      },
      { status: 404 }
    );
  }

  // Cross-patient privacy check: If user is authenticated as PATIENT, prevent accessing other patients' records
  const session = await getCurrentSession();
  if (session && session.role === "PATIENT") {
    if (apt.patientUserId && apt.patientUserId !== session.userId) {
      return NextResponse.json(
        {
          ok: false,
          error: "Forbidden: You cannot access appointment records belonging to another patient.",
        },
        { status: 403 }
      );
    }
  }

  const doctor = db.doctors.find((d) => d.id === apt.doctorId);
  const department = db.departments.find((d) => d.id === apt.departmentId);
  const branch = db.branches.find((b) => b.id === apt.branchId);

  return NextResponse.json({
    ok: true,
    appointment: {
      ...apt,
      doctorNameEn: doctor?.nameEn ?? apt.doctorId,
      doctorNameBn: doctor?.nameBn ?? apt.doctorId,
      departmentNameEn: department?.nameEn ?? apt.departmentId,
      departmentNameBn: department?.nameBn ?? apt.departmentId,
      branchNameEn: branch?.nameEn ?? apt.branchId,
      branchNameBn: branch?.nameBn ?? apt.branchId,
    },
  });
}

export async function POST(request: NextRequest) {
  // Public appointment creation rate limiting: 10 requests per 15 minutes per IP
  const clientIp = getClientIdentifier(request);
  const rateLimit = checkRateLimit("public_appointment_submission", clientIp, {
    maxRequests: 10,
    windowMs: 15 * 60 * 1000,
  });

  if (!rateLimit.allowed) {
    return buildRateLimitResponse(rateLimit.retryAfterSeconds);
  }

  try {
    const body = await request.json();
    const parsed = appointmentRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          ok: false,
          error: parsed.error.issues[0]?.message ?? "Invalid appointment request input.",
          issues: parsed.error.issues,
        },
        { status: 400 }
      );
    }

    const session = await getCurrentSession();
    const result = await createAppointmentRequest(parsed.data, session?.userId);

    if (!result.ok) {
      return NextResponse.json({ ok: false, error: result.error }, { status: 409 });
    }

    return NextResponse.json(
      {
        ok: true,
        notice:
          "Request Received (Pending Front-Desk Confirmation). This request is NOT a confirmed appointment until verified by DeltaCare staff.",
        appointment: result.appointment,
      },
      { status: 201 }
    );
  } catch {
    return NextResponse.json(
      { ok: false, error: "Unable to process appointment request." },
      { status: 500 }
    );
  }
}

