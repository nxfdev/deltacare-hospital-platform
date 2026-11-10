import React from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { getHospitalConfig, getPublishedServices } from "@/server/services/publicQueryService";
import { getServerLocale } from "@/lib/i18n/server";
import { Reveal } from "@/components/ui/Reveal";

export const dynamic = "force-dynamic";

export default async function PatientServicesPage() {
  const bn = (await getServerLocale()) === "bn";
  const h = getHospitalConfig();
  const services = getPublishedServices();

  const pillars = bn
    ? [
        { t: "অনলাইনে তাৎক্ষণিক অ্যাপয়েন্টমেন্ট", b: "ক্যালেন্ডার থেকে তারিখ ও সময় বেছে নিন — সঙ্গে সঙ্গে নিশ্চিতকরণ এসএমএস পাবেন।" },
        { t: "স্বচ্ছ ফি", b: "প্রতিটি কনসালটেশন ও পরীক্ষার ফি আগে থেকেই টাকায় প্রকাশিত — কোনো লুকানো চার্জ নেই।" },
        { t: "২৪/৭ হেল্পলাইন", b: `যেকোনো প্রয়োজনে ${h.helplinePhone} নম্বরে কল করুন অথবা অনলাইনে কলব্যাকের অনুরোধ করুন।` },
      ]
    : [
        { t: "Instant online booking", b: "Pick a date and time on the calendar — you'll get a confirmation SMS straight away." },
        { t: "Transparent fees", b: "Every consultation and test fee is published in Taka up front — no hidden charges." },
        { t: "24/7 helpline", b: `Call ${h.helplinePhone} any time, or request a callback online.` },
      ];

  return (
    <div className="bg-white">
      <section className="w-full bg-[#012d61] text-white">
        <div className="mc-container max-w-7xl mx-auto px-6 sm:px-10 lg:px-12 py-16 md:py-24">
          <h1 className="mc-serif text-4xl sm:text-5xl lg:text-6xl font-normal tracking-tight">
            {bn ? "রোগী ও দর্শনার্থী সেবা" : "Patient & visitor services"}
          </h1>
          <p className="mt-5 max-w-2xl text-lg text-white/80">
            {bn
              ? "অ্যাপয়েন্টমেন্ট, ফি ও হাসপাতালে আসার আগে প্রয়োজনীয় সব তথ্য।"
              : "Everything you need to know about appointments, fees and your visit."}
          </p>
        </div>
      </section>

      <div className="mc-container max-w-7xl mx-auto px-6 sm:px-10 lg:px-12 py-20 space-y-24">
        <div className="grid gap-12 md:grid-cols-3">
          {pillars.map((p, i) => (
            <Reveal key={p.t} delay={i * 0.06}>
              <h2 className="mc-serif text-2xl text-[#0b1b33]">{p.t}</h2>
              <p className="mt-3 text-lg leading-relaxed text-[#4b5563]">{p.b}</p>
            </Reveal>
          ))}
        </div>

        {services.length > 0 && (
          <section>
            <Reveal className="flex flex-wrap items-end justify-between gap-6">
              <h2 className="mc-serif text-3xl sm:text-4xl text-[#0b1b33]">{bn ? "সেবা ও ফি" : "Services & fees"}</h2>
              <Link href="/appointments" className="inline-flex items-center gap-2 text-[#0057b8] font-medium hover:underline">
                {bn ? "অ্যাপয়েন্টমেন্ট নিন" : "Book an appointment"} <ArrowRight className="w-4 h-4" />
              </Link>
            </Reveal>
            <ul className="mt-8 divide-y divide-[#eef0f3]">
              {services.map((s) => (
                <li key={s.id} className="py-5 flex items-start justify-between gap-6">
                  <div>
                    <p className="text-lg text-[#0b1b33]">{bn ? s.nameBn : s.nameEn}</p>
                    <p className="mt-1 text-[#6b7280]">{bn ? s.descriptionBn : s.descriptionEn}</p>
                  </div>
                  <span className="shrink-0 text-lg font-semibold text-[#0b1b33]">{bn ? s.feeLabelBn : s.feeLabelEn}</span>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </div>
  );
}
