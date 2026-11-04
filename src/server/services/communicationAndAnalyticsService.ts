import { getDbState, recordAuditEvent, runInTransaction } from "@/server/db/store";
import {
  ContactRequest,
  FeedbackRecord,
  FeedbackStatus,
  RoleCode,
} from "@/types/domain";
import {
  contactRequestSchema,
  feedbackSubmissionSchema,
} from "@/lib/validation/schemas";
import { z } from "zod";
import { SessionPayload } from "@/server/auth/session";

// ============================================================================
// DeltaCare Communications, Feedback & Operational Analytics Service
// Enforces FR-FB-01..06, FR-NTF-01..04, FR-REP-01..05
// - Private feedback & complaint submission with AI category assistance
// - Contact & callback request logging
// - Real-data operational analytics & CSV export (zero fake counts)
// ============================================================================

export async function createContactRequest(
  input: z.infer<typeof contactRequestSchema>
): Promise<ContactRequest> {
  return runInTransaction((state) => {
    const seq = 300 + state.contactRequests.length + 1;
    const reference = `CB-2026-${seq}`;
    const nowIso = new Date().toISOString();

    const record: ContactRequest = {
      id: `cr-${Date.now()}`,
      reference,
      fullName: input.fullName,
      phone: input.phone,
      email: input.email || undefined,
      branchId: input.branchId || undefined,
      departmentId: input.departmentId || undefined,
      preferredCallTime: input.preferredCallTime || undefined,
      message: input.message,
      consentAccepted: true,
      status: "OPEN",
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    state.contactRequests.unshift(record);

    state.notifications.unshift({
      id: `notif-${Date.now()}-cb`,
      channel: "SMS",
      recipient: input.phone,
      templateCode: "CALLBACK_REQUEST_LOGGED",
      subject: `DeltaCare Callback Logged (${reference})`,
      bodyPreview: `DeltaCare: Your enquiry ${reference} has been logged. Our Patient Desk will contact you at ${input.phone}.`,
      status: "SENT",
      relatedEntityType: "CONTACT_REQUEST",
      relatedEntityId: record.id,
      providerMessageId: `SIM-CB-${seq}`,
      sentAt: nowIso,
    });

    recordAuditEvent(state, {
      actorUserId: "visitor",
      actorName: input.fullName,
      actorRole: "VISITOR",
      action: "CONTACT_REQUEST_CREATED",
      entityType: "ContactRequest",
      entityId: record.id,
      summary: `Submitted callback/enquiry request ${reference}`,
    });

    return record;
  });
}

function suggestFeedbackCategoryByText(text: string): string {
  const lower = text.toLowerCase();
  if (/wait|delay|queue|late|দেরি|অপেক্ষা/.test(lower)) {
    return "WAIT_TIME — Suggested routing: Outpatient Operations";
  }
  if (/bill|fee|charge|cost|invoice|টাকা|ফি|বিল/.test(lower)) {
    return "BILLING_FEE — Suggested routing: Patient Billing & Administration";
  }
  if (/rude|behavior|staff|nurse|desk|আচরণ/.test(lower)) {
    return "STAFF_CONDUCT — Suggested routing: HR & Patient Relations";
  }
  if (/clean|room|elevator|washroom|parking|পরিচ্ছন্ন/.test(lower)) {
    return "FACILITY — Suggested routing: Facility Management";
  }
  if (/appointment|slot|reschedule|booking|অ্যাপয়েন্টমেন্ট/.test(lower)) {
    return "APPOINTMENT — Suggested routing: Front-Desk Scheduling";
  }
  return "GENERAL — Suggested routing: Patient Experience Desk";
}

export async function createFeedbackSubmission(
  input: z.infer<typeof feedbackSubmissionSchema>
): Promise<FeedbackRecord> {
  return runInTransaction((state) => {
    const seq = 900 + state.feedbacks.length + 1;
    const reference = `FB-2026-${seq}`;
    const nowIso = new Date().toISOString();
    const aiSuggested = suggestFeedbackCategoryByText(
      `${input.subject} ${input.message}`
    );

    const record: FeedbackRecord = {
      id: `fb-${Date.now()}`,
      reference,
      type: input.type,
      category: input.category,
      routedDepartmentId: input.routedDepartmentId || undefined,
      branchId: input.branchId || undefined,
      patientName: input.patientName || "Anonymous Patient",
      patientPhone: input.patientPhone || undefined,
      patientEmail: input.patientEmail || undefined,
      subject: input.subject,
      message: input.message,
      isPrivate: true, // FR-FB-02: Never displayed publicly on website
      status: "NEW",
      aiSuggestedCategory: aiSuggested,
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    state.feedbacks.unshift(record);

    recordAuditEvent(state, {
      actorUserId: "visitor",
      actorName: record.patientName || "Anonymous",
      actorRole: "VISITOR",
      action: "FEEDBACK_SUBMITTED",
      entityType: "FeedbackRecord",
      entityId: record.id,
      summary: `Submitted private ${input.type} (${reference}) under category ${input.category}.`,
    });

    return record;
  });
}

export async function updateFeedbackStatus(
  session: SessionPayload,
  params: {
    feedbackId: string;
    status: FeedbackStatus;
    routedDepartmentId?: string;
    assignedStaffName?: string;
    internalNotes?: string;
    resolutionSummary?: string;
  }
): Promise<{ ok: true; feedback: FeedbackRecord } | { ok: false; error: string }> {
  return runInTransaction((state) => {
    const fb = state.feedbacks.find(
      (f) => f.id === params.feedbackId || f.reference === params.feedbackId
    );
    if (!fb) {
      return { ok: false, error: "Feedback record not found." };
    }

    fb.status = params.status;
    if (params.routedDepartmentId !== undefined) {
      fb.routedDepartmentId = params.routedDepartmentId || undefined;
    }
    if (params.assignedStaffName !== undefined) {
      fb.assignedStaffName = params.assignedStaffName;
    }
    if (params.internalNotes !== undefined) {
      fb.internalNotes = params.internalNotes;
    }
    if (params.resolutionSummary !== undefined) {
      fb.resolutionSummary = params.resolutionSummary;
    }
    fb.updatedAt = new Date().toISOString();

    recordAuditEvent(state, {
      actorUserId: session.userId,
      actorName: session.fullName,
      actorRole: session.role,
      action: "FEEDBACK_UPDATED",
      entityType: "FeedbackRecord",
      entityId: fb.id,
      summary: `Updated feedback ${fb.reference} to status ${fb.status}.`,
    });

    return { ok: true, feedback: fb };
  });
}

export interface OperationalAnalyticsReport {
  generatedAt: string;
  appointments: {
    total: number;
    byStatus: Record<string, number>;
    byDepartment: Array<{ departmentId: string; departmentName: string; count: number }>;
    byBranch: Array<{ branchId: string; branchName: string; count: number }>;
  };
  feedback: {
    total: number;
    openCount: number;
    resolvedCount: number;
    byCategory: Record<string, number>;
    byType: Record<string, number>;
  };
  communications: {
    openCallbacks: number;
    totalCallbacks: number;
    notificationsSent: number;
  };
  aiAssistant: {
    totalInteractions: number;
    abstentionCount: number;
    clinicalRefusalCount: number;
    byCategory: Record<string, number>;
  };
  governance: {
    publishedDoctors: number;
    pendingApprovals: number;
    pendingAIUpdateDrafts: number;
    totalAuditEvents: number;
  };
}

export function getOperationalAnalytics(): OperationalAnalyticsReport {
  const db = getDbState();

  const byStatus: Record<string, number> = {};
  for (const apt of db.appointments) {
    byStatus[apt.status] = (byStatus[apt.status] ?? 0) + 1;
  }

  const byDepartment = db.departments.map((dept) => ({
    departmentId: dept.id,
    departmentName: dept.nameEn,
    count: db.appointments.filter((a) => a.departmentId === dept.id).length,
  }));

  const byBranch = db.branches.map((br) => ({
    branchId: br.id,
    branchName: br.nameEn,
    count: db.appointments.filter((a) => a.branchId === br.id).length,
  }));

  const fbByCategory: Record<string, number> = {};
  const fbByType: Record<string, number> = {};
  for (const fb of db.feedbacks) {
    fbByCategory[fb.category] = (fbByCategory[fb.category] ?? 0) + 1;
    fbByType[fb.type] = (fbByType[fb.type] ?? 0) + 1;
  }

  const aiByCategory: Record<string, number> = {};
  for (const cs of db.conversationSessions) {
    aiByCategory[cs.queryCategory] = (aiByCategory[cs.queryCategory] ?? 0) + 1;
  }

  return {
    generatedAt: new Date().toISOString(),
    appointments: {
      total: db.appointments.length,
      byStatus,
      byDepartment,
      byBranch,
    },
    feedback: {
      total: db.feedbacks.length,
      openCount: db.feedbacks.filter(
        (f) => f.status !== "RESOLVED" && f.status !== "CLOSED"
      ).length,
      resolvedCount: db.feedbacks.filter(
        (f) => f.status === "RESOLVED" || f.status === "CLOSED"
      ).length,
      byCategory: fbByCategory,
      byType: fbByType,
    },
    communications: {
      openCallbacks: db.contactRequests.filter((c) => c.status === "OPEN").length,
      totalCallbacks: db.contactRequests.length,
      notificationsSent: db.notifications.length,
    },
    aiAssistant: {
      totalInteractions: db.conversationSessions.length,
      abstentionCount: db.conversationSessions.filter((c) => c.wasAbstained).length,
      clinicalRefusalCount: db.conversationSessions.filter(
        (c) => c.wasClinicalRefusal
      ).length,
      byCategory: aiByCategory,
    },
    governance: {
      publishedDoctors: db.doctors.filter(
        (d) => d.publicationState === "PUBLISHED"
      ).length,
      pendingApprovals: db.approvalRequests.filter(
        (a) => a.status === "PENDING_APPROVAL"
      ).length,
      pendingAIUpdateDrafts: db.aiUpdateDrafts.filter(
        (u) => u.approvalStatus === "PENDING_APPROVAL"
      ).length,
      totalAuditEvents: db.auditEvents.length,
    },
  };
}

export function generateAppointmentsCsv(): string {
  const db = getDbState();
  const headers = [
    "Reference",
    "Status",
    "PatientName",
    "PatientPhone",
    "Doctor",
    "Department",
    "Branch",
    "PreferredDate",
    "PreferredTimeSlot",
    "VisitType",
    "CreatedAt",
  ];
  const rows = db.appointments.map((apt) => {
    const doc = db.doctors.find((d) => d.id === apt.doctorId)?.nameEn ?? apt.doctorId;
    const dept =
      db.departments.find((d) => d.id === apt.departmentId)?.nameEn ??
      apt.departmentId;
    const branch =
      db.branches.find((b) => b.id === apt.branchId)?.nameEn ?? apt.branchId;
    return [
      apt.reference,
      apt.status,
      `"${apt.patientName.replace(/"/g, '""')}"`,
      apt.patientPhone,
      `"${doc.replace(/"/g, '""')}"`,
      `"${dept.replace(/"/g, '""')}"`,
      `"${branch.replace(/"/g, '""')}"`,
      apt.preferredDate,
      apt.preferredTimeSlot,
      apt.visitType,
      apt.createdAt,
    ].join(",");
  });
  return [headers.join(","), ...rows].join("\n");
}

export async function updateUserRoleOrStatus(
  session: SessionPayload,
  params: {
    targetUserId: string;
    role?: RoleCode;
    isActive?: boolean;
  }
) {
  if (session.role !== "SUPER_ADMIN" && session.role !== "HOSPITAL_ADMIN") {
    return { ok: false as const, error: "Only Super Admin or Hospital Admin can manage user roles." };
  }
  return runInTransaction((state) => {
    const user = state.users.find((u) => u.id === params.targetUserId);
    if (!user) {
      return { ok: false as const, error: "User not found." };
    }
    if (params.role) user.role = params.role;
    if (typeof params.isActive === "boolean") user.isActive = params.isActive;
    user.updatedAt = new Date().toISOString();

    recordAuditEvent(state, {
      actorUserId: session.userId,
      actorName: session.fullName,
      actorRole: session.role,
      action: "USER_ROLE_OR_STATUS_UPDATED",
      entityType: "UserAccount",
      entityId: user.id,
      summary: `Updated user ${user.email}: role=${user.role}, active=${user.isActive}`,
    });

    return { ok: true as const, user };
  });
}

