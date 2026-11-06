import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  Phone,
  Award,
  ExternalLink,
} from "lucide-react";
import {
  getPublishedBranchBySlug,
  getPublishedDepartments,
  getPublishedDoctors,
} from "@/server/services/publicQueryService";

export const dynamic = "force-dynamic";

export default async function LocationDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const branch = getPublishedBranchBySlug(slug);
  if (!branch) {
    notFound();
  }

  const doctors = getPublishedDoctors({ branchId: branch.id });
  const departments = getPublishedDepartments(branch.id);

  return (
    <div className="min-h-screen bg-white">
      {/* Full-bleed Stretched Dark Blue Hero Header */}
      <div className="w-full bg-[#012d61] text-white py-14 md:py-20 border-b border-[#001f44]">
        <div className="mc-container max-w-7xl mx-auto px-6 sm:px-10 lg:px-12 space-y-4">
          <Link
            href="/locations"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#93c5fd] hover:underline mb-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>All Locations &amp; Branches / সকল শাখা</span>
          </Link>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#93c5fd]">
            <span>{branch.cityEn}</span>
            <span>•</span>
            <span>{branch.cityBn}</span>
          </div>
          <h1 className="mc-serif text-3xl sm:text-5xl lg:text-[54px] font-bold text-white tracking-tight leading-tight">
            {branch.nameEn}
          </h1>
          <p className="text-xl text-[#c5e2f9] font-medium">
            {branch.nameBn} — {branch.subtitleEn}
          </p>
          <div className="pt-2 flex flex-wrap gap-4">
            <Link
              href={`/request-appointment?branchId=${encodeURIComponent(branch.id)}`}
              className="mc-btn-primary inline-flex items-center gap-2 text-sm !py-2.5 !px-5"
            >
              <Calendar className="w-4 h-4" />
              <span>Request Appointment at {branch.nameEn}</span>
            </Link>
            <a
              href={branch.directionsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mc-btn-secondary-inverse text-sm !py-2.5 !px-5 inline-flex items-center gap-2"
            >
              <span>Directions &amp; Map</span>
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </div>
      </div>

      {/* Main Body - Unboxed Editorial */}
      <div className="w-full py-12 md:py-16">
        <div className="mc-container max-w-7xl mx-auto px-6 sm:px-10 lg:px-12 space-y-16">
          {/* Campus Overview: 4:3 Uncurved Photo + Details */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 pb-12 border-b border-[#e5e7eb] items-start">
            <div className="lg:col-span-5 aspect-[4/3] w-full overflow-hidden bg-slate-100">
              <img
                src={branch.imageUrl}
                alt={branch.nameEn}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="lg:col-span-7 space-y-4">
              <h2 className="mc-serif text-2xl md:text-3xl text-[#080808]">
                Campus Operations &amp; Contacts
              </h2>
              <div className="space-y-3 text-base text-[#374151] pt-2">
                <p className="flex items-start gap-2.5">
                  <MapPin className="w-5 h-5 text-[#0057b8] shrink-0 mt-0.5" />
                  <span>
                    {branch.addressEn} ({branch.addressBn})
                  </span>
                </p>
                <p className="flex items-center gap-2.5">
                  <Clock className="w-5 h-5 text-[#0057b8] shrink-0" />
                  <span>
                    {branch.operatingHoursEn} / {branch.operatingHoursBn}
                  </span>
                </p>
                <p className="flex items-center gap-2.5">
                  <Phone className="w-5 h-5 text-[#0057b8] shrink-0" />
                  <span>
                    Main Phone: <strong>{branch.phone}</strong> • Emergency:{" "}
                    <strong className="text-[#dc2626]">
                      {branch.emergencyPhone}
                    </strong>
                  </span>
                </p>
              </div>

              <div className="pt-3">
                <p className="text-xs font-bold uppercase tracking-wider text-[#6b7280] mb-2">
                  Campus Capabilities:
                </p>
                <div className="flex flex-wrap gap-2">
                  {branch.servicesSummaryEn.map((srv, idx) => (
                    <span
                      key={srv}
                      className="px-3 py-1 bg-[#f3f4f6] text-[#374151] text-xs font-medium"
                    >
                      {srv}
                      {branch.servicesSummaryBn[idx]
                        ? ` (${branch.servicesSummaryBn[idx]})`
                        : ""}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Specialists with Active Chambers at this Branch */}
          <section className="space-y-6">
            <div className="pb-4 border-b-2 border-[#080808]">
              <h2 className="mc-serif text-3xl text-[#080808]">
                Verified Consultants Practicing at {branch.nameEn} ({doctors.length})
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {doctors.map((doc) => {
                const assign = doc.branches.find((b) => b.branchId === branch.id);
                const rule = assign?.scheduleRules[0];
                return (
                  <div
                    key={doc.id}
                    className="pb-6 border-b border-[#e5e7eb] flex items-start justify-between gap-4"
                  >
                    <div className="flex items-start gap-4">
                      <img
                        src={doc.imageUrl}
                        alt={doc.nameEn}
                        className="w-16 h-16 rounded-full object-cover border border-[#0057b8] shrink-0"
                      />
                      <div className="space-y-1">
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-[#004181]">
                          <Award className="w-3.5 h-3.5 text-[#0057b8]" />
                          BMDC {doc.bmdcRegistrationNo} • {assign?.roomNumber}
                        </span>
                        <h3 className="font-bold text-lg text-[#080808]">
                          <Link
                            href={`/doctors/${doc.slug}`}
                            className="hover:text-[#0057b8] hover:underline"
                          >
                            {doc.nameEn}
                          </Link>
                        </h3>
                        <p className="text-xs text-[#6b7280]">
                          {doc.designationEn}
                        </p>
                        {rule && (
                          <p className="text-xs text-[#004181] font-medium">
                            {rule.weekdayLabelEn}: {rule.startTime}–{rule.endTime}
                          </p>
                        )}
                        <p className="text-xs font-bold text-[#080808]">
                          Fee: BDT {doc.consultationFeeBdt}
                        </p>
                      </div>
                    </div>
                    <Link
                      href={`/request-appointment?doctorId=${encodeURIComponent(
                        doc.id
                      )}&branchId=${encodeURIComponent(branch.id)}`}
                      className="mc-btn-primary !py-2 !px-4 text-xs shrink-0"
                    >
                      Book
                    </Link>
                  </div>
                );
              })}
            </div>
          </section>

          {departments.length > 0 && (
            <section className="space-y-6">
              <div className="pb-4 border-b-2 border-[#080808]">
                <h2 className="mc-serif text-3xl text-[#080808]">
                  Clinical Departments anchored at this Campus
                </h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {departments.map((d) => (
                  <Link
                    key={d.id}
                    href={`/departments/${d.slug}`}
                    className="py-3 px-4 border border-[#e5e7eb] hover:border-[#0057b8] font-semibold text-base text-[#004181] hover:text-[#0057b8] transition-colors"
                  >
                    {d.nameEn} ({d.nameBn})
                  </Link>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
