import { getDbState } from "@/server/db/store";
import { SmsLogRecord } from "@/types/domain";
import { formatSlotLabels } from "@/lib/schedule-engine";

// ============================================================================
// Evercare Pluggable Bangladesh SMS Gateway & Confirmation Service
// Supports: ssl_wireless | bulksmsbd | greenweb | simulated
// Persists every SMS dispatch to prisma.smsLog (state.smsLogs)
// ============================================================================

export type SmsEventType =
  | "REQUEST_RECEIVED"
  | "CONFIRMED"
  | "RESCHEDULED"
  | "CANCELLED";

export type SmsProviderCode =
  | "ssl_wireless"
  | "bulksmsbd"
  | "greenweb"
  | "simulated";

export interface SendAppointmentSmsParams {
  appointmentId: string;
  referenceCode: string;
  recipientPhone: string;
  patientName: string;
  doctorNameEn: string;
  doctorNameBn?: string;
  branchNameEn: string;
  chamberRoom: string;
  appointmentDate: string; // YYYY-MM-DD
  slotTime: string; // HH:mm
  eventType: SmsEventType;
  reason?: string;
}

export function normalizeBangladeshPhone(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (digits.startsWith("8801") && digits.length === 13) {
    return digits.slice(2);
  }
  return digits;
}

export function buildSmsMessageBody(params: SendAppointmentSmsParams): string {
  const { labelEn } = formatSlotLabels(params.slotTime);
  const hotline = "10666";

  switch (params.eventType) {
    case "REQUEST_RECEIVED":
      return `Evercare: Appointment request (${params.referenceCode}) received for ${params.doctorNameEn} at ${params.branchNameEn} (${params.chamberRoom}) on ${params.appointmentDate} at ${labelEn}. Status: PENDING confirmation. Helpline: ${hotline}.`;
    case "CONFIRMED":
      return `Evercare CONFIRMED: Ref ${params.referenceCode} for ${params.patientName} with ${params.doctorNameEn} on ${params.appointmentDate} at ${labelEn}, ${params.chamberRoom}, ${params.branchNameEn}. অনুগ্রহ করে নির্ধারিত সময়ের ১৫ মিনিট পূর্বে চেম্বার ডেস্কে রিপোর্ট করুন / Report 15 mins early. Helpline: ${hotline}.`;
    case "RESCHEDULED":
      return `Evercare RESCHEDULED: Ref ${params.referenceCode} with ${params.doctorNameEn} moved to ${params.appointmentDate} at ${labelEn} (${params.chamberRoom}, ${params.branchNameEn}). Please arrive 15 min early.${params.reason ? ` Note: ${params.reason}.` : ""} Helpline: ${hotline}.`;
    case "CANCELLED":
      return `Evercare CANCELLED: Appointment ${params.referenceCode} with ${params.doctorNameEn} (${params.appointmentDate} ${labelEn}) has been cancelled.${params.reason ? ` Reason: ${params.reason}.` : ""} Call ${hotline} to rebook.`;
  }
}

let cachedTextBeeDeviceId: string | null = null;

async function resolveTextBeeDeviceId(apiKey: string, baseUrl: string): Promise<string | null> {
  if (process.env.TEXTBEE_DEVICE_ID) return process.env.TEXTBEE_DEVICE_ID;
  if (cachedTextBeeDeviceId) return cachedTextBeeDeviceId;
  const res = await fetch(`${baseUrl}/gateway/devices`, { headers: { "x-api-key": apiKey } });
  if (!res.ok) return null;
  const json = (await res.json()) as { data?: Array<{ _id?: string; id?: string; enabled?: boolean }> };
  const devices = json.data ?? [];
  const device = devices.find((d) => d.enabled !== false) ?? devices[0];
  cachedTextBeeDeviceId = device?._id ?? device?.id ?? null;
  return cachedTextBeeDeviceId;
}

/** Sends an SMS through TextBee (https://textbee.dev) using the paired Android gateway device. */
export async function sendViaTextBee(recipientPhone: string, messageBody: string): Promise<"SENT" | "FAILED"> {
  const apiKey = process.env.TEXTBEE_API_KEY || process.env.SMS_API_KEY;
  const baseUrl = (process.env.TEXTBEE_API_URL || "https://api.textbee.dev/api/v1").replace(/\/$/, "");
  if (!apiKey) return "FAILED";
  try {
    const deviceId = await resolveTextBeeDeviceId(apiKey, baseUrl);
    if (!deviceId) {
      console.warn("[textbee] no gateway device found for this API key");
      return "FAILED";
    }
    const res = await fetch(`${baseUrl}/gateway/devices/${deviceId}/send-sms`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-api-key": apiKey },
      body: JSON.stringify({
        recipients: [`+880${normalizeBangladeshPhone(recipientPhone).replace(/^0/, "")}`],
        message: messageBody,
      }),
    });
    if (!res.ok) console.warn(`[textbee] send failed: HTTP ${res.status}`);
    return res.ok ? "SENT" : "FAILED";
  } catch (err) {
    console.warn("[textbee] send error:", (err as Error)?.message);
    return "FAILED";
  }
}

function isSmsProviderConfigured(): boolean {
  const provider = (process.env.SMS_PROVIDER || "simulated").toLowerCase();
  if (provider === "textbee") return Boolean(process.env.TEXTBEE_API_KEY || process.env.SMS_API_KEY);
  return provider !== "simulated" && Boolean(process.env.SMS_API_KEY && process.env.SMS_API_URL);
}

export async function dispatchViaConfiguredGateway(
  recipientPhone: string,
  messageBody: string
): Promise<"SENT" | "FAILED" | "SIMULATED"> {
  const provider = (process.env.SMS_PROVIDER || "simulated").toLowerCase();
  if (provider === "textbee") return sendViaTextBee(recipientPhone, messageBody);

  const apiKey = process.env.SMS_API_KEY;
  const senderId = process.env.SMS_SENDER_ID || "Evercare";
  const apiUrl = process.env.SMS_API_URL;

  if (provider === "simulated" || !apiKey || !apiUrl) {
    return "SIMULATED";
  }

  try {
    const bdMsisdn = `88${normalizeBangladeshPhone(recipientPhone)}`;
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        provider,
        api_key: apiKey,
        senderid: senderId,
        number: bdMsisdn,
        message: messageBody,
      }),
    });
    return response.ok ? "SENT" : "FAILED";
  } catch {
    return "SIMULATED";
  }
}

/**
 * Synchronous-safe SMS logger & dispatcher used inside and outside transactions
 */
export function recordAndDispatchAppointmentSms(
  params: SendAppointmentSmsParams
): SmsLogRecord {
  const state = getDbState();
  const normalizedPhone = normalizeBangladeshPhone(params.recipientPhone);
  const messageBody = buildSmsMessageBody(params);
  const nowIso = new Date().toISOString();

  const providerConfigured = isSmsProviderConfigured();

  const smsLog: SmsLogRecord = {
    id: `sms-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    appointmentId: params.appointmentId,
    recipientPhone: normalizedPhone,
    messageBody,
    eventType: params.eventType,
    providerStatus: providerConfigured ? "SENT" : "SIMULATED",
    sentAt: nowIso,
  };

  state.smsLogs.unshift(smsLog);

  // Also record in notifications array for backwards compatibility
  state.notifications.unshift({
    id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    channel: "SMS",
    recipient: normalizedPhone,
    templateCode: `APT_${params.eventType}`,
    subject: `Evercare SMS (${params.eventType} - ${params.referenceCode})`,
    bodyPreview: messageBody,
    status: "SENT",
    relatedEntityType: "APPOINTMENT",
    relatedEntityId: params.appointmentId,
    providerMessageId: smsLog.id,
    sentAt: nowIso,
  });

  if (providerConfigured) {
    // Fire-and-forget; record the real gateway outcome on the log entry when it resolves.
    void dispatchViaConfiguredGateway(normalizedPhone, messageBody).then((status) => {
      smsLog.providerStatus = status === "FAILED" ? "FAILED" : smsLog.providerStatus;
    });
  }

  return smsLog;
}

export function getSmsLogsForAppointment(appointmentId: string, referenceCode?: string): SmsLogRecord[] {
  const state = getDbState();
  return state.smsLogs.filter(
    (s) =>
      s.appointmentId === appointmentId ||
      (referenceCode && s.messageBody.includes(referenceCode))
  );
}
