import React from "react";
import { getHospitalConfig } from "@/server/services/publicQueryService";
import { getServerLocale } from "@/lib/i18n/server";
import { ContentPage } from "@/components/ui/ContentPage";

export default async function TermsPage() {
  const h = getHospitalConfig();
  const bn = (await getServerLocale()) === "bn";
  return bn ? (
    <ContentPage
      title="ব্যবহারের শর্তাবলী"
      sections={[
        {
          heading: "অনলাইনে চিকিৎসা পরামর্শ নয়",
          body: `এই ওয়েবসাইটের রোগ, পরীক্ষা ও সহায়কের তথ্য শুধুমাত্র সচেতনতার জন্য। এটি চিকিৎসকের পরামর্শ, রোগনির্ণয় বা প্রেসক্রিপশনের বিকল্প নয়। জরুরি প্রয়োজনে ${h.helplinePhone} নম্বরে কল করুন।`,
        },
        { heading: "অ্যাপয়েন্টমেন্ট ও বাতিল নীতি", body: h.cancellationPolicyBn },
        {
          heading: "ফি ও সময়সূচী",
          body: "প্রকাশিত কনসালটেশন ফি ও পরীক্ষার চার্জ হাসপাতাল কর্তৃপক্ষ অনুমোদিত। পরিবর্তন হলে ওয়েবসাইটে হালনাগাদ করা হয়।",
        },
      ]}
    />
  ) : (
    <ContentPage
      title="Terms of use"
      sections={[
        {
          heading: "No online medical advice",
          body: `Information on this website — including condition guides, test information and the assistant — is for general awareness only. It is not a substitute for a consultation, diagnosis or prescription. In an emergency, call ${h.helplinePhone}.`,
        },
        { heading: "Appointments & cancellations", body: h.cancellationPolicyEn },
        {
          heading: "Fees & schedules",
          body: "Published consultation fees and test charges are approved by hospital management and updated here whenever they change.",
        },
      ]}
    />
  );
}
