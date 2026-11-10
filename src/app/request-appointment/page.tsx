import { redirect } from "next/navigation";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Book Specialist Appointment Online | Evercare Hospital",
  description:
    "Interactive 3-step specialist appointment booking across Evercare Dhanmondi, Uttara, Mirpur, and nationwide branches with real-time fixed time slots and SMS confirmation.",
};

export default async function AppointmentLandingPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolvedParams = searchParams ? await searchParams : {};
  const qs = new URLSearchParams();

  for (const [key, value] of Object.entries(resolvedParams)) {
    if (typeof value === "string" && value) {
      qs.set(key, value);
    } else if (Array.isArray(value) && value[0]) {
      qs.set(key, value[0]);
    }
  }

  const queryString = qs.toString();
  redirect(queryString ? `/appointments?${queryString}` : "/appointments");
}
