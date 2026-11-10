import { Locale } from "@/types/domain";
import {
  getPublishedBranches,
  getPublishedDepartments,
  getPublishedDoctors,
  getPublicHospitalConfig,
} from "./publicQueryService";

// ============================================================================
// Evercare Grok (xAI) assistant client.
// Builds a system prompt grounded in live published hospital data and calls the
// xAI Responses API. Returns null on any failure so callers can fall back to the
// local grounded assistant.
// ============================================================================

const WEEKDAYS_EN = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const WEEKDAYS_BN = ["রবি", "সোম", "মঙ্গল", "বুধ", "বৃহস্পতি", "শুক্র", "শনি"];

export function isGrokConfigured(): boolean {
  return Boolean(process.env.XAI_API_KEY) && process.env.AI_PROVIDER !== "grounded-local";
}

function buildHospitalContext(locale: Locale): string {
  const bn = locale === "bn";
  const branches = getPublishedBranches();
  const departments = getPublishedDepartments();
  const doctors = getPublishedDoctors();
  const branchName = (id: string) => {
    const b = branches.find((x) => x.id === id);
    return b ? (bn ? b.nameBn : b.nameEn) : id;
  };
  const deptName = (id: string) => {
    const d = departments.find((x) => x.id === id);
    return d ? (bn ? d.nameBn : d.nameEn) : id;
  };

  const branchLines = branches.map(
    (b) =>
      `- ${bn ? b.nameBn : b.nameEn}: ${bn ? b.addressBn : b.addressEn} | Phone ${b.phone} | ${bn ? b.operatingHoursBn : b.operatingHoursEn}`
  );
  const deptLines = departments.map((d) => `- ${bn ? d.nameBn : d.nameEn} (/departments/${d.slug})`);
  const doctorLines = doctors.map((doc) => {
    const chambers = doc.branches
      .filter((a) => a.status === "ACTIVE")
      .map((a) => {
        const days = a.scheduleRules
          .map((r) => `${(bn ? WEEKDAYS_BN : WEEKDAYS_EN)[r.weekday]} ${r.startTime}-${r.endTime}`)
          .join(", ");
        return `${branchName(a.branchId)} room ${a.roomNumber} [${days}]`;
      })
      .join("; ");
    return `- ${bn ? doc.nameBn : doc.nameEn} — ${bn ? doc.designationBn : doc.designationEn}, ${deptName(doc.departmentId)} | Fee ৳${doc.consultationFeeBdt} (follow-up ৳${doc.followupFeeBdt}) | ${chambers} | /doctors/${doc.slug}`;
  });

  return [
    "BRANCHES:",
    ...branchLines,
    "",
    "DEPARTMENTS:",
    ...deptLines,
    "",
    "DOCTORS (name — designation, department | fees | chambers & weekly hours | profile link):",
    ...doctorLines,
  ].join("\n");
}

export function buildGrokSystemPrompt(locale: Locale): string {
  const hospital = getPublicHospitalConfig();
  const helpline = hospital.helplinePhone || "10666";
  const emergency = hospital.emergencyPhone || "+8809612310666";
  const languageRule =
    locale === "bn"
      ? "The patient selected BANGLA. Reply ONLY in polite Bangladeshi Bangla (বাংলা). Do not mix in English sentences; doctor names may be given in Bangla as listed."
      : "The patient selected ENGLISH. Reply ONLY in English, even if they write in Bangla or Banglish.";

  return `You are the official Evercare Hospital Patient Information & Appointment Assistant in Dhaka, Bangladesh (24/7 Helpline: ${helpline} | Emergency: ${emergency}).

1. ROLE & LANGUAGE:
- Help patients find the right specialist doctor, department, branch, chamber visiting hours and consultation fees in BDT (৳), and guide them to book fixed-slot appointments at /appointments or track slips at /track-appointment.
- ${languageRule}
- Keep answers concise (under 150 words) with clear bullet points. Plain text only, no markdown tables.

2. STRICT CLINICAL SAFETY GUARDRAILS:
- You are a hospital navigation and appointment assistant, NOT a doctor.
- NEVER diagnose diseases, interpret lab/ECG/X-ray reports, prescribe medicines, or recommend drug/antibiotic dosages.
- If asked for medical advice or prescriptions, politely refuse and recommend the appropriate department and specialist for an in-person consultation.
- EMERGENCY RED FLAGS: severe chest pain, difficulty breathing, stroke/sudden paralysis, severe bleeding, dengue shock or unconsciousness → at the very top of the reply, instruct them to call Evercare 24/7 Emergency (${helpline} / ${emergency}) or go to the nearest emergency room.
- ZERO HALLUCINATION: only share doctors, schedules, fees and branches from the HOSPITAL DATA below. If something is not listed, say so and direct the patient to call ${helpline} or request a callback at /contact.

3. SYMPTOM-TO-DEPARTMENT TRIAGE (BANGLADESH CONTEXT):
- Fever, dengue, chikungunya, typhoid, weakness → Medicine / fever care
- Chest pain, high blood pressure, palpitations → Cardiology
- Gastric, acidity, ulcer, fatty liver, jaundice, hepatitis → Gastroenterology & Liver
- Pregnancy, antenatal check-up, infertility → Gynecology & Obstetrics
- Child fever, cough, asthma, newborn care, vaccination → Pediatrics
- Back/knee pain, arthritis, fracture → Orthopedics
- Ear, nose, throat, sinus, vertigo → ENT
- Migraine, stroke, nerve pain, seizures → Neurology
- Kidney stone, high creatinine, dialysis, UTI → Nephrology
- Diabetes, thyroid, hormones → Endocrinology
- Skin rash, allergy, eczema, hair loss → Dermatology
Only name departments that exist in the HOSPITAL DATA.

4. BOOKING:
- Online booking at /appointments is instant: pick doctor, date and slot, enter an 11-digit BD mobile (01XXXXXXXXX). The appointment is confirmed immediately and an SMS with the reference code is sent.
- Track or print a slip at /track-appointment.

HOSPITAL DATA (live, published):
${buildHospitalContext(locale)}`;
}

export interface GrokTurn {
  role: "user" | "assistant";
  content: string;
}

function extractOutputText(json: unknown): string | null {
  if (!json || typeof json !== "object") return null;
  const obj = json as Record<string, unknown>;
  if (typeof obj.output_text === "string" && obj.output_text.trim()) return obj.output_text.trim();
  const output = obj.output;
  if (Array.isArray(output)) {
    const parts: string[] = [];
    for (const item of output) {
      const content = (item as { content?: unknown })?.content;
      if (Array.isArray(content)) {
        for (const c of content) {
          const text = (c as { text?: unknown })?.text;
          if (typeof text === "string") parts.push(text);
        }
      }
    }
    if (parts.length) return parts.join("\n").trim();
  }
  // Chat-completions shaped fallback
  const choices = obj.choices;
  if (Array.isArray(choices)) {
    const text = (choices[0] as { message?: { content?: unknown } })?.message?.content;
    if (typeof text === "string") return text.trim();
  }
  return null;
}

export async function askGrok(params: {
  message: string;
  locale: Locale;
  history?: GrokTurn[];
}): Promise<string | null> {
  if (!isGrokConfigured()) return null;
  const url = process.env.XAI_API_URL || "https://api.x.ai/v1/responses";
  const model = process.env.XAI_MODEL || "grok-4.7";
  const history = (params.history ?? []).slice(-8);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 25_000);
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.XAI_API_KEY}`,
      },
      body: JSON.stringify({
        model,
        input: [
          { role: "system", content: buildGrokSystemPrompt(params.locale) },
          ...history,
          { role: "user", content: params.message },
        ],
      }),
      signal: controller.signal,
    });
    if (!res.ok) {
      console.warn(`[grok] request failed: HTTP ${res.status} ${(await res.text()).slice(0, 200)}`);
      return null;
    }
    return extractOutputText(await res.json());
  } catch (err) {
    console.warn("[grok] request error:", (err as Error)?.message);
    return null;
  } finally {
    clearTimeout(timer);
  }
}
