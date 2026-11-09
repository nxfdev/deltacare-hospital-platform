import { getDbState } from "@/server/db/store";
import { SmsLogRecord } from "@/types/domain";
import { formatSlotLabels } from "@/lib/schedule-engine";

// ============================================================================
// DeltaCare Pluggable Bangladesh SMS Gateway & Confirmation Service
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
      return `DeltaCare: Appointment request (${params.referenceCode}) received for ${params.doctorNameEn} at ${params.branchNameEn} (${params.chamberRoom}) on ${params.appointmentDate} at ${labelEn}. Status: PENDING confirmation. Helpline: ${hotline}.`;
    case "CONFIRMED":
      return `DeltaCare CONFIRMED: Ref ${params.referenceCode} for ${params.patientName} with ${params.doctorNameEn} on ${params.appointmentDate} at ${labelEn}, ${params.chamberRoom}, ${params.branchNameEn}. অনুগ্রহ করে নির্ধারিত সময়ের ১৫ মিনিট পূর্বে চেম্বার ডেস্কে রিপোর্ট করুন / Report 15 mins early. Helpline: ${hotline}.`;
    case "RESCHEDULED":
      return `DeltaCare RESCHEDULED: Ref ${params.referenceCode} with ${params.doctorNameEn} moved to ${params.appointmentDate} at ${labelEn} (${params.chamberRoom}, ${params.branchNameEn}). অনুগ্রহ করে ১৫ মিনিট পূর্বে রিপোর্ট করুন।${params.reason ? ` Note: ${params.reason}.` : ""} Helpline: ${hotline}.`;
    case "CANCELLED":
      return `DeltaCare CANCELLED: Appointment ${params.referenceCode} with ${params.doctorNameEn} (${params.appointmentDate} ${labelEn}) has been cancelled.${params.reason ? ` Reason: ${params.reason}.` : ""} Call ${hotline} to rebook.`;
  }
}

export async function dispatchViaConfiguredGateway(
  recipientPhone: string,
  messageBody: string
): Promise<"SENT" | "FAILED" | "SIMULATED"> {
  const provider = (process.env.SMS_PROVIDER || "simulated").toLowerCase() as SmsProviderCode;
  const apiKey = process.env.SMS_API_KEY;
  const senderId = process.env.SMS_SENDER_ID || "DeltaCare";
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

  const providerConfigured = Boolean(
    process.env.SMS_PROVIDER &&
      process.env.SMS_PROVIDER !== "simulated" &&
      process.env.SMS_API_KEY
  );

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
    subject: `DeltaCare SMS (${params.eventType} - ${params.referenceCode})`,
    bodyPreview: messageBody,
    status: "SENT",
    relatedEntityType: "APPOINTMENT",
    relatedEntityId: params.appointmentId,
    providerMessageId: smsLog.id,
    sentAt: nowIso,
  });

  if (providerConfigured) {
    void dispatchViaConfiguredGateway(normalizedPhone, messageBody);
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
