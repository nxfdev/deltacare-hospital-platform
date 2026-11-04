import type { Metadata } from "next";
import "./globals.css";
import { LocaleProvider } from "@/lib/i18n/LocaleContext";

export const metadata: Metadata = {
  title: {
    default: "DeltaCare — Care at DeltaCare | Hospital & Specialist Platform",
    template: "%s | DeltaCare",
  },
  description:
    "DeltaCare Hospital Platform — Coordinated multi-disciplinary specialist care across Bangladesh with verified doctor schedules, transparent consultation fees, and accountable online appointment requests.",
  keywords: [
    "DeltaCare",
    "Care at DeltaCare",
    "Hospital Platform Bangladesh",
    "Request Appointment",
    "Verified Specialist Directory",
    "DeltaCare Assistant",
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col bg-white text-[#080808] antialiased">
        <LocaleProvider>{children}</LocaleProvider>
      </body>
    </html>
  );
}

