import { getDbState } from "@/server/db/store";
import { getAvailableSlotsForDoctor, resolveDhakaWeekday } from "@/lib/schedule-engine";

// ============================================================================
// Evercare Phase 3 — Daily Facebook Campaign Template & Caption Service
// Queries live chamber schedules + overrides via getAvailableSlotsForDoctor
// ============================================================================

export interface DoctorFacebookSpotlight {
  doctorId: string;
  doctorSlug: string;
  nameEn: string;
  nameBn: string;
  qualificationsEn: string;
  qualificationsBn: string;
  designationEn: string;
  designationBn: string;
  workplaceEn: string;
  workplaceBn: string;
  photoUrl: string | null;
  symptomTags: string[];
  consultationFeeBdt: number;
  followupFeeBdt: number;
  bmdcRegistrationNo: string;
  departmentId: string;
  departmentNameEn: string;
  departmentNameBn: string;
  branchId: string;
  branchNameEn: string;
  branchNameBn: string;
  branchAddressEn: string;
  branchAddressBn: string;
  chamberRoom: string;
  visitingHoursEn: string;
  visitingHoursBn: string;
  totalSlotsToday: number;
  availableSlotsCount: number;
  firstAvailableSlot: string | null;
  caption: string;
  customHeadline?: string;
}

export interface FacebookCampaignResponse {
  ok: boolean;
  date: string;
  weekdayNameEn: string;
  weekdayNameBn: string;
  totalDoctorsAvailable: number;
  doctors: DoctorFacebookSpotlight[];
  masterDailyCaption: string;
}

const WEEKDAY_NAMES: Record<number, { en: string; bn: string }> = {
  0: { en: "Sunday", bn: "রবিবার" },
  1: { en: "Monday", bn: "সোমবার" },
  2: { en: "Tuesday", bn: "মঙ্গলবার" },
  3: { en: "Wednesday", bn: "বুধবার" },
  4: { en: "Thursday", bn: "বৃহস্পতিবার" },
  5: { en: "Friday", bn: "শুক্রবার" },
  6: { en: "Saturday", bn: "শনিবার" },
};

function formatVisitingHoursBn(start24: string, end24: string): string {
  const toBnTime = (t: string) => {
    const [hStr, mStr] = t.split(":");
    const h = parseInt(hStr, 10);
    const period = h >= 18 ? "রাত" : h >= 15 ? "বিকাল" : h >= 12 ? "দুপুর" : "সকাল";
    const h12 = h % 12 === 0 ? 12 : h % 12;
    const bnDigits = (str: string) =>
      str.replace(/\d/g, (d) => "০১২৩৪৫৬৭৮৯"[parseInt(d, 10)]);
    return `${period} ${bnDigits(String(h12).padStart(2, "0"))}:${bnDigits(mStr)}টা`;
  };
  return `${toBnTime(start24)} – ${toBnTime(end24)}`;
}

function formatVisitingHoursEn(start24: string, end24: string): string {
  const to12 = (t: string) => {
    const [hStr, mStr] = t.split(":");
    const h = parseInt(hStr, 10);
    const ampm = h >= 12 ? "PM" : "AM";
    const h12 = h % 12 === 0 ? 12 : h % 12;
    return `${String(h12).padStart(2, "0")}:${mStr} ${ampm}`;
  };
  return `${to12(start24)} – ${to12(end24)}`;
}

export async function generateDailyFacebookCampaign(params: {
  date?: string;
  branchId?: string | null;
  departmentId?: string | null;
}): Promise<FacebookCampaignResponse> {
  const db = getDbState();

  const dateStr =
    params.date ||
    new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Dhaka",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date());

  const weekday = resolveDhakaWeekday(dateStr);
  const weekdayInfo = WEEKDAY_NAMES[weekday] ?? { en: "Today", bn: "আজ" };

  const availableDoctors: DoctorFacebookSpotlight[] = [];

  for (const doc of db.doctors) {
    if (doc.publicationState !== "PUBLISHED" || doc.isActive === false) continue;
    if (params.departmentId && doc.departmentId !== params.departmentId) continue;

    for (const br of doc.branches) {
      if (br.status !== "ACTIVE") continue;
      if (params.branchId && br.branchId !== params.branchId) continue;

      const slotEngineResult = await getAvailableSlotsForDoctor({
        doctorId: doc.id,
        branchId: br.branchId,
        date: dateStr,
      });

      if (!slotEngineResult.isAvailableDay || slotEngineResult.slots.length === 0) {
        continue;
      }

      const branchObj = db.branches.find((b) => b.id === br.branchId);
      const deptObj = db.departments.find((d) => d.id === doc.departmentId);

      const openSlots = slotEngineResult.slots.filter((s) => s.status === "AVAILABLE");
      const firstOpen = openSlots[0]?.time24 ?? slotEngineResult.slots[0]?.time24 ?? null;

      const firstSlotTime = slotEngineResult.slots[0]?.time24 ?? "17:00";
      const lastSlotTime =
        slotEngineResult.slots[slotEngineResult.slots.length - 1]?.time24 ?? "21:00";

      const visitingHoursEn = formatVisitingHoursEn(firstSlotTime, lastSlotTime);
      const visitingHoursBn = formatVisitingHoursBn(firstSlotTime, lastSlotTime);

      const symptomHighlightBn =
        (doc.symptomTags || []).slice(0, 4).join(" · ") ||
        `${deptObj?.nameBn || "বিশেষজ্ঞ"} পরামর্শ ও চিকিৎসা`;
      const directBookingLink = `https://evercare.bd/appointments?doctor=${encodeURIComponent(
        doc.slug
      )}&branch=${encodeURIComponent(br.branchId)}`;

      const chamberRoomStr = slotEngineResult.chamberRoom || br.roomNumber || "Room #402, 3rd Floor";

      const caption = `🏥 আজকের বিশেষজ্ঞ চিকিৎসক চেম্বার | Available Today (${dateStr})
🩺 ${doc.nameBn} (${doc.nameEn})
🎓 ${doc.qualificationsBn || doc.qualificationsEn}
💼 ${doc.workplaceBn || doc.workplaceEn || doc.designationBn}

📍 চেম্বার ক্যাম্পাস: ${branchObj?.nameBn || branchObj?.nameEn}
🏢 রুম নম্বর: ${chamberRoomStr}
⏰ চেম্বার সময়: ${visitingHoursBn} (${visitingHoursEn})
🎯 প্রধান সেবাসমূহ: ${symptomHighlightBn}

✅ অনলাইনে আপনার সুবিধাজনক ফিক্সড টাইম স্লট বুক করুন:
👉 ${directBookingLink}

📞 সিরিয়াল ও যে কোনো তথ্যের জন্য কল করুন এভারকেয়ার হটলাইন:
☎️ 10666 (+8809612310666)

#Evercare #EvercareHospital #SpecialistDoctor #DoctorChamber #${
        deptObj?.slug?.replace(/-/g, "") || "HealthCare"
      } #DhakaHospital #BMDCVerified`;

      availableDoctors.push({
        doctorId: doc.id,
        doctorSlug: doc.slug,
        nameEn: doc.nameEn,
        nameBn: doc.nameBn,
        qualificationsEn: doc.qualificationsEn || "",
        qualificationsBn: doc.qualificationsBn || doc.qualificationsEn || "",
        designationEn: doc.designationEn || "",
        designationBn: doc.designationBn || "",
        workplaceEn: doc.workplaceEn || doc.designationEn || "",
        workplaceBn: doc.workplaceBn || doc.workplaceEn || doc.designationBn || "",
        photoUrl: doc.imageUrl || null,
        symptomTags: doc.symptomTags || [],
        consultationFeeBdt: doc.consultationFeeBdt || 1200,
        followupFeeBdt: doc.followupFeeBdt || 700,
        bmdcRegistrationNo: doc.bmdcRegistrationNo || "BMDC-VERIFIED",
        departmentId: doc.departmentId,
        departmentNameEn: deptObj?.nameEn || doc.departmentId,
        departmentNameBn: deptObj?.nameBn || doc.departmentId,
        branchId: br.branchId,
        branchNameEn: branchObj?.nameEn || br.branchId,
        branchNameBn: branchObj?.nameBn || br.branchId,
        branchAddressEn: branchObj?.addressEn || "",
        branchAddressBn: branchObj?.addressBn || "",
        chamberRoom: chamberRoomStr,
        visitingHoursEn,
        visitingHoursBn,
        totalSlotsToday: slotEngineResult.slots.length,
        availableSlotsCount: openSlots.length,
        firstAvailableSlot: firstOpen,
        caption,
      });
    }
  }

  // Master Combined Daily Roster Caption
  const masterLines = availableDoctors.map(
    (d, i) =>
      `${i + 1}. ${d.nameBn} (${d.departmentNameBn})\n   📍 ${d.branchNameBn} (${d.chamberRoom}) | ⏰ ${d.visitingHoursBn}`
  );

  const masterDailyCaption = `🏥 এভারকেয়ার হাসপাতাল · আজকের বিশেষজ্ঞ চিকিৎসক তালিকা (${dateStr}, ${weekdayInfo.bn})
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
সম্মানিত সুধী, এভারকেয়ারের বিভিন্ন শাখায় আজকের চেম্বার সময়সূচি নিচে দেওয়া হলো:

${masterLines.join("\n\n")}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💡 প্রতিটি চেম্বার ১৫/২০ মিনিটের নির্ধারিত ফিক্সড স্লট ভিত্তিতে পরিচালিত হয়। 
🌐 অনলাইনে সরাসরি আপনার স্লট বেছে নিন: https://evercare.bd/appointments
📞 জরুরি প্রয়োজনে বা হটলাইনে বুকিংয়ের জন্য ২৪ ঘণ্টা কল করুন: 10666

#Evercare #EvercareHospital #DoctorSchedule #DhakaDoctors #HealthcareBangladesh`;

  return {
    ok: true,
    date: dateStr,
    weekdayNameEn: weekdayInfo.en,
    weekdayNameBn: weekdayInfo.bn,
    totalDoctorsAvailable: availableDoctors.length,
    doctors: availableDoctors,
    masterDailyCaption,
  };
}
