import React from "react";
import { getServerLocale } from "@/lib/i18n/server";
import { ContentPage } from "@/components/ui/ContentPage";

export default async function AccessibilityPage() {
  const bn = (await getServerLocale()) === "bn";
  return bn ? (
    <ContentPage
      title="অ্যাক্সেসিবিলিটি"
      intro="রোগী, পরিচর্যাকারী ও দর্শনার্থী — সবাই যেন সহজে এই ওয়েবসাইট ব্যবহার করতে পারেন, সেজন্য আমরা WCAG 2.1 AA মান অনুসরণ করি।"
      sections={[
        { heading: "কিবোর্ড দিয়ে ব্যবহার", body: "প্রতিটি বাটন ও লিংকে স্পষ্ট ফোকাস চিহ্ন আছে এবং প্রতিটি পেজের শুরুতে মূল বিষয়ে যাওয়ার লিংক রয়েছে।" },
        { heading: "অ্যানিমেশন নিয়ন্ত্রণ", body: "আপনার ডিভাইসে কম অ্যানিমেশন সেটিং চালু থাকলে ওয়েবসাইটের নড়াচড়া স্বয়ংক্রিয়ভাবে বন্ধ হয়ে যায়।" },
        { heading: "ভাষা", body: "পুরো ওয়েবসাইট বাংলা অথবা ইংরেজিতে পড়া যায় — উপরের ভাষা বাটন থেকে পরিবর্তন করুন।" },
      ]}
    />
  ) : (
    <ContentPage
      title="Accessibility"
      intro="We follow WCAG 2.1 AA so patients, carers and visitors can use this website comfortably."
      sections={[
        { heading: "Keyboard friendly", body: "Every button and link has a clear focus outline, and each page starts with a skip-to-content link." },
        { heading: "Motion control", body: "If your device is set to reduce motion, animations on this website are switched off automatically." },
        { heading: "Language", body: "The whole website is available in English or Bangla — switch using the language button at the top." },
      ]}
    />
  );
}
