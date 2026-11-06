import React from "react";
import Link from "next/link";
import {
  MapPin,
  Phone,
  Clock,
  ArrowRight,
  Calendar,
  AlertTriangle,
} from "lucide-react";
import { getPublishedBranches } from "@/server/services/publicQueryService";

export const dynamic = "force-dynamic";

export default function LocationsPage() {
  const branches = getPublishedBranches();

  return (
    <div className="min-h-screen bg-white">
      {/* Full-bleed Stretched Blue Hero Header */}
      <div className="w-full bg-[#012d61] text-white py-14 md:py-20 border-b border-[#001f44]">
        <div className="mc-container max-w-7xl mx-auto px-6 sm:px-10 lg:px-12 space-y-4">
          <p className="text-xs sm:text-sm font-bold uppercase tracking-widest text-[#93c5fd]">
            Care at DeltaCare • Hospital Campuses &amp; Branches
          </p>
          <h1 className="mc-serif text-3xl sm:text-5xl lg:text-[54px] font-bold text-white tracking-tight leading-tight">
            Locations &amp; Branches
          </h1>
          <p className="text-xl text-[#c5e2f9] font-medium">
            শাখা ও অবস্থানসমূহ
          </p>
          <p className="text-base sm:text-lg text-[#e8f0f9] max-w-3xl leading-relaxed">
            Explore DeltaCare&apos;s hospital campuses across Dhaka, Chattogram,
            and Sylhet, complete with 24/7 emergency contacts, OPD chamber
            hours, and specialist rosters.
          </p>
        </div>
      </div>

      {/* Main Body - Unboxed 4:3 Editorial Composition */}
      <div className="w-full py-12 md:py-16">
        <div className="mc-container max-w-7xl mx-auto px-6 sm:px-10 lg:px-12 space-y-16">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-10">
            {branches.map((branch) => (
              <div key={branch.id} className="group flex flex-col space-y-4">
                {/* 4:3 Uncurved Photo - No text inside picture */}
                <Link
                  href={`/locations/${branch.slug}`}
                  className="block aspect-[4/3] w-full overflow-hidden bg-slate-100"
                >
                  <img
                    src={branch.imageUrl}
                    alt={branch.nameEn}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                </Link>

                {/* Branch Name & Location Below Picture */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#0057b8]">
                    <span>{branch.cityEn}</span>
                    <span>•</span>
                    <span>{branch.cityBn}</span>
                  </div>

                  <h2 className="mc-serif text-2xl text-[#080808] group-hover:text-[#0057b8] transition-colors">
                    <Link href={`/locations/${branch.slug}`}>
                      {branch.nameEn}
                    </Link>
                  </h2>

                  <p className="text-sm font-semibold text-[#004181]">
                    {branch.subtitleEn}
                  </p>

                  <div className="space-y-1 text-sm text-[#4b5563] pt-1">
                    <p className="flex items-start gap-2">
                      <MapPin className="w-4 h-4 text-[#0057b8] shrink-0 mt-0.5" />
                      <span>{branch.addressEn}</span>
                    </p>
                    <p className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-[#0057b8] shrink-0" />
                      <span>
                        Main: {branch.phone} •{" "}
                        <span className="text-[#dc2626] font-bold">
                          ER: {branch.emergencyPhone}
                        </span>
                      </span>
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-4 pt-3 text-sm">
                    <Link
                      href={`/locations/${branch.slug}`}
                      className="font-bold text-[#0057b8] hover:underline inline-flex items-center gap-1"
                    >
                      <span>Campus Details</span>
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                    <Link
                      href={`/request-appointment?branchId=${encodeURIComponent(branch.id)}`}
                      className="font-semibold text-[#4b5563] hover:text-[#080808] hover:underline inline-flex items-center gap-1"
                    >
                      <Calendar className="w-3.5 h-3.5" />
                      <span>Book OPD</span>
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Emergency Alert Strip - Unboxed Clean Editorial */}
          <div className="p-6 border-l-4 border-[#dc2626] bg-[#fef2f2] text-sm text-[#7f1d1d] flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-[#dc2626] shrink-0 mt-0.5" />
            <div>
              <strong className="font-bold">24/7 Emergency &amp; Ambulance Dispatch:</strong>{" "}
              For acute chest pain, stroke symptoms, trauma, or respiratory distress, call{" "}
              <a href="tel:10678" className="font-bold underline text-[#dc2626]">
                10678
              </a>{" "}
              (+880 9612-310678) immediately or proceed directly to the nearest DeltaCare Emergency Department.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
