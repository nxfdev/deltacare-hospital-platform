import type { Metadata } from "next";
import { FrontDeskScheduleManager } from "@/components/staff/FrontDeskScheduleManager";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Front Desk & Doctor Assistant Schedule Manager | DeltaCare Hospital",
  description:
    "Operational Front Desk, Chamber Assistant 14-day fixed-slot calendar, 2-click extra chamber uploader, emergency leave blocker, and SMS confirmation queue.",
};

export default function FrontDeskDashboardPage() {
  return <FrontDeskScheduleManager />;
}

