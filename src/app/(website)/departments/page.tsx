import React from "react";
import Link from "next/link";
import { ChevronRight, Stethoscope, Calendar, CheckCircle2 } from "lucide-react";
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
    <div className="bg-[#f2f2f2] min-h-screen py-12">
      <div className="mc-container space-y-10">
        <div className="bg-[#012d61] text-white rounded-3xl p-8 md:p-12">
          <p className="text-xs font-bold uppercase tracking-widest text-[#c5e2f9]">
            Care at DeltaCare • Clinical Departments & Programs
          </p>
          <h1 className="mt-2 mc-serif text-3xl md:text-5xl text-white">
            Clinical Departments & Specialties / ক্লিনিক্যাল বিভাগসমূহ
          </h1>
          <p className="mt-3 text-base text-[#e8f0f9] max-w-3xl">
            Explore DeltaCare&apos;s multidisciplinary clinical departments,
            verified consultant rosters, and transparent diagnostic service fees.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {departments.map((dept) => {
            const deptDoctors = doctors.filter(
              (d) => d.departmentId === dept.id
            );
            const deptServices = services.filter(
              (s) => s.departmentId === dept.id
            );

            return (
              <article
                key={dept.id}
                className="bg-white rounded-2xl border border-[#d6d6d6] p-6 md:p-8 shadow-sm hover:border-[#0057b8] transition-all flex flex-col justify-between gap-6"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#e8f0f9] text-[#004181] text-xs font-bold">
                      <Stethoscope className="w-3.5 h-3.5 text-[#0057b8]" />
                      <span>{deptDoctors.length} Verified Consultants</span>
                    </span>
                    <span className="inline-flex items-center gap-1 text-xs text-[#686868]">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#0057b8]" />
                      Verified {dept.lastVerifiedAt.slice(0, 10)}
                    </span>
                  </div>

                  <h2 className="mc-serif text-2xl text-[#080808]">
                    <Link
                      href={`/departments/${dept.slug}`}
                      className="hover:text-[#0057b8] hover:underline"
                    >
                      {dept.nameEn}
                    </Link>
                  </h2>
                  <p className="text-sm font-semibold text-[#004181]">
                    {dept.nameBn}
                  </p>

                  <p className="text-sm text-[#424242] leading-relaxed">
                    {dept.shortDescriptionEn}
                  </p>
                  <p className="text-xs text-[#686868] leading-relaxed">
                    {dept.shortDescriptionBn}
                  </p>

                  {deptServices.length > 0 && (
                    <div className="pt-2">
                      <p className="text-xs font-bold uppercase text-[#686868] mb-1.5">
                        Published Diagnostic & Clinical Services:
                      </p>
                      <ul className="space-y-1 text-xs text-[#080808]">
                        {deptServices.map((srv) => (
                          <li
                            key={srv.id}
                            className="flex items-center justify-between py-1 border-b border-[#f2f2f2]"
                          >
                            <span>{srv.nameEn}</span>
                            <span className="font-bold text-[#004181]">
                              BDT {srv.feeBdt}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                <div className="pt-4 border-t border-[#d6d6d6] flex flex-wrap items-center justify-between gap-3">
                  <Link
                    href={`/departments/${dept.slug}`}
                    className="inline-flex items-center gap-1 text-sm font-semibold text-[#004181] hover:text-[#0057b8] underline"
                  >
                    <span>Department Overview & Doctors</span>
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                  <Link
                    href={`/appointments?departmentId=${encodeURIComponent(
                      dept.id
                    )}`}
                    className="mc-btn-primary !py-2 !px-4 text-xs"
                  >
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Request Appointment</span>
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </div>
  );
}

