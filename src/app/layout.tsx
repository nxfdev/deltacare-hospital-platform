import type { Metadata } from "next";
import "./globals.css";
import { LocaleProvider } from "@/lib/i18n/LocaleContext";
import { getServerLocale } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const bn = (await getServerLocale()) === "bn";
  return {
    icons: { icon: "/favicon.svg" },
    title: {
      default: bn ? "এভারকেয়ার হাসপাতাল ঢাকা" : "Evercare Hospital Dhaka",
      template: bn ? "%s | এভারকেয়ার" : "%s | Evercare",
    },
    description: bn
      ? "এভারকেয়ার হাসপাতাল — বিশেষজ্ঞ ডাক্তার, বিভাগসমূহ ও তাৎক্ষণিক অনলাইন অ্যাপয়েন্টমেন্ট।"
      : "Evercare Hospital — specialist doctors, departments and instant online appointments across Dhaka.",
  };
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = await getServerLocale();
  return (
    <html lang={locale}>
      <body className="min-h-screen flex flex-col bg-white text-[#080808] antialiased">
        <LocaleProvider initialLocale={locale}>{children}</LocaleProvider>
      </body>
    </html>
  );
}

