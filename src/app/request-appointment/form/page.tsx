import { redirect } from "next/navigation";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Request Appointment Form | DeltaCare Hospital",
  description:
    "Complete your specialist appointment booking with DeltaCare. Verified BMDC consultants and real-time fixed-slot scheduling.",
};

export default async function RequestAppointmentFormPage({
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
