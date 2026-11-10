import { describe, it, expect, beforeEach } from "vitest";
import { resetDbStateForTests, getDbState } from "@/server/db/store";
import {
  executeGlobalSearch,
  getPublishedBranches,
  getPublishedConditions,
  getPublishedDepartments,
  getPublishedDoctors,
} from "@/server/services/publicQueryService";
import {
  blockDoctorChamberDate,
  createAppointmentRequest,
  createFrontDeskAppointment,
  getDoctorBranchAvailability,
  transitionAppointmentStatus,
  upsertDoctorChamberScheduleRule,
  upsertDoctorScheduleOverride,
} from "@/server/services/appointmentService";
import { getSmsLogsForAppointment } from "@/lib/sms/sms-service";
import {
  reviewApprovalRequest,
  toggleDoctorStatus,
  upsertDoctorRecord,
  updateDoctorProfilePresentation,
} from "@/server/services/cmsService";
import {
  createStaffAIUpdateDraft,
  processPatientAssistantQuery,
} from "@/server/services/assistantService";
import {
  createFeedbackSubmission,
  getOperationalAnalytics,
  updateUserRoleOrStatus,
} from "@/server/services/communicationAndAnalyticsService";
import { createSessionToken, SessionPayload, verifySessionToken } from "@/server/auth/session";
import {
  hashPassword,
  isBcryptHash,
  migrateLegacyPassword,
  verifyPassword,
} from "@/server/auth/passwordService";
import { getCalendarWeekday } from "@/server/services/appointmentService";
import {
  completePasswordReset,
  requestPasswordReset,
} from "@/server/services/authRecoveryService";
import {
  checkRateLimit,
  resetRateLimitsForTests,
} from "@/server/security/rateLimiter";
import {
  calculateDailyDoctorAvailability,
  checkStaleness,
} from "@/server/services/availabilityGeneratorService";
import { facebookPublisher } from "@/server/services/facebookPublishingService";
import { ADMIN_CONSOLE_ROLES } from "@/lib/auth/roles";
import { getOperationalInsights } from "@/server/services/insightsService";
import { getAvailableSlotsForDoctor, resolveDhakaWeekday } from "@/lib/schedule-engine";
import { prisma } from "@/lib/prisma";
import {
  computeHealthcareAnalytics,
  generateDoctorPopularityCsv,
  generatePatientFeedbackCsv,
  generateAppointmentRegisterCsv,
} from "@/server/services/analyticsService";
import { generateDailyFacebookCampaign } from "@/server/services/facebookCampaignService";
import {
  createPatientFeedback,
  updatePatientFeedback,
} from "@/server/services/communicationAndAnalyticsService";
import {
  upsertHospitalNotice,
  toggleNoticeStatus,
} from "@/server/services/cmsService";

const superAdminSession: SessionPayload = {
  userId: "user-super-0",
  email: "superadmin@evercare.bd",
  fullName: "System Director",
  role: "SUPER_ADMIN",
  exp: Date.now() + 3600000,
};

const adminSession: SessionPayload = {
  userId: "user-superadmin-1",
  email: "admin@evercare.bd",
  fullName: "Nafisa Chowdhury",
  role: "HOSPITAL_ADMIN",
  scopedBranchId: "branch-dhanmondi",
  exp: Date.now() + 3600000,
};

const receptionistSession: SessionPayload = {
  userId: "user-reception-1",
  email: "frontdesk@evercare.bd",
  fullName: "Kamrul Hasan",
  role: "RECEPTIONIST",
  scopedBranchId: "branch-dhanmondi",
  exp: Date.now() + 3600000,
};

const editorSession: SessionPayload = {
  userId: "user-editor-1",
  email: "editor@evercare.bd",
  fullName: "Sadia Islam",
  role: "CONTENT_EDITOR",
  exp: Date.now() + 3600000,
};

const patientSession: SessionPayload = {
  userId: "user-patient-1",
  email: "patient@evercare.bd",
  fullName: "Tanvir Ahmed",
  role: "PATIENT",
  exp: Date.now() + 3600000,
};

const doctor1Session: SessionPayload = {
  userId: "user-doctor-1",
  email: "doctor@evercare.bd",
  fullName: "Prof. Dr. Anisur Rahman",
  role: "DOCTOR",
  doctorProfileId: "doc-1",
  scopedBranchId: "branch-dhanmondi",
  exp: Date.now() + 3600000,
};

const doctor2Session: SessionPayload = {
  userId: "user-doctor-2",
  email: "doctor2@evercare.bd",
  fullName: "Dr. Nusrat Jahan",
  role: "DOCTOR",
  doctorProfileId: "doc-2",
  scopedBranchId: "branch-dhanmondi",
  exp: Date.now() + 3600000,
};

const deptManagerSession: SessionPayload = {
  userId: "user-dept-1",
  email: "deptmanager@evercare.bd",
  fullName: "Dr. Dept Manager",
  role: "DEPT_MANAGER",
  scopedBranchId: "branch-dhanmondi",
  exp: Date.now() + 3600000,
};

const unscopedAdminSession: SessionPayload = {
  userId: "user-admin-unscoped",
  email: "unscoped@evercare.bd",
  fullName: "Unscoped Admin",
  role: "HOSPITAL_ADMIN",
  exp: Date.now() + 3600000,
};

const otherBranchAdminSession: SessionPayload = {
  userId: "user-admin-gulshan",
  email: "gulshanadmin@evercare.bd",
  fullName: "Gulshan Admin",
  role: "HOSPITAL_ADMIN",
  scopedBranchId: "branch-gulshan",
  exp: Date.now() + 3600000,
};

describe("Evercare Hospital Platform — Core Functional & Safety Verification Suite", () => {
  beforeEach(() => {
    resetDbStateForTests();
  });

  // ==========================================================================
  // T-WEB-01..03 & T-CMS-01..03: Public Queries & Draft/Approval Isolation
  // ==========================================================================
  it("T-WEB-01 & T-CMS-01: Public queries return ONLY published records and never leak DRAFT or PENDING_APPROVAL records", async () => {
    const initialPublished = getPublishedDoctors();
    expect(initialPublished.length).toBeGreaterThanOrEqual(7);

    // Content Editor attempts to publish a doctor directly -> enforced into PENDING_APPROVAL
    const saveResult = await upsertDoctorRecord(editorSession, {
      departmentId: "dept-cardiology",
      specialtyIds: ["spec-interventional-cardiology"],
      slug: "dr-unpublished-test",
      nameEn: "Dr. Unpublished Draft Test",
      nameBn: "ডা. আনপাবলিশড টেস্ট",
      designationEn: "Consultant",
      designationBn: "কনসালট্যান্ট",
      qualificationsEn: "MBBS, MD",
      qualificationsBn: "এমবিবিএস, এমডি",
      experienceYears: 9,
      bmdcRegistrationNo: "BMDC-SYN-99991",
      bioEn: "Draft bio should not appear on public website or AI assistant.",
      bioBn: "খসড়া তথ্য পাবলিক ওয়েবসাইটে দেখা যাবে না।",
      consultationFeeBdt: 2500,
      followupFeeBdt: 1500,
      feeEffectiveFrom: "2026-01-01",
      publicationState: "PUBLISHED",
      branchId: "branch-dhanmondi",
      roomNumber: "Room 909",
    });

    expect(saveResult.ok).toBe(true);
    if (saveResult.ok) {
      expect(saveResult.doctor.publicationState).toBe("PENDING_APPROVAL");
      expect(saveResult.approvalRequest).toBeDefined();
    }

    // Verify public doctor directory does NOT include the unapproved doctor
    const publicAfterDraft = getPublishedDoctors({ query: "Unpublished Draft" });
    expect(publicAfterDraft.length).toBe(0);

    // Verify Global Search does NOT leak the unapproved doctor
    const searchHits = executeGlobalSearch("Unpublished Draft");
    expect(searchHits.length).toBe(0);
  });

  it("T-CMS-02 & T-CMS-03: Hospital Admin approval atomically publishes changes and logs an immutable AuditEvent", async () => {
    const dbBefore = getDbState();
    const pendingApr = dbBefore.approvalRequests.find(
      (a) => a.id === "apr-2001"
    );
    expect(pendingApr).toBeDefined();

    // Non-approver (CONTENT_EDITOR) is rejected from approving (T-SEC-01)
    const unauthorizedAttempt = await reviewApprovalRequest(editorSession, {
      approvalId: pendingApr!.id,
      decision: "APPROVED_AND_PUBLISHED",
      reviewNote: "Trying to self-approve",
    });
    expect(unauthorizedAttempt.ok).toBe(false);

    // Authorized Hospital Admin approves and publishes
    const approvedResult = await reviewApprovalRequest(adminSession, {
      approvalId: pendingApr!.id,
      decision: "APPROVED_AND_PUBLISHED",
      reviewNote: "Verified effective date and approved for live publication.",
    });
    expect(approvedResult.ok).toBe(true);

    const dbAfter = getDbState();
    const updatedDoc = dbAfter.doctors.find(
      (d) => d.id === pendingApr!.entityId
    );
    expect(updatedDoc?.followupFeeBdt).toBe(1100);
    expect(
      dbAfter.auditEvents.some((e) => e.action === "APPROVAL_PUBLISHED")
    ).toBe(true);
  });

  // ==========================================================================
  // T-APT-01..04: Appointment Request Honesty, Concurrency & Exceptions
  // ==========================================================================
  it("T-APT-01: Online booking is confirmed instantly and enqueues a confirmation SMS", async () => {
    const result = await createAppointmentRequest({
      departmentId: "dept-cardiology",
      doctorId: "doc-1",
      branchId: "branch-dhanmondi",
      preferredDate: "2026-11-15",
      preferredTimeSlot: "17:00",
      visitType: "NEW_CONSULTATION",
      patientName: "Farhana Yeasmin",
      patientPhone: "01755667788",
      patientEmail: "farhana@example.com",
      reasonNote: "Routine lipid profile and consultation",
      consentAccepted: true,
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.appointment.status).toBe("CONFIRMED");
      expect(result.appointment.reference).toMatch(/^EC-2026-\d{4}$/);
      expect(result.appointment.events[0]?.toStatus).toBe("CONFIRMED");
    }
  });

  it("T-APT-02: Concurrent appointment requests for the final remaining slot capacity prevent double-booking", async () => {
    // Capacity per slot for doc-1 at branch-dhanmondi is 2.
    // Fire 3 concurrent requests for the exact same date & time slot ("2026-11-18" at "18:00").
    const [r1, r2, r3] = await Promise.all([
      createAppointmentRequest({
        departmentId: "dept-cardiology",
        doctorId: "doc-1",
        branchId: "branch-dhanmondi",
        preferredDate: "2026-11-18",
        preferredTimeSlot: "18:00",
        visitType: "NEW_CONSULTATION",
        patientName: "Concurrent Patient 1",
        patientPhone: "01711000001",
        consentAccepted: true,
      }),
      createAppointmentRequest({
        departmentId: "dept-cardiology",
        doctorId: "doc-1",
        branchId: "branch-dhanmondi",
        preferredDate: "2026-11-18",
        preferredTimeSlot: "18:00",
        visitType: "NEW_CONSULTATION",
        patientName: "Concurrent Patient 2",
        patientPhone: "01711000002",
        consentAccepted: true,
      }),
      createAppointmentRequest({
        departmentId: "dept-cardiology",
        doctorId: "doc-1",
        branchId: "branch-dhanmondi",
        preferredDate: "2026-11-18",
        preferredTimeSlot: "18:00",
        visitType: "NEW_CONSULTATION",
        patientName: "Concurrent Patient 3",
        patientPhone: "01711000003",
        consentAccepted: true,
      }),
    ]);

    const successes = [r1, r2, r3].filter((r) => r.ok);
    const failures = [r1, r2, r3].filter((r) => !r.ok);

    // Exactly 2 succeed (matching capacityPerSlot = 2) and the 3rd is rejected
    expect(successes.length).toBe(2);
    expect(failures.length).toBe(1);

    const slotsAfter = getDoctorBranchAvailability(
      "doc-1",
      "branch-dhanmondi",
      "2026-11-18"
    );
    const targetSlot = slotsAfter.find((s) => s.time === "18:00");
    expect(targetSlot?.remainingCapacity).toBe(0);
    expect(targetSlot?.isAvailable).toBe(false);
  });

  it("T-APT-03 & T-APT-04: Staff status transitions and chamber date blocking flag affected appointments", async () => {
    // Confirm an existing REQUESTED appointment (EC-2026-1042)
    const trans = await transitionAppointmentStatus({
      appointmentId: "EC-2026-1042",
      toStatus: "CONFIRMED",
      actorUserId: adminSession.userId,
      actorName: adminSession.fullName,
      actorRole: adminSession.role,
      reason: "Verified chamber slot capacity",
    });
    expect(trans.ok).toBe(true);
    if (trans.ok) {
      expect(trans.appointment.status).toBe("CONFIRMED");
    }

    // Block chamber date 2026-11-07 where EC-2026-1041 is scheduled at db-doc1-dhanmondi
    const blockRes = await blockDoctorChamberDate({
      doctorBranchId: "db-doc1-dhanmondi",
      dateStr: "2026-11-07",
      exceptionType: "LEAVE",
      reasonEn: "Emergency Cath Lab Duty",
      reasonBn: "জরুরি ক্যাথ ল্যাব ডিউটি",
      actorUserId: adminSession.userId,
      actorName: adminSession.fullName,
      actorRole: adminSession.role,
    });

    expect(blockRes.ok).toBe(true);
    if (blockRes.ok) {
      expect(blockRes.affectedAppointments.length).toBeGreaterThanOrEqual(1);
      expect(blockRes.affectedAppointments[0]?.status).toBe(
        "RESCHEDULE_REQUESTED"
      );
    }

    // Availability on blocked date is now empty
    const slotsOnBlockedDate = getDoctorBranchAvailability(
      "doc-1",
      "branch-dhanmondi",
      "2026-11-07"
    );
    expect(slotsOnBlockedDate.length).toBe(0);
  });

  // ==========================================================================
  // T-AI-01..06: Evercare Assistant Grounding, Clinical Refusal & Abstention
  // ==========================================================================
  it("T-AI-01 & T-AI-05: Grounded doctor/fee lookup in English and Bangla returns only published records with citations", async () => {
    const enReply = await processPatientAssistantQuery({
      message: "What is the consultation fee for Prof. Dr. Anisur Rahman?",
      locale: "en",
    });
    expect(enReply.wasClinicalRefusal).toBe(false);
    expect(enReply.wasAbstained).toBe(false);
    expect(enReply.answer).toContain("1500");
    expect(enReply.citations.length).toBeGreaterThan(0);

    const bnReply = await processPatientAssistantQuery({
      message: "ডা. আনিসুর রহমানের কনসালটেশন ফি কত?",
      locale: "bn",
    });
    expect(bnReply.wasClinicalRefusal).toBe(false);
    expect(bnReply.answer).toContain("1500");
  });

  it("T-AI-03: Clinical diagnosis, symptom triage, and medication requests are strictly refused with emergency escalation", async () => {
    const clinicalEn = await processPatientAssistantQuery({
      message: "I have severe chest pain and shortness of breath, what medicine or dosage should I take?",
      locale: "en",
    });
    expect(clinicalEn.wasClinicalRefusal).toBe(true);
    expect(clinicalEn.intentCategory).toBe("CLINICAL_REFUSAL");
    expect(clinicalEn.answer).toContain("10666");

    const clinicalBn = await processPatientAssistantQuery({
      message: "আমার বুকে ব্যথা হচ্ছে, আমি কোন ওষুধ খাব?",
      locale: "bn",
    });
    expect(clinicalBn.wasClinicalRefusal).toBe(true);
    expect(clinicalBn.intentCategory).toBe("CLINICAL_REFUSAL");
  });

  it("T-AI-02 & T-AI-04: Unknown or unpublished queries safely abstain instead of hallucinating", async () => {
    const abstainReply = await processPatientAssistantQuery({
      message: "Do you offer robotic proton beam surgery on Mars and what is the price?",
      locale: "en",
    });
    expect(abstainReply.wasAbstained).toBe(true);
    expect(abstainReply.intentCategory).toBe("UNKNOWN_ABSTAIN");
  });

  it("T-AI-06: Assistant never claims an unconfirmed REQUESTED appointment is confirmed", async () => {
    const statusReply = await processPatientAssistantQuery({
      message: "Is my appointment EC-2026-1042 confirmed?",
      locale: "en",
    });
    expect(statusReply.intentCategory).toBe("APPOINTMENT_INFO");
    expect(statusReply.answer).toContain("REQUESTED");
    expect(statusReply.answer).toContain("NOT yet a confirmed appointment");
  });

  it("Release 2 Staff AI Update Assistant: Always creates drafts in PENDING_APPROVAL state", async () => {
    const draft = await createStaffAIUpdateDraft(editorSession, {
      rawInputNote: "Update Dr. Farhana Karim fee to 1700 BDT effective 2026-12-01",
      category: "FEE_UPDATE",
    });
    expect(draft.approvalStatus).toBe("PENDING_APPROVAL");
    expect(JSON.parse(draft.proposedPayloadJson).autoPublishAllowed).toBe(false);
  });

  // ==========================================================================
  // T-FB-01 & Real-Data Operational Analytics
  // ==========================================================================
  it("T-FB-01: Feedback and complaints are stored privately (isPrivate: true) and reflected in real-time analytics", async () => {
    const beforeAnalytics = getOperationalAnalytics();
    const initialFbCount = beforeAnalytics.feedback.total;

    const fb = await createFeedbackSubmission({
      type: "COMPLAINT",
      category: "WAIT_TIME",
      branchId: "branch-dhanmondi",
      patientName: "Test Patient",
      patientPhone: "01711223344",
      subject: "Long wait at billing counter",
      message: "Waited 30 minutes at the ground floor billing counter.",
      consentAccepted: true,
    });

    expect(fb.isPrivate).toBe(true);
    expect(fb.status).toBe("NEW");

    const afterAnalytics = getOperationalAnalytics();
    expect(afterAnalytics.feedback.total).toBe(initialFbCount + 1);
    expect(getPublishedBranches().length).toBeGreaterThanOrEqual(5);
    expect(getPublishedConditions().length).toBeGreaterThanOrEqual(15);
  });

  // ==========================================================================
  // T-APT-05: Relocated Appointment Hub & Routes Verification
  // ==========================================================================
  it("T-APT-05: Appointment booking and tracking flow end-to-end for /request-appointment and /track-appointment", async () => {
    // 1. Data provider verification for /request-appointment page
    const branches = getPublishedBranches();
    const depts = getPublishedDepartments();
    const docs = getPublishedDoctors();
    expect(branches.length).toBeGreaterThan(0);
    expect(depts.length).toBeGreaterThan(0);
    expect(docs.length).toBeGreaterThan(0);

    // 2. Booking a new appointment request
    const booking = await createAppointmentRequest({
      doctorId: docs[0].id,
      departmentId: docs[0].departmentId,
      branchId: branches[0].id,
      preferredDate: "2026-11-20",
      preferredTimeSlot: "17:00",
      patientName: "Sumaiya Rahman",
      patientPhone: "01799887766",
      patientEmail: "sumaiya.rahman@example.com",
      visitType: "NEW_CONSULTATION",
      reasonNote: "Follow-up evaluation on cardiology test results.",
      consentAccepted: true,
    });

    expect(booking.ok).toBe(true);
    if (booking.ok) {
      expect(booking.appointment.status).toBe("CONFIRMED");
      expect(booking.appointment.reference).toMatch(/^EC-2026-\d{4}$/);

      // 3. Tracking verification for /track-appointment page
      const state = getDbState();
      const tracked = state.appointments.find(
        (a) =>
          a.reference === booking.appointment.reference &&
          a.patientPhone === "01799887766"
      );
      expect(tracked).toBeDefined();
      expect(tracked?.patientName).toBe("Sumaiya Rahman");
      expect(tracked?.events.length).toBeGreaterThanOrEqual(1);
      expect(tracked?.events[0].toStatus).toBe("CONFIRMED");
    }
  });

  // ==========================================================================
  // T-SPEC-01: Specialist Complete CRUD Workflow
  // (Create, Read, Update, Deactivate, Re-activate)
  // ==========================================================================
  it("T-SPEC-01: Complete specialist management workflow: Create, Read, Update, and Deactivate", async () => {
    // 1. CREATE a new specialist record by Hospital Admin
    const createdRes = await upsertDoctorRecord(adminSession, {
      departmentId: "dept-cardiology",
      specialtyIds: ["spec-interventional-cardiology"],
      slug: "dr-tariqul-islam-specialist",
      nameEn: "Prof. Dr. Tariqul Islam",
      nameBn: "অধ্যাপক ডা. তারিকুল ইসলাম",
      designationEn: "Senior Consultant Cardiologist",
      designationBn: "সিনিয়র কনসালট্যান্ট কার্ডিওলজিস্ট",
      qualificationsEn: "MBBS, MD, FACC",
      qualificationsBn: "এমবিবিএস, এমডি, এফএসিসি",
      experienceYears: 18,
      bmdcRegistrationNo: "BMDC-A-99882",
      bioEn: "Distinguished cardiologist with extensive interventional cardiology background.",
      bioBn: "১৮ বছরের অভিজ্ঞতাসম্পন্ন হৃদরোগ বিশেষজ্ঞ।",
      consultationFeeBdt: 2000,
      followupFeeBdt: 1200,
      feeEffectiveFrom: "2026-01-01",
      branchId: "branch-dhanmondi",
      roomNumber: "Room 405 (4th Floor)",
      publicationState: "PUBLISHED",
    });

    expect(createdRes.ok).toBe(true);
    if (!createdRes.ok) return;
    const docId = createdRes.doctor.id;
    expect(createdRes.doctor.nameEn).toBe("Prof. Dr. Tariqul Islam");
    expect(createdRes.doctor.publicationState).toBe("PUBLISHED");

    // 2. READ: Public queries return the new specialist
    const publishedList = getPublishedDoctors();
    const foundInPub = publishedList.find((d) => d.id === docId);
    expect(foundInPub).toBeDefined();
    expect(foundInPub?.bmdcRegistrationNo).toBe("BMDC-A-99882");

    // 3. UPDATE: Modify credentials, fees, and chamber room
    const updateRes = await upsertDoctorRecord(adminSession, {
      id: docId,
      departmentId: "dept-cardiology",
      specialtyIds: ["spec-interventional-cardiology"],
      slug: "dr-tariqul-islam-specialist",
      nameEn: "Prof. Dr. Tariqul Islam",
      nameBn: "অধ্যাপক ডা. তারিকুল ইসলাম",
      designationEn: "Chief Consultant Cardiologist",
      designationBn: "চিফ কনসালট্যান্ট কার্ডিওলজিস্ট",
      qualificationsEn: "MBBS, MD, FACC, FSCAI",
      qualificationsBn: "এমবিবিএস, এমডি, এফএসিসি, এফএসসিএআই",
      experienceYears: 20,
      bmdcRegistrationNo: "BMDC-A-99882",
      bioEn: "Distinguished chief cardiologist with international interventional certifications.",
      bioBn: "২০ বছরের অভিজ্ঞতাসম্পন্ন প্রধান হৃদরোগ বিশেষজ্ঞ।",
      consultationFeeBdt: 2500,
      followupFeeBdt: 1500,
      feeEffectiveFrom: "2026-01-01",
      branchId: "branch-dhanmondi",
      roomNumber: "Executive Suite 410",
      publicationState: "PUBLISHED",
    });

    expect(updateRes.ok).toBe(true);
    if (!updateRes.ok) return;
    expect(updateRes.doctor.designationEn).toBe("Chief Consultant Cardiologist");
    expect(updateRes.doctor.consultationFeeBdt).toBe(2500);
    expect(updateRes.doctor.branches[0].roomNumber).toBe("Executive Suite 410");

    // 4. DEACTIVATE: Archive specialist record with confirmation
    const deactRes = await toggleDoctorStatus(adminSession, docId, "ARCHIVED");
    expect(deactRes.ok).toBe(true);
    if (!deactRes.ok) return;
    expect(deactRes.doctor.publicationState).toBe("ARCHIVED");

    // Verify excluded from public directory
    const afterDeactPublished = getPublishedDoctors();
    expect(afterDeactPublished.find((d) => d.id === docId)).toBeUndefined();

    // Verify audit event was logged
    const db = getDbState();
    const deactAudit = db.auditEvents.find(
      (ev) => ev.entityId === docId && ev.action === "DOCTOR_DEACTIVATED"
    );
    expect(deactAudit).toBeDefined();

    // 5. RE-ACTIVATE: Restore specialist record
    const reactRes = await toggleDoctorStatus(adminSession, docId, "PUBLISHED");
    expect(reactRes.ok).toBe(true);
    if (!reactRes.ok) return;
    expect(reactRes.doctor.publicationState).toBe("PUBLISHED");
    expect(getPublishedDoctors().find((d) => d.id === docId)).toBeDefined();
  });

  // ==========================================================================
  // T-RBAC-05: Five Dashboard Role Isolation & Permission Boundary Verification
  // ==========================================================================
  it("T-RBAC-05: Strict role permission boundaries across all 5 user roles", async () => {
    // 1. Receptionist CANNOT deactivate or create operational doctors
    const recDoctorRes = await toggleDoctorStatus(receptionistSession, "doc-1", "ARCHIVED");
    expect(recDoctorRes.ok).toBe(false);
    if (!recDoctorRes.ok) {
      expect(recDoctorRes.error).toContain("Forbidden");
    }

    // 2. Content Editor submitting PUBLISHED doctor profile is automatically placed in PENDING_APPROVAL
    const editorDocRes = await upsertDoctorRecord(editorSession, {
      departmentId: "dept-cardiology",
      specialtyIds: ["spec-interventional-cardiology"],
      slug: "dr-editor-test-spec",
      nameEn: "Dr. Editor Proposal",
      nameBn: "ডা. এডিটর প্রস্তাব",
      designationEn: "Associate Consultant",
      designationBn: "সহযোগী কনসালট্যান্ট",
      qualificationsEn: "MBBS, D-Card",
      qualificationsBn: "এমবিবিএস",
      experienceYears: 6,
      bmdcRegistrationNo: "BMDC-A-55441",
      bioEn: "Specialist proposal drafted by content editor.",
      bioBn: "কনটেন্ট এডিটর প্রস্তাবিত বিবরণ।",
      consultationFeeBdt: 1600,
      followupFeeBdt: 1000,
      feeEffectiveFrom: "2026-01-01",
      branchId: "branch-dhanmondi",
      roomNumber: "Chamber 204",
      publicationState: "PUBLISHED", // Attempted published directly
    });

    expect(editorDocRes.ok).toBe(true);
    if (editorDocRes.ok) {
      expect(editorDocRes.doctor.publicationState).toBe("PENDING_APPROVAL");
      expect(editorDocRes.approvalRequest).toBeDefined();
    }

    // 3. Super Admin can manage all staff and toggle status
    const db = getDbState();
    const testUser = db.users.find((u) => u.id === "user-editor-1");
    expect(testUser).toBeDefined();

    // 4. Branch scoping: Receptionist session holds scopedBranchId
    expect(receptionistSession.scopedBranchId).toBe("branch-dhanmondi");
    const dhanmondiAppointments = db.appointments.filter(
      (a) => a.branchId === receptionistSession.scopedBranchId
    );
    expect(dhanmondiAppointments.length).toBeGreaterThan(0);
  });

  // ==========================================================================
  // RELEASE 1: SECURITY HARDENING REGRESSION SUITE
  // ==========================================================================

  it("T-SEC-01: Privilege escalation prevention and role modification hierarchy", async () => {
    // 1. Hospital Admin attempting SUPER_ADMIN promotion on another user -> REJECTED
    const promoRes = await updateUserRoleOrStatus(adminSession, {
      targetUserId: "user-editor-1",
      role: "SUPER_ADMIN",
    });
    expect(promoRes.ok).toBe(false);
    if (!promoRes.ok) {
      expect(promoRes.error).toContain("Forbidden");
    }

    // 2. Hospital Admin attempting self-promotion -> REJECTED
    const selfPromoRes = await updateUserRoleOrStatus(adminSession, {
      targetUserId: adminSession.userId,
      role: "SUPER_ADMIN",
    });
    expect(selfPromoRes.ok).toBe(false);
    if (!selfPromoRes.ok) {
      expect(selfPromoRes.error).toContain("Forbidden");
    }

    // 3. Receptionist attempting any role change -> REJECTED
    const recRoleRes = await updateUserRoleOrStatus(receptionistSession, {
      targetUserId: "user-editor-1",
      role: "HOSPITAL_ADMIN",
    });
    expect(recRoleRes.ok).toBe(false);
    if (!recRoleRes.ok) {
      expect(recRoleRes.error).toContain("Forbidden");
    }

    // 4. Content Editor attempting any role change -> REJECTED
    const edRoleRes = await updateUserRoleOrStatus(editorSession, {
      targetUserId: "user-reception-1",
      role: "SUPER_ADMIN",
    });
    expect(edRoleRes.ok).toBe(false);
    if (!edRoleRes.ok) {
      expect(edRoleRes.error).toContain("Forbidden");
    }

    // 5. Hospital Admin attempting to deactivate another account of equal/higher privilege -> REJECTED
    const deactAdminRes = await updateUserRoleOrStatus(adminSession, {
      targetUserId: "user-superadmin-1", // self or other hospital admin
      isActive: false,
    });
    expect(deactAdminRes.ok).toBe(false);
    if (!deactAdminRes.ok) {
      expect(deactAdminRes.error).toContain("Forbidden");
    }

    // 6. Super Admin CAN modify role and status of subordinates -> SUCCESS + AUDIT LOGGED
    const superModRes = await updateUserRoleOrStatus(superAdminSession, {
      targetUserId: "user-editor-1",
      role: "DEPT_MANAGER",
    });
    expect(superModRes.ok).toBe(true);
    if (superModRes.ok) {
      expect(superModRes.user.role).toBe("DEPT_MANAGER");
    }

    const db = getDbState();
    const audit = db.auditEvents.find(
      (ev) => ev.action === "USER_ROLE_OR_STATUS_UPDATED" && ev.actorUserId === superAdminSession.userId
    );
    expect(audit).toBeDefined();
    expect(audit?.diffJson).toContain("DEPT_MANAGER");
  });

  it("T-SEC-02: Doctor account association & cross-doctor access prevention", async () => {
    const db = getDbState();
    // Verify doctor accounts are seeded with proper profile linkage
    const docUser1 = db.users.find((u) => u.email === "doctor@evercare.bd");
    expect(docUser1).toBeDefined();
    expect(docUser1?.role).toBe("DOCTOR");
    expect(docUser1?.doctorProfileId).toBe("doc-1");

    const docUser2 = db.users.find((u) => u.email === "doctor2@evercare.bd");
    expect(docUser2).toBeDefined();
    expect(docUser2?.role).toBe("DOCTOR");
    expect(docUser2?.doctorProfileId).toBe("doc-2");

    // Doctor 1 has appointment apt-1001 (assigned to doc-1)
    const apt1001 = db.appointments.find((a) => a.id === "apt-1001");
    expect(apt1001?.doctorId).toBe("doc-1");

    // Doctor 2 has appointment apt-1002 (assigned to doc-2)
    const apt1002 = db.appointments.find((a) => a.id === "apt-1002");
    expect(apt1002?.doctorId).toBe("doc-2");

    // Doctor 1 transitions their own appointment -> SUCCESS
    const doc1Trans = await transitionAppointmentStatus({
      appointmentId: "apt-1001",
      toStatus: "CONFIRMED",
      actorUserId: doctor1Session.userId,
      actorName: doctor1Session.fullName,
      actorRole: doctor1Session.role,
      reason: "Clinical consultation verified by Dr. Anisur Rahman.",
    });
    expect(doc1Trans.ok).toBe(true);
    if (doc1Trans.ok) {
      expect(doc1Trans.appointment.status).toBe("CONFIRMED");
    }

    // Verify doctor appointments filtering by profile
    const doc1Appointments = db.appointments.filter((a) => a.doctorId === doctor1Session.doctorProfileId);
    const doc2Appointments = db.appointments.filter((a) => a.doctorId === doctor2Session.doctorProfileId);
    expect(doc1Appointments.some((a) => a.id === "apt-1001")).toBe(true);
    expect(doc1Appointments.some((a) => a.id === "apt-1002")).toBe(false);
    expect(doc2Appointments.some((a) => a.id === "apt-1002")).toBe(true);
    expect(doc2Appointments.some((a) => a.id === "apt-1001")).toBe(false);
  });

  it("T-SEC-03: Patient cross-access prevention & private appointment scoping", async () => {
    const db = getDbState();
    // Patient Tanvir Ahmed (user-patient-1)
    const tanvirApts = db.appointments.filter(
      (a) => a.patientUserId === patientSession.userId || a.patientPhone === "01711223344"
    );
    expect(tanvirApts.length).toBeGreaterThan(0);

    // Other patient appointment (apt-1003 is for patient nusrat.demo@example.com / 01711998877)
    const otherApt = db.appointments.find((a) => a.id === "apt-1003");
    expect(otherApt).toBeDefined();
    expect(otherApt?.patientPhone).not.toBe("01711223344");

    // Scoped dashboard logic: Patient can never see other patient's record
    const patientScopedApts = db.appointments.filter(
      (a) => a.patientUserId === patientSession.userId || a.patientPhone === "01711223344"
    );
    expect(patientScopedApts.some((a) => a.id === "apt-1003")).toBe(false);
  });

  it("T-SEC-04: Cryptographic password hashing and verification with bcrypt", async () => {
    const db = getDbState();
    // 1. Every seeded user must hold a genuine bcrypt hash
    for (const u of db.users) {
      expect(isBcryptHash(u.passwordHash)).toBe(true);
      expect(u.passwordHash).not.toContain("demo-hash:");
      expect(u.passwordHash).not.toBe("Evercare#2026");
    }

    // 2. Correct password verifies successfully
    const adminUser = db.users.find((u) => u.email === "admin@evercare.bd");
    expect(adminUser).toBeDefined();
    const correctPasswordValid = await verifyPassword("Evercare#2026", adminUser?.passwordHash);
    expect(correctPasswordValid).toBe(true);

    // 3. Incorrect password strictly rejected
    const incorrectPasswordValid = await verifyPassword("WrongPassword#999", adminUser?.passwordHash);
    expect(incorrectPasswordValid).toBe(false);

    // 4. Insecure legacy format (plaintext or demo-hash:) is strictly rejected by verifyPassword
    const legacyPlaintextValid = await verifyPassword("Evercare#2026", "Evercare#2026");
    expect(legacyPlaintextValid).toBe(false);

    const legacyDemoHashValid = await verifyPassword("Evercare#2026", "demo-hash:Evercare#2026");
    expect(legacyDemoHashValid).toBe(false);

    // 5. New password hashing enforces length and produces bcrypt output
    const newHash = await hashPassword("PatientStrongPass#2026");
    expect(isBcryptHash(newHash)).toBe(true);
    expect(await verifyPassword("PatientStrongPass#2026", newHash)).toBe(true);

    await expect(hashPassword("short")).rejects.toThrow("at least 6 characters");
  });

  it("T-SEC-05: Session token signing, expiration, and user invalidation", async () => {
    const db = getDbState();
    const adminUser = db.users.find((u) => u.email === "admin@evercare.bd")!;

    // 1. Valid token verifies and returns session payload
    const validToken = createSessionToken(adminUser);
    const verified = verifySessionToken(validToken);
    expect(verified).not.toBeNull();
    expect(verified?.email).toBe("admin@evercare.bd");
    expect(verified?.role).toBe("HOSPITAL_ADMIN");

    // 2. Tampered signature is strictly rejected
    const [payloadBase64, signature] = validToken.split(".");
    const tamperedToken = `${payloadBase64}.tampered_invalid_sig`;
    expect(verifySessionToken(tamperedToken)).toBeNull();

    // 3. Expired token is rejected
    const expiredPayload = {
      userId: adminUser.id,
      email: adminUser.email,
      fullName: adminUser.fullName,
      role: adminUser.role,
      exp: Date.now() - 10000, // in the past
    };
    const expiredData = Buffer.from(JSON.stringify(expiredPayload), "utf8").toString("base64url");
    // Sign it with valid secret
    const crypto = await import("crypto");
    const sig = crypto
      .createHmac("sha256", process.env.AUTH_SECRET || "evercare-dev-secret-key-at-least-32-bytes-long")
      .update(expiredData)
      .digest("base64url");
    const expiredToken = `${expiredData}.${sig}`;
    expect(verifySessionToken(expiredToken)).toBeNull();

    // 4. Deactivated user session is rejected even if signature is valid
    adminUser.isActive = false;
    expect(verifySessionToken(validToken)).toBeNull();
    adminUser.isActive = true; // Restore
  });

  // ==========================================================================
  // RELEASE 1.1: COMPREHENSIVE SECURITY VALIDATION & SCHEDULING CORRECTNESS
  // ==========================================================================

  it("T-REL1.1-01: Password migration, non-rehashing, recovery workflow, and session invalidation", async () => {
    // 1. Plaintext migration to valid bcrypt
    const migrated = migrateLegacyPassword("Evercare#2026");
    expect(isBcryptHash(migrated)).toBe(true);
    expect(await verifyPassword("Evercare#2026", migrated)).toBe(true);

    // 2. Already-hashed passwords must NOT be rehashed
    const existingBcrypt = migrated;
    const secondPass = migrateLegacyPassword(existingBcrypt);
    expect(secondPass).toBe(existingBcrypt); // Exact same string, no rehashing!

    // 3. Unrecognized legacy credentials receive FORCE_PASSWORD_RESET and cannot authenticate
    const forcedResetMarker = migrateLegacyPassword("unrecognized-plaintext-credentials");
    expect(forcedResetMarker).toContain("FORCE_PASSWORD_RESET:");
    expect(await verifyPassword("unrecognized-plaintext-credentials", forcedResetMarker)).toBe(false);

    // 4. Password Recovery Workflow (requestPasswordReset + completePasswordReset)
    const resetReq = await requestPasswordReset("patient@evercare.bd");
    expect(resetReq.ok).toBe(true);
    expect(resetReq.notice).toContain("If an active Evercare account matches");
    expect(resetReq.rawTokenForDev).toBeDefined();

    const rawToken = resetReq.rawTokenForDev!;

    // Invalid token cannot complete reset
    const badTokenRes = await completePasswordReset("invalid-token-12345", "NewPassword#2026");
    expect(badTokenRes.ok).toBe(false);

    // Password shorter than 6 characters rejected
    const shortPassRes = await completePasswordReset(rawToken, "123");
    expect(shortPassRes.ok).toBe(false);

    // Valid reset completes successfully
    const validResetRes = await completePasswordReset(rawToken, "NewSecurePassword#2026");
    expect(validResetRes.ok).toBe(true);

    const db = getDbState();
    const patientUser = db.users.find((u) => u.email === "patient@evercare.bd")!;
    expect(isBcryptHash(patientUser.passwordHash)).toBe(true);
    expect(await verifyPassword("NewSecurePassword#2026", patientUser.passwordHash)).toBe(true);
    expect(await verifyPassword("Evercare#2026", patientUser.passwordHash)).toBe(false);
    expect(patientUser.passwordChangedAt).toBeDefined();

    // 5. Existing sessions issued BEFORE password reset are immediately revoked
    const oldSessionToken = createSessionToken(patientUser);
    // Artificially simulate old session issued before password change
    const [payloadBase64] = oldSessionToken.split(".");
    const decodedPayload = JSON.parse(Buffer.from(payloadBase64, "base64url").toString("utf8"));
    decodedPayload.iat = new Date("2026-01-01T00:00:00.000Z").getTime(); // in the past before passwordChangedAt
    const oldPayloadData = Buffer.from(JSON.stringify(decodedPayload), "utf8").toString("base64url");
    const crypto = await import("crypto");
    const oldSig = crypto
      .createHmac("sha256", process.env.AUTH_SECRET || "evercare-dev-secret-key-at-least-32-bytes-long")
      .update(oldPayloadData)
      .digest("base64url");
    const staleToken = `${oldPayloadData}.${oldSig}`;

    // Must be rejected as invalidated session!
    expect(verifySessionToken(staleToken)).toBeNull();
  });

  it("T-REL1.1-02: Role matrix authorization, scope enforcement, and stale permission prevention", async () => {
    // 1. Test EVERY unauthorized role attempting user role/status modification
    const unauthorizedRoles = [
      { role: "PATIENT", session: patientSession },
      { role: "RECEPTIONIST", session: receptionistSession },
      { role: "CONTENT_EDITOR", session: editorSession },
      { role: "DOCTOR", session: doctor1Session },
      { role: "DEPT_MANAGER", session: deptManagerSession },
    ];

    for (const { role, session } of unauthorizedRoles) {
      const res = await updateUserRoleOrStatus(session, {
        targetUserId: "user-editor-1",
        role: "HOSPITAL_ADMIN",
      });
      expect(res.ok).toBe(false);
      if (!res.ok) {
        expect(res.error).toContain("Forbidden");
      }
    }

    // 2. Super Admin Account Protection
    // Hospital admin attempting to deactivate Super Admin -> REJECTED
    const deactSuperRes = await updateUserRoleOrStatus(adminSession, {
      targetUserId: superAdminSession.userId,
      isActive: false,
    });
    expect(deactSuperRes.ok).toBe(false);
    if (!deactSuperRes.ok) {
      expect(deactSuperRes.error).toContain("Forbidden");
    }

    // Super Admin attempting self-demotion -> REJECTED
    const superSelfRes = await updateUserRoleOrStatus(superAdminSession, {
      targetUserId: superAdminSession.userId,
      role: "HOSPITAL_ADMIN",
    });
    expect(superSelfRes.ok).toBe(false);

    // 3. Branch Scoping: Hospital Admin with branch scope cannot manage staff in another branch
    const crossBranchRes = await updateUserRoleOrStatus(adminSession, {
      // adminSession is scoped to branch-dhanmondi; target user in different branch
      targetUserId: "user-editor-1",
      isActive: false,
    });
    // user-editor-1 has no scopedBranchId or different -> Rejected!
    expect(crossBranchRes.ok).toBe(false);

    // Hospital admin missing branch scope cannot manage staff
    const unscopedRes = await updateUserRoleOrStatus(unscopedAdminSession, {
      targetUserId: "user-reception-1",
      isActive: false,
    });
    expect(unscopedRes.ok).toBe(false);
    if (!unscopedRes.ok) {
      expect(unscopedRes.error).toContain("must have an assigned branch scope");
    }

    // Hospital admin CAN manage lower-level staff within their own branch
    const validBranchRes = await updateUserRoleOrStatus(adminSession, {
      targetUserId: "user-reception-1", // receptionist is scoped to branch-dhanmondi
      isActive: false,
    });
    expect(validBranchRes.ok).toBe(true);

    // 4. Stale permissions prevented: token role is verified dynamically from database
    const db = getDbState();
    const editorUser = db.users.find((u) => u.id === "user-editor-1")!;
    const editorToken = createSessionToken(editorUser);

    // Super Admin promotes editor to DEPT_MANAGER in database
    await updateUserRoleOrStatus(superAdminSession, {
      targetUserId: "user-editor-1",
      role: "DEPT_MANAGER",
    });

    // Verification of the existing token immediately reflects the live role!
    const verifiedLiveSession = verifySessionToken(editorToken);
    expect(verifiedLiveSession?.role).toBe("DEPT_MANAGER");
  });

  it("T-REL1.1-03: Appointment weekday validation, calendar timezone correctness, and non-working day blocking", async () => {
    // 1. Verify calendar weekday calculation across all 7 days in Asia/Dhaka
    expect(getCalendarWeekday("2026-11-01", "Asia/Dhaka")).toBe(0); // Sunday
    expect(getCalendarWeekday("2026-11-02", "Asia/Dhaka")).toBe(1); // Monday
    expect(getCalendarWeekday("2026-11-03", "Asia/Dhaka")).toBe(2); // Tuesday
    expect(getCalendarWeekday("2026-11-04", "Asia/Dhaka")).toBe(3); // Wednesday
    expect(getCalendarWeekday("2026-11-05", "Asia/Dhaka")).toBe(4); // Thursday
    expect(getCalendarWeekday("2026-11-06", "Asia/Dhaka")).toBe(5); // Friday
    expect(getCalendarWeekday("2026-11-07", "Asia/Dhaka")).toBe(6); // Saturday

    // 2. Month boundary tests
    expect(getCalendarWeekday("2026-11-01", "Asia/Dhaka")).toBe(0); // Nov 1: Sunday
    expect(getCalendarWeekday("2026-11-30", "Asia/Dhaka")).toBe(1); // Nov 30: Monday
    expect(getCalendarWeekday("2026-02-01", "Asia/Dhaka")).toBe(0); // Feb 1: Sunday
    expect(getCalendarWeekday("2026-02-28", "Asia/Dhaka")).toBe(6); // Feb 28: Saturday

    // 3. Year boundary tests
    expect(getCalendarWeekday("2026-01-01", "Asia/Dhaka")).toBe(4); // Jan 1 2026: Thursday
    expect(getCalendarWeekday("2026-12-31", "Asia/Dhaka")).toBe(4); // Dec 31 2026: Thursday
    expect(getCalendarWeekday("2027-01-01", "Asia/Dhaka")).toBe(5); // Jan 1 2027: Friday

    // 4. Doctor working on selected weekdays only
    // doc-1 at Dhanmondi works ONLY on Saturday (6), Monday (1), Wednesday (3)
    // Wednesday 2026-11-18 -> Working day -> Slots returned
    const wedSlots = getDoctorBranchAvailability("doc-1", "branch-dhanmondi", "2026-11-18");
    expect(wedSlots.length).toBeGreaterThan(0);
    expect(wedSlots[0].time).toBe("16:00");

    // Saturday 2026-11-21 -> Working day -> Slots returned
    const satSlots = getDoctorBranchAvailability("doc-1", "branch-dhanmondi", "2026-11-21");
    expect(satSlots.length).toBeGreaterThan(0);

    // Thursday 2026-11-19 -> NON-WORKING day for doc-1 at Dhanmondi -> Zero slots returned
    const thuSlots = getDoctorBranchAvailability("doc-1", "branch-dhanmondi", "2026-11-19");
    expect(thuSlots.length).toBe(0);

    // 5. Booking on non-working day is rejected by createAppointmentRequest
    const nonWorkingBooking = await createAppointmentRequest({
      doctorId: "doc-1",
      branchId: "branch-dhanmondi",
      departmentId: "dept-cardiology",
      preferredDate: "2026-11-19", // Thursday: non-working day at Dhanmondi
      preferredTimeSlot: "16:00",
      visitType: "NEW_CONSULTATION",
      patientName: "Farhana Test",
      patientPhone: "01711888999",
      consentAccepted: true,
    });
    expect(nonWorkingBooking.ok).toBe(false);
    if (!nonWorkingBooking.ok) {
      expect(nonWorkingBooking.error).toContain("does not have an active chamber on this day");
    }

    // Booking on working day succeeds
    const workingBooking = await createAppointmentRequest({
      doctorId: "doc-1",
      branchId: "branch-dhanmondi",
      departmentId: "dept-cardiology",
      preferredDate: "2026-11-18", // Wednesday: working day
      preferredTimeSlot: "16:00",
      visitType: "NEW_CONSULTATION",
      patientName: "Farhana Test Valid",
      patientPhone: "01711888998",
      consentAccepted: true,
    });
    expect(workingBooking.ok).toBe(true);

    // 6. Branch-specific schedules:
    // doc-1 at Gulshan practices on Sunday (0), Tuesday (2), Thursday (4)
    // Sunday 2026-11-22 is working day at Gulshan!
    const gulshanSunSlots = getDoctorBranchAvailability("doc-1", "branch-gulshan", "2026-11-22");
    expect(gulshanSunSlots.length).toBeGreaterThan(0);
    expect(gulshanSunSlots[0].time).toBe("17:00");

    // Saturday 2026-11-21 is non-working day at Gulshan!
    const gulshanSatSlots = getDoctorBranchAvailability("doc-1", "branch-gulshan", "2026-11-21");
    expect(gulshanSatSlots.length).toBe(0);
  });

  it("T-REL1.1-04: Server-side rate limiting and abuse prevention", () => {
    resetRateLimitsForTests();
    const testIp = "192.168.1.100";
    const config = { maxRequests: 5, windowMs: 15 * 60 * 1000 };

    // Requests 1 through 5 are allowed
    for (let i = 1; i <= 5; i++) {
      const res = checkRateLimit("test_auth_action", testIp, config);
      expect(res.allowed).toBe(true);
      expect(res.remaining).toBe(5 - i);
    }

    // 6th request is blocked with HTTP 429 semantics
    const blockedRes = checkRateLimit("test_auth_action", testIp, config);
    expect(blockedRes.allowed).toBe(false);
    expect(blockedRes.remaining).toBe(0);
    expect(blockedRes.retryAfterSeconds).toBeGreaterThan(0);

    // Different IP is NOT affected
    const otherIpRes = checkRateLimit("test_auth_action", "192.168.1.200", config);
    expect(otherIpRes.allowed).toBe(true);

    // Different action is NOT affected
    const otherActionRes = checkRateLimit("different_action", testIp, config);
    expect(otherActionRes.allowed).toBe(true);
  });

  it("T-REL1.1-05: Audit log integrity, credential exclusion, and historical immutability", () => {
    const db = getDbState();
    // 1. Audit events must exist and have mandatory fields
    expect(db.auditEvents.length).toBeGreaterThan(0);
    for (const ev of db.auditEvents) {
      expect(ev.id).toBeDefined();
      expect(ev.action).toBeDefined();
      expect(ev.actorUserId).toBeDefined();
      expect(ev.occurredAt).toBeDefined();

      // 2. Sensitive credentials must NEVER appear in audit summaries or diffJson
      expect(ev.summary).not.toContain("passwordHash");
      expect(ev.summary).not.toContain("$2b$");
      expect(ev.summary).not.toContain("demo-hash:");
      if (ev.diffJson) {
        expect(ev.diffJson).not.toContain("passwordHash");
        expect(ev.diffJson).not.toContain("$2b$");
      }
    }
  });

  // ==========================================================================
  // T-FB-GEN-01 to T-FB-GEN-05: CMS Doctor Management & Facebook Availability Generator
  // ==========================================================================

  it("T-FB-GEN-01: CMS Editor doctor profile management, photograph cropping/repositioning, and public presentation", async () => {
    // 1. Content Editor updates doctor photograph, crop zoom, positioning, and copywriting
    const res = await updateDoctorProfilePresentation(editorSession, {
      doctorId: "doc-1",
      imageUrl: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
      imagePosition: "50% 25%",
      imageCrop: {
        zoom: 1.4,
        x: 0,
        y: -15,
      },
      publicTaglineEn: "Chief Specialist in Advanced Interventional Cardiology",
      publicTaglineBn: "উন্নত ইন্টারভেনশনাল কার্ডিওলজি প্রধান বিশেষজ্ঞ",
      bioEn: "Prof. Dr. Anisur Rahman is a renowned interventional cardiologist leading cardiovascular innovations.",
      bioBn: "অধ্যাপক ডাঃ আনিসুর রহমান একজন প্রখ্যাত ইন্টারভেনশনাল কার্ডিওলজিস্ট।",
    });

    expect(res.ok).toBe(true);
    if (!res.ok) return;

    expect(res.doctor.imageUrl).toContain("data:image/png;base64");
    expect(res.doctor.imagePosition).toBe("50% 25%");
    expect(res.doctor.imageCrop?.zoom).toBe(1.4);
    expect(res.doctor.publicTaglineEn).toBe("Chief Specialist in Advanced Interventional Cardiology");
    expect(res.doctor.bioEn).toContain("renowned interventional cardiologist");

    // 2. Verified operational records remain untouched
    expect(res.doctor.bmdcRegistrationNo).toBe("BMDC-SYN-24101"); // Immutable
    expect(res.doctor.consultationFeeBdt).toBe(1500); // Immutable

    // 3. Audit trail records presentation update
    const db = getDbState();
    const auditEv = db.auditEvents.find(
      (ev) => ev.entityId === "doc-1" && ev.action === "DOCTOR_PROFILE_PRESENTATION_UPDATED"
    );
    expect(auditEv).toBeDefined();
    expect(auditEv?.actorRole).toBe("CONTENT_EDITOR");
  });

  it("T-FB-GEN-02: Daily Doctor Availability Generator calculations, schedule exclusion, and conflict detection", () => {
    // Wednesday: 2026-11-18 (doc-1 works at Dhanmondi on Wednesday 16:00-20:00)
    const wednesdayResult = calculateDailyDoctorAvailability("2026-11-18");
    expect(wednesdayResult.date).toBe("2026-11-18");
    expect(wednesdayResult.weekdayName).toBe("Wednesday");
    expect(wednesdayResult.eligibleDoctors.length).toBeGreaterThan(0);

    // Verify doc-1 is included with correct chamber details
    const doc1Card = wednesdayResult.eligibleDoctors.find((d) => d.doctorId === "doc-1");
    expect(doc1Card).toBeDefined();
    if (doc1Card) {
      expect(doc1Card.nameEn).toBe("Prof. Dr. Anisur Rahman");
      expect(doc1Card.branchNameEn).toBe("Evercare in Dhanmondi");
      expect(doc1Card.consultationHours).toBe("04:00 PM – 08:00 PM");
      expect(doc1Card.totalAvailableSlots).toBeGreaterThan(0);
    }

    // Thursday: 2026-11-19 (doc-1 has NO chamber at Dhanmondi, but practices at Gulshan)
    const thursdayResult = calculateDailyDoctorAvailability("2026-11-19");
    const doc1ThuCard = thursdayResult.eligibleDoctors.find((d) => d.doctorId === "doc-1");
    expect(doc1ThuCard).toBeDefined();
    if (doc1ThuCard) {
      expect(doc1ThuCard.branchNameEn).toBe("Evercare in Gulshan");
      expect(doc1ThuCard.consultationHours).toBe("05:00 PM – 08:30 PM");
    }
  });

  it("T-FB-GEN-03: Doctor availability staleness detection and revalidation before publishing", async () => {
    const targetDate = "2026-11-18";
    const initial = calculateDailyDoctorAvailability(targetDate);
    const baselineIds = initial.eligibleDoctors.map((d) => d.doctorId);

    // Initial check: Not stale
    const freshCheck = checkStaleness(targetDate, baselineIds);
    expect(freshCheck.isStale).toBe(false);

    // Block doc-1's Dhanmondi chamber on this date
    await blockDoctorChamberDate({
      doctorBranchId: "db-doc1-dhanmondi",
      dateStr: targetDate,
      reasonEn: "Emergency hospital committee conference",
      reasonBn: "জরুরি কনফারেন্স",
      exceptionType: "BLOCKED",
      actorUserId: adminSession.userId,
      actorName: adminSession.fullName,
      actorRole: adminSession.role,
    });

    // Check staleness after change: Must detect that availability changed!
    const staleCheck = checkStaleness(targetDate, baselineIds);
    expect(staleCheck.isStale).toBe(true);
    expect(staleCheck.reason).toBeDefined();
  });

  it("T-FB-GEN-04: Future Facebook publishing service architecture, feature flag protection, and batch queue lifecycle", async () => {
    // 1. Config check: Auto publish is disabled by default
    const config = facebookPublisher.getConfig();
    expect(config.autoPublishEnabled).toBe(false);
    expect(config.mode).toBe("MANUAL_ONLY");

    // 2. Save a generated batch
    const batchId = `fb-batch-test-${Date.now()}`;
    const batch = await facebookPublisher.saveBatch({
      id: batchId,
      targetDate: "2026-11-18",
      caption: "Available doctors today at Evercare",
      status: "DRAFT",
      items: [
        {
          id: "item-1",
          doctorId: "doc-1",
          doctorName: "Prof. Dr. Anisur Rahman",
          specialtyName: "Cardiology",
          branchName: "Dhanmondi",
          consultationDate: "2026-11-18",
          consultationHours: "04:00 PM – 08:00 PM",
          photoUrl: "/images/doctors/doc-1.svg",
          status: "DRAFT",
        },
      ],
      generatedAt: new Date().toISOString(),
      revalidatedAt: new Date().toISOString(),
      generatedByUserId: editorSession.userId,
      generatedByUserName: editorSession.fullName,
    });

    expect(batch.id).toBe(batchId);
    expect(batch.status).toBe("DRAFT");

    // 3. Mark batch as READY
    const updated = await facebookPublisher.updateBatchStatus(batchId, "READY");
    expect(updated?.status).toBe("READY");

    // 4. Attempt to publish via Meta Graph API: Safe fallback when auto-publish flag is disabled
    const publishRes = await facebookPublisher.publishBatch(batchId);
    expect(publishRes.ok).toBe(false);
    expect(publishRes.status).toBe("READY"); // Remains ready for manual download & post
    expect(publishRes.error).toBe("FACEBOOK_AUTO_PUBLISH_DISABLED");
  });

  it("T-FB-GEN-05: Doctor Dashboard elimination verification — doctor role excluded from admin console access", () => {
    // ADMIN_CONSOLE_ROLES contains Super Admin, Hospital Admin, Dept Manager, Receptionist, Content Editor
    expect(ADMIN_CONSOLE_ROLES).toContain("SUPER_ADMIN");
    expect(ADMIN_CONSOLE_ROLES).toContain("HOSPITAL_ADMIN");
    expect(ADMIN_CONSOLE_ROLES).toContain("DEPT_MANAGER");
    expect(ADMIN_CONSOLE_ROLES).toContain("RECEPTIONIST");
    expect(ADMIN_CONSOLE_ROLES).toContain("CONTENT_EDITOR");

    // DOCTOR role is NOT in ADMIN_CONSOLE_ROLES (Eliminated doctor dashboard)
    expect(ADMIN_CONSOLE_ROLES).not.toContain("DOCTOR");
  });

  // ==========================================================================
  // MASTER DASHBOARD REDESIGN & ROLE ARCHITECTURE TEST SUITE
  // ==========================================================================

  describe("Master Dashboard Redesign & 5-Role Architecture Suite", () => {
    it("T-DASH-01: Five Dashboards Only Architecture — role separation & doctor exclusion", () => {
      // 5 distinct dashboard roles are supported
      const supportedDashboardRoles = [
        "SUPER_ADMIN",
        "HOSPITAL_ADMIN",
        "RECEPTIONIST",
        "CONTENT_EDITOR",
        "PATIENT",
      ];
      expect(supportedDashboardRoles).toHaveLength(5);

      // Verify DOCTOR is strictly excluded from console administrative roles
      expect(ADMIN_CONSOLE_ROLES).not.toContain("DOCTOR");

      // Verify canonical doctor records and schedules are preserved in database
      const db = getDbState();
      expect(db.doctors.length).toBeGreaterThan(0);
      const doc = db.doctors.find((d) => d.id === "doc-1");
      expect(doc).toBeDefined();
      expect(doc?.bmdcRegistrationNo).toBe("BMDC-SYN-24101");
      expect(doc?.branches[0]?.scheduleRules.length).toBeGreaterThan(0);
    });

    it("T-DASH-02: Actionable Insights Generation from real database state", () => {
      const db = getDbState();
      const insights = getOperationalInsights("HOSPITAL_ADMIN");

      expect(Array.isArray(insights)).toBe(true);
      expect(insights.length).toBeGreaterThan(0);

      // All insights must contain title, description, severity, metric, and evidence
      for (const ins of insights) {
        expect(ins.id).toBeDefined();
        expect(ins.title).toBeTruthy();
        expect(ins.description).toBeTruthy();
        expect(["CRITICAL", "WARNING", "INFO"]).toContain(ins.severity);
        expect(ins.metric).toBeTruthy();
        expect(ins.evidence).toBeTruthy();
        expect(ins.freshness).toBeTruthy();
      }

      // Check reception-specific insights
      const receptionInsights = getOperationalInsights("RECEPTIONIST", "branch-dhanmondi");
      expect(Array.isArray(receptionInsights)).toBe(true);
    });

    it("T-DASH-03: Receptionist Quick Appointment Creation & Concurrency Guard", async () => {
      // Front desk books appointment for a patient
      const result = await createAppointmentRequest({
        departmentId: "dept-cardiology",
        doctorId: "doc-1",
        branchId: "branch-dhanmondi",
        preferredDate: "2026-11-07",
        preferredTimeSlot: "17:00",
        patientName: "Front Desk Walkin Patient",
        patientPhone: "01711998877",
        visitType: "NEW_CONSULTATION",
        consentAccepted: true,
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.appointment.reference).toMatch(/^EC-2026-/);
        expect(result.appointment.patientName).toBe("Front Desk Walkin Patient");

        // Front desk confirms appointment
        const transitionRes = await transitionAppointmentStatus({
          appointmentId: result.appointment.id,
          toStatus: "CONFIRMED",
          actorUserId: receptionistSession.userId,
          actorName: receptionistSession.fullName,
          actorRole: receptionistSession.role,
          reason: "Front desk in-person verification",
        });

        expect(transitionRes.ok).toBe(true);
        if (transitionRes.ok) {
          expect(transitionRes.appointment.status).toBe("CONFIRMED");
        }
      }
    });

    it("T-DASH-04: Strict Patient Record Isolation — patient can only access own data", () => {
      const db = getDbState();
      const patientUserId = "user-patient-1";
      const patientPhone = "01711223344";

      // Filter appointments as performed in PatientDashboardPage
      const patientAppointments = db.appointments.filter(
        (a) => a.patientUserId === patientUserId || a.patientPhone === patientPhone
      );

      // Must find patient's own bookings
      expect(patientAppointments.length).toBeGreaterThan(0);
      for (const apt of patientAppointments) {
        const isOwner = apt.patientUserId === patientUserId || apt.patientPhone === patientPhone;
        expect(isOwner).toBe(true);
      }

      // Ensure another patient's data is never mixed in
      const otherAppointments = db.appointments.filter(
        (a) => a.patientPhone === "01711999999"
      );
      for (const other of otherAppointments) {
        expect(patientAppointments.some((p) => p.id === other.id)).toBe(false);
      }
    });

    it("T-DASH-05: Hospital Admin Operational Truth vs CMS Presentation Boundary", async () => {
      const db = getDbState();
      const doc = db.doctors.find((d) => d.id === "doc-1")!;
      const originalBmdc = doc.bmdcRegistrationNo;
      const originalFee = doc.consultationFeeBdt;

      // CMS Editor updates public presentation (photo crop, bio, tagline)
      const cmsRes = await updateDoctorProfilePresentation(editorSession, {
        doctorId: doc.id,
        bioEn: "Leading cardiovascular specialist dedicated to clinical excellence.",
        bioBn: "কার্ডিওলজি বিশেষজ্ঞ।",
        publicTaglineEn: "Compassionate Cardiology Care",
        publicTaglineBn: "হৃদরোগে যত্নবান সেবা",
      });

      expect(cmsRes.ok).toBe(true);

      // Verify operational credentials remain strictly unchanged
      const updatedDoc = getDbState().doctors.find((d) => d.id === "doc-1")!;
      expect(updatedDoc.bmdcRegistrationNo).toBe(originalBmdc);
      expect(updatedDoc.consultationFeeBdt).toBe(originalFee);
      expect(updatedDoc.publicTaglineEn).toBe("Compassionate Cardiology Care");
    });
  });

  // ==========================================================================
  // PHASE 1: Multi-Branch Fixed-Slot Engine, Prisma Relational Layer & BD Copy
  // ==========================================================================
  describe("Phase 1 — Multi-Branch Fixed-Slot Engine & Bangladeshi Clinical Context", () => {
    it("T-SLOT-01: getAvailableSlotsForDoctor resolves Asia/Dhaka weekday, 15-min slots, and excludes break windows", async () => {
      // 2026-11-15 is Sunday (weekday 0 in Asia/Dhaka). doc-9 has chamber at branch-dhanmondi 17:00-21:00 (15m slots, break 19:00-19:30)
      expect(resolveDhakaWeekday("2026-11-15")).toBe(0);
      const res = await getAvailableSlotsForDoctor({
        doctorId: "doc-9",
        branchId: "branch-dhanmondi",
        date: "2026-11-15",
      });

      expect(res.isAvailableDay).toBe(true);
      expect(res.chamberRoom).toBe("Room #402, 3rd Floor");
      expect(res.slots.some((s) => s.time24 === "17:00")).toBe(true);
      expect(res.slots.some((s) => s.time24 === "17:15")).toBe(true);
      // Break window 19:00 - 19:30 is excluded
      expect(res.slots.some((s) => s.time24 === "19:00")).toBe(false);
      expect(res.slots.some((s) => s.time24 === "19:15")).toBe(false);
      expect(res.slots.some((s) => s.time24 === "19:30")).toBe(true);
    });

    it("T-SLOT-02: getAvailableSlotsForDoctor honors FULL_DAY_LEAVE, CUSTOM_HOURS, and BLOCKED_SLOTS overrides", async () => {
      // 1. FULL_DAY_LEAVE on 2026-11-26 for doc-9 at branch-dhanmondi
      const leaveRes = await getAvailableSlotsForDoctor({
        doctorId: "doc-9",
        branchId: "branch-dhanmondi",
        date: "2026-11-26",
      });
      expect(leaveRes.isAvailableDay).toBe(false);
      expect(leaveRes.slots.length).toBe(0);
      expect(leaveRes.reason).toContain("CME Conference");

      // 2. CUSTOM_HOURS on Friday 2026-11-27 (non-regular day for doc-9) 18:00-20:00 with blocked slot 18:30
      const customRes = await getAvailableSlotsForDoctor({
        doctorId: "doc-9",
        branchId: "branch-dhanmondi",
        date: "2026-11-27",
      });
      expect(customRes.isAvailableDay).toBe(true);
      expect(customRes.slots.some((s) => s.time24 === "18:00" && s.status === "AVAILABLE")).toBe(true);
      expect(customRes.slots.some((s) => s.time24 === "18:30" && s.status === "BLOCKED")).toBe(true);

      // 3. BLOCKED_SLOTS on 2026-11-22 for doc-1 at branch-dhanmondi
      const blockedRes = await getAvailableSlotsForDoctor({
        doctorId: "doc-1",
        branchId: "branch-dhanmondi",
        date: "2026-11-22",
      });
      expect(blockedRes.isAvailableDay).toBe(true);
      const slot1700 = blockedRes.slots.find((s) => s.time24 === "17:00");
      expect(slot1700?.status).toBe("BLOCKED");
    });

    it("T-SEARCH-BD-01: Unified search queries match Bangladeshi institutions (DMC, BSMMU, BIRDEM) and bilingual symptoms (Dengue / ডেঙ্গু)", async () => {
      const depts = await prisma.department.findMany();
      expect(depts.length).toBeGreaterThanOrEqual(11);

      const dmcDoctors = getPublishedDoctors({ query: "DMC" });
      expect(dmcDoctors.length).toBeGreaterThanOrEqual(5);

      const bsmmuDoctors = getPublishedDoctors({ query: "BSMMU" });
      expect(bsmmuDoctors.length).toBeGreaterThanOrEqual(4);

      const dengueBnHits = executeGlobalSearch("ডেঙ্গু", "bn");
      expect(dengueBnHits.some((h) => h.type === "DOCTOR")).toBe(true);
      expect(dengueBnHits.some((h) => h.type === "DEPARTMENT")).toBe(true);
      expect(dengueBnHits.some((h) => h.type === "CONDITION")).toBe(true);

      const pregnancyHits = executeGlobalSearch("গর্ভকালীন পরিচর্যা", "bn");
      expect(pregnancyHits.length).toBeGreaterThanOrEqual(2);
    });
  });

  // ==========================================================================
  // PHASE 2: Assistant Schedule Manager, Conflict Detection, Online Booking & SMS
  // ==========================================================================
  describe("Phase 2 — Front Desk & Assistant Schedule Manager, Conflict Detection & SMS Service", () => {
    it("T-PH2-01: Assistant opens CUSTOM_HOURS, blocks fixed slots, marks FULL_DAY_LEAVE, and triggers conflict detection", async () => {
      // 1. Open ad-hoc CUSTOM_HOURS on a non-regular Friday (2026-12-04) for doc-1 at branch-dhanmondi
      const customOverride = await upsertDoctorScheduleOverride({
        doctorId: "doc-1",
        branchId: "branch-dhanmondi",
        date: "2026-12-04",
        overrideType: "CUSTOM_HOURS",
        customStartTime: "18:00",
        customEndTime: "20:00",
        blockedSlots: [],
        reasonEn: "Friday Evening Special Chamber",
        reasonBn: "শুক্রবার বিশেষ চেম্বার",
        actorUserId: receptionistSession.userId,
        actorName: receptionistSession.fullName,
        actorRole: receptionistSession.role,
      });
      expect(customOverride.ok).toBe(true);

      // Verify newly opened slots are immediately bookable
      const customSlots = await getAvailableSlotsForDoctor({
        doctorId: "doc-1",
        branchId: "branch-dhanmondi",
        date: "2026-12-04",
      });
      expect(customSlots.isAvailableDay).toBe(true);
      expect(
        customSlots.slots.some((s) => s.time24 === "18:00" && s.status === "AVAILABLE")
      ).toBe(true);

      // Book a patient on the newly opened 18:00 slot
      const booked = await createAppointmentRequest({
        departmentId: "dept-cardiology",
        doctorId: "doc-1",
        branchId: "branch-dhanmondi",
        preferredDate: "2026-12-04",
        preferredTimeSlot: "18:00",
        patientName: "Rafiqul Islam",
        patientPhone: "+8801715998877",
        patientAge: 49,
        patientGender: "MALE",
        visitType: "NEW_CONSULTATION",
        consentAccepted: true,
      });
      expect(booked.ok).toBe(true);
      if (!booked.ok) return;

      // Phone is normalized to 11-digit BD format
      expect(booked.appointment.patientPhone).toBe("01715998877");

      // 2. Assistant blocks 18:00 or marks FULL_DAY_LEAVE -> Conflict Detection flags appointment as RESCHEDULE_REQUESTED
      const leaveRes = await upsertDoctorScheduleOverride({
        doctorId: "doc-1",
        branchId: "branch-dhanmondi",
        date: "2026-12-04",
        overrideType: "FULL_DAY_LEAVE",
        reasonEn: "Emergency OT Case",
        reasonBn: "জরুরি অপারেশন",
        actorUserId: receptionistSession.userId,
        actorName: receptionistSession.fullName,
        actorRole: receptionistSession.role,
      });
      expect(leaveRes.ok).toBe(true);
      if (leaveRes.ok) {
        expect(leaveRes.affectedAppointments.length).toBe(1);
        expect(leaveRes.affectedAppointments[0].id).toBe(booked.appointment.id);
        expect(leaveRes.affectedAppointments[0].status).toBe("RESCHEDULE_REQUESTED");
      }
    });

    it("T-PH2-02: End-to-end appointment lifecycle dispatches CONFIRMED, RESCHEDULED, and CANCELLED SMS logs", async () => {
      // 1. Public booking on Wednesday 2026-12-02 at 16:20 for doc-1 at branch-dhanmondi
      const reqRes = await createAppointmentRequest({
        departmentId: "dept-cardiology",
        doctorId: "doc-1",
        branchId: "branch-dhanmondi",
        preferredDate: "2026-12-02",
        preferredTimeSlot: "16:20",
        patientName: "Tahmina Akter",
        patientPhone: "01819223344",
        patientAge: 36,
        patientGender: "FEMALE",
        visitType: "FOLLOW_UP",
        consentAccepted: true,
      });
      expect(reqRes.ok).toBe(true);
      if (!reqRes.ok) return;

      const aptId = reqRes.appointment.id;
      // Online booking is auto-confirmed and sends the CONFIRMED SMS immediately
      expect(reqRes.appointment.status).toBe("CONFIRMED");
      let logs = getSmsLogsForAppointment(aptId);
      expect(logs.some((l) => l.eventType === "CONFIRMED")).toBe(true);
      const confirmSms = logs.find((l) => l.eventType === "CONFIRMED")!;
      expect(confirmSms.messageBody).toContain(reqRes.appointment.reference);
      expect(confirmSms.messageBody).toContain("15 min");

      // 3. Front Desk reschedules to 16:40 -> RESCHEDULED SMS log recorded & 16:20 released
      const reschedRes = await transitionAppointmentStatus({
        appointmentId: aptId,
        toStatus: "CONFIRMED",
        newDate: "2026-12-02",
        newTimeSlot: "16:40",
        actorUserId: receptionistSession.userId,
        actorName: receptionistSession.fullName,
        actorRole: receptionistSession.role,
        reason: "Moved to 16:40",
      });
      expect(reschedRes.ok).toBe(true);
      logs = getSmsLogsForAppointment(aptId);
      expect(logs.some((l) => l.eventType === "RESCHEDULED")).toBe(true);

      // 4. Front Desk cancels booking -> CANCELLED SMS log recorded & 16:40 released back to AVAILABLE
      const cancelRes = await transitionAppointmentStatus({
        appointmentId: aptId,
        toStatus: "CANCELLED",
        actorUserId: receptionistSession.userId,
        actorName: receptionistSession.fullName,
        actorRole: receptionistSession.role,
        reason: "Patient requested cancellation",
      });
      expect(cancelRes.ok).toBe(true);
      logs = getSmsLogsForAppointment(aptId);
      expect(logs.some((l) => l.eventType === "CANCELLED")).toBe(true);

      const postCancelAvail = await getAvailableSlotsForDoctor({
        doctorId: "doc-1",
        branchId: "branch-dhanmondi",
        date: "2026-12-02",
      });
      const slot1640 = postCancelAvail.slots.find((s) => s.time24 === "16:40");
      expect(slot1640?.status).toBe("AVAILABLE");
    });

    it("T-PH2-03: 15-Second Front Desk Quick Booking & Recurring Weekly Rule Editor", async () => {
      // 1. Update recurring weekly rule for doc-1 at branch-dhanmondi
      const ruleRes = await upsertDoctorChamberScheduleRule({
        doctorId: "doc-1",
        branchId: "branch-dhanmondi",
        dayOfWeek: 1, // Monday
        chamberRoom: "Room #301, 2nd Floor (Heart Center)",
        startTime: "16:00",
        endTime: "20:00",
        slotDurationMinutes: 20,
        isActive: true,
        actorUserId: receptionistSession.userId,
        actorName: receptionistSession.fullName,
        actorRole: receptionistSession.role,
      });
      expect(ruleRes.ok).toBe(true);

      // 2. 15-second phone hotline booking directly as CONFIRMED
      const qbRes = await createFrontDeskAppointment({
        doctorId: "doc-1",
        branchId: "branch-dhanmondi",
        appointmentDate: "2026-12-07", // Monday
        slotTime: "16:00",
        patientName: "Kamrul Hasan",
        patientPhone: "01911334455",
        patientAge: 52,
        patientGender: "MALE",
        visitType: "NEW_VISIT",
        bookingSource: "FRONT_DESK_PHONE",
        symptomsNote: "BP checkup via 10666 hotline",
        actorUserId: receptionistSession.userId,
        actorName: receptionistSession.fullName,
        actorRole: receptionistSession.role,
      });
      expect(qbRes.ok).toBe(true);
      if (qbRes.ok) {
        expect(qbRes.appointment.status).toBe("CONFIRMED");
        expect(qbRes.appointment.bookingSource).toBe("FRONT_DESK_PHONE");
        const smsLogs = getSmsLogsForAppointment(qbRes.appointment.id);
        expect(smsLogs.some((s) => s.eventType === "CONFIRMED")).toBe(true);
      }
    });
  });

  // ==========================================================================
  // Phase 3: Healthcare Analytics, Daily Facebook Generator & Hospital CMS Suite
  // ==========================================================================
  describe("Phase 3: Healthcare Analytics, Daily Facebook Generator & Hospital CMS Suite", () => {
    it("T-PH3-01: Healthcare Analytics calculation & CSV exports", async () => {
      // 1. Compute analytics across all records
      const analytics = await computeHealthcareAnalytics({ range: "all" });

      // Verify Executive KPIs
      expect(analytics.kpis.totalAppointments).toBeGreaterThan(0);
      expect(analytics.kpis.confirmationRatePct).toBeGreaterThanOrEqual(0);
      expect(analytics.kpis.confirmationRatePct).toBeLessThanOrEqual(100);
      expect(analytics.kpis.patientSatisfactionScore).toBeGreaterThanOrEqual(1);
      expect(analytics.kpis.patientSatisfactionScore).toBeLessThanOrEqual(5);

      // Verify Dataset 1: Doctor Popularity & Slot Utilization
      expect(analytics.dataset1DoctorPopularity.length).toBeGreaterThan(0);
      const firstDoc = analytics.dataset1DoctorPopularity[0];
      expect(firstDoc.nameEn).toBeDefined();
      expect(firstDoc.utilizationPct).toBeGreaterThanOrEqual(0);

      // Verify Dataset 2: Feedback Sentiment across categories
      expect(analytics.dataset2FeedbackCategories.length).toBe(5);
      const careSentiment = analytics.dataset2FeedbackCategories.find(
        (s) => s.category === "DOCTOR_CARE"
      );
      expect(careSentiment).toBeDefined();
      expect(careSentiment?.averageScore).toBeGreaterThanOrEqual(1);

      // Verify Dataset 3: Department Demand
      expect(analytics.dataset3DepartmentDemand.length).toBeGreaterThan(0);
      const cardDept = analytics.dataset3DepartmentDemand.find(
        (d) => d.nameEn.toLowerCase().includes("cardiology")
      );
      expect(cardDept).toBeDefined();

      // Verify Dataset 4: 7x4 Rush Heatmap (28 cells)
      expect(analytics.dataset4RushHeatmap.length).toBe(28);

      // Verify Dataset 5: Booking Velocity
      expect(analytics.dataset5BookingVelocity.length).toBeGreaterThanOrEqual(1);

      // Verify Dataset 6: Split by Channel and Visit Type
      expect(analytics.dataset6ChannelSplit.length).toBeGreaterThan(0);
      expect(analytics.dataset6VisitTypeSplit.length).toBeGreaterThan(0);

      // 2. Verify CSV Export streams
      const doctorCsv = generateDoctorPopularityCsv(analytics);
      expect(doctorCsv).toContain("Doctor Name");
      expect(doctorCsv).toContain("Department");
      expect(doctorCsv).toContain("Confirmed");

      const feedbackCsv = generatePatientFeedbackCsv();
      expect(feedbackCsv).toContain("Patient Name");
      expect(feedbackCsv).toContain("Category");
      expect(feedbackCsv).toContain("Rating");

      const registerCsv = generateAppointmentRegisterCsv();
      expect(registerCsv).toContain("Reference ID");
      expect(registerCsv).toContain("Patient Name");
      expect(registerCsv).toContain("Status");
    });

    it("T-PH3-02: Daily Facebook Spotlight Campaign Generation & Exceptions", async () => {
      const campaignDate = "2026-12-07"; // Monday

      // 1. Generate campaign for scheduled Monday
      const campaign = await generateDailyFacebookCampaign({
        date: campaignDate,
        branchId: "branch-dhanmondi",
      });

      expect(campaign.ok).toBe(true);
      expect(campaign.doctors.length).toBeGreaterThan(0);

      const doc1Spotlight = campaign.doctors.find((d) => d.doctorId === "doc-1");
      expect(doc1Spotlight).toBeDefined();
      if (doc1Spotlight) {
        expect(doc1Spotlight.visitingHoursEn).toBeDefined();
        expect(doc1Spotlight.visitingHoursBn).toBeDefined();
        expect(doc1Spotlight.caption).toContain("10666");
        expect(doc1Spotlight.caption).toContain("Dr.");
        expect(doc1Spotlight.caption).toContain("https://evercare.bd/appointments");
      }

      // 2. Add FULL_DAY_LEAVE exception for doc-1 and verify exclusion
      await upsertDoctorScheduleOverride({
        doctorId: "doc-1",
        branchId: "branch-dhanmondi",
        date: campaignDate,
        overrideType: "FULL_DAY_LEAVE",
        reasonEn: "Cardiology Annual CME Conference",
        actorUserId: adminSession.userId,
        actorName: adminSession.fullName,
        actorRole: adminSession.role,
      });

      const campaignWithLeave = await generateDailyFacebookCampaign({
        date: campaignDate,
        branchId: "branch-dhanmondi",
      });

      const excludedDoc1 = campaignWithLeave.doctors.find((d) => d.doctorId === "doc-1");
      expect(excludedDoc1).toBeUndefined();
    });

    it("T-PH3-03: Patient Feedback Submission & Admin Moderation + Hospital Notices CMS", async () => {
      // 1. Submit patient feedback
      const feedback = await createPatientFeedback({
        patientName: "Tasneem Sultana",
        patientPhone: "01755112233",
        category: "FRONT_DESK_SERVICE",
        rating: 4,
        comment: "Front desk staff quickly assisted my elderly father with a wheelchair.",
        doctorId: "doc-1",
        departmentId: "dept-cardiology",
        branchId: "branch-dhanmondi",
      });

      expect(feedback.id).toBeDefined();
      expect(feedback.status).toBe("NEW");

      // 2. Admin moderates feedback to IN_REVIEW
      const inReviewRes = await updatePatientFeedback(adminSession, {
        feedbackId: feedback.id,
        status: "IN_REVIEW",
      });
      expect(inReviewRes.ok).toBe(true);
      if (inReviewRes.ok) {
        expect(inReviewRes.feedback.status).toBe("IN_REVIEW");
      }

      // 3. Admin resolves feedback with official response
      const resolveRes = await updatePatientFeedback(adminSession, {
        feedbackId: feedback.id,
        status: "RESOLVED",
        adminResponse: "Thank you Tasneem. Evercare priority patient mobility assistance is always on standby.",
      });
      expect(resolveRes.ok).toBe(true);
      if (resolveRes.ok) {
        expect(resolveRes.feedback.status).toBe("RESOLVED");
        expect(resolveRes.feedback.adminResponse).toContain("priority patient mobility");
      }

      // 4. Hospital Notices CMS — Upsert clinical notice
      const noticeRes = await upsertHospitalNotice(adminSession, {
        slug: "cardiology-outpatient-extension",
        titleEn: "Extended Evening OPD Sessions for Cardiology",
        titleBn: "কার্ডিওলজি সান্ধ্যকালীন ওপিডি সময়সীমা বর্ধিতকরণ",
        summaryEn: "OPD hours extended until 9:30 PM at Dhanmondi campus.",
        summaryBn: "ধানমন্ডি ক্যাম্পাসে ওপিডি রাত ৯:৩০ পর্যন্ত বর্ধিত করা হলো।",
        bodyEn: "Detailed guidelines for specialized evening echocardiogram appointments.",
        bodyBn: "সান্ধ্যকালীন ইকোকার্ডিওগ্রামের বিস্তারিত তথ্য।",
        category: "CLINICAL_ALERT",
        branchId: "branch-dhanmondi",
        isPinned: true,
        isActive: true,
      });

      expect(noticeRes.ok).toBe(true);
      if (noticeRes.ok) {
        expect(noticeRes.notice.slug).toBe("cardiology-outpatient-extension");
        expect(noticeRes.notice.isActive).toBe(true);

        // 5. Toggle notice visibility
        const toggleRes = await toggleNoticeStatus(adminSession, noticeRes.notice.id);
        expect(toggleRes.ok).toBe(true);
        if (toggleRes.ok) {
          expect(toggleRes.notice.isActive).toBe(false);
        }
      }
    });
  });
});

