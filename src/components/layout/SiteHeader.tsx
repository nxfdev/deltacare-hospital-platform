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
          labelEn: "About DeltaCare",
          labelBn: "ডেল্টাকেয়ার সম্পর্কে",
          href: "/about",
          descriptionEn: "Our clinical leadership, values, and multi-specialty standards.",
          descriptionBn: "আমাদের ক্লিনিক্যাল নেতৃত্ব, মূল্যবোধ ও মানদণ্ড।",
          icon: Info,
        },
        {
          labelEn: "Request Appointment",
          labelBn: "অ্যাপয়েন্টমেন্ট অনুরোধ করুন",
          href: "/request-appointment",
          descriptionEn: "Start your new or returning patient appointment journey.",
          descriptionBn: "নতুন বা পূর্বের রোগীর অ্যাপয়েন্টমেন্ট প্রক্রিয়া শুরু করুন।",
          icon: Calendar,
        },
        {
          labelEn: "Locations",
          labelBn: "শাখা ও অবস্থানসমূহ",
          href: "/locations",
          descriptionEn: "Dhanmondi, Uttara, Banani and national hospital campuses.",
          descriptionBn: "ধানমন্ডি, উত্তরা, বনানী ও দেশজুড়ে হাসপাতাল ক্যাম্পাস।",
          icon: MapPin,
        },
        {
          labelEn: "Contact Us",
          labelBn: "যোগাযোগ ও হেল্পলাইন",
          href: "/contact",
          descriptionEn: "24/7 patient helpline 10678, desk support, and callback requests.",
          descriptionBn: "২৪/৭ হেল্পলাইন ১০৬৭৮ এবং কলব্যাক সেবা।",
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
          labelEn: "Diseases and Conditions",
          labelBn: "রোগ ও শারীরিক অবস্থা (A–Z)",
          href: "/diseases-conditions",
          descriptionEn: "Verified medical articles, causes, and treatment options.",
          descriptionBn: "চিকিৎসক-যাচাইকৃত রোগ নির্দেশিকা ও চিকিৎসা পরামর্শ।",
          icon: BookOpen,
        },
        {
          labelEn: "Symptoms",
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
          labelEn: "Drugs and Supplements",
          labelBn: "ওষুধ ও সম্পূরক নির্দেশিকা",
          href: "/tests-procedures#drugs",
          descriptionEn: "Safe usage, verified clinical instructions, and pharmacy guidance.",
          descriptionBn: "নিরাপদ সেবনবিধি ও ফার্মেসি নির্দেশিকা।",
          icon: HeartHandshake,
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
          descriptionEn: "Cardiology, Neurology, Oncology, Orthopedics, Pediatrics, and more.",
          descriptionBn: "কার্ডিওলজি, নিউরোলজি, অনকোলজি, অর্থোপেডিকস ও অন্যান্য বিভাগ।",
          icon: Building2,
        },
        {
          labelEn: "Verified Specialists",
          labelBn: "যাচাইকৃত বিশেষজ্ঞ চিকিৎসক",
          href: "/doctors",
          descriptionEn: "BMDC-registered consultants with confirmed chamber schedules and fees.",
          descriptionBn: "বিএমডিসি-যাচাইকৃত কনসালট্যান্ট ও চেম্বার সময়সূচী।",
          icon: Stethoscope,
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
            1. Logo
            2. Care at DeltaCare
            3. Health Library
            4. Departments and Specialists
            5. Register / Log in
            6. Bangla / English
            7. Search Bar
           ==================================================================== */}
        <div className="hidden lg:flex items-center justify-center h-[80px] gap-2 lg:gap-3 xl:gap-4 2xl:gap-5 mx-auto">
          {/* OPTION 1: Logo */}
          <Link
            href="/"
            className="flex items-center shrink-0 pr-1 xl:pr-2 focus:outline-none transition-transform hover:opacity-95"
            aria-label="DeltaCare Home"
          >
            <img
              src="/images/deltacare-logo.svg"
              alt="DeltaCare"
              className="h-9 xl:h-10 w-auto"
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
                    className={`inline-flex items-center gap-1.5 px-3 py-2 text-[14px] xl:text-[15px] font-medium tracking-tight rounded-lg transition-all duration-150 select-none whitespace-nowrap ${
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
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#e8f0f9] text-[#004181] font-medium hover:bg-[#c5e2f9] transition-colors whitespace-nowrap"
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
                className="inline-flex items-center gap-1.5 px-2.5 xl:px-3 py-1.5 text-[14px] xl:text-[15px] font-medium text-[#1f2937] hover:text-[#0057b8] hover:bg-[#f9fafb] rounded-lg transition-colors whitespace-nowrap"
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
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-full border border-[#0057b8] text-[#0057b8] hover:bg-[#e8f0f9] transition-colors select-none shrink-0 whitespace-nowrap"
            aria-label="Toggle language between English and Bangla"
          >
            <Globe className="w-3.5 h-3.5" aria-hidden="true" />
            <span>{locale === "en" ? "বাংলা" : "English"}</span>
          </button>

          {/* OPTION 7: Search Bar */}
          <div className="relative shrink-0">
            <form onSubmit={handleSearchSubmit} className="relative flex items-center">
              <Search
                className="w-4 h-4 text-[#6b7280] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
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
                className="w-32 lg:w-36 xl:w-48 2xl:w-56 h-9 pl-9 pr-8 text-xs xl:text-sm rounded-full border border-[#d1d5db] bg-[#f9fafb] text-[#111827] placeholder-[#6b7280] focus:border-[#0057b8] focus:bg-white focus:outline-none transition-all shadow-sm"
                aria-label={t.alphabetSearchSection.searchHeading}
              />
              {searchQuery ? (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery("");
                    setSearchResults([]);
                  }}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 text-[#9ca3af] hover:text-[#111827] transition-colors"
                  aria-label={t.alphabetSearchSection.clearSearch}
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              ) : (
                <button
                  type="submit"
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-[#9ca3af] hover:text-[#0057b8] transition-colors"
                  aria-label="Submit search"
                >
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </form>

            {/* Instant Search Suggestions Dropdown */}
            {searchResults.length > 0 && (
              <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 border border-[#e5e7eb] rounded-xl divide-y divide-[#e5e7eb] bg-white shadow-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-1 duration-150">
                <div className="px-4 py-2 bg-[#f9fafb] text-[11px] font-bold text-[#6b7280] uppercase tracking-wider flex items-center justify-between">
                  <span>{locale === "bn" ? "ফলাফলসমূহ" : "Suggestions"}</span>
                  <button
                    type="button"
                    onClick={() => setSearchResults([])}
                    className="text-[#9ca3af] hover:text-[#111827]"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="max-h-72 overflow-y-auto divide-y divide-[#e5e7eb]">
                  {searchResults.map((hit) => (
                    <Link
                      key={`${hit.type}-${hit.id}`}
                      href={hit.href}
                      onClick={() => {
                        setSearchResults([]);
                        setSearchQuery("");
                      }}
                      className="flex items-center justify-between px-4 py-3 hover:bg-[#f0f7ff] transition-colors text-left"
                    >
                      <div className="min-w-0 pr-2">
                        <span className="inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-[#e8f0f9] text-[#004181] mr-2">
                          {hit.type}
                        </span>
                        <span className="font-semibold text-[#111827] text-xs">
                          {locale === "bn" ? hit.titleBn : hit.titleEn}
                        </span>
                        <p className="text-[11px] text-[#6b7280] mt-0.5 truncate">
                          {locale === "bn" ? hit.subtitleBn : hit.subtitleEn}
                        </p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-[#0057b8] shrink-0" />
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ====================================================================
            MOBILE / TABLET TOP ROW (< 1024px)
           ==================================================================== */}
        <div className="flex lg:hidden items-center justify-between h-[72px] w-full">
          {/* Mobile Logo */}
          <Link
            href="/"
            className="flex items-center shrink-0 focus:outline-none"
            aria-label="DeltaCare Home"
          >
            <img
              src="/images/deltacare-logo.svg"
              alt="DeltaCare"
              className="h-9 w-auto"
            />
          </Link>

          {/* Mobile Controls */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Quick Search Toggle */}
            <button
              type="button"
              aria-label={searchOpen ? t.nav.closeSearch : t.nav.search}
              onClick={() => {
                setSearchOpen(!searchOpen);
                setMobileDrawerOpen(false);
              }}
              className="inline-flex items-center justify-center w-9 h-9 rounded-full text-[#1f2937] hover:bg-[#f3f4f6]"
            >
              {searchOpen ? <X className="w-5 h-5 text-[#dc2626]" /> : <Search className="w-5 h-5" />}
            </button>

            {/* Language Toggle */}
            <button
              type="button"
              onClick={toggleLocale}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-full border border-[#0057b8] text-[#0057b8]"
              aria-label="Toggle language"
            >
              <Globe className="w-3 h-3" />
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
              className="inline-flex items-center justify-center w-10 h-10 rounded-full text-[#1f2937] hover:bg-[#f3f4f6]"
            >
              {mobileDrawerOpen ? (
                <X className="w-6 h-6" aria-hidden="true" />
              ) : (
                <Menu className="w-6 h-6" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* ====================================================================
          SPACIOUS DESKTOP MEGA-MENU FLYOUT (Mayo Clinic inspired)
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
              <div key={menu.id} className="w-full max-w-7xl mx-auto px-6 lg:px-10 py-8">
                <div className="grid grid-cols-12 gap-8 items-start">
                  {/* Left Column: Menu Links with Descriptions */}
                  <div className="col-span-8 space-y-2">
                    <p className="text-xs font-bold uppercase tracking-wider text-[#0057b8] mb-4">
                      {locale === "bn" ? menu.labelBn : menu.labelEn}
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {menu.items.map((item) => {
                        const Icon = item.icon || ChevronRight;
                        const itemTitle = locale === "bn" ? item.labelBn : item.labelEn;
                        const itemDesc = locale === "bn" ? item.descriptionBn : item.descriptionEn;
                        return (
                          <Link
                            key={item.href + item.labelEn}
                            href={item.href}
                            onClick={() => setActiveMenuId(null)}
                            className="group p-3.5 rounded-xl border border-transparent hover:border-[#bfdbfe] hover:bg-[#f0f7ff] transition-all flex items-start gap-3.5"
                          >
                            <div className="w-9 h-9 rounded-lg bg-[#e8f0f9] text-[#0057b8] group-hover:bg-[#0057b8] group-hover:text-white flex items-center justify-center shrink-0 transition-colors">
                              <Icon className="w-4 h-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between font-semibold text-[#111827] group-hover:text-[#0057b8] text-[15px] transition-colors">
                                <span>{itemTitle}</span>
                                <ChevronRight className="w-4 h-4 text-[#9ca3af] group-hover:text-[#0057b8] group-hover:translate-x-0.5 transition-transform" />
                              </div>
                              {itemDesc && (
                                <p className="text-xs text-[#6b7280] group-hover:text-[#4b5563] mt-1 leading-relaxed">
                                  {itemDesc}
                                </p>
                              )}
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  </div>

                  {/* Right Column: Featured Teaser Card */}
                  <div className="col-span-4 pl-4 border-l border-[#e5e7eb]">
                    <Link
                      href={menu.teaser.href}
                      onClick={() => setActiveMenuId(null)}
                      className="group block rounded-2xl overflow-hidden border border-[#e5e7eb] bg-[#f9fafb] hover:border-[#0057b8] hover:shadow-md transition-all"
                    >
                      <div className="aspect-[16/10] overflow-hidden bg-[#012d61]">
                        <img
                          src={menu.teaser.imageUrl}
                          alt={locale === "bn" ? menu.teaser.titleBn : menu.teaser.titleEn}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                      <div className="p-5 space-y-2">
                        <h4 className="font-bold text-[#080808] text-base group-hover:text-[#0057b8] transition-colors">
                          {locale === "bn" ? menu.teaser.titleBn : menu.teaser.titleEn}
                        </h4>
                        <p className="text-xs text-[#6b7280] leading-relaxed line-clamp-2">
                          {locale === "bn" ? menu.teaser.subtitleBn : menu.teaser.subtitleEn}
                        </p>
                        <div className="pt-2 inline-flex items-center gap-1.5 text-xs font-bold text-[#0057b8]">
                          <span>{locale === "bn" ? menu.teaser.ctaBn : menu.teaser.ctaEn}</span>
                          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                        </div>
                      </div>
                    </Link>
                  </div>
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
