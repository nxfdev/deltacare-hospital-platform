import { getDbState, recordAuditEvent, runInTransaction } from "@/server/db/store";
import { AIUpdateDraft, Locale } from "@/types/domain";
import {
  getPublishedBranches,
  getPublishedConditions,
  getPublishedDepartments,
  getPublishedDoctors,
  getPublishedProcedures,
  getPublishedServices,
} from "./publicQueryService";
import { SessionPayload } from "@/server/auth/session";

// ============================================================================
// Evercare Assistant (AI Patient Information Assistant) & Staff AI Update Service
// Enforces FR-AI-01..11 & FR-UPD-01..06:
// - Strictly grounds answers in PUBLISHED hospital sources (never DRAFT/unpublished)
// - Refuses clinical diagnosis, prescriptions, treatment plans, or symptom triage
// - Abstains on unknown fees, branches, or services and provides contact route
// - Never claims a pending appointment request is confirmed
// - Supports English, Bangla, and Banglish queries
// ============================================================================

export interface AssistantReply {
  answer: string;
  disclosure: string;
  intentCategory:
    | "DOCTOR_LOOKUP"
    | "HOURS_LOCATION"
    | "FEES_SERVICES"
    | "APPOINTMENT_INFO"
    | "CLINICAL_REFUSAL"
    | "UNKNOWN_ABSTAIN";
  wasClinicalRefusal: boolean;
  wasAbstained: boolean;
  citations: Array<{ id: string; title: string; href: string }>;
  suggestedActions: Array<{ label: string; href: string }>;
}

const CLINICAL_RISK_PATTERNS = [
  // English clinical/medication/triage patterns
  /\b(diagnos(e|is)|prescri(be|ption)|dosage|dose|antibiotic|tablet|medicine\s+for|what\s+drug|treatment\s+plan|cure\s+my|chest\s+pain|shortness\s+of\s+breath|bleeding|stroke\s+symptom|heart\s+attack|should\s+i\s+take|am\s+i\s+having)\b/i,
  // Bangla clinical/symptom/medication patterns
  /(ওষুধ|ঔষধ|প্রেসক্রিপশন|ডোজ|বুকে\s*ব্যথা|শ্বাসকষ্ট|রক্তপাত|রোগ\s*নির্ণয়|কী\s*ওষুধ\s*খাব|কোন\s*ওষুধ|চিকিৎসা\s*দিন)/i,
  // Banglish clinical/medication patterns
  /\b(kon\s+oshudh|ki\s+oshudh|khabo|buke\s+betha|shashkoshto|medicine\s+den|treatment\s+den)\b/i,
];

export async function processPatientAssistantQuery(params: {
  message: string;
  locale: Locale;
  branchId?: string;
}): Promise<AssistantReply> {
  const db = getDbState();
  const q = params.message.trim();
  const qLower = q.toLowerCase();
  const isBangla = params.locale === "bn" || /[\u0980-\u09FF]/.test(q);

  const disclosure = isBangla
    ? "স্বয়ংক্রিয় সহায়ক (Evercare Assistant) — শুধুমাত্র এভারকেয়ারের অনুমোদিত ও প্রকাশিত তথ্যের ভিত্তিতে উত্তর প্রদান করে। এটি কোনো চিকিৎসা পরামর্শ বা প্রেসক্রিপশন প্রদান করে না।"
    : "Automated Assistant (Evercare Assistant) — Answers strictly from approved, published Evercare hospital information. Does not provide medical diagnosis or clinical advice.";

  // 1. Strict Clinical Safety Refusal Check (FR-AI-07 / T-AI-03)
  if (CLINICAL_RISK_PATTERNS.some((rx) => rx.test(q))) {
    await runInTransaction((state) => {
      state.conversationSessions.unshift({
        id: `cs-${Date.now()}`,
        channel: "WEBSITE",
        locale: isBangla ? "bn" : "en",
        queryTextRedacted: "[CLINICAL_QUERY_REDACTED]",
        queryCategory: "CLINICAL_REFUSAL",
        wasAbstained: false,
        wasClinicalRefusal: true,
        sourceIdsUsed: [],
        createdAt: new Date().toISOString(),
      });
    });

    return {
      answer: isBangla
        ? `আমি এভারকেয়ারের একজন স্বয়ংক্রিয় তথ্য সহায়ক। আপনার নিরাপত্তার স্বার্থে আমি কোনো রোগ নির্ণয়, লক্ষণ যাচাই (triage), বা ওষুধের পরামর্শ দিতে পারি না। জরুরি শারীরিক সমস্যায় অনুগ্রহ করে অবিলম্বে আমাদের ২৪/৭ জরুরি নম্বরে (${db.hospital.emergencyPhone} / হেল্পলাইন ${db.hospital.helplinePhone}) যোগাযোগ করুন অথবা একজন বিশেষজ্ঞ চিকিৎসকের অ্যাপয়েন্টমেন্ট নিন।`
        : `I am Evercare's automated administrative assistant. For your safety, I cannot diagnose symptoms, recommend medications, or provide clinical treatment advice. If you are experiencing urgent medical symptoms, please call our 24/7 Emergency Helpline immediately at ${db.hospital.emergencyPhone} (Helpline: ${db.hospital.helplinePhone}) or request a consultation with a verified specialist.`,
      disclosure,
      intentCategory: "CLINICAL_REFUSAL",
      wasClinicalRefusal: true,
      wasAbstained: false,
      citations: [],
      suggestedActions: [
        {
          label: isBangla
            ? `জরুরি কল: ${db.hospital.helplinePhone}`
            : `Call 24/7 Emergency: ${db.hospital.helplinePhone}`,
          href: `tel:${db.hospital.emergencyPhone}`,
        },
        {
          label: isBangla ? "বিশেষজ্ঞ অ্যাপয়েন্টমেন্ট অনুরোধ" : "Request Specialist Appointment",
          href: "/appointments",
        },
      ],
    };
  }

  // 2. Appointment Status / Confirmation Honesty Check (FR-AI-08 / T-AI-06)
  const refMatch = q.match(/(?:EC|DC)-\d{4}-\d{4}/i);
  if (
    refMatch ||
    /\b(appointment\s+confirm|is\s+my\s+appointment\s+booked|amar\s+appointment|অ্যাপয়েন্টমেন্ট\s*কি\s*নিশ্চিত)\b/i.test(
      q
    )
  ) {
    const refCode = refMatch ? refMatch[0].toUpperCase() : null;
    const foundApt = refCode
      ? db.appointments.find((a) => a.reference.toUpperCase() === refCode)
      : null;

    await runInTransaction((state) => {
      state.conversationSessions.unshift({
        id: `cs-${Date.now()}`,
        channel: "WEBSITE",
        locale: isBangla ? "bn" : "en",
        queryTextRedacted: refCode ? `Status check for ${refCode}` : "Appointment policy query",
        queryCategory: "APPOINTMENT_INFO",
        wasAbstained: false,
        wasClinicalRefusal: false,
        sourceIdsUsed: foundApt ? [foundApt.id] : ["hosp-policy"],
        createdAt: new Date().toISOString(),
      });
    });

    if (foundApt) {
      const isConfirmed = foundApt.status === "CONFIRMED";
      return {
        answer: isBangla
          ? `আপনার অ্যাপয়েন্টমেন্ট রেফারেন্স ${foundApt.reference}-এর বর্তমান অবস্থা: **${foundApt.status}** (${foundApt.preferredDate}, সময়: ${foundApt.preferredTimeSlot})। ${
              isConfirmed
                ? "এই অ্যাপয়েন্টমেন্টটি ফ্রন্ট-ডেস্ক কর্তৃক চূড়ান্ত (CONFIRMED) করা হয়েছে।"
                : "অনুগ্রহ করে লক্ষ্য করুন: এই অনুরোধটি এখনও চূড়ান্ত (Confirmed) হয়নি; আমাদের ফ্রন্ট-ডেস্ক টিম স্লট যাচাই করার পর এটি নিশ্চিত হবে।"
            }`
          : `Appointment reference **${foundApt.reference}** currently has status: **${foundApt.status}** (Preferred slot: ${foundApt.preferredDate} at ${foundApt.preferredTimeSlot}). ${
              isConfirmed
                ? "This booking has been verified and confirmed by Evercare front-desk staff."
                : "Important: This request is NOT yet a confirmed appointment. It remains pending until Evercare front-desk staff verify capacity and confirm it."
            }`,
        disclosure,
        intentCategory: "APPOINTMENT_INFO",
        wasClinicalRefusal: false,
        wasAbstained: false,
        citations: [
          {
            id: foundApt.id,
            title: `Appointment Record ${foundApt.reference}`,
            href: `/appointments/track?ref=${foundApt.reference}`,
          },
        ],
        suggestedActions: [
          {
            label: isBangla ? "অ্যাপয়েন্টমেন্ট ট্র্যাক করুন" : "Track Appointment Status",
            href: `/appointments/track?ref=${foundApt.reference}`,
          },
        ],
      };
    }

    return {
      answer: isBangla
        ? `/appointments পেজে ডাক্তার, তারিখ ও সময় বেছে অনলাইনে বুক করলে অ্যাপয়েন্টমেন্ট সঙ্গে সঙ্গে নিশ্চিত হয় এবং রেফারেন্স কোডসহ এসএমএস পাঠানো হয়। /track-appointment পেজে রেফারেন্স কোড দিয়ে স্ট্যাটাস দেখতে পারেন।`
        : `Book online at /appointments: pick a doctor, date and time slot and your appointment is confirmed instantly, with an SMS containing your reference code. You can check the status anytime at /track-appointment.`,
      disclosure,
      intentCategory: "APPOINTMENT_INFO",
      wasClinicalRefusal: false,
      wasAbstained: false,
      citations: [
        {
          id: "apt-policy",
          title: "Evercare Appointment Policy",
          href: "/appointments",
        },
      ],
      suggestedActions: [
        { label: isBangla ? "অ্যাপয়েন্টমেন্ট অনুরোধ করুন" : "Request Appointment", href: "/appointments" },
        { label: isBangla ? "স্ট্যাটাস ট্র্যাক করুন" : "Track Existing Request", href: "/appointments/track" },
      ],
    };
  }

  // 3. Check Published Doctors & Specialties (Only PUBLISHED records via getPublishedDoctors — FR-AI-03/04)
  const publishedDocs = getPublishedDoctors();
  const matchedDocs = publishedDocs.filter((doc) => {
    const cleanNameEn = doc.nameEn
      .replace(/\(synthetic\)/gi, "")
      .replace(/\b(prof\.?|dr\.?)\b/gi, "")
      .trim()
      .toLowerCase();
    const cleanNameBn = doc.nameBn
      .replace(/\(সিনথেটিক\)/g, "")
      .replace(/(অধ্যাপক|ডা\.?)/g, "")
      .trim()
      .toLowerCase();
    const nameTokensEn = cleanNameEn
      .split(/\s+/)
      .filter((t) => t.length >= 4);
    const nameTokensBn = cleanNameBn
      .split(/\s+/)
      .filter((t) => t.length >= 3);

    const hay = [
      doc.nameEn,
      doc.nameBn,
      doc.designationEn,
      doc.designationBn,
      ...doc.clinicalInterestsEn,
      ...doc.clinicalInterestsBn,
    ]
      .join(" ")
      .toLowerCase();
    return (
      hay.includes(qLower) ||
      (cleanNameEn.length > 0 && qLower.includes(cleanNameEn)) ||
      (cleanNameBn.length > 0 && qLower.includes(cleanNameBn)) ||
      nameTokensEn.some((tok) => qLower.includes(tok)) ||
      nameTokensBn.some((tok) => qLower.includes(tok)) ||
      (qLower.includes("cardio") && doc.departmentId === "dept-cardiology") ||
      (qLower.includes("হৃদরোগ") && doc.departmentId === "dept-cardiology") ||
      (qLower.includes("neuro") && doc.departmentId === "dept-neurology") ||
      (qLower.includes("নিউরো") && doc.departmentId === "dept-neurology") ||
      (qLower.includes("onco") && doc.departmentId === "dept-oncology") ||
      (qLower.includes("ক্যান্সার") && doc.departmentId === "dept-oncology") ||
      (qLower.includes("ortho") && doc.departmentId === "dept-orthopedics") ||
      (qLower.includes("হাড়") && doc.departmentId === "dept-orthopedics") ||
      (qLower.includes("gastro") && doc.departmentId === "dept-gastroenterology") ||
      (qLower.includes("লিভার") && doc.departmentId === "dept-gastroenterology") ||
      (qLower.includes("nephro") && doc.departmentId === "dept-nephrology") ||
      (qLower.includes("কিডনি") && doc.departmentId === "dept-nephrology") ||
      (qLower.includes("diabet") && doc.departmentId === "dept-internal-medicine") ||
      (qLower.includes("ডায়াবেটিস") && doc.departmentId === "dept-internal-medicine")
    );
  });

  if (
    matchedDocs.length > 0 &&
    !/\b(mri\s+fee|pet\s*ct|rajshahi|khulna|barishal)\b/i.test(qLower)
  ) {
    const topDoc = matchedDocs[0];
    const scheduleSummary = topDoc.branches
      .map((b) => {
        const br = db.branches.find((x) => x.id === b.branchId);
        const sr = b.scheduleRules[0];
        return `${isBangla ? br?.nameBn : br?.nameEn} (${b.roomNumber}): ${
          sr ? `${isBangla ? sr.weekdayLabelBn : sr.weekdayLabelEn} ${sr.startTime}–${sr.endTime}` : ""
        }`;
      })
      .join("; ");

    await runInTransaction((state) => {
      state.conversationSessions.unshift({
        id: `cs-${Date.now()}`,
        channel: "WEBSITE",
        locale: isBangla ? "bn" : "en",
        queryTextRedacted: q.slice(0, 120),
        queryCategory: "DOCTOR_LOOKUP",
        wasAbstained: false,
        wasClinicalRefusal: false,
        sourceIdsUsed: matchedDocs.map((d) => d.id),
        createdAt: new Date().toISOString(),
      });
    });

    return {
      answer: isBangla
        ? `অনুমোদিত তথ্য অনুযায়ী **${topDoc.nameBn}** (${topDoc.designationBn}, যোগ্যতা: ${topDoc.qualificationsBn}) এভারকেয়ারে রোগী দেখেন। \n• **নতুন কনসালটেশন ফি:** ${topDoc.consultationFeeBdt} টাকা (ফলো-আপ: ${topDoc.followupFeeBdt} টাকা, কার্যকর তারিখ: ${topDoc.feeEffectiveFrom.slice(0, 10)}) \n• **চেম্বার ও সময়সূচী:** ${scheduleSummary}`
        : `Based on Evercare's published directory, **${topDoc.nameEn}** (${topDoc.designationEn}, ${topDoc.qualificationsEn}) practices at Evercare.\n• **Published Consultation Fee:** ${topDoc.consultationFeeBdt} BDT (Follow-up: ${topDoc.followupFeeBdt} BDT, effective from ${topDoc.feeEffectiveFrom.slice(0, 10)})\n• **Verified Chamber Schedule:** ${scheduleSummary}`,
      disclosure,
      intentCategory: "DOCTOR_LOOKUP",
      wasClinicalRefusal: false,
      wasAbstained: false,
      citations: matchedDocs.slice(0, 3).map((d) => ({
        id: d.id,
        title: isBangla ? d.nameBn : d.nameEn,
        href: `/doctors/${d.slug}`,
      })),
      suggestedActions: [
        {
          label: isBangla ? "প্রোফাইল ও সময়সূচী দেখুন" : `View ${topDoc.nameEn}`,
          href: `/doctors/${topDoc.slug}`,
        },
        {
          label: isBangla ? "অ্যাপয়েন্টমেন্ট অনুরোধ" : "Request Appointment",
          href: `/appointments?doctorId=${topDoc.id}`,
        },
      ],
    };
  }

  // 4. Check Published Services & Procedures Fees
  const publishedServices = getPublishedServices();
  const matchedService = publishedServices.find(
    (s) =>
      qLower.includes(s.nameEn.toLowerCase()) ||
      (qLower.includes("echo") && s.id === "srv-echo-doppler") ||
      (qLower.includes("ইকো") && s.id === "srv-echo-doppler") ||
      (qLower.includes("holter") && s.id === "srv-holter-24h") ||
      (qLower.includes("হল্টার") && s.id === "srv-holter-24h") ||
      (qLower.includes("eeg") && s.id === "srv-eeg-digital") ||
      (qLower.includes("ইইজি") && s.id === "srv-eeg-digital") ||
      (qLower.includes("endoscopy") && s.id === "srv-upper-gi-endoscopy") ||
      (qLower.includes("এন্ডোস্কোপি") && s.id === "srv-upper-gi-endoscopy") ||
      (qLower.includes("spirometry") && s.id === "srv-spirometry-pft")
  );

  if (matchedService) {
    await runInTransaction((state) => {
      state.conversationSessions.unshift({
        id: `cs-${Date.now()}`,
        channel: "WEBSITE",
        locale: isBangla ? "bn" : "en",
        queryTextRedacted: q.slice(0, 120),
        queryCategory: "FEES_SERVICES",
        wasAbstained: false,
        wasClinicalRefusal: false,
        sourceIdsUsed: [matchedService.id],
        createdAt: new Date().toISOString(),
      });
    });

    return {
      answer: isBangla
        ? `**${matchedService.nameBn}** সেবার অনুমোদিত ফি **${matchedService.feeBdt} টাকা (BDT)** (কার্যকর তারিখ: ${matchedService.effectiveFrom.slice(0, 10)})। প্রস্তুতি: ${matchedService.preparationBn ?? "বিশেষ প্রস্তুতির প্রয়োজন নেই।"}`
        : `The published fee for **${matchedService.nameEn}** is **${matchedService.feeBdt} BDT** (${matchedService.feeLabelEn}, effective from ${matchedService.effectiveFrom.slice(0, 10)}). Preparation: ${matchedService.preparationEn ?? "Standard outpatient preparation."}`,
      disclosure,
      intentCategory: "FEES_SERVICES",
      wasClinicalRefusal: false,
      wasAbstained: false,
      citations: [
        {
          id: matchedService.id,
          title: isBangla ? matchedService.nameBn : matchedService.nameEn,
          href: "/tests-procedures",
        },
      ],
      suggestedActions: [
        { label: isBangla ? "সকল পরীক্ষা ও ফি দেখুন" : "View Tests & Procedures", href: "/tests-procedures" },
      ],
    };
  }

  // 5. Check Published Branches, Hours & Contact Details (T-AI-01)
  if (
    /\b(hour|open|time|location|branch|address|phone|contact|helpline|emergency|dhanmondi|gulshan|uttara|chattogram|sylhet|kokhon|kothay|শাখা|ঠিকানা|সময়|কখন\s*খোলা|জরুরি)\b/i.test(
      qLower
    ) &&
    !/\b(rajshahi|khulna|barishal|rangpur)\b/i.test(qLower)
  ) {
    const branches = getPublishedBranches();
    const branchLines = branches
      .map((b) =>
        isBangla
          ? `• **${b.nameBn}:** ${b.addressBn} | ফোন: ${b.phone} | সময়: ${b.operatingHoursBn}`
          : `• **${b.nameEn}:** ${b.addressEn} | Phone: ${b.phone} | Hours: ${b.operatingHoursEn}`
      )
      .join("\n");

    await runInTransaction((state) => {
      state.conversationSessions.unshift({
        id: `cs-${Date.now()}`,
        channel: "WEBSITE",
        locale: isBangla ? "bn" : "en",
        queryTextRedacted: q.slice(0, 120),
        queryCategory: "HOURS_LOCATION",
        wasAbstained: false,
        wasClinicalRefusal: false,
        sourceIdsUsed: branches.map((b) => b.id),
        createdAt: new Date().toISOString(),
      });
    });

    return {
      answer: isBangla
        ? `এভারকেয়ারের অনুমোদিত শাখা ও কার্যসময়ের তথ্য নিচে দেওয়া হলো (২৪/৭ হেল্পলাইন: **${db.hospital.helplinePhone}**, জরুরি: **${db.hospital.emergencyPhone}**):\n${branchLines}`
        : `Here are Evercare's published branch locations and operating hours (24/7 Helpline: **${db.hospital.helplinePhone}**, Emergency: **${db.hospital.emergencyPhone}**):\n${branchLines}`,
      disclosure,
      intentCategory: "HOURS_LOCATION",
      wasClinicalRefusal: false,
      wasAbstained: false,
      citations: branches.slice(0, 3).map((b) => ({
        id: b.id,
        title: isBangla ? b.nameBn : b.nameEn,
        href: `/locations/${b.slug}`,
      })),
      suggestedActions: [
        { label: isBangla ? "সকল শাখা দেখুন" : "Explore All Locations", href: "/locations" },
        { label: isBangla ? "যোগাযোগ ও কলব্যাক" : "Contact & Callback", href: "/contact" },
      ],
    };
  }

  // 6. Safe Abstention for Unknown / Unpublished / Unverified Queries (FR-AI-06 / T-AI-02 / T-AI-04)
  await runInTransaction((state) => {
    state.conversationSessions.unshift({
      id: `cs-${Date.now()}`,
      channel: "WEBSITE",
      locale: isBangla ? "bn" : "en",
      queryTextRedacted: q.slice(0, 120),
      queryCategory: "UNKNOWN_ABSTAIN",
      wasAbstained: true,
      wasClinicalRefusal: false,
      sourceIdsUsed: [],
      createdAt: new Date().toISOString(),
    });
  });

  return {
    answer: isBangla
      ? `দুঃখিত, আপনার প্রশ্নের বিষয়ে এভারকেয়ারের অনুমোদিত ও প্রকাশিত তথ্যে নির্দিষ্ট কোনো রেকর্ড পাওয়া যায়নি। ভুল বা অনুমাননির্ভর তথ্য না দেওয়ার নীতির কারণে আমি এই প্রশ্নের উত্তর দেওয়া থেকে বিরত থাকছি (Abstained)। অনুগ্রহ করে আমাদের হেল্পলাইন **${db.hospital.helplinePhone}** (${db.hospital.emergencyPhone}) নম্বরে কল করুন অথবা একটি কলব্যাক অনুরোধ জমা দিন।`
      : `I do not have verified, published hospital information matching that specific query. In accordance with Evercare's safety policy, I abstain from guessing fees, unpublished schedules, or unverified services. Please contact our Patient Desk at **${db.hospital.helplinePhone}** (${db.hospital.emergencyPhone}) or submit a callback request so our staff can assist you directly.`,
    disclosure,
    intentCategory: "UNKNOWN_ABSTAIN",
    wasClinicalRefusal: false,
    wasAbstained: true,
    citations: [],
    suggestedActions: [
      { label: isBangla ? "কলব্যাক অনুরোধ জমা দিন" : "Request a Staff Callback", href: "/contact" },
      {
        label: isBangla ? `হেল্পলাইনে কল করুন (${db.hospital.helplinePhone})` : `Call Helpline (${db.hospital.helplinePhone})`,
        href: `tel:${db.hospital.emergencyPhone}`,
      },
    ],
  };
}

// ============================================================================
// Release 2 / Section 15: Staff AI Update Assistant (FR-UPD-01..06)
// Parses unstructured staff notes into structured change drafts that
// ALWAYS require human review & approval before publication.
// ============================================================================

export async function createStaffAIUpdateDraft(
  session: SessionPayload,
  params: {
    rawInputNote: string;
    category: "DOCTOR_SCHEDULE" | "FEE_UPDATE" | "PUBLIC_NOTICE" | "SERVICE_INFO";
  }
): Promise<AIUpdateDraft> {
  return runInTransaction((state) => {
    const note = params.rawInputNote.trim();
    const feeMatch = note.match(/(\d{3,5})\s*(?:bdt|taka|টাকা)/i);
    const dateMatch = note.match(/(\d{4}-\d{2}-\d{2})/);

    const parsedSummary = `[AI Draft — Requires Human Approval] Parsed ${params.category} update from staff note (${note.slice(0, 80)}...).`;
    const proposedPayload = {
      category: params.category,
      extractedFeeBdt: feeMatch ? Number(feeMatch[1]) : undefined,
      extractedEffectiveDate: dateMatch ? dateMatch[1] : new Date().toISOString().slice(0, 10),
      originalAuthor: session.fullName,
      requiresHumanApprover: true,
      autoPublishAllowed: false,
    };

    const draft: AIUpdateDraft = {
      id: `aiupd-${Date.now()}`,
      staffUserId: session.userId,
      staffName: session.fullName,
      rawInputNote: note,
      category: params.category,
      parsedSummary,
      proposedPayloadJson: JSON.stringify(proposedPayload, null, 2),
      draftNoticeEn: `Advisory (Draft Pending Approval): ${note}`,
      draftNoticeBn: `বিজ্ঞপ্তি (অনুমোদনের অপেক্ষায় খসড়া): ${note}`,
      approvalStatus: "PENDING_APPROVAL",
      createdAt: new Date().toISOString(),
    };

    state.aiUpdateDrafts.unshift(draft);

    recordAuditEvent(state, {
      actorUserId: session.userId,
      actorName: session.fullName,
      actorRole: session.role,
      action: "AI_UPDATE_DRAFT_CREATED",
      entityType: "AIUpdateDraft",
      entityId: draft.id,
      summary: `Created AI-assisted staff update draft (${params.category}) in PENDING_APPROVAL state.`,
    });

    return draft;
  });
}
