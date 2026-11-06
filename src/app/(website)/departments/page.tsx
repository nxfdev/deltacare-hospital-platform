import React from "react";
import Link from "next/link";
import { ArrowRight, Stethoscope, Calendar, CheckCircle2 } from "lucide-react";
import {
  getPublishedDepartments,
  getPublishedDoctors,
  getPublishedServices,
} from "@/server/services/publicQueryService";

export const dynamic = "force-dynamic";

export default function DepartmentsPage() {
  const departments = getPublishedDepartments();
  const doctors = getPublishedDoctors();
  const services = getPublishedServices();

  return (
    <div className="min-h-screen bg-white">
      {/* Full-bleed Stretched Blue Hero Header */}
      <div className="w-full bg-[#012d61] text-white py-14 md:py-20 border-b border-[#001f44]">
        <div className="mc-container max-w-7xl mx-auto px-6 sm:px-10 lg:px-12 space-y-4">
          <p className="text-xs sm:text-sm font-bold uppercase tracking-widest text-[#93c5fd]">
            Care at DeltaCare • Clinical Departments &amp; Programs
          </p>
          <h1 className="mc-serif text-3xl sm:text-5xl lg:text-[54px] font-bold text-white tracking-tight leading-tight">
            Clinical Departments &amp; Specialties
          </h1>
          <p className="text-xl text-[#c5e2f9] font-medium">
            ক্লিনিক্যাল বিভাগ ও বিশেষায়িত সেন্টার
          </p>
          <p className="text-base sm:text-lg text-[#e8f0f9] max-w-3xl leading-relaxed">
            Explore DeltaCare&apos;s multidisciplinary clinical departments,
            verified consultant rosters, and transparent diagnostic service fees.
          </p>
        </div>
      </div>

      {/* Main Body - Unboxed 2-Column Editorial Layout */}
      <div className="w-full py-12 md:py-16">
        <div className="mc-container max-w-7xl mx-auto px-6 sm:px-10 lg:px-12 space-y-16">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-14">
            {departments.map((dept) => {
              const deptDoctors = doctors.filter(
                (d) => d.departmentId === dept.id
              );
              const deptServices = services.filter(
                (s) => s.departmentId === dept.id
              );

              return (
                <div
                  key={dept.id}
                  className="pb-10 border-b border-[#e5e7eb] flex flex-col justify-between gap-6"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#0057b8]">
                        <Stethoscope className="w-4 h-4" />
                        <span>{deptDoctors.length} Verified Consultants</span>
                      </span>
                      <span className="inline-flex items-center gap-1 text-xs text-[#6b7280]">
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#0057b8]" />
                        Verified {dept.lastVerifiedAt.slice(0, 10)}
                      </span>
                    </div>

                    <h2 className="mc-serif text-2xl md:text-3xl text-[#080808]">
                      <Link
                        href={`/departments/${dept.slug}`}
                        className="hover:text-[#0057b8] transition-colors"
                      >
                        {dept.nameEn}
                      </Link>
                    </h2>
                    <p className="text-base font-semibold text-[#004181]">
                      {dept.nameBn}
                    </p>

                    <p className="text-base text-[#4b5563] leading-relaxed">
                      {dept.shortDescriptionEn}
                    </p>
                    <p className="text-sm text-[#6b7280] leading-relaxed">
                      {dept.shortDescriptionBn}
                    </p>

                    {deptServices.length > 0 && (
                      <div className="pt-3">
                        <p className="text-xs font-bold uppercase tracking-wider text-[#6b7280] mb-2">
                          Published Diagnostic &amp; Clinical Services:
                        </p>
                        <div className="divide-y divide-[#e5e7eb] border-t border-b border-[#e5e7eb]">
                          {deptServices.map((srv) => (
                            <div
                              key={srv.id}
                              className="flex items-center justify-between py-2 text-sm text-[#080808]"
                            >
                              <span>{srv.nameEn}</span>
                              <span className="font-bold text-[#004181]">
                                BDT {srv.feeBdt}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="pt-2 flex flex-wrap items-center justify-between gap-4">
                    <Link
                      href={`/departments/${dept.slug}`}
                      className="inline-flex items-center gap-1 text-sm font-bold text-[#004181] hover:text-[#0057b8] hover:underline"
                    >
                      <span>Department Overview &amp; Doctors</span>
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                    <Link
                      href={`/request-appointment?departmentId=${encodeURIComponent(
                        dept.id
                      )}`}
                      className="mc-btn-primary !py-2 !px-4 text-xs inline-flex items-center gap-1.5"
                    >
                      <Calendar className="w-3.5 h-3.5" />
                      <span>Request Appointment</span>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
