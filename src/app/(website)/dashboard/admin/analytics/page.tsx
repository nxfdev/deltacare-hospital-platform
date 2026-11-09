import type { Metadata } from "next";
import { AdminHealthcareAnalytics } from "@/components/admin/AdminHealthcareAnalytics";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Healthcare Data Analytics Suite | DeltaCare Hospital Management",
  description:
    "Real-time slot utilization, doctor popularity, patient wait-time sentiment, departmental rush heatmaps, and consultation revenue attribution across DeltaCare campuses.",
};

export default function AnalyticsDashboardPage() {
  return <AdminHealthcareAnalytics />;
}

