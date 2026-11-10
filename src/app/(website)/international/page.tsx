import React from "react";
import { getServerLocale } from "@/lib/i18n/server";
import { ContentPage } from "@/components/ui/ContentPage";

export default async function InternationalPage() {
  const bn = (await getServerLocale()) === "bn";
  return bn ? (
    <ContentPage
      title="ঢাকার বাইরের ও প্রবাসী রোগী"
      intro="ঢাকার বাইরে বা বিদেশ থেকে আসা রোগীদের জন্য আমরা একাধিক বিশেষজ্ঞের পরামর্শ ও পরীক্ষা এক বা দুই দিনে সাজিয়ে দিই।"
      cta={{ label: "কলব্যাকের অনুরোধ করুন", href: "/contact" }}
      sections={[
        { heading: "এক সফরে সব পরামর্শ", body: "আপনার প্রয়োজনীয় ডাক্তার দেখানো ও পরীক্ষাগুলো আমরা একই সময়সূচীতে সমন্বয় করি, যাতে বারবার আসতে না হয়।" },
        { heading: "আগেই ফি জেনে নিন", body: "যাত্রার আগেই কনসালটেশন ফি ও পরীক্ষার খরচ জেনে নিন — কোনো লুকানো চার্জ নেই।" },
        { heading: "রোগী সহায়তা ডেস্ক", body: "আমাদের কোঅর্ডিনেটররা অ্যাপয়েন্টমেন্ট, রিপোর্ট জমা ও পরিবারের থাকার ব্যবস্থায় সহায়তা করেন।" },
      ]}
    />
  ) : (
    <ContentPage
      title="Patients from outside Dhaka & abroad"
      intro="Travelling from outside Dhaka or overseas? We arrange your consultations and tests together so you can be seen in a day or two."
      cta={{ label: "Request a callback", href: "/contact" }}
      sections={[
        { heading: "One trip, every consultation", body: "We coordinate the doctors and tests you need on the same schedule, so you don't have to make repeat visits." },
        { heading: "Know the fees before you travel", body: "See consultation fees and test charges in Taka before you set off — no hidden charges." },
        { heading: "Patient support desk", body: "Our coordinators help with appointments, report submission and accommodation guidance for your family." },
      ]}
    />
  );
}
