import { Locale } from "@/types/domain";

export const dictionaries = {
  en: {
    brand: {
      name: "Evercare",
      tagline: "Care at Evercare",
      platformName: "Evercare Hospital Platform",
      adminName: "Evercare Admin",
      assistantName: "Evercare Assistant",
      syntheticDataNotice:
        "SYNTHETIC DEVELOPMENT DATA — All doctors, schedules, fees, and branches displayed in this environment are clearly marked synthetic records for platform verification.",
    },
    nav: {
      skipToContent: "Skip to content",
      careAtEvercare: "Care at Evercare",
      healthLibrary: "Health Library",
      forMedicalProfessionals: "Departments & Specialists",
      researchAndEducation: "Clinical Governance & Quality",
      givingToEvercare: "Patient Support & Services",
      requestAppointment: "Request Appointment",
      register: "Register",
      login: "Log in",
      registerLogin: "Register / Log in",
      myDashboard: "Patient Portal",
      adminDashboard: "Evercare Admin",
      logout: "Sign out",
      search: "Search",
      closeSearch: "Close search",
      languageLabel: "Language:",
      emergencyLabel: "24/7 Emergency & Helpline:",
    },
    hero: {
      headline: "Care That Comes Together",
      subheadline:
        "Bringing the right specialists and coordinated healthcare services together around what matters most: your well-being.",
      primaryCta: "Explore Patient-Centered Care",
      secondaryCta: "Request Appointment",
      pauseMotion: "Pause ambient motion",
      playMotion: "Resume ambient motion",
    },
    appointmentSection: {
      eyebrow: "Care at Evercare • Online Request",
      title: "Request an Appointment",
      subtitle:
        "Select a department, specialist, branch chamber, and available time slot. Submitting a request reserves a pending review slot and returns an instant tracking reference. Appointments are marked Confirmed only after Evercare front-desk verification.",
      departmentLabel: "1. Department or Specialty",
      departmentPlaceholder: "All Departments",
      doctorLabel: "2. Specialist Doctor",
      doctorPlaceholder: "Select a Verified Specialist",
      branchLabel: "3. Hospital Branch & Chamber",
      dateLabel: "4. Preferred Date",
      slotLabel: "5. Available Time Slot",
      visitTypeLabel: "Consultation Type",
      visitNew: "New Consultation",
      visitFollowup: "Follow-up Visit",
      patientNameLabel: "Patient Full Name",
      patientNamePlaceholder: "e.g., Tanvir Ahmed",
      patientPhoneLabel: "Bangladesh Mobile Number",
      patientPhonePlaceholder: "e.g., 01711223344",
      patientEmailLabel: "Email Address (Optional)",
      patientEmailPlaceholder: "name@example.com",
      reasonLabel: "Brief Appointment Note (Optional — Do not enter sensitive medical history)",
      reasonPlaceholder: "Preferred time window or general consultation reason...",
      consentText:
        "I understand this is an Appointment Request subject to staff confirmation and I agree to Evercare's Privacy Notice.",
      submitButton: "Submit Appointment Request",
      submittingButton: "Submitting Request...",
      trackExistingLink: "Already have a reference code? Track request status",
      unconfirmedNotice:
        "Important: Submitting a request does not immediately confirm a clinical booking. You will receive an SMS/Email confirmation once our front-desk team verifies slot capacity.",
    },
    alphabetSearchSection: {
      alphabetHeading: "Find diseases & conditions by first letter",
      searchHeading: "Search diseases, procedures, doctors & departments",
      searchHint:
        "Type 2 or more letters to display suggested search options. Use up and down arrow keys to navigate suggestions.",
      searchPlaceholder: "Search doctors, conditions, tests, departments...",
      searchButton: "Search",
      clearSearch: "Clear text input",
      viewAllConditions: "View full A–Z directory",
    },
    storySections: {
      story1Title: "Healing starts here",
      story1Sub1Title: "The right answers the first time",
      story1Sub1Body:
        "Effective care depends on accurate evaluation and coordinated specialist consultation. Evercare brings senior consultants, diagnostic services, and transparent schedules together under one accountable platform.",
      story1Sub2Title: "Verified specialists & transparent fee governance",
      story1Sub2Body:
        "Every published doctor schedule and service fee at Evercare carries an explicit effective date and administrative verification stamp.",
      story1Link: "Learn more about our clinical departments.",
      story1Cta: "Why choose Evercare",
      story2Title: "World-class care for patients across Bangladesh & beyond",
      story2Body:
        "We make it straightforward for patients from Dhaka, Chattogram, Sylhet, and international locations to coordinate specialist consultations, second-opinion appointments, and visitor support at Evercare.",
      story2Cta: "International & Out-of-Town Patient Services",
    },
    locationsSection: {
      title: "Locations",
      description:
        "Learn more about Evercare hospital branches across Bangladesh or choose a specific campus for chamber schedules and emergency contacts.",
      cta: "Explore all locations",
    },
    featuredCareSection: {
      title: "Featured care areas",
      description:
        "We coordinate multidisciplinary specialist consultations and diagnostic care across our approved clinical programs.",
      viewAllLink: "Explore all departments & specialties",
    },
    institutionalBanner: {
      title: "From clinical governance to patient trust, faster",
      description:
        "Evercare's commitment to verified medical information, transparent consultation fees, and safe patient communication ensures every visitor receives accurate guidance.",
      cta: "Explore Quality & Patient Services",
    },
    footer: {
      findDoctor: "Find a doctor",
      exploreCareers: "Explore careers & training",
      contactCallback: "Request a callback or submit feedback",
      aboutHeading: "About Evercare",
      medicalProfHeading: "Departments & Specialties",
      patientServicesHeading: "Patient & Visitor Services",
      internationalHeading: "International & Out-of-Town Patients",
      financialHeading: "Fee Transparency & Patient Support",
      followHeading: "Follow Evercare",
      appHeading: "Access Evercare Patient Portal",
      copyright:
        "© 2026 Evercare Hospital Platform. All rights reserved. Dedicated Hospital Digital Operations Installation (Bangladesh).",
    },
  },
  bn: {
    brand: {
      name: "এভারকেয়ার",
      tagline: "এভারকেয়ারে সেবা",
      platformName: "এভারকেয়ার হাসপাতাল প্ল্যাটফর্ম",
      adminName: "এভারকেয়ার অ্যাডমিন",
      assistantName: "এভারকেয়ার অ্যাসিস্ট্যান্ট",
      syntheticDataNotice:
        "সিনথেটিক ডেভেলপমেন্ট ডেটা — এই পরিবেশে প্রদর্শিত সকল চিকিৎসক, সময়সূচী, ফি এবং শাখাসমূহ শুধুমাত্র প্ল্যাটফর্ম যাচাইয়ের জন্য চিহ্নিত ডেমো তথ্য।",
    },
    nav: {
      skipToContent: "মূল বিষয়বস্তুতে যান",
      careAtEvercare: "এভারকেয়ারে সেবা",
      healthLibrary: "স্বাস্থ্য লাইব্রেরি",
      forMedicalProfessionals: "বিভাগ ও বিশেষজ্ঞ চিকিৎসক",
      researchAndEducation: "চিকিৎসা মান ও গভর্ন্যান্স",
      givingToEvercare: "রোগী সহায়তা ও সেবা",
      requestAppointment: "অ্যাপয়েন্টমেন্ট অনুরোধ",
      register: "নিবন্ধন",
      login: "লগ ইন",
      registerLogin: "নিবন্ধন / লগ ইন",
      myDashboard: "রোগী পোর্টাল",
      adminDashboard: "এভারকেয়ার অ্যাডমিন",
      logout: "লগ আউট",
      search: "অনুসন্ধান",
      closeSearch: "অনুসন্ধান বন্ধ করুন",
      languageLabel: "ভাষা:",
      emergencyLabel: "২৪/৭ জরুরি ও হেল্পলাইন:",
    },
    hero: {
      headline: "সমন্বিত যত্নে আপনার পাশে",
      subheadline:
        "আপনার সুস্বাস্থ্যকে সর্বোচ্চ অগ্রাধিকার দিয়ে বিশেষজ্ঞ চিকিৎসক ও সমন্বিত স্বাস্থ্যসেবাকে একত্রিত করছি।",
      primaryCta: "রোগী-কেন্দ্রিক সেবা সম্পর্কে জানুন",
      secondaryCta: "অ্যাপয়েন্টমেন্ট অনুরোধ",
      pauseMotion: " অ্যানিমেশন বিরতি",
      playMotion: "অ্যানিমেশন চালু করুন",
    },
    appointmentSection: {
      eyebrow: "এভারকেয়ারে সেবা • অনলাইন অনুরোধ",
      title: "অ্যাপয়েন্টমেন্টের জন্য অনুরোধ করুন",
      subtitle:
        "বিভাগ, বিশেষজ্ঞ চিকিৎসক, শাখা চেম্বার এবং সুবিধাজনক সময় নির্বাচন করুন। অনুরোধ জমা দিলে একটি ট্র্যাকিং রেফারেন্স কোড প্রদান করা হবে। ফ্রন্ট-ডেস্ক টিম যাচাই করার পরেই অ্যাপয়েন্টমেন্ট চূড়ান্ত (Confirmed) হিসেবে গণ্য হবে।",
      departmentLabel: "১. বিভাগ বা স্পেশালিটি",
      departmentPlaceholder: "সকল বিভাগ",
      doctorLabel: "২. বিশেষজ্ঞ চিকিৎসক",
      doctorPlaceholder: "যাচাইকৃত চিকিৎসক নির্বাচন করুন",
      branchLabel: "৩. হাসপাতালের শাখা ও চেম্বার",
      dateLabel: "৪. পছন্দের তারিখ",
      slotLabel: "৫. নির্ধারিত স্লট",
      visitTypeLabel: "পরামর্শের ধরন",
      visitNew: "নতুন পরামর্শ",
      visitFollowup: "ফলো-আপ ভিজিট",
      patientNameLabel: "রোগীর পূর্ণ নাম",
      patientNamePlaceholder: "যেমন: তানভীর আহমেদ",
      patientPhoneLabel: "মোবাইল নম্বর (বাংলাদেশ)",
      patientPhonePlaceholder: "যেমন: 01711223344",
      patientEmailLabel: "ইমেইল ঠিকানা (ঐচ্ছিক)",
      patientEmailPlaceholder: "name@example.com",
      reasonLabel: "সংক্ষিপ্ত নোট (ঐচ্ছিক — সংবেদনশীল চিকিৎসা ইতিহাস লিখবেন না)",
      reasonPlaceholder: "পছন্দের সময় বা সাধারণ পরামর্শের কারণ...",
      consentText:
        "আমি বুঝতে পারছি এটি একটি অ্যাপয়েন্টমেন্ট অনুরোধ যা স্টাফদের নিশ্চিতকরণের ওপর নির্ভরশীল এবং আমি এভারকেয়ারের গোপনীয়তা নীতিতে সম্মতি দিচ্ছি।",
      submitButton: "অ্যাপয়েন্টমেন্ট অনুরোধ জমা দিন",
      submittingButton: "জমা হচ্ছে...",
      trackExistingLink: "ইতিমধ্যে রেফারেন্স কোড আছে? স্ট্যাটাস ট্র্যাক করুন",
      unconfirmedNotice:
        "গুরুত্বপূর্ণ: অনুরোধ জমা দিলেই অ্যাপয়েন্টমেন্ট চূড়ান্ত হয় না। আমাদের ফ্রন্ট-ডেস্ক টিম স্লট যাচাই করে এসএমএস/ইমেইলের মাধ্যমে চূড়ান্ত নিশ্চিতকরণ জানাবে।",
    },
    alphabetSearchSection: {
      alphabetHeading: "প্রথম অক্ষর দিয়ে রোগ ও শারীরিক অবস্থা খুঁজুন",
      searchHeading: "রোগ, পরীক্ষা, চিকিৎসক ও বিভাগ অনুসন্ধান করুন",
      searchHint:
        "সাজেশন দেখতে ২ বা ততোধিক অক্ষর টাইপ করুন। কিবোর্ডের তীরচিহ্ন ব্যবহার করে সাজেশন নির্বাচন করুন।",
      searchPlaceholder: "চিকিৎসক, রোগ, পরীক্ষা, বিভাগ খুঁজুন...",
      searchButton: "খুঁজুন",
      clearSearch: "মুছে ফেলুন",
      viewAllConditions: "সম্পূর্ণ A–Z তালিকা দেখুন",
    },
    storySections: {
      story1Title: "সুস্থতার যাত্রা শুরু হোক এখানেই",
      story1Sub1Title: "প্রথমবারেই সঠিক দিকনির্দেশনা",
      story1Sub1Body:
        "সঠিক রোগ নির্ণয় ও সমন্বিত বিশেষজ্ঞ পরামর্শের ওপরই কার্যকর চিকিৎসা নির্ভর করে। এভারকেয়ার অভিজ্ঞ কনসালট্যান্ট, ডায়াগনস্টিক সেবা এবং স্বচ্ছ সময়সূচী এক প্ল্যাটফর্মে নিয়ে এসেছে।",
      story1Sub2Title: "যাচাইকৃত বিশেষজ্ঞ ও স্বচ্ছ ফি ব্যবস্থাপনা",
      story1Sub2Body:
        "এভারকেয়ারে প্রকাশিত প্রতিটি চিকিৎসকের সময়সূচী এবং সেবার ফি-তে কার্যকর তারিখ ও প্রশাসনিক অনুমোদনের উল্লেখ থাকে।",
      story1Link: "আমাদের ক্লিনিক্যাল বিভাগসমূহ সম্পর্কে আরও জানুন।",
      story1Cta: "কেন এভারকেয়ার বেছে নেবেন",
      story2Title: "সারা বাংলাদেশ ও প্রবাসী রোগীদের জন্য বিশ্বমানের সেবা",
      story2Body:
        "ঢাকা, চট্টগ্রাম, সিলেটসহ দেশের যেকোনো প্রান্ত এবং প্রবাসী রোগীদের জন্য বিশেষজ্ঞ অ্যাপয়েন্টমেন্ট ও রোগী সহায়তা সমন্বয় করা আমরা সহজ করে তুলেছি।",
      story2Cta: "আন্তর্জাতিক ও দূরবর্তী রোগী সেবা",
    },
    locationsSection: {
      title: "শাখা ও অবস্থানসমূহ",
      description:
        "বাংলাদেশে এভারকেয়ার হাসপাতালের শাখাসমূহ সম্পর্কে জানুন অথবা চেম্বার সময়সূচী ও জরুরি যোগাযোগের জন্য নির্দিষ্ট শাখা নির্বাচন করুন।",
      cta: "সকল শাখা দেখুন",
    },
    featuredCareSection: {
      title: "বিশেষায়িত চিকিৎসা ক্ষেত্রসমূহ",
      description:
        "আমাদের অনুমোদিত ক্লিনিক্যাল প্রোগ্রামগুলোর মাধ্যমে আমরা সমন্বিত বিশেষজ্ঞ পরামর্শ ও ডায়াগনস্টিক সেবা প্রদান করি।",
      viewAllLink: "সকল বিভাগ ও স্পেশালিটি দেখুন",
    },
    institutionalBanner: {
      title: "স্বচ্ছ চিকিৎসা তথ্য থেকে রোগীর আস্থা—আরও দ্রুত",
      description:
        "যাচাইকৃত চিকিৎসা তথ্য, স্বচ্ছ কনসালটেশন ফি এবং নিরাপদ যোগাযোগের মাধ্যমে এভারকেয়ার প্রতিটি রোগীর জন্য সঠিক সেবা নিশ্চিত করে।",
      cta: "সেবার মান ও রোগী সহায়তা দেখুন",
    },
    footer: {
      findDoctor: "চিকিৎসক খুঁজুন",
      exploreCareers: "ক্যারিয়ার ও প্রশিক্ষণ",
      contactCallback: "কলব্যাক অনুরোধ বা মতামত জানান",
      aboutHeading: "এভারকেয়ার সম্পর্কে",
      medicalProfHeading: "বিভাগ ও স্পেশালিটি",
      patientServicesHeading: "রোগী ও দর্শনার্থী সেবা",
      internationalHeading: "আন্তর্জাতিক ও দূরবর্তী রোগী",
      financialHeading: "ফি স্বচ্ছতা ও সহায়তা",
      followHeading: "এভারকেয়ার অনুসরণ করুন",
      appHeading: "এভারকেয়ার পেশেন্ট পোর্টাল",
      copyright:
        "© ২০২৬ এভারকেয়ার হাসপাতাল প্ল্যাটফর্ম। সর্বস্বত্ব সংরক্ষিত। ডেডিকেটেড হাসপাতাল ডিজিটাল অপারেশনস ইনস্টলেশন (বাংলাদেশ)।",
    },
  },
} as const;

export function getDictionary(locale: Locale) {
  return dictionaries[locale] ?? dictionaries.en;
}

export function localizeField<T extends Record<string, unknown>>(
  item: T,
  baseKey: string,
  locale: Locale
): string {
  const suffix = locale === "bn" ? "Bn" : "En";
  const fallbackSuffix = "En";
  const val = item[`${baseKey}${suffix}`];
  if (typeof val === "string" && val.trim().length > 0) {
    return val;
  }
  const fallback = item[`${baseKey}${fallbackSuffix}`];
  return typeof fallback === "string" ? fallback : "";
}

export function localizeArrayField<T extends Record<string, unknown>>(
  item: T,
  baseKey: string,
  locale: Locale
): string[] {
  const suffix = locale === "bn" ? "Bn" : "En";
  const val = item[`${baseKey}${suffix}`];
  if (Array.isArray(val) && val.length > 0) {
    return val as string[];
  }
  const fallback = item[`${baseKey}En`];
  return Array.isArray(fallback) ? (fallback as string[]) : [];
}

