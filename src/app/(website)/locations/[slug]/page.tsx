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
    <div className="bg-[#f2f2f2] min-h-screen py-12">
      <div className="mc-container space-y-10">
        <div>
          <Link
            href="/locations"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#004181] hover:text-[#0057b8] hover:underline"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>All Locations & Branches / সকল শাখা</span>
          </Link>
        </div>

        <div className="bg-white rounded-3xl border border-[#d6d6d6] overflow-hidden shadow-sm">
          <div className="grid grid-cols-1 lg:grid-cols-12">
            <div className="lg:col-span-5 min-h-[280px] relative bg-[#012d61]">
              <img
                src={branch.imageUrl}
                alt={branch.nameEn}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="lg:col-span-7 p-8 md:p-10 space-y-4">
              <span className="px-3 py-1 rounded-full bg-[#e8f0f9] text-[#004181] text-xs font-bold">
                {branch.cityEn} ({branch.cityBn})
              </span>
              <h1 className="mc-serif text-3xl md:text-4xl text-[#080808]">
                {branch.nameEn}
              </h1>
              <p className="text-lg font-semibold text-[#004181]">
                {branch.nameBn} — {branch.subtitleEn}
              </p>

              <div className="space-y-2 text-sm text-[#424242] pt-2">
                <p className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-[#0057b8] shrink-0 mt-1" />
                  <span>
                    {branch.addressEn} ({branch.addressBn})
                  </span>
                </p>
                <p className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-[#0057b8] shrink-0" />
                  <span>
                    {branch.operatingHoursEn} / {branch.operatingHoursBn}
                  </span>
                </p>
                <p className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-[#0057b8] shrink-0" />
                  <span>
                    Main Phone: <strong>{branch.phone}</strong> • Emergency:{" "}
                    <strong className="text-[#dc2626]">
                      {branch.emergencyPhone}
                    </strong>
                  </span>
                </p>
              </div>

              <div className="pt-2 flex flex-wrap gap-2">
                {branch.servicesSummaryEn.map((srv, idx) => (
                  <span
                    key={srv}
                    className="px-3 py-1 rounded-full bg-[#f2f2f2] text-[#080808] text-xs font-medium"
                  >
                    {srv}
                    {branch.servicesSummaryBn[idx]
                      ? ` (${branch.servicesSummaryBn[idx]})`
                      : ""}
                  </span>
                ))}
              </div>

              <div className="pt-4 flex flex-wrap gap-3">
                <Link
                  href={`/appointments?branchId=${encodeURIComponent(
                    branch.id
                  )}`}
                  className="mc-btn-primary"
                >
                  <Calendar className="w-4 h-4" />
                  <span>Request Appointment at {branch.nameEn}</span>
                </Link>
                <a
                  href={branch.directionsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mc-btn-secondary"
                >
                  <span>Directions & Map</span>
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Specialists with Active Chambers at this Branch */}
        <section className="space-y-4">
          <h2 className="mc-serif text-2xl md:text-3xl text-[#080808]">
            Verified Consultants Practicing at {branch.nameEn} ({doctors.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {doctors.map((doc) => {
              const assign = doc.branches.find((b) => b.branchId === branch.id);
              const rule = assign?.scheduleRules[0];
              return (
                <div
                  key={doc.id}
                  className="bg-white rounded-2xl border border-[#d6d6d6] p-6 flex items-start justify-between gap-4"
                >
                  <div className="flex items-start gap-4">
                    <img
                      src={doc.imageUrl}
                      alt={doc.nameEn}
                      className="w-16 h-16 rounded-full object-cover border border-[#0057b8]"
                    />
                    <div className="space-y-1">
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-[#004181]">
                        <Award className="w-3.5 h-3.5 text-[#0057b8]" />
                        BMDC {doc.bmdcRegistrationNo} • {assign?.roomNumber}
                      </span>
                      <h3 className="font-bold text-base text-[#080808]">
                        <Link
                          href={`/doctors/${doc.slug}`}
                          className="hover:text-[#0057b8] hover:underline"
                        >
                          {doc.nameEn}
                        </Link>
                      </h3>
                      <p className="text-xs text-[#686868]">
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
                    href={`/appointments?doctorId=${encodeURIComponent(
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
          <section className="space-y-4">
            <h2 className="mc-serif text-2xl text-[#080808]">
              Clinical Departments anchored at this Campus
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {departments.map((d) => (
                <Link
                  key={d.id}
                  href={`/departments/${d.slug}`}
                  className="p-4 rounded-xl bg-white border border-[#d6d6d6] hover:border-[#0057b8] font-semibold text-sm text-[#004181]"
                >
                  {d.nameEn} ({d.nameBn})
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

