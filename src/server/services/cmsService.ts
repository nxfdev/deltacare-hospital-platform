import { recordAuditEvent, runInTransaction } from "@/server/db/store";
import { APPROVER_ROLES, SessionPayload } from "@/server/auth/session";
import {
  ApprovalRequest,
  Department,
  DiseaseCondition,
  Doctor,
  PublicationState,
} from "@/types/domain";
import { doctorUpsertSchema } from "@/lib/validation/schemas";
import { z } from "zod";

// ============================================================================
// DeltaCare CMS, Editorial Approval & Publishing Service
// Enforces FR-CMS-01..09: Draft/Pending Approval/Approved/Published workflow,
// server-side role checks, and full audit history.
// ============================================================================

export async function upsertDoctorRecord(
  session: SessionPayload,
  input: z.infer<typeof doctorUpsertSchema>
): Promise<{
  ok: true;
  doctor: Doctor;
  approvalRequest?: ApprovalRequest;
} | { ok: false; error: string }> {
  return runInTransaction((state) => {
    const canPublishDirectly = APPROVER_ROLES.includes(session.role);
    // FR-CMS-06 / US-C01: Non-approvers (e.g. CONTENT_EDITOR) cannot directly publish fee/credential changes
    const effectiveState: PublicationState =
      input.publicationState === "PUBLISHED" && !canPublishDirectly
        ? "PENDING_APPROVAL"
        : input.publicationState;

    const nowIso = new Date().toISOString();
    const existingIdx = input.id
      ? state.doctors.findIndex((d) => d.id === input.id)
      : -1;

    if (existingIdx >= 0) {
      const existing = state.doctors[existingIdx];
      const previousSnapshot = JSON.stringify({
        nameEn: existing.nameEn,
        qualificationsEn: existing.qualificationsEn,
        consultationFeeBdt: existing.consultationFeeBdt,
        publicationState: existing.publicationState,
      });

      // Update or attach branch info
      let updatedBranches = [...(existing.branches || [])];
      if (input.branchId) {
        const brIdx = updatedBranches.findIndex((b) => b.branchId === input.branchId);
        if (brIdx >= 0) {
          updatedBranches[brIdx] = {
            ...updatedBranches[brIdx],
            roomNumber: input.roomNumber || updatedBranches[brIdx].roomNumber,
            status: "ACTIVE",
          };
        } else {
          const dbId = `db-${existing.id}-${input.branchId}`;
          updatedBranches.push({
            id: dbId,
            doctorId: existing.id,
            branchId: input.branchId,
            roomNumber: input.roomNumber || "Chamber Desk",
            status: "ACTIVE",
            scheduleRules: [],
            scheduleExceptions: [],
          });
        }
      }

      const updated: Doctor = {
        ...existing,
        departmentId: input.departmentId,
        specialtyIds: input.specialtyIds,
        slug: input.slug,
        nameEn: input.nameEn,
        nameBn: input.nameBn,
        designationEn: input.designationEn,
        designationBn: input.designationBn,
        qualificationsEn: input.qualificationsEn,
        qualificationsBn: input.qualificationsBn,
        experienceYears: input.experienceYears,
        bmdcRegistrationNo: input.bmdcRegistrationNo,
        bioEn: input.bioEn,
        bioBn: input.bioBn,
        consultationFeeBdt: input.consultationFeeBdt,
        followupFeeBdt: input.followupFeeBdt,
        feeEffectiveFrom: input.feeEffectiveFrom,
        publicationState: effectiveState,
        branches: updatedBranches,
        lastVerifiedAt: effectiveState === "PUBLISHED" ? nowIso : existing.lastVerifiedAt,
        updatedAt: nowIso,
      };

      state.doctors[existingIdx] = updated;

      let approvalRequest: ApprovalRequest | undefined;
      if (effectiveState === "PENDING_APPROVAL") {
        approvalRequest = {
          id: `apr-${Date.now()}`,
          entityType: "DOCTOR",
          entityId: updated.id,
          entityTitle: `${updated.nameEn} — Profile & Fee Update`,
          changeSummary: `Updated profile/fee (${updated.consultationFeeBdt} BDT) awaiting approver sign-off.`,
          previousPayloadJson: previousSnapshot,
          proposedPayloadJson: JSON.stringify({
            nameEn: updated.nameEn,
            qualificationsEn: updated.qualificationsEn,
            consultationFeeBdt: updated.consultationFeeBdt,
            publicationState: "PUBLISHED",
          }),
          status: "PENDING_APPROVAL",
          requestedByUserId: session.userId,
          requestedByName: session.fullName,
          createdAt: nowIso,
        };
        state.approvalRequests.unshift(approvalRequest);
      }

      recordAuditEvent(state, {
        actorUserId: session.userId,
        actorName: session.fullName,
        actorRole: session.role,
        action: "DOCTOR_UPDATED",
        entityType: "Doctor",
        entityId: updated.id,
        summary: `Updated doctor ${updated.nameEn} (State: ${effectiveState})`,
        diffJson: JSON.stringify({ before: previousSnapshot, after: updated.consultationFeeBdt }),
      });

      return { ok: true, doctor: updated, approvalRequest };
    }

    // Create new doctor
    const newDocId = `doc-${Date.now()}`;
    const dbId = `db-${newDocId}-${input.branchId}`;
    const created: Doctor = {
      id: newDocId,
      hospitalId: state.hospital.id,
      departmentId: input.departmentId,
      specialtyIds: input.specialtyIds,
      slug: input.slug,
      nameEn: input.nameEn,
      nameBn: input.nameBn,
      designationEn: input.designationEn,
      designationBn: input.designationBn,
      qualificationsEn: input.qualificationsEn,
      qualificationsBn: input.qualificationsBn,
      experienceYears: input.experienceYears,
      bmdcRegistrationNo: input.bmdcRegistrationNo,
      bioEn: input.bioEn,
      bioBn: input.bioBn,
      clinicalInterestsEn: ["Specialist Consultation"],
      clinicalInterestsBn: ["বিশেষজ্ঞ পরামর্শ"],
      languagesEn: ["Bangla", "English"],
      languagesBn: ["বাংলা", "ইংরেজি"],
      imageUrl: "/images/doctors/doc-1.svg",
      consultationFeeBdt: input.consultationFeeBdt,
      followupFeeBdt: input.followupFeeBdt,
      feeEffectiveFrom: input.feeEffectiveFrom,
      feeEffectiveTo: null,
      publicationState: effectiveState,
      lastVerifiedAt: nowIso,
      updatedAt: nowIso,
      branches: [
        {
          id: dbId,
          doctorId: newDocId,
          branchId: input.branchId,
          roomNumber: input.roomNumber,
          status: "ACTIVE",
          scheduleRules: [0, 1, 2, 3, 4].map((w, idx) => ({
            id: `sr-${Date.now()}-${idx}`,
            doctorBranchId: dbId,
            weekday: w,
            weekdayLabelEn: "Sunday – Thursday",
            weekdayLabelBn: "রবিবার – বৃহস্পতিবার",
            startTime: "16:00",
            endTime: "20:00",
            slotMinutes: 20,
            capacityPerSlot: 2,
            effectiveFrom: input.feeEffectiveFrom,
            effectiveTo: null,
            publicationState: effectiveState,
            updatedAt: nowIso,
          })),
          scheduleExceptions: [],
        },
      ],
    };

    state.doctors.unshift(created);

    let approvalRequest: ApprovalRequest | undefined;
    if (effectiveState === "PENDING_APPROVAL") {
      approvalRequest = {
        id: `apr-${Date.now()}`,
        entityType: "DOCTOR",
        entityId: created.id,
        entityTitle: `${created.nameEn} — New Specialist Profile`,
        changeSummary: `New specialist profile (${created.consultationFeeBdt} BDT) awaiting approver sign-off.`,
        previousPayloadJson: JSON.stringify({ publicationState: "DRAFT" }),
        proposedPayloadJson: JSON.stringify({
          nameEn: created.nameEn,
          qualificationsEn: created.qualificationsEn,
          consultationFeeBdt: created.consultationFeeBdt,
          publicationState: "PUBLISHED",
        }),
        status: "PENDING_APPROVAL",
        requestedByUserId: session.userId,
        requestedByName: session.fullName,
        createdAt: nowIso,
      };
      state.approvalRequests.unshift(approvalRequest);
    }

    recordAuditEvent(state, {
      actorUserId: session.userId,
      actorName: session.fullName,
      actorRole: session.role,
      action: "DOCTOR_CREATED",
      entityType: "Doctor",
      entityId: created.id,
      summary: `Created doctor ${created.nameEn} in ${effectiveState} state.`,
    });

    return { ok: true, doctor: created, approvalRequest };
  });
}

export async function toggleDoctorStatus(
  session: SessionPayload,
  doctorId: string,
  targetState: "ARCHIVED" | "PUBLISHED"
): Promise<{ ok: true; doctor: Doctor } | { ok: false; error: string }> {
  return runInTransaction((state) => {
    if (!["SUPER_ADMIN", "HOSPITAL_ADMIN", "DEPT_MANAGER"].includes(session.role)) {
      return {
        ok: false,
        error: "Forbidden: Administrator role required to change specialist status.",
      };
    }
    const idx = state.doctors.findIndex((d) => d.id === doctorId);
    if (idx === -1) {
      return { ok: false, error: "Specialist record not found." };
    }
    const doc = state.doctors[idx];
    const prev = doc.publicationState;
    doc.publicationState = targetState;
    doc.updatedAt = new Date().toISOString();

    recordAuditEvent(state, {
      actorUserId: session.userId,
      actorName: session.fullName,
      actorRole: session.role,
      action: targetState === "ARCHIVED" ? "DOCTOR_DEACTIVATED" : "DOCTOR_ACTIVATED",
      entityType: "Doctor",
      entityId: doc.id,
      summary: `${targetState === "ARCHIVED" ? "Deactivated" : "Activated"} specialist ${doc.nameEn} (was ${prev})`,
      diffJson: JSON.stringify({ before: prev, after: targetState }),
    });

    return { ok: true, doctor: doc };
  });
}

export interface DoctorProfilePresentationInput {
  doctorId: string;
  imageUrl?: string;
  imagePosition?: string;
  imageCrop?: {
    zoom: number;
    x: number;
    y: number;
  };
  bioEn?: string;
  bioBn?: string;
  publicTaglineEn?: string;
  publicTaglineBn?: string;
  clinicalInterestsEn?: string[];
  clinicalInterestsBn?: string[];
}

export async function updateDoctorProfilePresentation(
  session: SessionPayload,
  input: DoctorProfilePresentationInput
): Promise<{ ok: true; doctor: Doctor } | { ok: false; error: string }> {
  return runInTransaction((state) => {
    if (!["SUPER_ADMIN", "HOSPITAL_ADMIN", "DEPT_MANAGER", "CONTENT_EDITOR"].includes(session.role)) {
      return { ok: false, error: "Forbidden: CMS Editor or Administrator role required." };
    }

    const idx = state.doctors.findIndex((d) => d.id === input.doctorId);
    if (idx === -1) {
      return { ok: false, error: "Doctor record not found." };
    }

    const existing = state.doctors[idx];
    const nowIso = new Date().toISOString();

    const updated: Doctor = {
      ...existing,
      imageUrl: input.imageUrl !== undefined ? input.imageUrl : existing.imageUrl,
      imagePosition: input.imagePosition !== undefined ? input.imagePosition : existing.imagePosition,
      imageCrop: input.imageCrop !== undefined ? input.imageCrop : existing.imageCrop,
      bioEn: input.bioEn !== undefined ? input.bioEn : existing.bioEn,
      bioBn: input.bioBn !== undefined ? input.bioBn : existing.bioBn,
      publicTaglineEn: input.publicTaglineEn !== undefined ? input.publicTaglineEn : existing.publicTaglineEn,
      publicTaglineBn: input.publicTaglineBn !== undefined ? input.publicTaglineBn : existing.publicTaglineBn,
      clinicalInterestsEn:
        input.clinicalInterestsEn !== undefined ? input.clinicalInterestsEn : existing.clinicalInterestsEn,
      clinicalInterestsBn:
        input.clinicalInterestsBn !== undefined ? input.clinicalInterestsBn : existing.clinicalInterestsBn,
      updatedAt: nowIso,
    };

    state.doctors[idx] = updated;

    recordAuditEvent(state, {
      actorUserId: session.userId,
      actorName: session.fullName,
      actorRole: session.role,
      action: "DOCTOR_PROFILE_PRESENTATION_UPDATED",
      entityType: "Doctor",
      entityId: updated.id,
      summary: `Updated public profile presentation & copywriting for ${updated.nameEn}`,
      diffJson: JSON.stringify({
        hasNewPhoto: input.imageUrl !== undefined && input.imageUrl !== existing.imageUrl,
        photoPosition: updated.imagePosition,
        hasBioUpdate: input.bioEn !== undefined,
      }),
    });

    return { ok: true, doctor: updated };
  });
}

export async function reviewApprovalRequest(
  session: SessionPayload,
  params: {
    approvalId: string;
    decision: "APPROVED_AND_PUBLISHED" | "REJECTED";
    reviewNote: string;
  }
): Promise<{ ok: true; approval: ApprovalRequest } | { ok: false; error: string }> {
  if (!APPROVER_ROLES.includes(session.role)) {
    return {
      ok: false,
      error: "Unauthorized: Only Hospital Administrators or Department Managers may approve and publish changes.",
    };
  }

  return runInTransaction((state) => {
    const apr = state.approvalRequests.find((a) => a.id === params.approvalId);
    if (!apr) {
      return { ok: false, error: "Approval request not found." };
    }

    const nowIso = new Date().toISOString();
    apr.reviewedByUserId = session.userId;
    apr.reviewedByName = session.fullName;
    apr.reviewNote = params.reviewNote;
    apr.reviewedAt = nowIso;

    if (params.decision === "REJECTED") {
      apr.status = "DRAFT";
      recordAuditEvent(state, {
        actorUserId: session.userId,
        actorName: session.fullName,
        actorRole: session.role,
        action: "APPROVAL_REJECTED",
        entityType: apr.entityType,
        entityId: apr.entityId,
        summary: `Rejected approval request ${apr.id}: ${params.reviewNote}`,
      });
      return { ok: true, approval: apr };
    }

    // Atomic publish (US-A02 / T-CMS-03)
    apr.status = "PUBLISHED";
    try {
      const proposed = JSON.parse(apr.proposedPayloadJson);
      if (apr.entityType === "DOCTOR" || apr.entityType === "FEE") {
        const doc = state.doctors.find((d) => d.id === apr.entityId);
        if (doc) {
          if (typeof proposed.consultationFeeBdt === "number") {
            doc.consultationFeeBdt = proposed.consultationFeeBdt;
          }
          if (typeof proposed.followupFeeBdt === "number") {
            doc.followupFeeBdt = proposed.followupFeeBdt;
          }
          if (typeof proposed.feeEffectiveFrom === "string") {
            doc.feeEffectiveFrom = proposed.feeEffectiveFrom;
          }
          doc.publicationState = "PUBLISHED";
          doc.lastVerifiedAt = nowIso;
          doc.updatedAt = nowIso;
        }
      } else if (apr.entityType === "SCHEDULE") {
        const doc = state.doctors.find((d) => d.id === apr.entityId);
        const firstRule = doc?.branches[0]?.scheduleRules[0];
        if (firstRule && proposed.endTime) {
          firstRule.endTime = proposed.endTime;
          firstRule.publicationState = "PUBLISHED";
          firstRule.updatedAt = nowIso;
        }
      }
    } catch {
      // Keep status updated even if payload is custom
    }

    recordAuditEvent(state, {
      actorUserId: session.userId,
      actorName: session.fullName,
      actorRole: session.role,
      action: "APPROVAL_PUBLISHED",
      entityType: apr.entityType,
      entityId: apr.entityId,
      summary: `Approved & published ${apr.entityTitle}. Note: ${params.reviewNote}`,
    });

    return { ok: true, approval: apr };
  });
}

export async function upsertDepartmentRecord(
  session: SessionPayload,
  input: {
    id?: string;
    branchId: string;
    slug: string;
    nameEn: string;
    nameBn: string;
    shortDescriptionEn: string;
    shortDescriptionBn: string;
    overviewEn: string;
    overviewBn: string;
    isFeaturedCareArea: boolean;
    publicationState: PublicationState;
  }
): Promise<{ ok: true; department: Department }> {
  return runInTransaction((state) => {
    const nowIso = new Date().toISOString();
    const canPublish = APPROVER_ROLES.includes(session.role);
    const pubState: PublicationState =
      input.publicationState === "PUBLISHED" && !canPublish
        ? "PENDING_APPROVAL"
        : input.publicationState;

    const existingIdx = input.id
      ? state.departments.findIndex((d) => d.id === input.id)
      : -1;

    if (existingIdx >= 0) {
      const updated: Department = {
        ...state.departments[existingIdx],
        ...input,
        publicationState: pubState,
        lastVerifiedAt: nowIso,
        updatedAt: nowIso,
      };
      state.departments[existingIdx] = updated;
      recordAuditEvent(state, {
        actorUserId: session.userId,
        actorName: session.fullName,
        actorRole: session.role,
        action: "DEPARTMENT_UPDATED",
        entityType: "Department",
        entityId: updated.id,
        summary: `Updated department ${updated.nameEn} (${pubState})`,
      });
      return { ok: true, department: updated };
    }

    const created: Department = {
      id: `dept-${Date.now()}`,
      branchId: input.branchId,
      slug: input.slug,
      nameEn: input.nameEn,
      nameBn: input.nameBn,
      shortDescriptionEn: input.shortDescriptionEn,
      shortDescriptionBn: input.shortDescriptionBn,
      overviewEn: input.overviewEn,
      overviewBn: input.overviewBn,
      iconName: "Stethoscope",
      isFeaturedCareArea: input.isFeaturedCareArea,
      publicationState: pubState,
      lastVerifiedAt: nowIso,
      updatedAt: nowIso,
    };
    state.departments.push(created);

    recordAuditEvent(state, {
      actorUserId: session.userId,
      actorName: session.fullName,
      actorRole: session.role,
      action: "DEPARTMENT_CREATED",
      entityType: "Department",
      entityId: created.id,
      summary: `Created department ${created.nameEn} (${pubState})`,
    });

    return { ok: true, department: created };
  });
}

export async function upsertConditionRecord(
  session: SessionPayload,
  input: {
    id?: string;
    departmentId: string;
    slug: string;
    nameEn: string;
    nameBn: string;
    summaryEn: string;
    summaryBn: string;
    symptomsEn: string[];
    symptomsBn: string[];
    causesEn: string;
    causesBn: string;
    diagnosisOverviewEn: string;
    diagnosisOverviewBn: string;
    careAtDeltaCareEn: string;
    careAtDeltaCareBn: string;
    isFeaturedCareArea: boolean;
    reviewedByEn: string;
    reviewedByBn: string;
    publicationState: PublicationState;
  }
): Promise<{ ok: true; condition: DiseaseCondition }> {
  return runInTransaction((state) => {
    const nowIso = new Date().toISOString();
    const canPublish = APPROVER_ROLES.includes(session.role);
    const pubState: PublicationState =
      input.publicationState === "PUBLISHED" && !canPublish
        ? "PENDING_APPROVAL"
        : input.publicationState;

    const firstLetter = (input.nameEn.trim()[0] || "A").toUpperCase();
    const existingIdx = input.id
      ? state.conditions.findIndex((c) => c.id === input.id)
      : -1;

    if (existingIdx >= 0) {
      const updated: DiseaseCondition = {
        ...state.conditions[existingIdx],
        ...input,
        firstLetter,
        publicationState: pubState,
        lastReviewedAt: nowIso,
        updatedAt: nowIso,
      };
      state.conditions[existingIdx] = updated;
      recordAuditEvent(state, {
        actorUserId: session.userId,
        actorName: session.fullName,
        actorRole: session.role,
        action: "CONDITION_UPDATED",
        entityType: "DiseaseCondition",
        entityId: updated.id,
        summary: `Updated condition guide ${updated.nameEn} (${pubState})`,
      });
      return { ok: true, condition: updated };
    }

    const created: DiseaseCondition = {
      id: `cond-${Date.now()}`,
      ...input,
      firstLetter,
      publicationState: pubState,
      lastReviewedAt: nowIso,
      updatedAt: nowIso,
    };
    state.conditions.push(created);

    recordAuditEvent(state, {
      actorUserId: session.userId,
      actorName: session.fullName,
      actorRole: session.role,
      action: "CONDITION_CREATED",
      entityType: "DiseaseCondition",
      entityId: created.id,
      summary: `Created condition guide ${created.nameEn} (${pubState})`,
    });

    return { ok: true, condition: created };
  });
}
