import type { Metadata } from "next";
import { FacebookCampaignGenerator } from "@/components/admin/FacebookCampaignGenerator";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Daily Facebook Spotlight Studio | DeltaCare Marketing",
  description:
    "Generate high-resolution PNG individual doctor spotlight cards (1080×1080 & 1080×1350) and bilingual Facebook captions for active chamber sessions.",
};

export default function FacebookGeneratorPage() {
  return <FacebookCampaignGenerator />;
}

