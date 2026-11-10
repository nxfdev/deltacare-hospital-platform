import { Locale } from "@/types/domain";
import {
  getPublishedBranches,
  getPublishedDepartments,
  getPublishedDoctors,
  getPublicHospitalConfig,
} from "./publicQueryService";
import { fuzzyRecordScore } from "@/lib/fuzzy";
import { toBnDigits } from "@/lib/i18n/digits";

// ============================================================================
// Evercare patient assistant — LLM client.
// Providers: Groq (default, OpenAI-compatible chat completions) or xAI Grok.
// The system prompt is built on the backend from live published hospital data.
// Returns null on any failure so the caller can fall back to the local
// grounded assistant.
// ============================================================================

const WEEKDAYS_BN = ["রবিবার", "সোমবার", "মঙ্গলবার", "বুধবার", "বৃহস্পতিবার", "শুক্রবার", "শনিবার"];
const WEEKDAYS_EN_FULL = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

/** Renders a room label like "Room #402, 3rd Floor" in Bangla. */
function roomBn(room: string): string {
  return toBnDigits(
    room
      .replace(/Room\s*#?/gi, "কক্ষ ")
      .replace(/(\d+)(st|nd|rd|th)\s*Floor/gi, "$1 তলা")
      .replace(/Ground Floor/gi, "নিচতলা")
      .replace(/Floor/gi, "তলা")
      .replace(/Level\s*/gi, "লেভেল ")
      .replace(/Chamber\s*/gi, "চেম্বার ")
      .replace(/\s*\([A-Za-z ]+\)/g, "")
  );
}

type Provider = "groq" | "grok";

function activeProvider(): Provider | null {
  const pref = (process.env.AI_PROVIDER || "").toLowerCase();
  if (pref === "grounded-local") return null;
  if (pref === "grok" && process.env.XAI_API_KEY) return "grok";
  if (process.env.GROQ_API_KEY) return "groq";
  if (process.env.XAI_API_KEY) return "grok";
  return null;
}

export function isAssistantLlmConfigured(): boolean {
  return activeProvider() !== null;
}

// Symptom keywords (EN / BN / Banglish) -> department ids, used to pick relevant doctors.
const TRIAGE: Array<[RegExp, string[]]> = [
  [/fever|dengue|dengu|chikungunya|typhoid|weak|jor|জ্বর|ডেঙ্গু|দুর্বল|শরীর ব্যথা/i, ["dept-medicine-dengue"]],
  [/chest|heart|blood pressure|bp|palpitation|cardio|buke|হৃদ|বুক|প্রেশার|হার্ট/i, ["dept-cardiology"]],
  [/gastric|acid|ulcer|liver|jaundice|hepatitis|stomach|pet|গ্যাস্ট্রিক|লিভার|জন্ডিস|পেট|আলসার/i, ["dept-gastroenterology"]],
  [/pregnan|antenatal|infertil|gyn|period|গর্ভ|গাইনী|প্রসূতি|বন্ধ্যা|মাসিক/i, ["dept-gynecology"]],
  [/child|baby|newborn|vaccin|kid|shishu|শিশু|বাচ্চা|নবজাতক|টিকা/i, ["dept-pediatrics"]],
  [/back pain|knee|joint|arthritis|fracture|bone|spine|কোমর|হাঁটু|হাড়|বাত|জয়েন্ট/i, ["dept-orthopedics"]],
  [/ear|nose|throat|tonsil|sinus|vertigo|ent|কান|নাক|গলা|টনসিল/i, ["dept-ent"]],
  [/migraine|headache|stroke|seizure|nerve|epilep|paraly|matha|মাথা|স্ট্রোক|খিঁচুনি|মৃগী|অবশ/i, ["dept-neurology"]],
  [/kidney|creatinine|dialysis|uti|urine|কিডনি|ডায়ালাইসিস|প্রস্রাব/i, ["dept-nephrology"]],
  [/diabet|sugar|thyroid|hormone|ডায়াবেটিস|সুগার|থাইরয়েড|হরমোন/i, ["dept-internal-medicine"]],
  [/skin|rash|allerg|eczema|hair|চর্ম|ত্বক|এলার্জি|চুল/i, ["dept-dermatology"]],
  [/cancer|tumou?r|chemo|oncolog|ক্যান্সার|ক্যানসার|টিউমার/i, ["dept-oncology"]],
  [/asthma|copd|breath|lung|cough|শ্বাস|কাশি|ফুসফুস|হাঁপানি/i, ["dept-critical-care"]],
];

function buildHospitalContext(locale: Locale, message: string): string {
  const bn = locale === "bn";
  const branches = getPublishedBranches();
  const departments = getPublishedDepartments();
  const doctors = getPublishedDoctors();
  const N = <T extends { nameEn: string; nameBn: string }>(x?: T) => (x ? (bn ? x.nameBn : x.nameEn) : "");
  const days = bn ? WEEKDAYS_BN : WEEKDAYS_EN_FULL;

  // Pick doctors relevant to the question: named directly, by department name, or by symptom triage.
  const q = message.toLowerCase();
  const deptIds = new Set<string>();
  TRIAGE.forEach(([rx, ids]) => rx.test(message) && ids.forEach((id) => deptIds.add(id)));
  departments.forEach((d) => {
    if (fuzzyRecordScore(message, [d.nameEn, d.nameBn, d.slug.replace(/-/g, " ")]) >= 0.8) deptIds.add(d.id);
  });
  const named = doctors.filter((d) =>
    [d.nameEn, d.nameBn].some((n) =>
      n
        .replace(/^(Prof\.|Assoc\.|Dr\.|অধ্যাপক|ডা\.)\s*/g, "")
        .toLowerCase()
        .split(/\s+/)
        .some((part) => part.length > 3 && q.includes(part))
    )
  );
  const relevant = [...named, ...doctors.filter((d) => deptIds.has(d.departmentId) && !named.includes(d))].slice(0, 4);

  const num = (v: string | number) => (bn ? toBnDigits(v) : String(v));
  // One line per chamber, each repeating the doctor's name, so hours can't be attributed to the wrong doctor.
  const detail = (doc: (typeof doctors)[number]) => {
    const dept = departments.find((d) => d.id === doc.departmentId);
    const head = `* ${N(doc)} — ${N(dept)} — ${bn ? "ফি" : "fee"} ৳${num(doc.consultationFeeBdt)}, ${bn ? "ফলো-আপ" : "follow-up"} ৳${num(doc.followupFeeBdt)} — /doctors/${doc.slug}`;
    const chambers = doc.branches
      .filter((a) => a.status === "ACTIVE")
      .map((a) => {
        const br = branches.find((b) => b.id === a.branchId);
        const sched = a.scheduleRules.map((r) => `${days[r.weekday]} ${num(r.startTime)}–${num(r.endTime)}`).join(", ");
        return `    - ${N(doc)} @ ${N(br)}, ${bn ? roomBn(a.roomNumber) : a.roomNumber}: ${sched}`;
      });
    return [head, ...chambers].join("\n");
  };

  const lines = [
    `BRANCHES: ${branches.map((b) => `${N(b)} (${b.phone})`).join("; ")}`,
    `DEPARTMENTS: ${departments.map((d) => N(d)).join("; ")}`,
    `ALL DOCTORS: ${doctors
      .map((d) => `${N(d)} — ${N(departments.find((x) => x.id === d.departmentId))}`)
      .join("; ")}`,
  ];
  if (relevant.length) lines.push("RELEVANT DOCTOR DETAILS (fees, chambers, weekly hours):", ...relevant.map(detail));
  else lines.push("No specific doctor matched; ask which symptom or department, or share the general booking steps.");
  return lines.join("\n");
}

/** Backend-owned system prompt, injected on every request. */
export function buildAssistantSystemPrompt(locale: Locale, message = ""): string {
  const hospital = getPublicHospitalConfig();
  const helpline = hospital.helplinePhone || "10666";
  const emergency = hospital.emergencyPhone || "+8809612310666";
  const branchNames = getPublishedBranches()
    .map((b) => b.nameEn)
    .join(", ");
  const languageRule =
    locale === "bn"
      ? "The patient has selected BANGLA on the website. Reply ONLY in polite Bangladeshi Bangla (বাংলা), even if they write in English or Banglish. Use the Bangla doctor and department names from the hospital data. Do not mix English sentences into the reply."
      : "The patient has selected ENGLISH on the website. Reply ONLY in English, even if they write in Bangla or Banglish (e.g. \"amar matha betha korche\"). Keep doctor names, room numbers and times easy to read.";

  return `You are the official Evercare Hospital Patient Information & Appointment Assistant in Dhaka, Bangladesh (24/7 Helpline: ${helpline} | Emergency: ${emergency}).

1. ROLE & LANGUAGE:
- Help patients find the right specialist doctor, department, branch location (${branchNames}), chamber visiting hours and consultation fees in BDT (৳), and guide them to book fixed-slot appointments at /appointments or track slips at /track-appointment.
- ${languageRule}
- Keep answers concise (under 150 words) with clear bullet points. Use plain text with "-" bullets; do not use markdown tables, headings or bold markers.

2. STRICT CLINICAL SAFETY GUARDRAILS:
- You are a hospital navigation and appointment assistant, NOT a doctor.
- NEVER diagnose diseases, interpret lab/ECG/X-ray reports, prescribe medicines, or recommend drug/antibiotic dosages.
- If asked for medical advice or prescriptions, politely refuse clinical advice and recommend the appropriate hospital department and specialist for an in-person consultation.
- EMERGENCY RED FLAGS: If the user mentions severe chest pain (তীব্র বুকে ব্যথা), difficulty breathing (শ্বাসকষ্ট), stroke/paralysis (হঠাৎ অবশ হয়ে যাওয়া), severe bleeding, dengue shock, or unconsciousness, IMMEDIATELY instruct them at the very top of your reply to call Evercare 24/7 Emergency (${helpline} / ${emergency}) or visit the nearest hospital emergency room.
- ZERO HALLUCINATION: Only share doctors, schedules, fees (৳) and branches that appear in the HOSPITAL DATA below. If information is not there, do not guess — direct the patient to call ${helpline} or submit a callback request at /contact.

3. SYMPTOM-TO-DEPARTMENT TRIAGE (BANGLADESH CONTEXT) — map to the matching department in the HOSPITAL DATA:
- Fever, dengue, chikungunya, typhoid, weakness -> Medicine & Dengue/Fever Care
- Chest pain, high blood pressure, palpitations, heart disease -> Cardiology
- Gastric, acidity, ulcer, fatty liver, jaundice, hepatitis -> Gastroenterology & Liver
- Pregnancy, antenatal check-up, infertility, gynaecology -> Gynaecology & Obstetrics
- Child fever, cough, asthma, newborn care, vaccination -> Paediatrics & Neonatology
- Back pain, knee pain, arthritis, fracture, trauma -> Orthopaedics
- Ear, nose, throat, tonsils, sinus, vertigo -> ENT
- Migraine, severe headache, stroke, nerve pain, seizures -> Neurology
- Kidney stone, high creatinine, dialysis, UTI -> Nephrology
- Diabetes, thyroid, hormone imbalance -> Endocrinology / Internal Medicine
- Skin rash, allergy, eczema, hair loss -> Dermatology
When you suggest a department, name 1–2 matching doctors from the data with their branch, room, chamber days/times and fee — copy days, times, rooms and fees exactly as written in the data.

4. BOOKING & TRACKING:
- Book fixed 15/20-minute time slots online at /appointments (no login required). Patients pick a doctor, a highlighted date on the calendar and a time, then enter an 11-digit BD mobile number (01XXXXXXXXX). The appointment is confirmed instantly and an SMS with the reference code (EC-2026-XXXX) is sent.
- Track or print an appointment slip at /track-appointment.

HOSPITAL DATA (live, published — the only source you may use; if a detail is missing, give the doctor's profile link and booking page instead of guessing):
${buildHospitalContext(locale, message)}`;
}

export interface AssistantTurn {
  role: "user" | "assistant";
  content: string;
}

function extractText(json: unknown): string | null {
  if (!json || typeof json !== "object") return null;
  const obj = json as Record<string, unknown>;
  const choices = obj.choices;
  if (Array.isArray(choices)) {
    const text = (choices[0] as { message?: { content?: unknown } })?.message?.content;
    if (typeof text === "string" && text.trim()) return text.trim();
  }
  if (typeof obj.output_text === "string" && obj.output_text.trim()) return obj.output_text.trim();
  if (Array.isArray(obj.output)) {
    const parts: string[] = [];
    for (const item of obj.output) {
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
  return null;
}

/** Strips markdown emphasis the widget doesn't render. */
function tidy(text: string): string {
  return text.replace(/\*\*(.+?)\*\*/g, "$1").replace(/^#{1,6}\s+/gm, "").trim();
}

export async function askAssistantLlm(params: {
  message: string;
  locale: Locale;
  history?: AssistantTurn[];
}): Promise<string | null> {
  const provider = activeProvider();
  if (!provider) return null;

  const messages = [
    { role: "system", content: buildAssistantSystemPrompt(params.locale, params.message) },
    ...(params.history ?? []).slice(-4).map((t) => ({ role: t.role, content: t.content.slice(0, 600) })),
    { role: "user", content: params.message },
  ];

  const request =
    provider === "groq"
      ? {
          url: process.env.GROQ_API_URL || "https://api.groq.com/openai/v1/chat/completions",
          key: process.env.GROQ_API_KEY,
          body: {
            model: process.env.GROQ_MODEL || "openai/gpt-oss-120b",
            messages,
            temperature: 0.2,
            max_completion_tokens: 700,
            reasoning_effort: "low",
          },
        }
      : {
          url: process.env.XAI_API_URL || "https://api.x.ai/v1/responses",
          key: process.env.XAI_API_KEY,
          body: { model: process.env.XAI_MODEL || "grok-4.7", input: messages },
        };

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 25_000);
  try {
    const res = await fetch(request.url, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${request.key}` },
      body: JSON.stringify(request.body),
      signal: controller.signal,
    });
    if (!res.ok) {
      console.warn(`[assistant:${provider}] HTTP ${res.status} ${(await res.text()).slice(0, 200)}`);
      return null;
    }
    const text = extractText(await res.json());
    return text ? tidy(text) : null;
  } catch (err) {
    console.warn(`[assistant:${provider}] request error:`, (err as Error)?.message);
    return null;
  } finally {
    clearTimeout(timer);
  }
}
