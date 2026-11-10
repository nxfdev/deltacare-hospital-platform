import React, { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowDown } from "lucide-react";
import {
  getPublishedBranches,
  getPublishedDepartments,
  getPublishedDoctorBySlug,
  getPublishedDoctors,
} from "@/server/services/publicQueryService";
import { PublicThreeStepBookingClient } from "@/components/appointments/PublicThreeStepBookingClient";
import { getServerLocale } from "@/lib/i18n/server";
import { Reveal } from "@/components/ui/Reveal";
import { toBnDigits } from "@/lib/i18n/digits";

export const dynamic = "force-dynamic";

const WEEKDAYS_EN = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const WEEKDAYS_BN = ["রবিবার", "সোমবার", "মঙ্গলবার", "বুধবার", "বৃহস্পতিবার", "শুক্রবার", "শনিবার"];

function timeLabel(t: string, bn: boolean): string {
  const [h, m] = t.split(":").map(Number);
  if (bn) {
    const period = h >= 18 ? "রাত" : h >= 15 ? "বিকাল" : h >= 12 ? "দুপুর" : "সকাল";
    return `${period} ${toBnDigits(`${h % 12 || 12}:${String(m).padStart(2, "0")}`)}`;
  }
  return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${h >= 12 ? "PM" : "AM"}`;
}

export default async function DoctorDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const doctor = getPublishedDoctorBySlug(slug);
  if (!doctor) notFound();

  const locale = await getServerLocale();
  const bn = locale === "bn";
  const L = (en?: string, b?: string) => (bn ? b || en : en) || "";
  const n = (v: number) => (bn ? toBnDigits(v.toLocaleString("en-IN")) : v.toLocaleString("en-IN"));

  const departments = getPublishedDepartments();
  const branches = getPublishedBranches();
  const allDoctors = getPublishedDoctors();
  const department = departments.find((d) => d.id === doctor.departmentId);
  const interests = bn ? doctor.clinicalInterestsBn : doctor.clinicalInterestsEn;

  return (
    <div className="bg-white">
      <section className="w-full bg-[#012d61] text-white">
        <div className="mc-container max-w-7xl mx-auto px-6 sm:px-10 lg:px-12 py-14 md:py-20">
          <Link
            href="/doctors"
            className="inline-flex items-center gap-1.5 text-sm text-white/70 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            {bn ? "সকল ডাক্তার" : "All doctors"}
          </Link>
          <div className="mt-8 flex flex-col md:flex-row md:items-center gap-8 md:gap-12">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={doctor.imageUrl}
              alt={L(doctor.nameEn, doctor.nameBn)}
              className="w-40 h-40 md:w-48 md:h-48 rounded-full object-cover object-top bg-white/10"
            />
            <div>
              {department && (
                <Link
                  href={`/departments/${department.slug}`}
                  className="text-sm text-white/70 hover:text-white transition-colors"
                >
                  {L(department.nameEn, department.nameBn)}
                </Link>
              )}
              <h1 className="mc-serif mt-2 text-4xl sm:text-5xl font-normal tracking-tight">
                {L(doctor.nameEn, doctor.nameBn)}
              </h1>
              <p className="mt-3 text-lg text-white/80">{L(doctor.designationEn, doctor.designationBn)}</p>
              <p className="mt-1 text-white/60">{L(doctor.qualificationsEn, doctor.qualificationsBn)}</p>
              <a
                href="#book-appointment"
                className="mc-btn-primary mt-7 inline-flex items-center gap-2 !py-3 !px-6"
              >
                {bn ? "অ্যাপয়েন্টমেন্ট নিন" : "Book an appointment"}
                <ArrowDown className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>
      </section>

      <div className="mc-container max-w-7xl mx-auto px-6 sm:px-10 lg:px-12 py-20 space-y-24">
        <section className="grid gap-16 lg:grid-cols-[1.5fr_1fr]">
          <Reveal>
            <h2 className="mc-serif text-3xl text-[#0b1b33]">{bn ? "পরিচিতি" : "About"}</h2>
            <p className="mt-5 text-lg leading-relaxed text-[#374151]">{L(doctor.bioEn, doctor.bioBn)}</p>
            {interests.length > 0 && (
              <>
                <h3 className="mt-10 text-lg font-semibold text-[#0b1b33]">
                  {bn ? "বিশেষ আগ্রহের ক্ষেত্র" : "Areas of focus"}
                </h3>
                <ul className="mt-3 grid sm:grid-cols-2 gap-x-8">
                  {interests.map((it) => (
                    <li key={it} className="py-2.5 border-b border-[#eef0f3] text-[#374151]">
                      {it}
                    </li>
                  ))}
                </ul>
              </>
            )}
          </Reveal>

          <Reveal delay={0.08} className="space-y-10">
            <div>
              <p className="text-sm text-[#6b7280]">{bn ? "কনসালটেশন ফি" : "Consultation fee"}</p>
              <p className="mt-1 text-3xl font-semibold text-[#0b1b33]">৳{n(doctor.consultationFeeBdt)}</p>
              <p className="mt-1 text-sm text-[#6b7280]">
                {bn ? "ফলো-আপ" : "Follow-up"} ৳{n(doctor.followupFeeBdt)}
              </p>
            </div>
            <div>
              <p className="text-sm text-[#6b7280]">{bn ? "চেম্বারের সময়" : "Chamber hours"}</p>
              <div className="mt-3 space-y-5">
                {doctor.branches.map((a) => {
                  const br = branches.find((b) => b.id === a.branchId);
                  return (
                    <div key={a.id}>
                      <p className="font-semibold text-[#0b1b33]">
                        {L(br?.nameEn, br?.nameBn)} · {bn ? "কক্ষ" : "Room"} {bn ? toBnDigits(a.roomNumber) : a.roomNumber}
                      </p>
                      <ul className="mt-1.5 space-y-1 text-[#4b5563]">
                        {a.scheduleRules.map((r) => (
                          <li key={r.id} className="flex justify-between gap-4">
                            <span>{(bn ? WEEKDAYS_BN : WEEKDAYS_EN)[r.weekday]}</span>
                            <span>
                              {timeLabel(r.startTime, bn)} – {timeLabel(r.endTime, bn)}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  );
                })}
              </div>
            </div>
            <div>
              <p className="text-sm text-[#6b7280]">{bn ? "ভাষা" : "Languages"}</p>
              <p className="mt-1 text-[#0b1b33]">{(bn ? doctor.languagesBn : doctor.languagesEn).join(", ")}</p>
            </div>
          </Reveal>
        </section>

        <section id="book-appointment" className="scroll-mt-24">
          <Reveal>
            <h2 className="mc-serif text-3xl sm:text-4xl text-[#0b1b33] mb-12">
              {bn ? "অ্যাপয়েন্টমেন্ট নিন" : "Book an appointment"}
            </h2>
          </Reveal>
          <Suspense fallback={null}>
            <PublicThreeStepBookingClient
              embedded
              branches={branches}
              departments={departments}
              doctors={allDoctors}
              preselectedDoctorId={doctor.id}
              preselectedDepartmentId={doctor.departmentId}
              preselectedBranchId={doctor.branches[0]?.branchId}
            />
          </Suspense>
        </section>
      </div>
    </div>
  );
}
