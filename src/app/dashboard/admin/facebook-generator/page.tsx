import type { Metadata } from "next";
import { redirect } from "next/navigation";
import {
  getCurrentSession,
  hasRolePermission,
  STAFF_ROLES,
} from "@/server/auth/session";
import { FacebookCampaignGenerator } from "@/components/admin/FacebookCampaignGenerator";
import { StaffPortalHeader } from "@/components/staff/StaffPortalHeader";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Daily Facebook Spotlight Studio | DeltaCare Marketing",
  description:
    "Generate high-resolution PNG individual doctor spotlight cards (1080×1080 & 1080×1350) and bilingual Facebook captions for active chamber sessions.",
};

export default async function FacebookGeneratorPage() {
  const session = await getCurrentSession();
  if (!session || !hasRolePermission(session, STAFF_ROLES)) {
    redirect("/login?redirect=/dashboard/admin/facebook-generator");
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <StaffPortalHeader
        user={{
          userId: session.userId,
          fullName: session.fullName,
          email: session.email,
          role: session.role,
        }}
      />
      <main className="flex-1">
        <FacebookCampaignGenerator />
      </main>
    </div>
  );
}

