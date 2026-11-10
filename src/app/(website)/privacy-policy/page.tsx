import React from "react";
import { getHospitalConfig } from "@/server/services/publicQueryService";
import { getServerLocale } from "@/lib/i18n/server";
import { ContentPage } from "@/components/ui/ContentPage";

export default async function PrivacyPolicyPage() {
  const h = getHospitalConfig();
  const bn = (await getServerLocale()) === "bn";
  return bn ? (
    <ContentPage
      title="গোপনীয়তা নীতি"
      intro={h.privacyNoticeBn}
      sections={[
        {
          heading: "আমরা কী তথ্য সংগ্রহ করি",
          body: "অ্যাপয়েন্টমেন্ট ও যোগাযোগ ফর্মে শুধু আপনার নাম, মোবাইল নম্বর, ঐচ্ছিক ইমেইল, পছন্দের ডাক্তার/শাখা/সময় এবং সংক্ষিপ্ত নোট নেওয়া হয়। অনুগ্রহ করে ফর্মে চিকিৎসা রিপোর্ট বা ছবি আপলোড করবেন না।",
        },
        {
          heading: "মতামত ও অভিযোগের গোপনীয়তা",
          body: "সকল মতামত ও অভিযোগ গোপন রাখা হয় এবং শুধুমাত্র অনুমোদিত রোগী সম্পর্ক ও প্রশাসনিক কর্মীরা দেখতে পারেন।",
        },
        {
          heading: "নিরাপত্তা",
          body: "প্রশাসনিক পরিবর্তন অডিট লগে সংরক্ষিত হয় এবং সহায়কের কাছে করা স্বাস্থ্যসংক্রান্ত প্রশ্ন বিশ্লেষণ থেকে আড়াল রাখা হয়।",
        },
      ]}
    />
  ) : (
    <ContentPage
      title="Privacy policy"
      intro={h.privacyNoticeEn}
      sections={[
        {
          heading: "What we collect",
          body: "Appointment and contact forms collect only your name, mobile number, optional email, preferred doctor, branch and time, and a short note. Please don't upload medical reports or images into public forms.",
        },
        {
          heading: "Confidential feedback",
          body: "All feedback and complaints are kept private and are visible only to authorised patient-relations and administrative staff.",
        },
        {
          heading: "Security",
          body: "Administrative changes are recorded in an audit log, and health questions asked to the assistant are redacted from analytics.",
        },
      ]}
    />
  );
}
