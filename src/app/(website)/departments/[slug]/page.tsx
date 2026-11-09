import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Award,
  Calendar,
  ChevronRight,
  Stethoscope,
  BookOpen,
} from "lucide-react";
import {
  getPublishedConditions,
  getPublishedDepartmentBySlug,
  getPublishedDoctors,
  getPublishedProcedures,
  getPublishedServices,
} from "@/server/services/publicQueryService";

export const dynamic = "force-dynamic";

export default async function DepartmentDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const dept = getPublishedDepartmentBySlug(slug);
  if (!dept) {
    notFound();
  }

  const doctors = getPublishedDoctors({ departmentId: dept.id });
  const services = getPublishedServices(dept.id);
  const conditions = getPublishedConditions({ departmentId: dept.id });
  const procedures = getPublishedProcedures(dept.id);

  return (
    <div className="min-h-screen bg-white">
      {/* Full-bleed Stretched Blue Hero Header */}
      <div className="w-full bg-[#012d61] text-white py-14 md:py-20 border-b border-[#001f44]">
        <div className="mc-container max-w-7xl mx-auto px-6 sm:px-10 lg:px-12 space-y-4">
          <Link
            href="/departments"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#93c5fd] hover:underline mb-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>All Clinical Departments / সকল ক্লিনিক্যাল বিভাগ</span>
          </Link>
          <p className="text-xs sm:text-sm font-bold uppercase tracking-widest text-[#93c5fd]">
            DeltaCare Clinical Department
          </p>
          <h1 className="mc-serif text-3xl sm:text-5xl lg:text-[54px] font-bold text-white tracking-tight leading-tight">
            {dept.nameEn}
          </h1>
          <p className="text-xl text-[#c5e2f9] font-medium">{dept.nameBn}</p>
          <p className="text-base sm:text-lg text-[#e8f0f9] max-w-3xl leading-relaxed">
            {dept.overviewEn}
          </p>
          <p className="text-sm sm:text-base text-[#c5e2f9] max-w-3xl leading-relaxed">
            {dept.overviewBn}
          </p>
          <div className="pt-3">
            <Link
              href={`/request-appointment?departmentId=${encodeURIComponent(dept.id)}`}
              className="mc-btn-primary inline-flex items-center gap-2 text-sm !py-3 !px-6"
            >
              <Calendar className="w-4 h-4" />
              <span>Request Appointment in {dept.nameEn}</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Main Body - Unboxed Editorial */}
      <div className="w-full py-12 md:py-16">
        <div className="mc-container max-w-7xl mx-auto px-6 sm:px-10 lg:px-12 space-y-16">
          {/* Department Specialists */}
          <section className="space-y-6">
            <div className="pb-4 border-b-2 border-[#080808]">
              <h2 className="mc-serif text-3xl sm:text-4xl text-[#080808]">
                Verified Department Specialists ({doctors.length})
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
              {doctors.map((doc) => (
                <div
                  key={doc.id}
                  className="pb-8 border-b border-[#e5e7eb] flex items-start justify-between gap-6"
                >
                  <div className="flex items-start gap-5">
                    <img
                      src={doc.imageUrl}
                      alt={doc.nameEn}
                      className="w-20 h-20 rounded-full object-cover border-2 border-[#0057b8] bg-[#e8f0f9] shrink-0"
                    />
                    <div className="space-y-1">
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-[#0057b8]">
                        <Award className="w-3.5 h-3.5" />
                        BMDC: {doc.bmdcRegistrationNo}
                      </span>
                      <h3 className="text-xl font-bold text-[#080808]">
                        <Link
                          href={`/doctors/${doc.slug}`}
                          className="hover:text-[#0057b8] hover:underline"
                        >
                          {doc.nameEn}
                        </Link>
                      </h3>
                      <p className="text-sm text-[#004181] font-semibold">
                        {doc.nameBn} • {doc.designationEn}
                      </p>
                      <p className="text-sm text-[#4b5563]">
                        {doc.qualificationsEn}
                      </p>
                      {doc.workplaceEn && (
                        <p className="text-xs font-medium text-[#374151]">
                          {doc.workplaceEn}
                        </p>
                      )}
                      <p className="text-base font-bold text-[#080808] pt-1">
                        Consultation: ৳{doc.consultationFeeBdt.toLocaleString()} (Follow-up: ৳{doc.followupFeeBdt.toLocaleString()})
                      </p>
                    </div>
                  </div>
                  <Link
                    href={`/request-appointment?doctorId=${encodeURIComponent(doc.id)}`}
                    className="mc-btn-primary !py-2 !px-4 text-xs shrink-0"
                  >
                    Book
                  </Link>
                </div>
              ))}
            </div>
          </section>

          {/* Department Core Services & Common Conditions (Bilingual EN/BN) */}
          {(dept.servicesEn?.length || dept.commonConditionsEn?.length) && (
            <section className="grid grid-cols-1 md:grid-cols-2 gap-12">
              {dept.servicesEn && dept.servicesEn.length > 0 && (
                <div className="space-y-4">
                  <div className="pb-3 border-b-2 border-[#080808]">
                    <h2 className="mc-serif text-2xl sm:text-3xl text-[#080808]">
                      Specialized Services / বিশেষায়িত সেবাসমূহ
                    </h2>
                  </div>
                  <ul className="divide-y divide-[#e5e7eb]">
                    {dept.servicesEn.map((item, idx) => (
                      <li key={item} className="py-3.5 space-y-0.5">
                        <p className="font-bold text-base text-[#080808]">{item}</p>
                        {dept.servicesBn?.[idx] && (
                          <p className="text-sm text-[#004181]">{dept.servicesBn[idx]}</p>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {dept.commonConditionsEn && dept.commonConditionsEn.length > 0 && (
                <div className="space-y-4">
                  <div className="pb-3 border-b-2 border-[#080808]">
                    <h2 className="mc-serif text-2xl sm:text-3xl text-[#080808]">
                      Common Conditions Treated / সাধারণ রোগ ও চিকিৎসা
                    </h2>
                  </div>
                  <ul className="divide-y divide-[#e5e7eb]">
                    {dept.commonConditionsEn.map((item, idx) => (
                      <li key={item} className="py-3.5 space-y-0.5">
                        <p className="font-bold text-base text-[#080808]">{item}</p>
                        {dept.commonConditionsBn?.[idx] && (
                          <p className="text-sm text-[#004181]">{dept.commonConditionsBn[idx]}</p>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </section>
          )}

          {/* Published Diagnostic Services & Transparent Fees */}
          {services.length > 0 && (
            <section className="space-y-6">
              <div className="pb-4 border-b-2 border-[#080808]">
                <h2 className="mc-serif text-3xl sm:text-4xl text-[#080808]">
                  Approved Services &amp; Transparent Fee Schedule
                </h2>
              </div>
              <div className="divide-y divide-[#e5e7eb]">
                {services.map((srv) => (
                  <div
                    key={srv.id}
                    className="py-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-[#fbfbfb] px-2 transition-colors"
                  >
                    <div className="space-y-1">
                      <h3 className="font-bold text-lg text-[#080808]">
                        {srv.nameEn}{" "}
                        <span className="font-normal text-sm text-[#4b5563]">
                          ({srv.nameBn})
                        </span>
                      </h3>
                      <p className="text-base text-[#4b5563]">{srv.descriptionEn}</p>
                      {srv.preparationEn && (
                        <p className="text-sm text-[#004181]">
                          <strong>Preparation:</strong> {srv.preparationEn}
                        </p>
                      )}
                    </div>
                    <div className="sm:text-right shrink-0">
                      <span className="block text-xl font-bold text-[#004181]">
                        {srv.feeLabelEn}
                      </span>
                      <span className="text-xs font-semibold text-[#6b7280]">
                        Effective {srv.effectiveFrom}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Related Conditions & Procedures - Unboxed Editorial */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 pt-4">
            <div className="space-y-4">
              <div className="pb-3 border-b-2 border-[#080808]">
                <h2 className="font-bold text-xl text-[#080808] flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-[#0057b8]" />
                  <span>Conditions Treated in {dept.nameEn}</span>
                </h2>
              </div>
              {conditions.length === 0 ? (
                <p className="text-base text-[#6b7280]">
                  Browse our full A–Z condition directory for patient guides.
                </p>
              ) : (
                <ul className="divide-y divide-[#e5e7eb]">
                  {conditions.map((c) => (
                    <li key={c.id}>
                      <Link
                        href={`/diseases-conditions/${c.slug}`}
                        className="py-3.5 flex items-center justify-between text-base font-semibold text-[#004181] hover:text-[#0057b8]"
                      >
                        <span>
                          {c.nameEn} ({c.nameBn})
                        </span>
                        <ChevronRight className="w-4 h-4" />
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="space-y-4">
              <div className="pb-3 border-b-2 border-[#080808]">
                <h2 className="font-bold text-xl text-[#080808]">
                  Diagnostic Tests &amp; Procedures
                </h2>
              </div>
              {procedures.length === 0 ? (
                <p className="text-base text-[#6b7280]">
                  Explore all diagnostic preparation guides in Tests &amp; Procedures.
                </p>
              ) : (
                <ul className="divide-y divide-[#e5e7eb]">
                  {procedures.map((p) => (
                    <li key={p.id}>
                      <Link
                        href={`/tests-procedures/${p.slug}`}
                        className="py-3.5 flex items-center justify-between text-base font-semibold text-[#004181] hover:text-[#0057b8]"
                      >
                        <span>
                          {p.nameEn} ({p.nameBn})
                        </span>
                        <ChevronRight className="w-4 h-4" />
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
