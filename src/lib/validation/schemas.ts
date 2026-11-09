import { z } from "zod";

// ============================================================================
// DeltaCare Hospital Platform — Runtime Validation Schemas (Zod)
// ============================================================================

export const bangladeshPhoneRegex = /^(?:\+?8801|01)[3-9]\d{8}$/;

export const appointmentRequestSchema = z.object({
  departmentId: z.string().min(1, "Please select a department / অনুগ্রহ করে বিভাগ নির্বাচন করুন"),
  doctorId: z.string().min(1, "Please select a doctor / অনুগ্রহ করে চিকিৎসক নির্বাচন করুন"),
  branchId: z.string().min(1, "Please select a branch / অনুগ্রহ করে শাখা নির্বাচন করুন"),
  preferredDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Valid date (YYYY-MM-DD) is required"),
  preferredTimeSlot: z
    .string()
    .regex(/^\d{2}:\d{2}$/, "Please select a preferred time slot"),
  visitType: z
    .enum(["NEW_CONSULTATION", "FOLLOW_UP", "NEW_VISIT", "REPORT_SHOW"])
    .default("NEW_CONSULTATION"),
  bookingSource: z
    .enum(["ONLINE_WEBSITE", "FRONT_DESK_PHONE", "WALK_IN_DESK"])
    .optional(),
  patientName: z
    .string()
    .trim()
    .min(2, "Full name is required (minimum 2 characters)")
    .max(100, "Name is too long"),
  patientPhone: z
    .string()
    .trim()
    .regex(
      bangladeshPhoneRegex,
      "Enter a valid Bangladesh mobile number (e.g. 01711223344 or +8801711223344)"
    ),
  patientAge: z.coerce.number().int().min(0).max(120).optional(),
  patientGender: z.enum(["MALE", "FEMALE", "OTHER"]).optional().or(z.literal("")),
  patientEmail: z
    .string()
    .trim()
    .email("Enter a valid email address")
    .optional()
    .or(z.literal("")),
  reasonNote: z
    .string()
    .trim()
    .max(500, "Brief note must be under 500 characters (do not include sensitive clinical records)")
    .optional(),
  symptomsNote: z
    .string()
    .trim()
    .max(500)
    .optional(),
  consentAccepted: z.literal(true, {
    errorMap: () => ({
      message: "You must acknowledge the privacy notice and appointment request policy",
    }),
  }),
});

export type AppointmentRequestInput = z.infer<typeof appointmentRequestSchema>;

export const appointmentStatusUpdateSchema = z.object({
  toStatus: z.enum([
    "REQUESTED",
    "PENDING_CONFIRMATION",
    "CONFIRMED",
    "RESCHEDULE_REQUESTED",
    "CANCELLED",
    "COMPLETED",
    "NO_SHOW",
  ]),
  preferredDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  preferredTimeSlot: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  reason: z.string().trim().min(2, "Please provide a reason or note for the audit trail").max(400),
});

export const scheduleExceptionSchema = z.object({
  doctorBranchId: z.string().min(1, "Doctor chamber assignment is required"),
  dateStr: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date (YYYY-MM-DD) is required"),
  exceptionType: z.enum(["BLOCKED", "LEAVE", "RESCHEDULED"]),
  reasonEn: z.string().trim().min(3, "Reason in English is required"),
  reasonBn: z.string().trim().min(3, "Reason in Bangla is required"),
});

export const contactRequestSchema = z.object({
  fullName: z.string().trim().min(2, "Full name is required").max(100),
  phone: z
    .string()
    .trim()
    .regex(bangladeshPhoneRegex, "Enter a valid Bangladesh phone number"),
  email: z.string().trim().email().optional().or(z.literal("")),
  branchId: z.string().optional(),
  departmentId: z.string().optional(),
  preferredCallTime: z.string().max(100).optional(),
  message: z.string().trim().min(5, "Please enter your enquiry").max(800),
  consentAccepted: z.literal(true, {
    errorMap: () => ({ message: "Please accept the privacy notice" }),
  }),
});

export const feedbackSubmissionSchema = z.object({
  type: z.enum(["FEEDBACK", "COMPLAINT", "SUGGESTION"]),
  category: z.enum([
    "WAIT_TIME",
    "BILLING_FEE",
    "STAFF_CONDUCT",
    "FACILITY",
    "APPOINTMENT",
    "GENERAL",
  ]),
  branchId: z.string().optional(),
  routedDepartmentId: z.string().optional(),
  patientName: z.string().trim().max(100).optional(),
  patientPhone: z.string().trim().max(25).optional(),
  patientEmail: z.string().trim().email().optional().or(z.literal("")),
  subject: z.string().trim().min(3, "Subject is required").max(150),
  message: z.string().trim().min(10, "Please describe your feedback or complaint").max(1500),
  consentAccepted: z.literal(true, {
    errorMap: () => ({ message: "Please accept the privacy notice" }),
  }),
});

export const assistantMessageSchema = z.object({
  message: z.string().trim().min(1, "Please enter a question").max(600),
  locale: z.enum(["en", "bn"]).default("en"),
  branchId: z.string().optional(),
});

export const loginSchema = z.object({
  email: z.string().trim().email("Valid email is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const registerSchema = z.object({
  fullName: z.string().trim().min(2, "Full name is required").max(100),
  email: z.string().trim().email("Valid email is required"),
  phone: z
    .string()
    .trim()
    .regex(bangladeshPhoneRegex, "Valid Bangladesh mobile number is required"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  consentAccepted: z.literal(true, {
    errorMap: () => ({ message: "Please accept the privacy notice" }),
  }),
});

export const doctorUpsertSchema = z.object({
  id: z.string().optional(),
  departmentId: z.string().min(1),
  specialtyIds: z.array(z.string()).min(1),
  slug: z.string().min(2),
  nameEn: z.string().min(3),
  nameBn: z.string().min(3),
  designationEn: z.string().min(2),
  designationBn: z.string().min(2),
  qualificationsEn: z.string().min(2),
  qualificationsBn: z.string().min(2),
  experienceYears: z.coerce.number().int().min(0).max(70),
  bmdcRegistrationNo: z.string().min(3),
  bioEn: z.string().min(10),
  bioBn: z.string().min(10),
  consultationFeeBdt: z.coerce.number().int().min(0),
  followupFeeBdt: z.coerce.number().int().min(0),
  feeEffectiveFrom: z.string().min(4),
  branchId: z.string().min(1),
  roomNumber: z.string().min(1),
  publicationState: z
    .enum(["DRAFT", "PENDING_APPROVAL", "APPROVED", "PUBLISHED", "ARCHIVED"])
    .default("PENDING_APPROVAL"),
});

export const aiStaffUpdateSchema = z.object({
  rawInputNote: z.string().trim().min(10, "Enter a descriptive staff update note").max(1500),
  category: z.enum(["DOCTOR_SCHEDULE", "FEE_UPDATE", "PUBLIC_NOTICE", "SERVICE_INFO"]),
});

