"use client";

import React from "react";
import Link from "next/link";
import {
  Stethoscope,
  Briefcase,
  MessageSquare,
  ChevronRight,
  Globe,
  PhoneCall,
} from "lucide-react";
import { useLocale } from "@/lib/i18n/LocaleContext";

export function SiteFooter() {
  const { locale, setLocale, t } = useLocale();

  const leftActionBoxes = [
    {
      icon: Stethoscope,
      label: t.footer.findDoctor,
      href: "/doctors",
    },
    {
      icon: Briefcase,
      label: t.footer.exploreCareers,
      href: "/about#careers",
    },
    {
      icon: MessageSquare,
      label: t.footer.contactCallback,
      href: "/contact",
    },
  ];

  return (
    <footer className="bg-[#012d61] text-white border-t border-white/20">
      {/* Main Footer Grid (Mirrors inspo.html .cmp-footer__top) */}
      <div className="mc-container py-14">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Column 1: 3 Rectangular Outlined Action Buttons + Logo */}
          <div className="lg:col-span-4 space-y-4">
            <div className="mb-5">
              <img
                src="/images/deltacare-logo-inverse.svg"
                alt="DeltaCare Hospital Platform"
                className="h-11 w-auto"
              />
            </div>

            {leftActionBoxes.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="group flex items-center justify-between px-5 py-4 rounded-xl border border-white/50 bg-white/5 hover:bg-white/15 transition-colors"
                >
                  <div className="flex items-center gap-3.5">
                    <Icon
                      className="w-5 h-5 text-[#c5e2f9]"
                      aria-hidden="true"
                    />
                    <span className="font-medium text-[15px] text-white">
                      {item.label}
                    </span>
                  </div>
                  <ChevronRight
                    className="w-5 h-5 text-white/80 group-hover:translate-x-1 transition-transform"
                    aria-hidden="true"
                  />
                </Link>
              );
            })}

            <div className="pt-2 text-sm text-[#e8f0f9] flex items-center gap-2">
              <PhoneCall className="w-4 h-4 text-[#c5e2f9]" aria-hidden="true" />
              <span>
                {locale === "bn"
                  ? "২৪/৭ জরুরি ও হেল্পলাইন: ১০৬৭৮ (+880 9612-310678)"
                  : "24/7 Emergency & Helpline: 10678 (+880 9612-310678)"}
              </span>
            </div>
          </div>

          {/* Column 2: Medical Professionals / Departments & Clinical Governance */}
          <div className="lg:col-span-3 space-y-6">
            <div>
              <Link
                href="/departments"
                className="inline-flex items-center gap-1.5 font-semibold text-base text-white hover:underline mb-3"
              >
                <span>{t.footer.medicalProfHeading}</span>
                <ChevronRight className="w-4 h-4" />
              </Link>
              <ul className="space-y-2.5 text-sm text-[#e8f0f9]">
                <li>
                  <Link href="/departments/cardiology-vascular" className="hover:underline">
                    {locale === "bn"
                      ? "কার্ডিওলজি ও ভাস্কুলার মেডিসিন"
                      : "Cardiology & Vascular Medicine"}
                  </Link>
                </li>
                <li>
                  <Link href="/departments/neurology-stroke" className="hover:underline">
                    {locale === "bn"
                      ? "নিউরোলজি ও স্ট্রোক সেন্টার"
                      : "Neurology & Stroke Center"}
                  </Link>
                </li>
                <li>
                  <Link href="/departments/oncology-cancer-care" className="hover:underline">
                    {locale === "bn"
                      ? "অনকোলজি ও ক্যান্সার কেয়ার"
                      : "Oncology & Cancer Care"}
                  </Link>
                </li>
                <li>
                  <Link href="/departments/orthopedics-joint" className="hover:underline">
                    {locale === "bn"
                      ? "অর্থোপেডিকস ও জয়েন্ট প্রতিস্থাপন"
                      : "Orthopedics & Joint Replacement"}
                  </Link>
                </li>
                <li>
                  <Link href="/tests-procedures" className="hover:underline">
                    {locale === "bn"
                      ? "পরীক্ষা ও ডায়াগনস্টিক পদ্ধতিসমূহ"
                      : "Diagnostic Tests & Procedures"}
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <Link
                href="/international"
                className="inline-flex items-center gap-1.5 font-semibold text-base text-white hover:underline mb-3"
              >
                <span>{t.footer.internationalHeading}</span>
                <ChevronRight className="w-4 h-4" />
              </Link>
              <ul className="space-y-2.5 text-sm text-[#e8f0f9]">
                <li>
                  <Link href="/international" className="hover:underline">
                    {locale === "bn"
                      ? "আন্তর্জাতিক ও প্রবাসী রোগী ডেস্ক"
                      : "International Patient Coordination"}
                  </Link>
                </li>
                <li>
                  <Link href="/patient-services" className="hover:underline">
                    {locale === "bn"
                      ? "ফি স্বচ্ছতা ও প্রাক্কলন"
                      : "Fee Transparency & Cost Guidance"}
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          {/* Column 3: About DeltaCare & Locations */}
          <div className="lg:col-span-3 space-y-6">
            <div>
              <Link
                href="/about"
                className="inline-flex items-center gap-1.5 font-semibold text-base text-white hover:underline mb-3"
              >
                <span>{t.footer.aboutHeading}</span>
                <ChevronRight className="w-4 h-4" />
              </Link>
              <ul className="space-y-2.5 text-sm text-[#e8f0f9]">
                <li>
                  <Link href="/about" className="hover:underline">
                    {locale === "bn"
                      ? "ডেল্টাকেয়ার সম্পর্কে ও গভর্ন্যান্স"
                      : "About this Site & Governance"}
                  </Link>
                </li>
                <li>
                  <Link href="/contact" className="hover:underline">
                    {locale === "bn" ? "যোগাযোগ ও কলব্যাক" : "Contact Us & Callback"}
                  </Link>
                </li>
                <li>
                  <Link href="/locations" className="hover:underline">
                    {locale === "bn" ? "শাখা ও অবস্থানসমূহ" : "Locations & Campuses"}
                  </Link>
                </li>
                <li>
                  <Link href="/patient-services" className="hover:underline">
                    {locale === "bn"
                      ? "স্বাস্থ্য তথ্য নীতি ও পর্যালোচনা"
                      : "Health Information Policy"}
                  </Link>
                </li>
                <li>
                  <Link href="/track-appointment" className="hover:underline">
                    {locale === "bn"
                      ? "অ্যাপয়েন্টমেন্ট স্ট্যাটাস ট্র্যাকিং"
                      : "Track Appointment Status"}
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          {/* Column 4: Patient Services & Portal Access */}
          <div className="lg:col-span-2 space-y-6">
            <div>
              <Link
                href="/patient-services"
                className="inline-flex items-center gap-1.5 font-semibold text-base text-white hover:underline mb-3"
              >
                <span>{t.footer.patientServicesHeading}</span>
                <ChevronRight className="w-4 h-4" />
              </Link>
              <ul className="space-y-2.5 text-sm text-[#e8f0f9]">
                <li>
                  <Link href="/request-appointment" className="hover:underline">
                    {locale === "bn"
                      ? "অ্যাপয়েন্টমেন্ট অনুরোধ"
                      : "Request Appointment"}
                  </Link>
                </li>
                <li>
                  <Link href="/diseases-conditions" className="hover:underline">
                    {locale === "bn"
                      ? "রোগ ও শারীরিক অবস্থা (A–Z)"
                      : "Diseases & Conditions A–Z"}
                  </Link>
                </li>
                <li>
                  <Link href="/dashboard" className="hover:underline">
                    {locale === "bn" ? "পেশেন্ট পোর্টাল" : "Patient Portal"}
                  </Link>
                </li>
                <li>
                  <Link href="/admin" className="hover:underline">
                    {locale === "bn" ? "ডেল্টাকেয়ার অ্যাডমিন" : "DeltaCare Admin"}
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Social & App Badges Row (Mirrors inspo.html .cmp-footer__social) */}
        <div className="mt-12 pt-8 border-t border-white/25 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <p className="text-sm font-semibold mb-3">{t.footer.followHeading}</p>
            <div className="flex items-center gap-3">
              {[
                { label: "X / Twitter", short: "X", href: "/contact" },
                { label: "YouTube", short: "YT", href: "/contact" },
                { label: "Facebook", short: "FB", href: "/contact" },
                { label: "LinkedIn", short: "IN", href: "/contact" },
                { label: "Instagram", short: "IG", href: "/contact" },
              ].map((soc) => (
                <Link
                  key={soc.short}
                  href={soc.href}
                  aria-label={soc.label}
                  className="w-10 h-10 rounded-full border border-white/60 bg-white/10 hover:bg-white/25 flex items-center justify-center text-xs font-bold transition-colors"
                >
                  {soc.short}
                </Link>
              ))}
            </div>
          </div>

          <div>
            <p className="text-sm font-semibold mb-3">{t.footer.appHeading}</p>
            <div className="flex flex-wrap items-center gap-3">
              <Link
                href="/dashboard"
                aria-label="Google Play Store — DeltaCare Patient Portal"
              >
                <img
                  src="/images/inspo/google-play-badge-en.svg"
                  alt="Get it on Google Play"
                  className="h-10 w-auto"
                />
              </Link>
              <Link
                href="/dashboard"
                aria-label="Apple App Store — DeltaCare Patient Portal"
              >
                <img
                  src="/images/inspo/apple-app-store-badge-en.svg"
                  alt="Download on the App Store"
                  className="h-10 w-auto"
                />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Legal & Language Bottom Bar */}
      <div className="bg-[#002443] border-t border-white/15 py-6">
        <div className="mc-container flex flex-col md:flex-row items-start md:items-center justify-between gap-4 text-xs text-[#e8f0f9]">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-4 font-medium">
              <Link href="/terms" className="hover:underline">
                {locale === "bn" ? "ব্যবহারের শর্তাবলী" : "Terms and Conditions"}
              </Link>
              <Link href="/privacy-policy" className="hover:underline">
                {locale === "bn" ? "গোপনীয়তা নীতি" : "Privacy Policy"}
              </Link>
              <Link href="/accessibility" className="hover:underline">
                {locale === "bn"
                  ? "অ্যাক্সেসিবিলিটি বিবৃতি"
                  : "Accessibility Statement"}
              </Link>
              <Link href="/patient-services" className="hover:underline">
                {locale === "bn" ? "ফি ও বাতিলকরণ নীতি" : "Cancellation & Fee Policy"}
              </Link>
            </div>
            <p className="text-white/80">{t.footer.copyright}</p>
          </div>

          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-[#c5e2f9]" aria-hidden="true" />
            <label htmlFor="footer-lang-select" className="font-medium">
              {t.nav.languageLabel}
            </label>
            <select
              id="footer-lang-select"
              value={locale}
              onChange={(e) => setLocale(e.target.value as "en" | "bn")}
              className="bg-[#012d61] text-white border border-white/40 rounded px-2.5 py-1 text-xs"
            >
              <option value="en">English</option>
              <option value="bn">বাংলা (Bangla)</option>
            </select>
          </div>
        </div>
      </div>
    </footer>
  );
}

