import React from "react";
import Link from "next/link";
import { Globe, Calendar, PhoneCall, CheckCircle2 } from "lucide-react";

export default function InternationalPage() {
  return (
    <div className="bg-[#f2f2f2] min-h-screen py-12">
      <div className="mc-container space-y-10">
        <div className="bg-[#012d61] text-white rounded-3xl p-8 md:p-12 space-y-4">
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 text-xs font-bold uppercase tracking-wider text-[#c5e2f9]">
            <Globe className="w-4 h-4" />
            <span>International & Out-of-Town Patient Coordination</span>
          </span>
          <h1 className="mc-serif text-3xl md:text-5xl text-white">
            World-Class Care for Patients Across Bangladesh & Beyond
          </h1>
          <p className="text-lg text-[#c5e2f9]">
            সারা বাংলাদেশ ও প্রবাসী রোগীদের জন্য সমন্বিত বিশেষজ্ঞ স্বাস্থ্যসেবা
          </p>
          <p className="text-base text-[#e8f0f9] max-w-3xl leading-relaxed">
            DeltaCare coordinates multi-disciplinary specialist consultations,
            diagnostic scheduling, and bilingual (Bangla & English) visitor
            support for patients traveling from outside Dhaka or abroad.
          </p>
          <div className="pt-2 flex flex-wrap gap-3">
            <Link href="/appointments" className="mc-btn-secondary-inverse">
              <Calendar className="w-4 h-4" />
              <span>Request Appointment</span>
            </Link>
            <Link href="/contact" className="mc-btn-primary">
              <PhoneCall className="w-4 h-4" />
              <span>Request International Desk Callback</span>
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              title: "Coordinated Multi-Specialist Visits",
              titleBn: "সমন্বিত বিশেষজ্ঞ পরামর্শ",
              body: "We group your outpatient consultations and diagnostic procedures across our Dhanmondi, Gulshan, Uttara, Chattogram, and Sylhet campuses.",
            },
            {
              title: "Transparent Pre-Visit Fee Information",
              titleBn: "স্বচ্ছ ফি ও প্রাক্কলন",
              body: "Review verified consultation fees (BDT) and diagnostic charges before traveling, with zero hidden booking markups.",
            },
            {
              title: "Bilingual Patient Relations Desk",
              titleBn: "দ্বিভাষিক রোগী সহায়তা ডেস্ক",
              body: "Dedicated coordinators assist with appointment confirmations, medical report intake at the hospital desk, and family accommodation guidance.",
            },
          ].map((card) => (
            <div
              key={card.title}
              className="bg-white rounded-2xl border border-[#d6d6d6] p-6 space-y-2.5"
            >
              <CheckCircle2 className="w-6 h-6 text-[#0057b8]" />
              <h2 className="mc-serif text-xl text-[#080808]">{card.title}</h2>
              <p className="text-xs font-bold text-[#004181]">{card.titleBn}</p>
              <p className="text-sm text-[#424242] leading-relaxed">
                {card.body}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

