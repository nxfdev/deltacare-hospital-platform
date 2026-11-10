import React from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { getPublishedDepartments, getPublishedDoctors } from "@/server/services/publicQueryService";
import { getServerLocale } from "@/lib/i18n/server";
import { Reveal } from "@/components/ui/Reveal";
import { toBnDigits } from "@/lib/i18n/digits";

export const dynamic = "force-dynamic";

export default async function DepartmentsPage() {
  const locale = await getServerLocale();
  const bn = locale === "bn";
  const departments = getPublishedDepartments();
  const doctors = getPublishedDoctors();

  return (
    <div className="bg-white">
      <section className="w-full bg-[#012d61] text-white">
        <div className="mc-container max-w-7xl mx-auto px-6 sm:px-10 lg:px-12 py-16 md:py-24">
          <h1 className="mc-serif text-4xl sm:text-5xl lg:text-6xl font-normal tracking-tight">
            {bn ? "বিভাগ ও বিশেষায়িত সেবা" : "Departments & specialties"}
          </h1>
          <p className="mt-5 max-w-2xl text-lg text-white/80">
            {bn
              ? "অভিজ্ঞ বিশেষজ্ঞ, আধুনিক যন্ত্রপাতি ও সমন্বিত চিকিৎসা — এক ছাদের নিচে।"
              : "Experienced specialists, modern equipment and coordinated care — under one roof."}
          </p>
        </div>
      </section>

      <div className="mc-container max-w-7xl mx-auto px-6 sm:px-10 lg:px-12 py-20">
        <div className="grid gap-x-16 gap-y-2 md:grid-cols-2">
          {departments.map((dept, i) => {
            const count = doctors.filter((d) => d.departmentId === dept.id).length;
            return (
              <Reveal key={dept.id} delay={(i % 2) * 0.06}>
                <Link
                  href={`/departments/${dept.slug}`}
                  className="group flex items-start justify-between gap-6 py-8 border-b border-[#eef0f3]"
                >
                  <div>
                    <h2 className="mc-serif text-2xl md:text-3xl text-[#0b1b33] group-hover:text-[#0057b8] transition-colors">
                      {bn ? dept.nameBn : dept.nameEn}
                    </h2>
                    <p className="mt-2 text-[#4b5563] leading-relaxed">
                      {bn ? dept.shortDescriptionBn : dept.shortDescriptionEn}
                    </p>
                    {count > 0 && (
                      <p className="mt-3 text-sm text-[#6b7280]">
                        {bn ? `${toBnDigits(count)} জন বিশেষজ্ঞ` : `${count} specialist${count > 1 ? "s" : ""}`}
                      </p>
                    )}
                  </div>
                  <ArrowRight className="mt-2 w-5 h-5 shrink-0 text-[#9ca3af] transition-all group-hover:text-[#0057b8] group-hover:translate-x-1" />
                </Link>
              </Reveal>
            );
          })}
        </div>
      </div>
    </div>
  );
}
