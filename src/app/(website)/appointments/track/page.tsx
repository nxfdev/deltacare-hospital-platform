import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function TrackRedirectPage({
  searchParams,
}: {
  searchParams: Promise<{
    reference?: string;
    phone?: string;
  }>;
}) {
  const sp = await searchParams;
  const q = new URLSearchParams();
  if (sp.reference) q.set("reference", sp.reference);
  if (sp.phone) q.set("phone", sp.phone);
  const qs = q.toString();
  redirect(qs ? `/track-appointment?${qs}` : "/track-appointment");
}
