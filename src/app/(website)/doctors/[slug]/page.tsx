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

  return (
    <div className="bg-[#f2f2f2] min-h-screen py-10 md:py-14">
      <div className="mc-container space-y-10">
        <div>
          <Link
            href="/doctors"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#004181] hover:text-[#0057b8] hover:underline"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Specialist Directory / চিকিৎসক ডিরেক্টরিতে ফিরুন</span>
          </Link>
        </div>

        {/* Profile Hero Card */}
        <div className="bg-white rounded-3xl border border-[#d6d6d6] p-6 md:p-10 shadow-sm">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-3 flex flex-col items-center text-center space-y-3">
              <img
                src={doctor.imageUrl}
                alt={doctor.nameEn}
                className="w-40 h-40 rounded-full object-cover border-4 border-[#0057b8] bg-[#e8f0f9] shadow"
              />
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[#e8f0f9] text-[#004181] text-xs font-bold">
                <Award className="w-3.5 h-3.5 text-[#0057b8]" />
                BMDC: {doctor.bmdcRegistrationNo}
              </span>
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[#ecfdf5] text-[#065f46] text-xs font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Verified & Published Record
              </span>
            </div>

            <div className="lg:col-span-9 space-y-5">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-[#0057b8]">
                  {department?.nameEn} • {department?.nameBn}
                </p>
                <h1 className="mt-1 mc-serif text-3xl md:text-4xl text-[#080808]">
                  {doctor.nameEn}
                </h1>
                <p className="text-lg font-medium text-[#004181] mt-0.5">
                  {doctor.nameBn}
                </p>
                <p className="mt-2 text-base font-semibold text-[#424242]">
                  {doctor.designationEn} ({doctor.designationBn})
                </p>
                <p className="text-sm text-[#686868] mt-1">
                  {doctor.qualificationsEn} • {doctor.experienceYears} Years
                  Clinical Experience
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-2xl bg-[#f8fafc] border border-[#d6d6d6]">
                <div>
                  <p className="text-xs text-[#686868] uppercase font-bold">
                    Approved Consultation Fee (Effective {doctor.feeEffectiveFrom})
                  </p>
                  <p className="text-xl font-bold text-[#080808] mt-1">
                    BDT {doctor.consultationFeeBdt}{" "}
                    <span className="text-sm font-normal text-[#686868]">
                      (New Visit)
                    </span>
                  </p>
                  <p className="text-sm text-[#004181] font-medium">
                    Follow-up Visit: BDT {doctor.followupFeeBdt}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-[#686868] uppercase font-bold">
                    Languages & Verification
                  </p>
                  <p className="text-sm font-semibold text-[#080808] mt-1 flex items-center gap-1.5">
                    <Globe2 className="w-4 h-4 text-[#0057b8]" />
                    {doctor.languagesEn.join(", ")} ({doctor.languagesBn.join(", ")})
                  </p>
                  <p className="text-xs text-[#686868] mt-1 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-[#0057b8]" />
                    Last verified: {doctor.lastVerifiedAt.slice(0, 10)}
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <h2 className="text-lg font-bold text-[#080808]">
                  Clinical Biography / পরিচিতি
                </h2>
                <p className="text-sm text-[#424242] leading-relaxed">
                  {doctor.bioEn}
                </p>
                <p className="text-sm text-[#424242] leading-relaxed">
                  {doctor.bioBn}
                </p>
              </div>

              <div>
                <h3 className="text-sm font-bold text-[#080808] mb-2">
                  Clinical Focus Areas / বিশেষায়িত ক্ষেত্র
                </h3>
                <div className="flex flex-wrap gap-2">
                  {doctor.clinicalInterestsEn.map((interest, idx) => (
                    <span
                      key={interest}
                      className="px-3 py-1 rounded-full bg-[#e8f0f9] text-[#004181] text-xs font-semibold"
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
              <div className="pt-4 border-t border-[#d6d6d6]">
                <h3 className="text-base font-bold text-[#080808] mb-3 flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-[#0057b8]" />
                  <span>Active Hospital Chambers & Schedule Rules</span>
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {doctor.branches.map((dbAssign) => {
                    const br = branches.find((b) => b.id === dbAssign.branchId);
                    return (
                      <div
                        key={dbAssign.id}
                        className="p-4 rounded-xl border border-[#d6d6d6] bg-white space-y-2"
                      >
                        <p className="font-bold text-sm text-[#004181]">
                          {br?.nameEn} ({br?.nameBn})
                        </p>
                        <p className="text-xs text-[#424242]">
                          Chamber: <strong>{dbAssign.roomNumber}</strong>
                        </p>
                        {dbAssign.scheduleRules.map((rule) => (
                          <div
                            key={rule.id}
                            className="text-xs text-[#080808] flex items-center gap-1.5"
                          >
                            <Clock className="w-3.5 h-3.5 text-[#0057b8]" />
                            <span>
                              {rule.weekdayLabelEn}: {rule.startTime} –{" "}
                              {rule.endTime} ({rule.slotMinutes}m slots)
                            </span>
                          </div>
                        ))}
                        {dbAssign.scheduleExceptions.length > 0 && (
                          <div className="mt-2 p-2 rounded bg-[#fef3c7] text-[#92400e] text-xs">
                            <strong>Schedule Notice:</strong> Unavailable on{" "}
                            {dbAssign.scheduleExceptions
                              .map((ex) => `${ex.dateStr} (${ex.reasonEn})`)
                              .join(", ")}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Direct Appointment Booking Section for this Specialist */}
        <div id="book-with-doctor">
          <div className="mb-4 flex items-center gap-2 text-sm font-bold text-[#004181]">
            <Calendar className="w-4 h-4 text-[#0057b8]" />
            <span>
              Request an Appointment with {doctor.nameEn}
            </span>
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
  );
}

