"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Search,
  X,
  ChevronDown,
  ChevronRight,
  Menu,
  User,
  Globe,
  ArrowRight,
  Building2,
  Stethoscope,
  BookOpen,
  Calendar,
  Phone,
  Info,
  MapPin,
  HeartHandshake,
  HeartPulse,
  Brain,
  Activity,
  ShieldCheck,
} from "lucide-react";
import { useLocale } from "@/lib/i18n/LocaleContext";
import { STAFF_ROLES } from "@/lib/auth/roles";
import { RoleCode } from "@/types/domain";

interface NavUser {
  id: string;
  email: string;
  fullName: string;
  role: RoleCode;
}

interface SearchHit {
  type: "DOCTOR" | "DEPARTMENT" | "CONDITION" | "PROCEDURE" | "SERVICE" | "BRANCH";
  id: string;
  titleEn: string;
  titleBn: string;
  subtitleEn: string;
  subtitleBn: string;
  href: string;
}

interface DropdownItem {
  labelEn: string;
  labelBn: string;
  href: string;
  descriptionEn?: string;
  descriptionBn?: string;
  icon?: React.ComponentType<{ className?: string }>;
}

interface PrimaryMenu {
  id: "care" | "library" | "departments";
  labelEn: string;
  labelBn: string;
  items: DropdownItem[];
  teaser: {
    titleEn: string;
    titleBn: string;
    subtitleEn: string;
    subtitleBn: string;
    href: string;
    imageUrl: string;
    ctaEn: string;
    ctaBn: string;
  };
}

export function SiteHeader({ initialUser }: { initialUser?: NavUser | null }) {
  const { locale, toggleLocale, t } = useLocale();
  const router = useRouter();
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchHit[]>([]);
  const [user, setUser] = useState<NavUser | null>(initialUser ?? null);
  const headerRef = useRef<HTMLElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setUser(initialUser ?? null);
  }, [initialUser]);

  // Close dropdown or search drawer on Escape or outside click
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setActiveMenuId(null);
        setSearchOpen(false);
        setMobileDrawerOpen(false);
      }
    };
    const handleClickOutside = (e: MouseEvent) => {
      if (headerRef.current && !headerRef.current.contains(e.target as Node)) {
        setActiveMenuId(null);
        setSearchResults([]);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("mousedown", handleClickOutside);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    if (searchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [searchOpen]);

  // Live search suggestions
  useEffect(() => {
    if (searchQuery.trim().length < 2) {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/v1/public/search?q=${encodeURIComponent(searchQuery.trim())}`
        );
        if (res.ok) {
          const data = await res.json();
          setSearchResults(data.results?.slice(0, 6) ?? []);
        }
      } catch {
        // Ignore network errors
      }
    }, 150);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setSearchOpen(false);
    router.push(`/diseases-conditions?q=${encodeURIComponent(searchQuery.trim())}`);
  };

  const handleLogout = async () => {
    await fetch("/api/v1/auth/logout", { method: "POST" });
    setUser(null);
    router.refresh();
  };

  const isStaff = user && STAFF_ROLES.includes(user.role);

  // EXACT PRIMARY MENUS PER REQUIREMENTS:
  // 1. Care at DeltaCare
  // 2. Health Library
  // 3. Departments and Specialists
  const primaryMenus: PrimaryMenu[] = [
    {
      id: "care",
      labelEn: "Care at DeltaCare",
      labelBn: "ডেল্টাকেয়ারে সেবা",
      items: [
        {
          labelEn: "Patient-Centred Care",
          labelBn: "রোগী-কেন্দ্রিক সেবা",
          href: "/patient-services",
          descriptionEn: "Compassionate, coordinated clinical support and patient rights.",
          descriptionBn: "সহমর্মিতাপূর্ণ সমন্বিত সেবা ও রোগীর অধিকার।",
          icon: HeartHandshake,
        },
        {
          labelEn: "Request Appointment",
          labelBn: "অ্যাপয়েন্টমেন্ট অনুরোধ",
          href: "/request-appointment",
          descriptionEn: "Start your new or returning patient consultation booking.",
          descriptionBn: "অনলাইনে বিশেষজ্ঞ ডাক্তার অ্যাপয়েন্টমেন্ট বুকিং শুরু করুন।",
          icon: Calendar,
        },
        {
          labelEn: "Locations & Campuses",
          labelBn: "শাখা ও অবস্থানসমূহ",
          href: "/locations",
          descriptionEn: "Dhanmondi, Gulshan, Uttara, Chattogram and Sylhet campuses.",
          descriptionBn: "ধানমন্ডি, গুলশান, উত্তরা, চট্টগ্রাম ও সিলেট হাসপাতাল ক্যাম্পাস।",
          icon: MapPin,
        },
        {
          labelEn: "About DeltaCare",
          labelBn: "ডেল্টাকেয়ার সম্পর্কে",
          href: "/about",
          descriptionEn: "Our clinical leadership, values, and multi-specialty standards.",
          descriptionBn: "আমাদের ক্লিনিক্যাল নেতৃত্ব, মূল্যবোধ ও চিকিৎসার মানদণ্ড।",
          icon: Info,
        },
        {
          labelEn: "Track Appointment Status",
          labelBn: "অ্যাপয়েন্টমেন্ট ট্র্যাকিং",
          href: "/track-appointment",
          descriptionEn: "Live status lookup using your tracking code and mobile number.",
          descriptionBn: "ট্র্যাকিং কোড ও মোবাইল নম্বর দিয়ে অবস্থান ও স্থিতি দেখুন।",
          icon: Activity,
        },
        {
          labelEn: "Contact Us & 24/7 Helpline",
          labelBn: "যোগাযোগ ও জরুরি হেল্পলাইন",
          href: "/contact",
          descriptionEn: "24/7 patient helpline 10678, international desk, and callbacks.",
          descriptionBn: "২৪/৭ জরুরি হেল্পলাইন ১০৬৭৮ এবং কলব্যাক সেবা।",
          icon: Phone,
        },
      ],
      teaser: {
        titleEn: "Care at DeltaCare",
        titleBn: "ডেল্টাকেয়ারে বিশেষজ্ঞ সেবা",
        subtitleEn: "Multi-disciplinary coordinated specialist consultations across modern medical campuses.",
        subtitleBn: "আধুনিক মেডিকেল ক্যাম্পাসে সমন্বিত বিশেষজ্ঞ সেবা ও পরামর্শ।",
        href: "/patient-services",
        imageUrl: "/images/inspo/pt-visitor-Getty-1419492732-415x275.jpg",
        ctaEn: "Learn about our care model",
        ctaBn: "আমাদের সেবা মডেল জানুন",
      },
    },
    {
      id: "library",
      labelEn: "Health Library",
      labelBn: "স্বাস্থ্য তথ্যভাণ্ডার",
      items: [
        {
          labelEn: "Diseases and Conditions (A–Z)",
          labelBn: "রোগ ও শারীরিক অবস্থা (A–Z)",
          href: "/diseases-conditions",
          descriptionEn: "Comprehensive index of medical conditions and specialist care plans.",
          descriptionBn: "চিকিৎসক-যাচাইকৃত রোগ নির্দেশিকা ও চিকিৎসা পরামর্শ।",
          icon: BookOpen,
        },
        {
          labelEn: "Symptoms Directory",
          labelBn: "লক্ষণ ও উপসর্গ নির্দেশিকা",
          href: "/diseases-conditions#symptoms",
          descriptionEn: "Understand common clinical signs and when to seek urgent care.",
          descriptionBn: "সাধারণ লক্ষণসমূহ এবং কখন জরুরি পরামর্শ প্রয়োজন।",
          icon: Info,
        },
        {
          labelEn: "Tests and Procedures",
          labelBn: "পরীক্ষা ও ডায়াগনস্টিক পদ্ধতি",
          href: "/tests-procedures",
          descriptionEn: "Preparation instructions, transparent BDT fees, and what to expect.",
          descriptionBn: "প্রস্তুতি নির্দেশিকা, স্বচ্ছ ফি ও পদ্ধতির বিবরণ।",
          icon: Building2,
        },
        {
          labelEn: "Find Doctors by Condition",
          labelBn: "রোগ অনুযায়ী ডাক্তার খুঁজুন",
          href: "/doctors",
          descriptionEn: "Locate BMDC-registered specialists by disease, symptom, or treatment.",
          descriptionBn: "রোগ বা উপসর্গ অনুযায়ী যাচাইকৃত বিশেষজ্ঞ চিকিৎসক খুঁজুন।",
          icon: Stethoscope,
        },
        {
          labelEn: "Health Guidance & Policies",
          labelBn: "স্বাস্থ্য নীতিমালা ও পরামর্শ",
          href: "/patient-services",
          descriptionEn: "Safe clinical practices, patient privacy, and fee transparency.",
          descriptionBn: "নিরাপদ চিকিৎসা নির্দেশিকা, গোপনীয়তা ও স্বচ্ছ ফি নীতিমালা।",
          icon: ShieldCheck,
        },
        {
          labelEn: "Emergency Care & Triage",
          labelBn: "জরুরি সেবা ও ট্রায়াজ",
          href: "/contact",
          descriptionEn: "Immediate clinical guidance, emergency contact, and helpline.",
          descriptionBn: "জরুরি স্বাস্থ্য নির্দেশিকা এবং ২৪/৭ সাপোর্ট হেল্পলাইন।",
          icon: Activity,
        },
      ],
      teaser: {
        titleEn: "Evidence-Based Health Library",
        titleBn: "প্রমাণ-ভিত্তিক স্বাস্থ্য তথ্যভাণ্ডার",
        subtitleEn: "All condition guides and medical tests are reviewed by BMDC-registered specialists.",
        subtitleBn: "সকল স্বাস্থ্য নির্দেশিকা বিএমডিসি-নিবন্ধিত বিশেষজ্ঞদের দ্বারা পরীক্ষিত।",
        href: "/diseases-conditions",
        imageUrl: "/images/inspo/mccms-Getty-1082003662-415x275.jpg",
        ctaEn: "Explore Health Library",
        ctaBn: "তথ্যভাণ্ডার ব্রাউজ করুন",
      },
    },
    {
      id: "departments",
      labelEn: "Departments and Specialists",
      labelBn: "বিভাগ ও বিশেষজ্ঞবৃন্দ",
      items: [
        {
          labelEn: "All Clinical Departments",
          labelBn: "সকল ক্লিনিক্যাল বিভাগ",
          href: "/departments",
          descriptionEn: "Comprehensive hospital centers and diagnostic facilities.",
          descriptionBn: "সকল বিশেষায়িত ক্লিনিক্যাল বিভাগ ও ল্যাবরেটরি।",
          icon: Building2,
        },
        {
          labelEn: "Verified Medical Specialists",
          labelBn: "যাচাইকৃত বিশেষজ্ঞ চিকিৎসক",
          href: "/doctors",
          descriptionEn: "BMDC-registered consultants with confirmed chamber schedules.",
          descriptionBn: "বিএমডিসি-যাচাইকৃত কনসালট্যান্ট ও চেম্বার সময়সূচী।",
          icon: Stethoscope,
        },
        {
          labelEn: "Cardiology & Vascular",
          labelBn: "কার্ডিওলজি ও ভাস্কুলার",
          href: "/departments/cardiology-vascular",
          descriptionEn: "Interventional cardiology, heart valve care, and bypass surgery.",
          descriptionBn: "হৃদরোগ নির্ণয়, ক্যাথল্যাব এবং হার্ট বাইপাস সার্জারি।",
          icon: HeartPulse,
        },
        {
          labelEn: "Neurology & Stroke Center",
          labelBn: "নিউরোলজি ও স্ট্রোক সেন্টার",
          href: "/departments/neurology-stroke",
          descriptionEn: "Comprehensive stroke unit, neurosurgery, and spine care.",
          descriptionBn: "স্ট্রোক ইউনিট, নিউরোসার্জারি ও স্পাইনাল কেয়ার।",
          icon: Brain,
        },
        {
          labelEn: "Oncology & Cancer Care",
          labelBn: "অনকোলজি ও ক্যানসার কেয়ার",
          href: "/departments/oncology-cancer-care",
          descriptionEn: "Medical oncology, tumor boards, and chemotherapy suites.",
          descriptionBn: "টিউমার বোর্ড, কেমোথেরাপি ও ক্যানসার চিকিৎসা।",
          icon: Activity,
        },
        {
          labelEn: "Orthopedics & Joint Replacement",
          labelBn: "অর্থোপেডিকস ও জয়েন্ট রিপ্লেসমেন্ট",
          href: "/departments/orthopedics-joint",
          descriptionEn: "Robotic joint replacement, trauma, and sports medicine.",
          descriptionBn: "জয়েন্ট রিপ্লেসমেন্ট, ট্রমা এবং অর্থোপেডিক সার্জারি।",
          icon: ShieldCheck,
        },
      ],
      teaser: {
        titleEn: "Meet Our Medical Faculty",
        titleBn: "আমাদের বিশেষজ্ঞ চিকিৎসক দল",
        subtitleEn: "Over 12+ specialized departments with verified availability and transparent fees.",
        subtitleBn: "স্বচ্ছ কনসালটেশন ফি ও যাচাইকৃত চেম্বার শিডিউল সহ ১২+ বিভাগ।",
        href: "/doctors",
        imageUrl: "/images/inspo/cont-ed-1676659-3734290-0048-C-415x275.jpg",
        ctaEn: "Find your doctor",
        ctaBn: "ডাক্তার খুঁজুন",
      },
    },
  ];

  return (
    <header
      ref={headerRef}
      className="sticky top-0 z-40 bg-white border-b border-[#e5e7eb] shadow-sm"
    >
      {/* ====================================================================
          SPACIOUS, BALANCED NAVBAR WITH EXACTLY SIX PRIMARY ELEMENTS
          1. Care at DeltaCare (Dropdown)
          2. Health Library (Dropdown)
          3. Departments and Specialists (Dropdown)
          4. Register / Log in (Auth State)
          5. Bangla / English (Language Switcher)
          6. Search (Functional Search)
         ==================================================================== */}
      <div className="w-full px-3 sm:px-6 lg:px-8">
        {/* ====================================================================
            DESKTOP NAVBAR: All options middle-justified in one centered row
            (Enlarged by 30% for high visual impact, clarity & legibility)
            1. Logo
            2. Care at DeltaCare
            3. Health Library
            4. Departments and Specialists
            5. Register / Log in
            6. Bangla / English
            7. Search Bar
           ==================================================================== */}
        <div className="hidden lg:flex items-center justify-center h-[90px] gap-2.5 lg:gap-3 xl:gap-4 2xl:gap-6 mx-auto">
          {/* OPTION 1: Logo */}
          <Link
            href="/"
            className="flex items-center shrink-0 pr-1 xl:pr-2 focus:outline-none transition-transform hover:opacity-95"
            aria-label="DeltaCare Home"
          >
            <img
              src="/images/deltacare-logo.svg"
              alt="DeltaCare"
              className="h-10 xl:h-11 w-auto"
            />
          </Link>

          {/* OPTIONS 2, 3, 4: Care at DeltaCare, Health Library, Departments and Specialists */}
          <nav
            aria-label="Primary Navigation"
            className="flex items-center gap-1 xl:gap-2"
          >
            {primaryMenus.map((menu) => {
              const isOpen = activeMenuId === menu.id;
              const menuLabel = locale === "bn" ? menu.labelBn : menu.labelEn;
              return (
                <div key={menu.id} className="relative">
                  <button
                    type="button"
                    aria-expanded={isOpen}
                    onClick={() => setActiveMenuId(isOpen ? null : menu.id)}
                    className={`inline-flex items-center gap-1.5 px-3.5 xl:px-4 py-2 text-[15px] xl:text-[16px] font-medium tracking-tight rounded-xl transition-all duration-150 select-none whitespace-nowrap ${
                      isOpen
                        ? "bg-[#e8f0f9] text-[#0057b8] font-semibold"
                        : "text-[#1f2937] hover:text-[#0057b8] hover:bg-[#f9fafb]"
                    }`}
                  >
                    <span>{menuLabel}</span>
                    <ChevronDown
                      className={`w-4 h-4 transition-transform duration-200 ${
                        isOpen ? "rotate-180 text-[#0057b8]" : "text-[#6b7280]"
                      }`}
                      aria-hidden="true"
                    />
                  </button>
                </div>
              );
            })}
          </nav>

          {/* OPTION 5: Register / Log in */}
          <div className="flex items-center shrink-0">
            {user ? (
              <div className="flex items-center gap-2 text-sm">
                <Link
                  href={isStaff ? "/admin" : "/dashboard"}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-[#e8f0f9] text-[#004181] font-medium hover:bg-[#c5e2f9] transition-colors whitespace-nowrap text-sm"
                >
                  <User className="w-4 h-4 text-[#0057b8]" aria-hidden="true" />
                  <span>{isStaff ? t.nav.adminDashboard : t.nav.myDashboard}</span>
                </Link>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="text-xs text-[#6b7280] hover:text-[#080808] underline px-1 transition-colors"
                >
                  {t.nav.logout}
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                className="inline-flex items-center gap-1.5 px-3.5 xl:px-4 py-2 text-[15px] xl:text-[16px] font-medium text-[#1f2937] hover:text-[#0057b8] hover:bg-[#f9fafb] rounded-xl transition-colors whitespace-nowrap"
              >
                <User className="w-4 h-4 text-[#4b5563]" aria-hidden="true" />
                <span>{t.nav.registerLogin}</span>
              </Link>
            )}
          </div>

          {/* OPTION 6: Bangla / English */}
          <button
            type="button"
            onClick={toggleLocale}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs xl:text-sm font-bold rounded-full border border-[#0057b8] text-[#0057b8] hover:bg-[#e8f0f9] transition-colors select-none shrink-0 whitespace-nowrap"
            aria-label="Toggle language between English and Bangla"
          >
            <Globe className="w-4 h-4" aria-hidden="true" />
            <span>{locale === "en" ? "বাংলা" : "English"}</span>
          </button>

          {/* OPTION 7: Search Bar */}
          <div className="relative shrink-0">
            <form onSubmit={handleSearchSubmit} className="relative flex items-center">
              <Search
                className="w-4 h-4 text-[#6b7280] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                aria-hidden="true"
              />
              <input
                ref={searchInputRef}
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setActiveMenuId(null)}
                placeholder={
                  locale === "bn" ? "অনুসন্ধান করুন..." : "Search DeltaCare..."
                }
                className="w-36 lg:w-44 xl:w-56 2xl:w-64 h-10 pl-10 pr-9 text-xs xl:text-sm rounded-full border border-[#d1d5db] bg-[#f9fafb] text-[#111827] placeholder-[#6b7280] focus:border-[#0057b8] focus:bg-white focus:outline-none transition-all shadow-sm"
                aria-label={t.alphabetSearchSection.searchHeading}
              />
              {searchQuery ? (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery("");
                    setSearchResults([]);
                  }}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-[#9ca3af] hover:text-[#111827] transition-colors"
                  aria-label={t.alphabetSearchSection.clearSearch}
                >
                  <X className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="submit"
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-[#9ca3af] hover:text-[#0057b8] transition-colors"
                  aria-label="Submit search"
                >
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </form>

            {/* Instant Search Suggestions Dropdown */}
            {searchResults.length > 0 && (
              <div className="absolute right-0 top-full mt-2 w-88 sm:w-96 border border-[#e5e7eb] rounded-xl divide-y divide-[#e5e7eb] bg-white shadow-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-1 duration-150">
                <div className="px-4 py-2.5 bg-[#f9fafb] text-xs font-bold text-[#6b7280] uppercase tracking-wider flex items-center justify-between">
                  <span>{locale === "bn" ? "ফলাফলসমূহ" : "Suggestions"}</span>
                  <button
                    type="button"
                    onClick={() => setSearchResults([])}
                    className="text-[#9ca3af] hover:text-[#111827]"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="max-h-80 overflow-y-auto divide-y divide-[#e5e7eb]">
                  {searchResults.map((hit) => (
                    <Link
                      key={`${hit.type}-${hit.id}`}
                      href={hit.href}
                      onClick={() => {
                        setSearchResults([]);
                        setSearchQuery("");
                      }}
                      className="flex items-center justify-between px-4 py-3.5 hover:bg-[#f0f7ff] transition-colors text-left"
                    >
                      <div className="min-w-0 pr-2">
                        <span className="inline-block text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded bg-[#e8f0f9] text-[#004181] mr-2">
                          {hit.type}
                        </span>
                        <span className="font-semibold text-[#111827] text-sm">
                          {locale === "bn" ? hit.titleBn : hit.titleEn}
                        </span>
                        <p className="text-xs text-[#6b7280] mt-0.5 truncate">
                          {locale === "bn" ? hit.subtitleBn : hit.subtitleEn}
                        </p>
                      </div>
                      <ChevronRight className="w-4.5 h-4.5 text-[#0057b8] shrink-0" />
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ====================================================================
            MOBILE / TABLET TOP ROW (< 1024px) (+30% larger)
           ==================================================================== */}
        <div className="flex lg:hidden items-center justify-between h-[94px] w-full">
          {/* Mobile Logo */}
          <Link
            href="/"
            className="flex items-center shrink-0 focus:outline-none"
            aria-label="DeltaCare Home"
          >
            <img
              src="/images/deltacare-logo.svg"
              alt="DeltaCare"
              className="h-12 w-auto"
            />
          </Link>

          {/* Mobile Controls */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Quick Search Toggle */}
            <button
              type="button"
              aria-label={searchOpen ? t.nav.closeSearch : t.nav.search}
              onClick={() => {
                setSearchOpen(!searchOpen);
                setMobileDrawerOpen(false);
              }}
              className="inline-flex items-center justify-center w-11 h-11 rounded-full text-[#1f2937] hover:bg-[#f3f4f6]"
            >
              {searchOpen ? <X className="w-6 h-6 text-[#dc2626]" /> : <Search className="w-6 h-6" />}
            </button>

            {/* Language Toggle */}
            <button
              type="button"
              onClick={toggleLocale}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-bold rounded-full border-2 border-[#0057b8] text-[#0057b8]"
              aria-label="Toggle language"
            >
              <Globe className="w-4 h-4" />
              <span>{locale === "en" ? "বাং" : "EN"}</span>
            </button>

            {/* Hamburger Toggle */}
            <button
              type="button"
              aria-label="Open navigation menu"
              aria-expanded={mobileDrawerOpen}
              onClick={() => {
                setMobileDrawerOpen(!mobileDrawerOpen);
                setSearchOpen(false);
                setActiveMenuId(null);
              }}
              className="inline-flex items-center justify-center w-12 h-12 rounded-full text-[#1f2937] hover:bg-[#f3f4f6]"
            >
              {mobileDrawerOpen ? (
                <X className="w-7 h-7" aria-hidden="true" />
              ) : (
                <Menu className="w-7 h-7" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* ====================================================================
          SPREAD-OUT EDITORIAL MEGA-MENU FLYOUT
          - No rectangular card boxes
          - Options spread out across full screen width (Left, Center, Right)
          - Large, prominent, legible fonts with clean whitespace balance
         ==================================================================== */}
      {activeMenuId && (
        <div
          role="region"
          aria-label="Navigation dropdown menu"
          className="hidden lg:block bg-white border-t border-b border-[#e5e7eb] shadow-xl animate-in fade-in slide-in-from-top-1 duration-150"
        >
          {primaryMenus
            .filter((m) => m.id === activeMenuId)
            .map((menu) => (
              <div key={menu.id} className="w-full px-6 sm:px-10 lg:px-14 xl:px-20 py-8">
                {/* Top Section Eyebrow Bar */}
                <div className="flex items-center justify-between pb-3.5 mb-6 border-b border-[#e5e7eb]">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#0057b8]" />
                    <span className="text-xs font-extrabold uppercase tracking-widest text-[#0057b8]">
                      {locale === "bn" ? menu.labelBn : menu.labelEn}
                    </span>
                  </div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-[#9ca3af]">
                    {locale === "bn" ? "সরাসরি বিভাগ ও সেবাসমূহ" : "Direct Directory Services"}
                  </span>
                </div>

                {/* 3-Column Spread-Out Options Grid (Left, Center, Right) */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-12 xl:gap-x-16 gap-y-7">
                  {menu.items.map((item) => {
                    const Icon = item.icon || ChevronRight;
                    const itemTitle = locale === "bn" ? item.labelBn : item.labelEn;
                    const itemDesc = locale === "bn" ? item.descriptionBn : item.descriptionEn;
                    return (
                      <Link
                        key={item.href + item.labelEn}
                        href={item.href}
                        onClick={() => setActiveMenuId(null)}
                        className="group block py-2 hover:bg-[#f0f7ff]/50 rounded-xl px-3 -mx-3 transition-colors duration-150"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-lg bg-[#e8f0f9] text-[#0057b8] flex items-center justify-center shrink-0 group-hover:bg-[#0057b8] group-hover:text-white transition-colors duration-150">
                              <Icon className="w-5 h-5" />
                            </div>
                            <span className="font-normal text-[#080808] group-hover:text-[#0057b8] text-[18px] xl:text-[19px] leading-snug transition-colors">
                              {itemTitle}
                            </span>
                          </div>
                          <ChevronRight className="w-5 h-5 text-[#9ca3af] group-hover:text-[#0057b8] group-hover:translate-x-1 transition-all shrink-0 ml-2" />
                        </div>
                        {itemDesc && (
                          <p className="text-[14px] xl:text-[14.5px] text-[#4b5563] group-hover:text-[#1f2937] mt-1.5 pl-12 leading-relaxed">
                            {itemDesc}
                          </p>
                        )}
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
        </div>
      )}

      {/* ====================================================================
          GLOBAL SEARCH FLYOUT DRAWER (ELEMENT 6)
         ==================================================================== */}
      {searchOpen && (
        <div className="bg-white border-t border-b border-[#e5e7eb] shadow-xl py-8 animate-in fade-in duration-150">
          <div className="max-w-4xl mx-auto px-4 sm:px-6">
            <form onSubmit={handleSearchSubmit} className="relative">
              <label htmlFor="header-global-search" className="sr-only">
                {t.alphabetSearchSection.searchHeading}
              </label>
              <div className="flex items-center gap-3">
                <div className="relative flex-1">
                  <Search
                    className="w-5 h-5 text-[#9ca3af] absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none"
                    aria-hidden="true"
                  />
                  <input
                    ref={searchInputRef}
                    id="header-global-search"
                    type="search"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={
                      locale === "bn"
                        ? "রোগ, বিশেষজ্ঞ চিকিৎসক বা সেবা অনুসন্ধান করুন..."
                        : "Search diseases, conditions, doctors, departments or services..."
                    }
                    className="w-full h-14 pl-12 pr-12 rounded-xl border-2 border-[#d1d5db] text-base text-[#111827] focus:border-[#0057b8] focus:outline-none transition-colors"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery("")}
                      aria-label={t.alphabetSearchSection.clearSearch}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-[#9ca3af] hover:text-[#111827]"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
                <button
                  type="submit"
                  className="h-14 px-8 rounded-xl bg-[#0057b8] hover:bg-[#004181] text-white font-bold text-sm tracking-wide shadow transition-colors shrink-0"
                >
                  {locale === "bn" ? "খুঁজুন" : "Search"}
                </button>
              </div>
              <p className="mt-2.5 text-xs text-[#6b7280]">
                {locale === "bn"
                  ? "উদাহরণ: Cardiology, Stroke, Dr. Farhana, MRI, Dhanmondi"
                  : "Try: Cardiology, Ischemic Stroke, Dr. Farhana, MRI, Dhanmondi"}
              </p>
            </form>

            {/* Live Autocomplete Suggestions */}
            {searchResults.length > 0 && (
              <div className="mt-4 border border-[#e5e7eb] rounded-xl divide-y divide-[#e5e7eb] bg-white shadow-sm overflow-hidden">
                {searchResults.map((hit) => (
                  <Link
                    key={`${hit.type}-${hit.id}`}
                    href={hit.href}
                    onClick={() => setSearchOpen(false)}
                    className="flex items-center justify-between px-5 py-3.5 hover:bg-[#f0f7ff] transition-colors"
                  >
                    <div>
                      <span className="inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-[#e8f0f9] text-[#004181] mr-2.5">
                        {hit.type}
                      </span>
                      <span className="font-semibold text-[#111827] text-sm">
                        {locale === "bn" ? hit.titleBn : hit.titleEn}
                      </span>
                      <p className="text-xs text-[#6b7280] mt-0.5">
                        {locale === "bn" ? hit.subtitleBn : hit.subtitleEn}
                      </p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-[#0057b8]" />
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ====================================================================
          RESPONSIVE MOBILE / TABLET DRAWER (< 1024px)
          Provides clean, accessible access to all six elements
         ==================================================================== */}
      {mobileDrawerOpen && (
        <div className="lg:hidden bg-white border-t border-[#e5e7eb] max-h-[85vh] overflow-y-auto shadow-2xl animate-in slide-in-from-top-2 duration-150">
          <div className="p-5 space-y-6">
            {/* Mobile Auth & Language Bar */}
            <div className="flex items-center justify-between p-3.5 rounded-xl bg-[#f9fafb] border border-[#e5e7eb]">
              {user ? (
                <div className="flex items-center gap-2">
                  <Link
                    href={isStaff ? "/admin" : "/dashboard"}
                    onClick={() => setMobileDrawerOpen(false)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0057b8] text-white text-xs font-bold"
                  >
                    <User className="w-3.5 h-3.5" />
                    <span>{isStaff ? "DeltaCare Admin" : "Patient Portal"}</span>
                  </Link>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="text-xs text-[#dc2626] hover:underline px-1 font-semibold"
                  >
                    Sign out
                  </button>
                </div>
              ) : (
                <Link
                  href="/login"
                  onClick={() => setMobileDrawerOpen(false)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#0057b8] text-white text-xs font-bold"
                >
                  <User className="w-3.5 h-3.5" />
                  <span>{t.nav.registerLogin}</span>
                </Link>
              )}

              <button
                type="button"
                onClick={toggleLocale}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[#0057b8] text-[#0057b8] text-xs font-bold hover:bg-[#e8f0f9]"
              >
                <Globe className="w-3.5 h-3.5" />
                <span>{locale === "en" ? "বাংলা" : "English"}</span>
              </button>
            </div>

            {/* Mobile Dropdown Groups */}
            <div className="space-y-4 divide-y divide-[#e5e7eb]">
              {primaryMenus.map((menu) => (
                <div key={menu.id} className="pt-3 first:pt-0">
                  <p className="font-bold text-xs uppercase tracking-wider text-[#0057b8] mb-2 px-1">
                    {locale === "bn" ? menu.labelBn : menu.labelEn}
                  </p>
                  <div className="space-y-1">
                    {menu.items.map((item) => (
                      <Link
                        key={item.href + item.labelEn}
                        href={item.href}
                        onClick={() => setMobileDrawerOpen(false)}
                        className="flex items-center justify-between p-2.5 rounded-lg hover:bg-[#f0f7ff] text-[#111827] hover:text-[#0057b8] text-sm font-medium transition-colors"
                      >
                        <span>{locale === "bn" ? item.labelBn : item.labelEn}</span>
                        <ChevronRight className="w-4 h-4 text-[#9ca3af]" />
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
