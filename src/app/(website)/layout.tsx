import React from "react";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { EvercareAssistantWidget } from "@/components/assistant/EvercareAssistantWidget";
import { getCurrentSession } from "@/server/auth/session";

export default async function WebsiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getCurrentSession();
  const initialUser = session
    ? {
        id: session.userId,
        email: session.email,
        fullName: session.fullName,
        role: session.role,
      }
    : null;

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader initialUser={initialUser} />
      <main id="main-content" className="flex-1">
        {children}
      </main>
      <SiteFooter />
      <EvercareAssistantWidget />
    </div>
  );
}

