import React from "react";
import Link from "next/link";
import {
  MapPin,
  Phone,
  Clock,
  ChevronRight,
  Calendar,
  AlertTriangle,
} from "lucide-react";
import { getPublishedBranches } from "@/server/services/publicQueryService";

export const dynamic = "force-dynamic";

export default function LocationsPage() {
  const branches = getPublishedBranches();

  return (
    <div className="bg-[#f2f2f2] min-h-screen py-12">
      <div className="mc-container space-y-10">
        <div className="bg-[#012d61] text-white rounded-3xl p-8 md:p-12 space-y-3">
          <p className="text-xs font-bold uppercase tracking-widest text-[#c5e2f9]">
            Care at DeltaCare • Hospital Campuses & Branches
          </p>
          <h1 className="mc-serif text-3xl md:text-5xl text-white">
            Locations & Branches / শাখা ও অবস্থানসমূহ
          </h1>
          <p className="text-base text-[#e8f0f9] max-w-3xl">
            Explore DeltaCare&apos;s hospital campuses across Dhaka, Chattogram,
            and Sylhet, complete with 24/7 emergency contacts, OPD chamber
            hours, and specialist rosters.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {branches.map((branch) => (
            <article
              key={branch.id}
              className="bg-white rounded-2xl border border-[#d6d6d6] overflow-hidden shadow-sm hover:border-[#0057b8] transition-all flex flex-col justify-between"
            >
              <div>
                <div className="aspect-[16/9] relative overflow-hidden bg-[#012d61]">
                  <img
                    src={branch.imageUrl}
                    alt={branch.nameEn}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 mc-location-scrim" />
                  <div className="absolute bottom-4 left-5 right-5 text-white">
                    <span className="inline-block px-2.5 py-0.5 rounded bg-[#0057b8] text-xs font-bold mb-1">
                      {branch.cityEn} • {branch.cityBn}
                    </span>
                    <h2 className="mc-serif text-2xl text-white">
                      {branch.nameEn}
                    </h2>
                    <p className="text-sm text-[#e8f0f9]">{branch.nameBn}</p>
                  </div>
                </div>

                <div className="p-6 space-y-4">
                  <p className="text-sm font-semibold text-[#004181]">
                    {branch.subtitleEn} ({branch.subtitleBn})
                  </p>

                  <div className="space-y-2 text-sm text-[#424242]">
                    <p className="flex items-start gap-2">
                      <MapPin className="w-4 h-4 text-[#0057b8] shrink-0 mt-1" />
                      <span>
                        {branch.addressEn}
                        <br />
                        <span className="text-xs text-[#686868]">
                          {branch.addressBn}
                        </span>
                      </span>
                    </p>
                    <p className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-[#0057b8] shrink-0" />
                      <span>{branch.operatingHoursEn}</span>
                    </p>
                    <p className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-[#0057b8] shrink-0" />
                      <span>
                        Main Desk: <strong>{branch.phone}</strong> •{" "}
                        <span className="text-[#dc2626] font-bold">
                          Emergency: {branch.emergencyPhone}
                        </span>
                      </span>
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-bold uppercase text-[#686868] mb-1.5">
                      Key Campus Capabilities:
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {branch.servicesSummaryEn.map((cap) => (
                        <span
                          key={cap}
                          className="px-2.5 py-1 rounded-full bg-[#e8f0f9] text-[#004181] text-xs font-medium"
                        >
                          {cap}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="px-6 py-4 bg-[#f8fafc] border-t border-[#d6d6d6] flex flex-wrap items-center justify-between gap-3">
                <Link
                  href={`/locations/${branch.slug}`}
                  className="inline-flex items-center gap-1 text-sm font-bold text-[#004181] hover:text-[#0057b8] underline"
                >
                  <span>Campus Details & Specialists</span>
                  <ChevronRight className="w-4 h-4" />
                </Link>
                <Link
                  href={`/appointments?branchId=${encodeURIComponent(
                    branch.id
                  )}`}
                  className="mc-btn-primary !py-2 !px-4 text-xs"
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Book at this Branch</span>
                </Link>
              </div>
            </article>
          ))}
        </div>

        <div className="p-6 rounded-2xl bg-[#fef2f2] border border-[#dc2626] flex items-start gap-3 text-sm text-[#7f1d1d]">
          <AlertTriangle className="w-5 h-5 text-[#dc2626] shrink-0 mt-0.5" />
          <div>
            <strong>24/7 Emergency & Ambulance Dispatch:</strong> For acute
            chest pain, stroke symptoms, trauma, or respiratory distress, call{" "}
            <a href="tel:10678" className="font-bold underline">
              10678
            </a>{" "}
            (+880 9612-310678) immediately or proceed directly to the nearest
            DeltaCare Emergency Department.
          </div>
        </div>
      </div>
    </div>
  );
}

