import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Award,
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  Globe2,
  ArrowLeft,
  ShieldCheck,
} from "lucide-react";
import {
  getPublishedBranches,
  getPublishedDepartments,
  getPublishedDoctorBySlug,
  getPublishedDoctors,
} from "@/server/services/publicQueryService";
import { AppointmentBookingModule } from "@/components/appointments/AppointmentBookingModule";
import { getAvailableSlotsForDoctor } from "@/lib/schedule-engine";

export const dynamic = "force-dynamic";

export default async function DoctorDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const doctor = getPublishedDoctorBySlug(slug);
  if (!doctor) {
    notFound();
  }

  const departments = getPublishedDepartments();
  const branches = getPublishedBranches();
  const allDoctors = getPublishedDoctors();
  const department = departments.find((d) => d.id === doctor.departmentId);

  const primaryBranchId = doctor.branches[0]?.branchId ?? "branch-dhanmondi";
  // Find next available chamber date within the next 7 days
  let nextSlotPreview = await getAvailableSlotsForDoctor({
    doctorId: doctor.id,
    branchId: primaryBranchId,
    date: "2026-11-15",
  });
  for (let offset = 0; offset < 7; offset++) {
    const dt = new Date(Date.now() + offset * 86400000);
    const dateStr = dt.toISOString().slice(0, 10);
    const candidate = await getAvailableSlotsForDoctor({
      doctorId: doctor.id,
      branchId: primaryBranchId,
      date: dateStr,
    });
    if (candidate.isAvailableDay && candidate.slots.some((s) => s.status === "AVAILABLE")) {
      nextSlotPreview = candidate;
      break;
    }
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Full-bleed Stretched Dark Blue Hero Header */}
      <div className="w-full bg-[#012d61] text-white py-14 md:py-20 border-b border-[#001f44]">
        <div className="mc-container max-w-7xl mx-auto px-6 sm:px-10 lg:px-12 space-y-4">
          <Link
            href="/doctors"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#93c5fd] hover:underline mb-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Specialist Directory / চিকিৎসক ডিরেক্টরিতে ফিরুন</span>
          </Link>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#93c5fd]">
            <span>{department?.nameEn} • {department?.nameBn}</span>
          </div>
          <h1 className="mc-serif text-3xl sm:text-5xl lg:text-[54px] font-bold text-white tracking-tight leading-tight">
            {doctor.nameEn}
          </h1>
          <p className="text-xl text-[#c5e2f9] font-medium">
            {doctor.nameBn} — {doctor.designationEn}
          </p>
          <p className="text-base sm:text-lg text-[#e8f0f9] max-w-3xl leading-relaxed">
            {doctor.qualificationsEn} • {doctor.experienceYears} Years Clinical Experience
          </p>
          {doctor.workplaceEn && (
            <p className="text-sm sm:text-base text-[#93c5fd] font-semibold max-w-3xl">
              {doctor.workplaceEn}
              {doctor.workplaceBn ? ` (${doctor.workplaceBn})` : ""}
            </p>
          )}
        </div>
      </div>

      {/* Main Body - Unboxed Editorial */}
      <div className="w-full py-12 md:py-16">
        <div className="mc-container max-w-7xl mx-auto px-6 sm:px-10 lg:px-12 space-y-16">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 pb-12 border-b border-[#e5e7eb] items-start">
            <div className="lg:col-span-3 flex flex-col items-center text-center space-y-3">
              <img
                src={doctor.imageUrl}
                alt={doctor.nameEn}
                className="w-44 h-44 rounded-full object-cover border-4 border-[#0057b8] bg-[#e8f0f9] shadow-sm"
              />
              <span className="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-[#0057b8]">
                <Award className="w-3.5 h-3.5" />
                BMDC Reg. No: {doctor.bmdcRegistrationNo}
              </span>
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#065f46]">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Verified &amp; Published Record
              </span>
            </div>

            <div className="lg:col-span-9 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pb-6 border-b border-[#e5e7eb]">
                <div>
                  <p className="text-xs text-[#6b7280] uppercase font-bold tracking-wider">
                    Consultation Fee / ভিজিট ফি
                  </p>
                  <p className="text-2xl font-bold text-[#080808] mt-1">
                    ৳{doctor.consultationFeeBdt.toLocaleString()}{" "}
                    <span className="text-sm font-normal text-[#6b7280]">
                      (New Visit / নতুন রোগী)
                    </span>
                  </p>
                  <p className="text-sm text-[#004181] font-semibold mt-1">
                    Follow-up / রিপোর্ট দেখানো: ৳{doctor.followupFeeBdt.toLocaleString()}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-[#6b7280] uppercase font-bold tracking-wider">
                    Languages &amp; Verification
                  </p>
                  <p className="text-base font-semibold text-[#080808] mt-1 flex items-center gap-2">
                    <Globe2 className="w-4 h-4 text-[#0057b8]" />
                    {doctor.languagesEn.join(", ")} ({doctor.languagesBn.join(", ")})
                  </p>
                  <p className="text-xs text-[#6b7280] mt-1 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-[#0057b8]" />
                    Last verified: {doctor.lastVerifiedAt.slice(0, 10)}
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <h2 className="mc-serif text-2xl text-[#080808]">
                  Clinical Biography / পরিচিতি
                </h2>
                <p className="text-base text-[#374151] leading-relaxed">
                  {doctor.bioEn}
                </p>
                <p className="text-sm text-[#6b7280] leading-relaxed">
                  {doctor.bioBn}
                </p>
              </div>

              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#6b7280] mb-2">
                  Clinical Focus Areas:
                </h3>
                <div className="flex flex-wrap gap-2">
                  {doctor.clinicalInterestsEn.map((interest, idx) => (
                    <span
                      key={interest}
                      className="px-3 py-1 bg-[#f3f4f6] text-[#374151] text-xs font-medium"
                    >
                      {interest}
                      {doctor.clinicalInterestsBn[idx]
                        ? ` (${doctor.clinicalInterestsBn[idx]})`
                        : ""}
                    </span>
                  ))}
                </div>
              </div>

              {/* Chamber Assignments & Schedules */}
              <div className="pt-6 border-t border-[#e5e7eb] space-y-4">
                <h3 className="mc-serif text-2xl text-[#080808] flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-[#0057b8]" />
                  <span>Branch-by-Branch Chamber Schedule / শাখাভিত্তিক চেম্বার সময়সূচী</span>
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {doctor.branches.map((dbAssign) => {
                    const br = branches.find((b) => b.id === dbAssign.branchId);
                    const uniqueLabels = Array.from(
                      new Set(
                        dbAssign.scheduleRules.map(
                          (rule) =>
                            `${rule.weekdayLabelEn} (${rule.weekdayLabelBn}) · ${rule.startTime} – ${rule.endTime} · ${rule.slotMinutes}m fixed slots`
                        )
                      )
                    );
                    return (
                      <div
                        key={dbAssign.id}
                        className="p-5 border border-[#e5e7eb] space-y-2"
                      >
                        <p className="font-bold text-base text-[#004181]">
                          {br?.nameEn} ({br?.nameBn})
                        </p>
                        <p className="text-sm text-[#4b5563]">
                          Chamber Room: <strong className="text-[#080808]">{dbAssign.roomNumber}</strong>
                        </p>
                        {uniqueLabels.map((lbl) => (
                          <div
                            key={lbl}
                            className="text-sm text-[#374151] flex items-center gap-2"
                          >
                            <Clock className="w-4 h-4 text-[#0057b8] shrink-0" />
                            <span>{lbl}</span>
                          </div>
                        ))}
                      </div>
                    );
                  })}
                </div>

                {/* Next Available Fixed Time Slots Preview */}
                {nextSlotPreview.isAvailableDay && nextSlotPreview.slots.length > 0 && (
                  <div className="pt-4 space-y-2">
                    <p className="text-xs font-bold uppercase tracking-wider text-[#0057b8]">
                      Next Available Fixed Time Slots ({nextSlotPreview.date} · {nextSlotPreview.chamberRoom}):
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {nextSlotPreview.slots
                        .filter((s) => s.status === "AVAILABLE")
                        .slice(0, 8)
                        .map((slot) => (
                          <a
                            key={slot.time24}
                            href="#book-with-doctor"
                            className="px-3 py-1.5 bg-[#f0f7ff] hover:bg-[#0057b8] text-[#004181] hover:text-white border border-[#93c5fd] text-xs font-bold transition-colors"
                          >
                            {slot.labelEn} ({slot.labelBn})
                          </a>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Direct Appointment Booking Section for this Specialist */}
          <div id="book-with-doctor" className="space-y-6 pt-4">
            <div className="pb-4 border-b-2 border-[#080808] flex items-center gap-2">
              <Calendar className="w-5 h-5 text-[#0057b8]" />
              <h2 className="mc-serif text-3xl text-[#080808]">
                Request an Appointment with {doctor.nameEn}
              </h2>
            </div>
            <AppointmentBookingModule
              departments={departments}
              doctors={allDoctors}
              branches={branches}
              preselectedDoctorId={doctor.id}
              preselectedDepartmentId={doctor.departmentId}
              preselectedBranchId={doctor.branches[0]?.branchId}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
