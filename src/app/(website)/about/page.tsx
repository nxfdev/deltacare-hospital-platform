import React from "react";
import { getServerLocale } from "@/lib/i18n/server";
import { ContentPage } from "@/components/ui/ContentPage";

const CONTENT = {
  en: {
    title: "About Evercare",
    intro:
      "Evercare is a multi-specialty hospital network in Dhaka bringing experienced specialists, modern diagnostics and coordinated care together for families across Bangladesh.",
    cta: "Find a doctor",
    sections: [
      {
        heading: "Care that comes together",
        body: "From the first consultation to follow-up, your doctors, nurses and diagnostic teams work as one. Reports move between departments digitally, so you don't have to carry files from floor to floor.",
      },
      {
        heading: "Specialists you can trust",
        body: "Our consultants are BMDC-registered and many hold teaching posts at leading medical colleges in Dhaka. Every profile on this website shows real chamber hours and transparent fees in Taka.",
      },
      {
        heading: "Modern technology",
        body: "3T MRI, cardiac CT, a biplane cath lab, HD endoscopy, laminar-airflow operating theatres and a Level-III NICU let us diagnose accurately and treat safely — close to home.",
      },
      {
        heading: "Careers",
        body: "We welcome doctors, nurses and allied health professionals who share our commitment to patient-centred care. Call 10666 or visit the Contact page to reach our HR team.",
      },
    ],
  },
  bn: {
    title: "এভারকেয়ার সম্পর্কে",
    intro:
      "এভারকেয়ার ঢাকার একটি মাল্টি-স্পেশালিটি হাসপাতাল নেটওয়ার্ক — অভিজ্ঞ বিশেষজ্ঞ, আধুনিক রোগনির্ণয় ও সমন্বিত চিকিৎসা এক জায়গায়, সারা দেশের পরিবারের জন্য।",
    cta: "ডাক্তার খুঁজুন",
    sections: [
      {
        heading: "সমন্বিত চিকিৎসাসেবা",
        body: "প্রথম পরামর্শ থেকে ফলো-আপ পর্যন্ত আপনার ডাক্তার, নার্স ও ডায়াগনস্টিক টিম একসাথে কাজ করে। রিপোর্ট ডিজিটালভাবে এক বিভাগ থেকে অন্য বিভাগে পৌঁছে যায়, তাই ফাইল হাতে ঘুরতে হয় না।",
      },
      {
        heading: "আস্থাভাজন বিশেষজ্ঞ",
        body: "আমাদের কনসালট্যান্টরা বিএমডিসি নিবন্ধিত এবং অনেকেই ঢাকার শীর্ষস্থানীয় মেডিকেল কলেজে শিক্ষকতা করেন। ওয়েবসাইটে প্রতিটি ডাক্তারের প্রকৃত চেম্বার সময় ও টাকায় স্বচ্ছ ফি দেওয়া আছে।",
      },
      {
        heading: "আধুনিক প্রযুক্তি",
        body: "৩ টেসলা এমআরআই, কার্ডিয়াক সিটি, বাইপ্লেন ক্যাথ ল্যাব, এইচডি এন্ডোস্কপি, ল্যামিনার এয়ারফ্লো অপারেশন থিয়েটার ও লেভেল-৩ এনআইসিইউ — দেশেই নির্ভুল রোগনির্ণয় ও নিরাপদ চিকিৎসা।",
      },
      {
        heading: "ক্যারিয়ার",
        body: "রোগী-কেন্দ্রিক সেবায় অঙ্গীকারবদ্ধ ডাক্তার, নার্স ও স্বাস্থ্যকর্মীদের আমরা স্বাগত জানাই। আমাদের এইচআর টিমের সাথে যোগাযোগ করতে ১০৬৬৬ নম্বরে কল করুন অথবা যোগাযোগ পেজ দেখুন।",
      },
    ],
  },
};

export default async function AboutPage() {
  const c = CONTENT[await getServerLocale()];
  return <ContentPage title={c.title} intro={c.intro} sections={c.sections} cta={{ label: c.cta, href: "/doctors" }} />;
}
