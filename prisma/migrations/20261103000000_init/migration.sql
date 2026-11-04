-- ============================================================================
-- DeltaCare Hospital Platform — Initial PostgreSQL Migration
-- Generated from prisma/schema.prisma
-- ============================================================================

-- CreateEnum
CREATE TYPE "PublicationState" AS ENUM ('DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "AppointmentStatus" AS ENUM ('REQUESTED', 'PENDING_CONFIRMATION', 'CONFIRMED', 'RESCHEDULE_REQUESTED', 'CANCELLED', 'COMPLETED', 'NO_SHOW');

-- CreateEnum
CREATE TYPE "RoleCode" AS ENUM ('SUPER_ADMIN', 'HOSPITAL_ADMIN', 'DEPT_MANAGER', 'DOCTOR', 'RECEPTIONIST', 'CONTENT_EDITOR', 'SUPPORT_OPERATOR', 'PATIENT');

-- CreateEnum
CREATE TYPE "FeedbackType" AS ENUM ('FEEDBACK', 'COMPLAINT', 'SUGGESTION');

-- CreateEnum
CREATE TYPE "FeedbackStatus" AS ENUM ('NEW', 'TRIAGED', 'IN_PROGRESS', 'RESOLVED', 'CLOSED');

-- CreateEnum
CREATE TYPE "NotificationChannel" AS ENUM ('EMAIL', 'SMS', 'WHATSAPP', 'WEBSITE');

-- CreateEnum
CREATE TYPE "NotificationStatus" AS ENUM ('QUEUED', 'SENT', 'DELIVERED', 'FAILED');

-- CreateTable
CREATE TABLE "HospitalConfiguration" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "nameEn" TEXT NOT NULL,
    "nameBn" TEXT NOT NULL,
    "taglineEn" TEXT NOT NULL DEFAULT 'Care at DeltaCare',
    "taglineBn" TEXT NOT NULL DEFAULT 'ডেল্টাকেয়ারে সেবা',
    "timezone" TEXT NOT NULL DEFAULT 'Asia/Dhaka',
    "defaultLocale" TEXT NOT NULL DEFAULT 'en',
    "emergencyPhone" TEXT NOT NULL,
    "helplinePhone" TEXT NOT NULL,
    "generalEmail" TEXT NOT NULL,
    "cancellationPolicyEn" TEXT NOT NULL,
    "cancellationPolicyBn" TEXT NOT NULL,
    "privacyNoticeEn" TEXT NOT NULL,
    "privacyNoticeBn" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "HospitalConfiguration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Branch" (
    "id" TEXT NOT NULL,
    "hospitalId" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "nameEn" TEXT NOT NULL,
    "nameBn" TEXT NOT NULL,
    "subtitleEn" TEXT NOT NULL,
    "subtitleBn" TEXT NOT NULL,
    "addressEn" TEXT NOT NULL,
    "addressBn" TEXT NOT NULL,
    "cityEn" TEXT NOT NULL,
    "cityBn" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "emergencyPhone" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "operatingHoursEn" TEXT NOT NULL,
    "operatingHoursBn" TEXT NOT NULL,
    "directionsUrl" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "servicesSummaryEn" TEXT[],
    "servicesSummaryBn" TEXT[],
    "publicationState" "PublicationState" NOT NULL DEFAULT 'PUBLISHED',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Branch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Department" (
    "id" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "nameEn" TEXT NOT NULL,
    "nameBn" TEXT NOT NULL,
    "shortDescriptionEn" TEXT NOT NULL,
    "shortDescriptionBn" TEXT NOT NULL,
    "overviewEn" TEXT NOT NULL,
    "overviewBn" TEXT NOT NULL,
    "iconName" TEXT NOT NULL DEFAULT 'Stethoscope',
    "imageUrl" TEXT,
    "isFeaturedCareArea" BOOLEAN NOT NULL DEFAULT false,
    "publicationState" "PublicationState" NOT NULL DEFAULT 'PUBLISHED',
    "lastVerifiedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Department_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Specialty" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "nameEn" TEXT NOT NULL,
    "nameBn" TEXT NOT NULL,
    "descriptionEn" TEXT NOT NULL,
    "descriptionBn" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Specialty_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Doctor" (
    "id" TEXT NOT NULL,
    "hospitalId" TEXT NOT NULL,
    "departmentId" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "nameEn" TEXT NOT NULL,
    "nameBn" TEXT NOT NULL,
    "designationEn" TEXT NOT NULL,
    "designationBn" TEXT NOT NULL,
    "qualificationsEn" TEXT NOT NULL,
    "qualificationsBn" TEXT NOT NULL,
    "experienceYears" INTEGER NOT NULL,
    "bmdcRegistrationNo" TEXT NOT NULL,
    "bioEn" TEXT NOT NULL,
    "bioBn" TEXT NOT NULL,
    "clinicalInterestsEn" TEXT[],
    "clinicalInterestsBn" TEXT[],
    "languagesEn" TEXT[],
    "languagesBn" TEXT[],
    "imageUrl" TEXT NOT NULL,
    "consultationFeeBdt" INTEGER NOT NULL,
    "followupFeeBdt" INTEGER NOT NULL,
    "feeEffectiveFrom" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "feeEffectiveTo" TIMESTAMP(3),
    "publicationState" "PublicationState" NOT NULL DEFAULT 'PUBLISHED',
    "lastVerifiedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Doctor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DoctorSpecialty" (
    "doctorId" TEXT NOT NULL,
    "specialtyId" TEXT NOT NULL,
    CONSTRAINT "DoctorSpecialty_pkey" PRIMARY KEY ("doctorId","specialtyId")
);

-- CreateTable
CREATE TABLE "DoctorBranch" (
    "id" TEXT NOT NULL,
    "doctorId" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "roomNumber" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    CONSTRAINT "DoctorBranch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScheduleRule" (
    "id" TEXT NOT NULL,
    "doctorBranchId" TEXT NOT NULL,
    "weekday" INTEGER NOT NULL,
    "weekdayLabelEn" TEXT NOT NULL,
    "weekdayLabelBn" TEXT NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "slotMinutes" INTEGER NOT NULL DEFAULT 20,
    "capacityPerSlot" INTEGER NOT NULL DEFAULT 2,
    "effectiveFrom" TIMESTAMP(3) NOT NULL,
    "effectiveTo" TIMESTAMP(3),
    "publicationState" "PublicationState" NOT NULL DEFAULT 'PUBLISHED',
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ScheduleRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScheduleException" (
    "id" TEXT NOT NULL,
    "doctorBranchId" TEXT NOT NULL,
    "dateStr" TEXT NOT NULL,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3) NOT NULL,
    "exceptionType" TEXT NOT NULL,
    "reasonEn" TEXT NOT NULL,
    "reasonBn" TEXT NOT NULL,
    "createdByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ScheduleException_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Service" (
    "id" TEXT NOT NULL,
    "departmentId" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "nameEn" TEXT NOT NULL,
    "nameBn" TEXT NOT NULL,
    "descriptionEn" TEXT NOT NULL,
    "descriptionBn" TEXT NOT NULL,
    "preparationEn" TEXT,
    "preparationBn" TEXT,
    "publicationState" "PublicationState" NOT NULL DEFAULT 'PUBLISHED',
    "lastVerifiedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Service_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Fee" (
    "id" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "amountBdt" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'BDT',
    "feeLabelEn" TEXT NOT NULL,
    "feeLabelBn" TEXT NOT NULL,
    "effectiveFrom" TIMESTAMP(3) NOT NULL,
    "effectiveTo" TIMESTAMP(3),
    "publicationState" "PublicationState" NOT NULL DEFAULT 'PUBLISHED',
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Fee_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DiseaseCondition" (
    "id" TEXT NOT NULL,
    "departmentId" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "firstLetter" TEXT NOT NULL,
    "nameEn" TEXT NOT NULL,
    "nameBn" TEXT NOT NULL,
    "summaryEn" TEXT NOT NULL,
    "summaryBn" TEXT NOT NULL,
    "symptomsEn" TEXT[],
    "symptomsBn" TEXT[],
    "causesEn" TEXT NOT NULL,
    "causesBn" TEXT NOT NULL,
    "diagnosisOverviewEn" TEXT NOT NULL,
    "diagnosisOverviewBn" TEXT NOT NULL,
    "careAtDeltaCareEn" TEXT NOT NULL,
    "careAtDeltaCareBn" TEXT NOT NULL,
    "isFeaturedCareArea" BOOLEAN NOT NULL DEFAULT false,
    "reviewedByEn" TEXT NOT NULL,
    "reviewedByBn" TEXT NOT NULL,
    "lastReviewedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "publicationState" "PublicationState" NOT NULL DEFAULT 'PUBLISHED',
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "DiseaseCondition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MedicalProcedure" (
    "id" TEXT NOT NULL,
    "departmentId" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "nameEn" TEXT NOT NULL,
    "nameBn" TEXT NOT NULL,
    "categoryEn" TEXT NOT NULL,
    "categoryBn" TEXT NOT NULL,
    "summaryEn" TEXT NOT NULL,
    "summaryBn" TEXT NOT NULL,
    "preparationEn" TEXT NOT NULL,
    "preparationBn" TEXT NOT NULL,
    "whatToExpectEn" TEXT NOT NULL,
    "whatToExpectBn" TEXT NOT NULL,
    "feeBdt" INTEGER,
    "feeEffectiveFrom" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedByEn" TEXT NOT NULL,
    "reviewedByBn" TEXT NOT NULL,
    "lastReviewedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "publicationState" "PublicationState" NOT NULL DEFAULT 'PUBLISHED',
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "MedicalProcedure_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Appointment" (
    "id" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "doctorBranchId" TEXT NOT NULL,
    "departmentId" TEXT NOT NULL,
    "doctorId" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "patientUserId" TEXT,
    "patientName" TEXT NOT NULL,
    "patientPhone" TEXT NOT NULL,
    "patientEmail" TEXT,
    "preferredDate" TEXT NOT NULL,
    "preferredTimeSlot" TEXT NOT NULL,
    "visitType" TEXT NOT NULL DEFAULT 'NEW_CONSULTATION',
    "reasonNote" TEXT,
    "consentAccepted" BOOLEAN NOT NULL DEFAULT true,
    "status" "AppointmentStatus" NOT NULL DEFAULT 'REQUESTED',
    "source" TEXT NOT NULL DEFAULT 'WEBSITE',
    "staffNotes" TEXT,
    "confirmedByUserId" TEXT,
    "confirmedAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Appointment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AppointmentEvent" (
    "id" TEXT NOT NULL,
    "appointmentId" TEXT NOT NULL,
    "fromStatus" "AppointmentStatus",
    "toStatus" "AppointmentStatus" NOT NULL,
    "actorUserId" TEXT,
    "actorName" TEXT NOT NULL,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AppointmentEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "phone" TEXT,
    "passwordHash" TEXT NOT NULL,
    "role" "RoleCode" NOT NULL DEFAULT 'PATIENT',
    "scopedBranchId" TEXT,
    "scopedDepartmentId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "mfaEnabled" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApprovalRequest" (
    "id" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "entityTitle" TEXT NOT NULL,
    "changeSummary" TEXT NOT NULL,
    "previousPayloadJson" TEXT NOT NULL,
    "proposedPayloadJson" TEXT NOT NULL,
    "status" "PublicationState" NOT NULL DEFAULT 'PENDING_APPROVAL',
    "requestedByUserId" TEXT NOT NULL,
    "requestedByName" TEXT NOT NULL,
    "reviewedByUserId" TEXT,
    "reviewedByName" TEXT,
    "reviewNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" TIMESTAMP(3),
    CONSTRAINT "ApprovalRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AIUpdateDraft" (
    "id" TEXT NOT NULL,
    "staffUserId" TEXT NOT NULL,
    "staffName" TEXT NOT NULL,
    "rawInputNote" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "parsedSummary" TEXT NOT NULL,
    "proposedPayloadJson" TEXT NOT NULL,
    "draftNoticeEn" TEXT NOT NULL,
    "draftNoticeBn" TEXT NOT NULL,
    "approvalStatus" "PublicationState" NOT NULL DEFAULT 'PENDING_APPROVAL',
    "reviewedByName" TEXT,
    "reviewNote" TEXT,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AIUpdateDraft_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContactRequest" (
    "id" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "branchId" TEXT,
    "departmentId" TEXT,
    "preferredCallTime" TEXT,
    "message" TEXT NOT NULL,
    "consentAccepted" BOOLEAN NOT NULL DEFAULT true,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "assignedToName" TEXT,
    "resolutionNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ContactRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Feedback" (
    "id" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "type" "FeedbackType" NOT NULL DEFAULT 'FEEDBACK',
    "category" TEXT NOT NULL,
    "routedDepartmentId" TEXT,
    "branchId" TEXT,
    "patientName" TEXT,
    "patientPhone" TEXT,
    "patientEmail" TEXT,
    "subject" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "isPrivate" BOOLEAN NOT NULL DEFAULT true,
    "status" "FeedbackStatus" NOT NULL DEFAULT 'NEW',
    "assignedStaffName" TEXT,
    "internalNotes" TEXT,
    "resolutionSummary" TEXT,
    "aiSuggestedCategory" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Feedback_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "channel" "NotificationChannel" NOT NULL,
    "recipient" TEXT NOT NULL,
    "templateCode" TEXT NOT NULL,
    "subject" TEXT,
    "bodyPreview" TEXT NOT NULL,
    "status" "NotificationStatus" NOT NULL DEFAULT 'SENT',
    "relatedEntityType" TEXT,
    "relatedEntityId" TEXT,
    "providerMessageId" TEXT,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConversationSession" (
    "id" TEXT NOT NULL,
    "channel" TEXT NOT NULL DEFAULT 'WEBSITE',
    "locale" TEXT NOT NULL DEFAULT 'en',
    "queryCategory" TEXT NOT NULL,
    "wasAbstained" BOOLEAN NOT NULL DEFAULT false,
    "wasClinicalRefusal" BOOLEAN NOT NULL DEFAULT false,
    "sourceIdsUsed" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ConversationSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditEvent" (
    "id" TEXT NOT NULL,
    "actorUserId" TEXT NOT NULL,
    "actorName" TEXT NOT NULL,
    "actorRole" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "diffJson" TEXT,
    "requestId" TEXT,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AuditEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "HospitalConfiguration_code_key" ON "HospitalConfiguration"("code");
CREATE UNIQUE INDEX "Branch_slug_key" ON "Branch"("slug");
CREATE INDEX "Branch_publicationState_sortOrder_idx" ON "Branch"("publicationState", "sortOrder");
CREATE UNIQUE INDEX "Department_slug_key" ON "Department"("slug");
CREATE INDEX "Department_publicationState_isFeaturedCareArea_idx" ON "Department"("publicationState", "isFeaturedCareArea");
CREATE UNIQUE INDEX "Specialty_slug_key" ON "Specialty"("slug");
CREATE UNIQUE INDEX "Doctor_slug_key" ON "Doctor"("slug");
CREATE UNIQUE INDEX "Doctor_bmdcRegistrationNo_key" ON "Doctor"("bmdcRegistrationNo");
CREATE INDEX "Doctor_publicationState_departmentId_idx" ON "Doctor"("publicationState", "departmentId");
CREATE UNIQUE INDEX "DoctorBranch_doctorId_branchId_key" ON "DoctorBranch"("doctorId", "branchId");
CREATE INDEX "ScheduleRule_doctorBranchId_publicationState_idx" ON "ScheduleRule"("doctorBranchId", "publicationState");
CREATE INDEX "ScheduleException_doctorBranchId_dateStr_idx" ON "ScheduleException"("doctorBranchId", "dateStr");
CREATE UNIQUE INDEX "Service_slug_key" ON "Service"("slug");
CREATE INDEX "Service_departmentId_publicationState_idx" ON "Service"("departmentId", "publicationState");
CREATE INDEX "Fee_serviceId_publicationState_idx" ON "Fee"("serviceId", "publicationState");
CREATE UNIQUE INDEX "DiseaseCondition_slug_key" ON "DiseaseCondition"("slug");
CREATE INDEX "DiseaseCondition_firstLetter_publicationState_idx" ON "DiseaseCondition"("firstLetter", "publicationState");
CREATE UNIQUE INDEX "MedicalProcedure_slug_key" ON "MedicalProcedure"("slug");
CREATE INDEX "MedicalProcedure_publicationState_departmentId_idx" ON "MedicalProcedure"("publicationState", "departmentId");
CREATE UNIQUE INDEX "Appointment_reference_key" ON "Appointment"("reference");
CREATE INDEX "Appointment_status_preferredDate_idx" ON "Appointment"("status", "preferredDate");
CREATE INDEX "Appointment_doctorBranchId_preferredDate_preferredTimeSlot_idx" ON "Appointment"("doctorBranchId", "preferredDate", "preferredTimeSlot");
CREATE INDEX "Appointment_patientPhone_idx" ON "Appointment"("patientPhone");
CREATE INDEX "AppointmentEvent_appointmentId_createdAt_idx" ON "AppointmentEvent"("appointmentId", "createdAt");
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE INDEX "User_role_isActive_idx" ON "User"("role", "isActive");
CREATE INDEX "ApprovalRequest_status_createdAt_idx" ON "ApprovalRequest"("status", "createdAt");
CREATE UNIQUE INDEX "ContactRequest_reference_key" ON "ContactRequest"("reference");
CREATE UNIQUE INDEX "Feedback_reference_key" ON "Feedback"("reference");
CREATE INDEX "Feedback_status_type_idx" ON "Feedback"("status", "type");
CREATE INDEX "AuditEvent_occurredAt_idx" ON "AuditEvent"("occurredAt");
CREATE INDEX "AuditEvent_entityType_entityId_idx" ON "AuditEvent"("entityType", "entityId");

-- AddForeignKey
ALTER TABLE "Branch" ADD CONSTRAINT "Branch_hospitalId_fkey" FOREIGN KEY ("hospitalId") REFERENCES "HospitalConfiguration"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Department" ADD CONSTRAINT "Department_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Doctor" ADD CONSTRAINT "Doctor_hospitalId_fkey" FOREIGN KEY ("hospitalId") REFERENCES "HospitalConfiguration"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Doctor" ADD CONSTRAINT "Doctor_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "DoctorSpecialty" ADD CONSTRAINT "DoctorSpecialty_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "Doctor"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DoctorSpecialty" ADD CONSTRAINT "DoctorSpecialty_specialtyId_fkey" FOREIGN KEY ("specialtyId") REFERENCES "Specialty"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DoctorBranch" ADD CONSTRAINT "DoctorBranch_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "Doctor"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DoctorBranch" ADD CONSTRAINT "DoctorBranch_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ScheduleRule" ADD CONSTRAINT "ScheduleRule_doctorBranchId_fkey" FOREIGN KEY ("doctorBranchId") REFERENCES "DoctorBranch"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ScheduleException" ADD CONSTRAINT "ScheduleException_doctorBranchId_fkey" FOREIGN KEY ("doctorBranchId") REFERENCES "DoctorBranch"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Service" ADD CONSTRAINT "Service_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Fee" ADD CONSTRAINT "Fee_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DiseaseCondition" ADD CONSTRAINT "DiseaseCondition_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "MedicalProcedure" ADD CONSTRAINT "MedicalProcedure_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_doctorBranchId_fkey" FOREIGN KEY ("doctorBranchId") REFERENCES "DoctorBranch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "AppointmentEvent" ADD CONSTRAINT "AppointmentEvent_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "Appointment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

