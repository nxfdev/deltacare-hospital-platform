// ============================================================================
// DeltaCare Hospital Platform — Strict TypeScript Domain Types
// Aligns with Prisma schema and 02-SRS.md / 04-SDD-architecture.md
// ============================================================================

export type Locale = "en" | "bn";

export type PublicationState =
  | "DRAFT"
  | "PENDING_APPROVAL"
  | "APPROVED"
  | "PUBLISHED"
  | "ARCHIVED";

export type AppointmentStatus =
  | "REQUESTED"
  | "PENDING_CONFIRMATION"
  | "CONFIRMED"
  | "RESCHEDULE_REQUESTED"
  | "CANCELLED"
  | "COMPLETED"
  | "NO_SHOW";

export type RoleCode =
  | "SUPER_ADMIN"
  | "HOSPITAL_ADMIN"
  | "CMS_EDITOR"
  | "APPOINTMENT_MANAGER"
  | "FRONT_DESK"
  | "DEPT_MANAGER"
  | "DOCTOR"
  | "RECEPTIONIST"
  | "CONTENT_EDITOR"
  | "SUPPORT_OPERATOR"
  | "PATIENT";

export type FeedbackType = "FEEDBACK" | "COMPLAINT" | "SUGGESTION";
export type FeedbackStatus = "NEW" | "TRIAGED" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";
export type NotificationChannel = "EMAIL" | "SMS" | "WHATSAPP" | "WEBSITE";
export type NotificationStatus = "QUEUED" | "SENT" | "DELIVERED" | "FAILED";

export interface HospitalConfiguration {
  id: string;
  code: string;
  nameEn: string;
  nameBn: string;
  taglineEn: string;
  taglineBn: string;
  timezone: string;
  defaultLocale: Locale;
  emergencyPhone: string;
  helplinePhone: string;
  generalEmail: string;
  cancellationPolicyEn: string;
  cancellationPolicyBn: string;
  privacyNoticeEn: string;
  privacyNoticeBn: string;
  status: "ACTIVE" | "MAINTENANCE";
  updatedAt: string;
}

export interface Branch {
  id: string;
  hospitalId: string;
  slug: string;
  nameEn: string;
  nameBn: string;
  subtitleEn: string;
  subtitleBn: string;
  addressEn: string;
  addressBn: string;
  cityEn: string;
  cityBn: string;
  phone: string;
  hotline?: string;
  emergencyPhone: string;
  email: string;
  operatingHoursEn: string;
  operatingHoursBn: string;
  directionsUrl: string;
  mapUrl?: string;
  imageUrl: string;
  servicesSummaryEn: string[];
  servicesSummaryBn: string[];
  isActive?: boolean;
  publicationState: PublicationState;
  sortOrder: number;
  updatedAt: string;
}

export interface Department {
  id: string;
  branchId: string;
  slug: string;
  nameEn: string;
  nameBn: string;
  shortDescriptionEn: string;
  shortDescriptionBn: string;
  shortDescEn?: string;
  shortDescBn?: string;
  overviewEn: string;
  overviewBn: string;
  servicesEn?: string[];
  servicesBn?: string[];
  commonConditionsEn?: string[];
  commonConditionsBn?: string[];
  iconName: string;
  icon?: string;
  imageUrl?: string;
  displayOrder?: number;
  isActive?: boolean;
  isFeaturedCareArea: boolean;
  publicationState: PublicationState;
  lastVerifiedAt: string;
  updatedAt: string;
}

export interface Specialty {
  id: string;
  slug: string;
  nameEn: string;
  nameBn: string;
  descriptionEn: string;
  descriptionBn: string;
}

export interface ScheduleRule {
  id: string;
  doctorBranchId: string;
  weekday: number; // 0 = Sunday .. 6 = Saturday
  weekdayLabelEn: string;
  weekdayLabelBn: string;
  startTime: string; // "16:00"
  endTime: string;   // "20:00"
  slotMinutes: number;
  capacityPerSlot: number;
  effectiveFrom: string;
  effectiveTo: string | null;
  publicationState: PublicationState;
  updatedAt: string;
}

export interface ScheduleException {
  id: string;
  doctorBranchId: string;
  dateStr: string; // "YYYY-MM-DD"
  startsAt: string;
  endsAt: string;
  exceptionType: "BLOCKED" | "LEAVE" | "RESCHEDULED";
  reasonEn: string;
  reasonBn: string;
  createdByUserId?: string;
  createdAt: string;
}

export interface DoctorBranchAssignment {
  id: string;
  doctorId: string;
  branchId: string;
  roomNumber: string;
  status: "ACTIVE" | "INACTIVE";
  scheduleRules: ScheduleRule[];
  scheduleExceptions: ScheduleException[];
}

export interface DoctorChamberSchedule {
  id: string;
  doctorId: string;
  branchId: string;
  chamberRoom: string;
  dayOfWeek: number; // 0 = Sun to 6 = Sat
  startTime: string; // "17:00"
  endTime: string;   // "21:00"
  breakStartTime?: string | null;
  breakEndTime?: string | null;
  slotDurationMinutes: number; // 15 or 20
  isActive: boolean;
}

export interface DoctorScheduleOverride {
  id: string;
  doctorId: string;
  branchId: string;
  date: string; // "YYYY-MM-DD"
  overrideType: "FULL_DAY_LEAVE" | "CUSTOM_HOURS" | "BLOCKED_SLOTS";
  customStartTime?: string | null;
  customEndTime?: string | null;
  blockedSlots: string[];
  reasonEn?: string | null;
  reasonBn?: string | null;
  createdByUserId?: string | null;
  createdAt: string;
}

export interface Doctor {
  id: string;
  hospitalId: string;
  departmentId: string;
  specialtyIds: string[];
  slug: string;
  nameEn: string;
  nameBn: string;
  designationEn: string;
  designationBn: string;
  qualificationsEn: string;
  qualificationsBn: string;
  workplaceEn?: string;
  workplaceBn?: string;
  experienceYears: number;
  bmdcRegistrationNo: string;
  bmdcRegNo?: string;
  bioEn: string;
  bioBn: string;
  clinicalInterestsEn: string[];
  clinicalInterestsBn: string[];
  symptomTags?: string[];
  languagesEn: string[];
  languagesBn: string[];
  imageUrl: string;
  photoUrl?: string;
  imagePosition?: string; // e.g. "50% 25%" or "center"
  imageCrop?: {
    zoom: number; // 1.0 to 3.0
    x: number; // horizontal pan offset percentage (-50 to 50)
    y: number; // vertical pan offset percentage (-50 to 50)
  };
  publicTaglineEn?: string;
  publicTaglineBn?: string;
  consultationFeeBdt: number;
  followupFeeBdt: number;
  feeEffectiveFrom: string;
  feeEffectiveTo: string | null;
  isActive?: boolean;
  publicationState: PublicationState;
  lastVerifiedAt: string;
  updatedAt: string;
  branches: DoctorBranchAssignment[];
  chamberSchedules?: DoctorChamberSchedule[];
  scheduleOverrides?: DoctorScheduleOverride[];
}

export interface Service {
  id: string;
  departmentId: string;
  slug: string;
  nameEn: string;
  nameBn: string;
  descriptionEn: string;
  descriptionBn: string;
  preparationEn?: string;
  preparationBn?: string;
  feeBdt: number;
  feeLabelEn: string;
  feeLabelBn: string;
  effectiveFrom: string;
  effectiveTo: string | null;
  publicationState: PublicationState;
  lastVerifiedAt: string;
  updatedAt: string;
}

export interface DiseaseCondition {
  id: string;
  departmentId: string;
  slug: string;
  firstLetter: string; // "A".."Z" or "#"
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
  lastReviewedAt: string;
  publicationState: PublicationState;
  updatedAt: string;
}

export interface MedicalProcedure {
  id: string;
  departmentId: string;
  slug: string;
  nameEn: string;
  nameBn: string;
  categoryEn: string;
  categoryBn: string;
  summaryEn: string;
  summaryBn: string;
  preparationEn: string;
  preparationBn: string;
  whatToExpectEn: string;
  whatToExpectBn: string;
  feeBdt: number | null;
  feeEffectiveFrom: string;
  reviewedByEn: string;
  reviewedByBn: string;
  lastReviewedAt: string;
  publicationState: PublicationState;
  updatedAt: string;
}

export interface AppointmentEvent {
  id: string;
  appointmentId: string;
  fromStatus: AppointmentStatus | null;
  toStatus: AppointmentStatus;
  actorUserId?: string;
  actorName: string;
  reason?: string;
  createdAt: string;
}

export interface Appointment {
  id: string;
  reference: string;
  doctorBranchId: string;
  departmentId: string;
  doctorId: string;
  branchId: string;
  patientUserId?: string;
  patientName: string;
  patientPhone: string;
  patientEmail?: string;
  patientAge?: number;
  patientGender?: "MALE" | "FEMALE" | "OTHER" | string;
  preferredDate: string; // "YYYY-MM-DD"
  preferredTimeSlot: string; // "17:00"
  visitType: "NEW_CONSULTATION" | "FOLLOW_UP" | "NEW_VISIT" | "REPORT_SHOW";
  bookingSource?: "ONLINE_WEBSITE" | "FRONT_DESK_PHONE" | "WALK_IN_DESK";
  reasonNote?: string;
  symptomsNote?: string;
  cancelReason?: string;
  consentAccepted: boolean;
  status: AppointmentStatus;
  source: "WEBSITE" | "FRONT_DESK" | "PHONE";
  staffNotes?: string;
  confirmedByUserId?: string;
  confirmedAt?: string;
  updatedAt: string;
  createdAt: string;
  events: AppointmentEvent[];
}

export interface UserAccount {
  id: string;
  email: string;
  fullName: string;
  phone?: string;
  passwordHash: string;
  role: RoleCode;
  doctorProfileId?: string;
  scopedBranchId?: string;
  scopedDepartmentId?: string;
  resetTokenHash?: string;
  resetTokenExpiresAt?: number;
  passwordChangedAt?: string;
  mustChangePassword?: boolean;
  isActive: boolean;
  mfaEnabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface HospitalNotice {
  id: string;
  slug: string;
  titleEn: string;
  titleBn: string;
  summaryEn: string;
  summaryBn: string;
  bodyEn: string;
  bodyBn: string;
  category: string;
  branchId?: string | null;
  isPinned: boolean;
  isActive: boolean;
  publishedAt: string;
  updatedAt: string;
}

export interface SmsLogRecord {
  id: string;
  appointmentId?: string | null;
  recipientPhone: string;
  messageBody: string;
  eventType: "REQUEST_RECEIVED" | "CONFIRMED" | "RESCHEDULED" | "CANCELLED";
  providerStatus: "SENT" | "FAILED" | "SIMULATED";
  sentAt: string;
}

export interface PatientFeedbackRecord {
  id: string;
  appointmentId?: string | null;
  doctorId?: string | null;
  doctorName?: string | null;
  departmentId?: string | null;
  branchId?: string | null;
  patientName: string;
  patientPhone: string;
  category: "DOCTOR_CARE" | "WAIT_TIME" | "FRONT_DESK_SERVICE" | "CLEANLINESS" | "ONLINE_BOOKING";
  rating: number;
  comment?: string;
  feedbackEn?: string;
  feedbackBn?: string;
  status: "NEW" | "IN_REVIEW" | "RESOLVED" | "REJECTED";
  adminResponse?: string | null;
  respondedAt?: string | null;
  createdAt: string;
}

export type PatientFeedback = PatientFeedbackRecord;

export interface ApprovalRequest {
  id: string;
  entityType: "DOCTOR" | "SCHEDULE" | "FEE" | "DEPARTMENT" | "CONTENT" | "AI_UPDATE";
  entityId: string;
  entityTitle: string;
  changeSummary: string;
  previousPayloadJson: string;
  proposedPayloadJson: string;
  status: PublicationState;
  requestedByUserId: string;
  requestedByName: string;
  reviewedByUserId?: string;
  reviewedByName?: string;
  reviewNote?: string;
  createdAt: string;
  reviewedAt?: string;
}

export interface AIUpdateDraft {
  id: string;
  staffUserId: string;
  staffName: string;
  rawInputNote: string;
  category: "DOCTOR_SCHEDULE" | "FEE_UPDATE" | "PUBLIC_NOTICE" | "SERVICE_INFO";
  parsedSummary: string;
  proposedPayloadJson: string;
  draftNoticeEn: string;
  draftNoticeBn: string;
  approvalStatus: PublicationState;
  reviewedByName?: string;
  reviewNote?: string;
  publishedAt?: string;
  createdAt: string;
}

export interface ContactRequest {
  id: string;
  reference: string;
  fullName: string;
  phone: string;
  email?: string;
  branchId?: string;
  departmentId?: string;
  preferredCallTime?: string;
  message: string;
  consentAccepted: boolean;
  status: "OPEN" | "CONTACTED" | "CLOSED";
  assignedToName?: string;
  resolutionNote?: string;
  createdAt: string;
  updatedAt: string;
}

export interface FeedbackRecord {
  id: string;
  reference: string;
  type: FeedbackType;
  category: "WAIT_TIME" | "BILLING_FEE" | "STAFF_CONDUCT" | "FACILITY" | "APPOINTMENT" | "GENERAL";
  routedDepartmentId?: string;
  branchId?: string;
  patientName?: string;
  patientPhone?: string;
  patientEmail?: string;
  subject: string;
  message: string;
  isPrivate: boolean;
  status: FeedbackStatus;
  assignedStaffName?: string;
  internalNotes?: string;
  resolutionSummary?: string;
  aiSuggestedCategory?: string;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationRecord {
  id: string;
  channel: NotificationChannel;
  recipient: string;
  templateCode: string;
  subject?: string;
  bodyPreview: string;
  status: NotificationStatus;
  relatedEntityType?: string;
  relatedEntityId?: string;
  providerMessageId?: string;
  sentAt: string;
}

export interface ConversationSessionRecord {
  id: string;
  channel: "WEBSITE" | "WHATSAPP" | "MESSENGER";
  locale: Locale;
  queryTextRedacted: string;
  queryCategory:
    | "DOCTOR_LOOKUP"
    | "HOURS_LOCATION"
    | "FEES_SERVICES"
    | "APPOINTMENT_INFO"
    | "CLINICAL_REFUSAL"
    | "UNKNOWN_ABSTAIN";
  wasAbstained: boolean;
  wasClinicalRefusal: boolean;
  sourceIdsUsed: string[];
  createdAt: string;
}

export interface AuditEvent {
  id: string;
  actorUserId: string;
  actorName: string;
  actorRole: RoleCode | "VISITOR" | "SYSTEM";
  action: string;
  entityType: string;
  entityId: string;
  summary: string;
  diffJson?: string;
  requestId?: string;
  occurredAt: string;
}

// ============================================================================
// DeltaCare Facebook Daily Doctor Availability & Promotional Publishing Types
// ============================================================================

export type FacebookPublishStatus =
  | "DRAFT"
  | "READY"
  | "PUBLISHED"
  | "FAILED"
  | "RETRY";

export interface FacebookPostItem {
  id: string;
  doctorId: string;
  doctorName: string;
  specialtyName: string;
  branchName: string;
  consultationDate: string; // YYYY-MM-DD
  consultationHours: string;
  photoUrl: string;
  cardImagePreviewUrl?: string;
  fbMediaId?: string;
  fbPostId?: string;
  publishedAt?: string;
  status: FacebookPublishStatus;
  errorMessage?: string;
}

export interface FacebookPostBatch {
  id: string;
  targetDate: string; // YYYY-MM-DD
  caption: string;
  status: FacebookPublishStatus;
  items: FacebookPostItem[];
  generatedAt: string;
  revalidatedAt: string;
  publishedAt?: string;
  fbPostId?: string;
  generatedByUserId: string;
  generatedByUserName: string;
  isStale?: boolean;
}

// ============================================================================
// DeltaCare Master Dashboard, Role Architecture & Operational Insights Types
// ============================================================================

export type InsightSeverity = "CRITICAL" | "WARNING" | "INFO";

export interface OperationalInsight {
  id: string;
  title: string;
  description: string;
  severity: InsightSeverity;
  category: "APPOINTMENTS" | "CAPACITY" | "SCHEDULE" | "CONTENT" | "COMPLIANCE" | "SYSTEM";
  metric: string;
  evidence: string;
  recommendedAction: string;
  actionLink?: string;
  actionTab?: string;
  freshness: string;
}

export interface PlatformSubscription {
  id: string;
  hospitalId: string;
  hospitalName: string;
  planName: "COMMUNITY" | "REGIONAL" | "ENTERPRISE";
  status: "ACTIVE" | "TRIAL" | "SUSPENDED";
  billingCycle: "MONTHLY" | "ANNUAL";
  monthlyFeeBdt: number;
  maxBranches: number;
  maxDoctors: number;
  maxAppointmentsPerMonth: number;
  startDate: string;
  renewalDate: string;
  autoRenew: boolean;
}

export interface SystemServiceHealth {
  name: string;
  category: "CORE" | "DATABASE" | "MESSAGING" | "AI" | "STORAGE";
  status: "HEALTHY" | "DEGRADED" | "DOWN";
  latencyMs: number;
  uptimePercent: number;
  lastCheckedAt: string;
  details?: string;
}

export interface PlatformHospitalSummary {
  id: string;
  code: string;
  nameEn: string;
  nameBn: string;
  status: "ACTIVE" | "MAINTENANCE" | "PENDING_APPROVAL" | "SUSPENDED";
  branchesCount: number;
  doctorsCount: number;
  appointmentsCount: number;
  subscriptionPlan: "COMMUNITY" | "REGIONAL" | "ENTERPRISE";
  subscriptionStatus: "ACTIVE" | "TRIAL" | "SUSPENDED";
  onboardedAt: string;
  adminContactEmail: string;
  primaryPhone: string;
}


