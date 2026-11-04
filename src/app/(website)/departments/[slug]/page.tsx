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
    <div className="bg-[#f2f2f2] min-h-screen py-12">
      <div className="mc-container space-y-10">
        <div>
          <Link
            href="/departments"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#004181] hover:text-[#0057b8] hover:underline"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>All Clinical Departments / সকল ক্লিনিক্যাল বিভাগ</span>
          </Link>
        </div>

        <div className="bg-[#012d61] text-white rounded-3xl p-8 md:p-12 space-y-4">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 text-xs font-bold uppercase tracking-wider text-[#c5e2f9]">
            <Stethoscope className="w-3.5 h-3.5" />
            <span>DeltaCare Clinical Department</span>
          </span>
          <h1 className="mc-serif text-3xl md:text-5xl text-white">
            {dept.nameEn}
          </h1>
          <p className="text-xl text-[#c5e2f9] font-medium">{dept.nameBn}</p>
          <p className="text-base text-[#e8f0f9] max-w-3xl leading-relaxed">
            {dept.overviewEn}
          </p>
          <p className="text-sm text-[#c5e2f9] max-w-3xl leading-relaxed">
            {dept.overviewBn}
          </p>
          <div className="pt-2">
            <Link
              href={`/appointments?departmentId=${encodeURIComponent(dept.id)}`}
              className="mc-btn-secondary-inverse"
            >
              <Calendar className="w-4 h-4" />
              <span>Request Appointment in {dept.nameEn}</span>
            </Link>
          </div>
        </div>

        {/* Department Specialists */}
        <section className="space-y-5">
          <h2 className="mc-serif text-2xl md:text-3xl text-[#080808]">
            Verified Department Specialists ({doctors.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {doctors.map((doc) => (
              <div
                key={doc.id}
                className="bg-white rounded-2xl border border-[#d6d6d6] p-6 flex items-start gap-4 justify-between"
              >
                <div className="flex items-start gap-4">
                  <img
                    src={doc.imageUrl}
                    alt={doc.nameEn}
                    className="w-20 h-20 rounded-full object-cover border-2 border-[#0057b8] bg-[#e8f0f9]"
                  />
                  <div className="space-y-1">
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-[#004181]">
                      <Award className="w-3.5 h-3.5 text-[#0057b8]" />
                      BMDC: {doc.bmdcRegistrationNo}
                    </span>
                    <h3 className="text-lg font-bold text-[#080808]">
                      <Link
                        href={`/doctors/${doc.slug}`}
                        className="hover:text-[#0057b8] hover:underline"
                      >
                        {doc.nameEn}
                      </Link>
                    </h3>
                    <p className="text-xs text-[#004181] font-semibold">
                      {doc.nameBn} • {doc.designationEn}
                    </p>
                    <p className="text-xs text-[#686868]">
                      {doc.qualificationsEn}
                    </p>
                    <p className="text-sm font-bold text-[#080808] pt-1">
                      Consultation Fee: BDT {doc.consultationFeeBdt}
                    </p>
                  </div>
                </div>
                <Link
                  href={`/appointments?doctorId=${encodeURIComponent(doc.id)}`}
                  className="mc-btn-primary !py-2 !px-4 text-xs shrink-0"
                >
                  Book
                </Link>
              </div>
            ))}
          </div>
        </section>

        {/* Published Diagnostic Services & Transparent Fees */}
        {services.length > 0 && (
          <section className="bg-white rounded-2xl border border-[#d6d6d6] p-6 md:p-8 space-y-4">
            <h2 className="mc-serif text-2xl text-[#080808]">
              Approved Services & Transparent Fee Schedule
            </h2>
            <div className="divide-y divide-[#d6d6d6]">
              {services.map((srv) => (
                <div
                  key={srv.id}
                  className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <h3 className="font-bold text-base text-[#080808]">
                      {srv.nameEn} ({srv.nameBn})
                    </h3>
                    <p className="text-sm text-[#424242]">{srv.descriptionEn}</p>
                    {srv.preparationEn && (
                      <p className="text-xs text-[#004181]">
                        <strong>Preparation:</strong> {srv.preparationEn}
                      </p>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <span className="block text-lg font-bold text-[#004181]">
                      {srv.feeLabelEn}
                    </span>
                    <span className="text-xs text-[#686868]">
                      Effective {srv.effectiveFrom}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Related Conditions & Procedures */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl border border-[#d6d6d6] p-6 space-y-3">
            <h2 className="font-bold text-lg text-[#080808] flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-[#0057b8]" />
              <span>Conditions Treated in {dept.nameEn}</span>
            </h2>
            {conditions.length === 0 ? (
              <p className="text-sm text-[#686868]">
                Browse our full A–Z condition directory for patient guides.
              </p>
            ) : (
              <ul className="divide-y divide-[#d6d6d6]">
                {conditions.map((c) => (
                  <li key={c.id}>
                    <Link
                      href={`/diseases-conditions/${c.slug}`}
                      className="py-3 flex items-center justify-between text-sm font-semibold text-[#004181] hover:text-[#0057b8]"
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

          <div className="bg-white rounded-2xl border border-[#d6d6d6] p-6 space-y-3">
            <h2 className="font-bold text-lg text-[#080808]">
              Diagnostic Tests & Procedures
            </h2>
            {procedures.length === 0 ? (
              <p className="text-sm text-[#686868]">
                Explore all diagnostic preparation guides in Tests & Procedures.
              </p>
            ) : (
              <ul className="divide-y divide-[#d6d6d6]">
                {procedures.map((p) => (
                  <li key={p.id}>
                    <Link
                      href={`/tests-procedures/${p.slug}`}
                      className="py-3 flex items-center justify-between text-sm font-semibold text-[#004181] hover:text-[#0057b8]"
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
  );
}

