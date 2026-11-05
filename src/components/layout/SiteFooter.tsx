"use client";

import React from "react";
import Link from "next/link";
import {
  ChevronRight,
  Globe,
  PhoneCall,
  Facebook,
  Linkedin,
  Youtube,
  Instagram,
} from "lucide-react";
import { useLocale } from "@/lib/i18n/LocaleContext";

function XIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

export function SiteFooter() {
  const { locale, setLocale, t } = useLocale();

  const socialLinks = [
    { label: "X (Twitter)", href: "/contact", icon: XIcon },
    { label: "YouTube", href: "/contact", icon: Youtube },
    { label: "Facebook", href: "/contact", icon: Facebook },
    { label: "LinkedIn", href: "/contact", icon: Linkedin },
    { label: "Instagram", href: "/contact", icon: Instagram },
  ];

  return (
    <footer className="bg-[#012d61] text-white border-t border-white/20">
      {/* Main Minimal Grid */}
      <div className="mc-container py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 lg:gap-12 items-start">
          {/* Brand & Emergency Section */}
          <div className="lg:col-span-5 space-y-5">
            <div>
              <img
                src="/images/deltacare-logo-inverse.svg"
                alt="DeltaCare"
                className="h-10 w-auto"
              />
            </div>

            <p className="text-sm text-[#c5e2f9] max-w-sm leading-relaxed">
              {locale === "bn"
                ? "বাংলাদেশের একটি বিশ্বস্ত মাল্টি-ডিসিপ্লিনারি হাসপাতাল প্ল্যাটফর্ম। সময়সূচী ও স্বচ্ছ ফি ব্যবস্থাপনা।"
                : "A verified multi-disciplinary hospital platform with transparent schedules and clinical governance."}
            </p>

            <div className="pt-1">
              <a
                href="tel:10678"
                className="inline-flex items-center gap-2.5 px-4 py-2.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-sm text-[#e8f0f9] transition-all group"
              >
                <PhoneCall className="w-4 h-4 text-[#c5e2f9] group-hover:scale-110 transition-transform" />
                <span className="font-bold text-white">
                  {locale === "bn"
                    ? "২৪/৭ হেল্পলাইন: ১০৬৭৮"
                    : "24/7 Helpline: 10678"}
                </span>
                <span className="text-xs text-[#c5e2f9] font-normal">
                  (+880 9612-310678)
                </span>
              </a>
            </div>
          </div>

          {/* Column 1: Patient Care & Services */}
          <div className="lg:col-span-4 space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-[#c5e2f9]">
              {t.footer.patientServicesHeading}
            </h3>
            <ul className="space-y-3 text-sm text-[#e8f0f9]">
              <li>
                <Link
                  href="/request-appointment"
                  className="hover:text-white hover:underline transition-colors flex items-center gap-1.5"
                >
                  <span>
                    {locale === "bn"
                      ? "অ্যাপয়েন্টমেন্ট অনুরোধ"
                      : "Request Appointment"}
                  </span>
                </Link>
              </li>
              <li>
                <Link
                  href="/track-appointment"
                  className="hover:text-white hover:underline transition-colors flex items-center gap-1.5"
                >
                  <span>
                    {locale === "bn"
                      ? "অ্যাপয়েন্টমেন্ট স্ট্যাটাস ট্র্যাকিং"
                      : "Track Appointment Status"}
                  </span>
                </Link>
              </li>
              <li>
                <Link
                  href="/diseases-conditions"
                  className="hover:text-white hover:underline transition-colors flex items-center gap-1.5"
                >
                  <span>
                    {locale === "bn"
                      ? "রোগ ও শারীরিক অবস্থা (A–Z)"
                      : "Diseases & Conditions (A–Z)"}
                  </span>
                </Link>
              </li>
              <li>
                <Link
                  href="/tests-procedures"
                  className="hover:text-white hover:underline transition-colors flex items-center gap-1.5"
                >
                  <span>
                    {locale === "bn"
                      ? "ডায়াগনস্টিক পরীক্ষা ও পদ্ধতিসমূহ"
                      : "Diagnostic Tests & Procedures"}
                  </span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 2: Hospital & Campuses */}
          <div className="lg:col-span-3 space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-[#c5e2f9]">
              {t.footer.aboutHeading}
            </h3>
            <ul className="space-y-3 text-sm text-[#e8f0f9]">
              <li>
                <Link
                  href="/locations"
                  className="hover:text-white hover:underline transition-colors flex items-center gap-1.5"
                >
                  <span>
                    {locale === "bn"
                      ? "শাখা ও ক্যাম্পাসসমূহ"
                      : "Locations & Campuses"}
                  </span>
                </Link>
              </li>
              <li>
                <Link
                  href="/about"
                  className="hover:text-white hover:underline transition-colors flex items-center gap-1.5"
                >
                  <span>
                    {locale === "bn"
                      ? "ডেল্টাকেয়ার সম্পর্কে"
                      : "About DeltaCare"}
                  </span>
                </Link>
              </li>
              <li>
                <Link
                  href="/contact"
                  className="hover:text-white hover:underline transition-colors flex items-center gap-1.5"
                >
                  <span>
                    {locale === "bn" ? "যোগাযোগ করুন" : "Contact Us"}
                  </span>
                </Link>
              </li>
              <li>
                <Link
                  href="/dashboard"
                  className="hover:text-white hover:underline transition-colors flex items-center gap-1.5"
                >
                  <span>
                    {locale === "bn" ? "পেশেন্ট পোর্টাল" : "Patient Portal"}
                  </span>
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Social Row with Logos */}
        <div className="mt-10 pt-6 border-t border-white/15 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#c5e2f9] mr-1">
              {t.footer.followHeading}:
            </span>
            {socialLinks.map((soc) => {
              const Icon = soc.icon;
              return (
                <Link
                  key={soc.label}
                  href={soc.href}
                  aria-label={soc.label}
                  className="w-9 h-9 rounded-full border border-white/25 bg-white/5 hover:bg-white/20 hover:border-white/50 flex items-center justify-center text-white transition-all duration-150 hover:scale-105"
                >
                  <Icon className="w-4 h-4" />
                </Link>
              );
            })}
          </div>

          <div className="text-xs text-[#c5e2f9] flex items-center gap-2">
            <Globe className="w-3.5 h-3.5 text-[#c5e2f9]" aria-hidden="true" />
            <label htmlFor="footer-lang-select" className="font-medium">
              {t.nav.languageLabel}:
            </label>
            <select
              id="footer-lang-select"
              value={locale}
              onChange={(e) => setLocale(e.target.value as "en" | "bn")}
              className="bg-[#002443] text-white border border-white/30 rounded-md px-2.5 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-white/40"
            >
              <option value="en">English</option>
              <option value="bn">বাংলা (Bangla)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Legal & Copyright Bottom Strip */}
      <div className="bg-[#00203f] border-t border-white/10 py-5">
        <div className="mc-container flex flex-col md:flex-row items-center justify-between gap-3 text-xs text-[#c5e2f9]">
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-x-5 gap-y-2">
            <Link href="/terms" className="hover:text-white hover:underline">
              {locale === "bn" ? "ব্যবহারের শর্তাবলী" : "Terms & Conditions"}
            </Link>
            <Link href="/privacy-policy" className="hover:text-white hover:underline">
              {locale === "bn" ? "গোপনীয়তা নীতি" : "Privacy Policy"}
            </Link>
            <Link href="/accessibility" className="hover:text-white hover:underline">
              {locale === "bn" ? "অ্যাক্সেসিবিলিটি" : "Accessibility"}
            </Link>
            <Link href="/patient-services" className="hover:text-white hover:underline">
              {locale === "bn" ? "ফি ও সেবা নীতি" : "Fee & Service Policy"}
            </Link>
          </div>
          <p className="text-white/60 text-center md:text-right">
            © {new Date().getFullYear()} DeltaCare Hospital Platform. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
