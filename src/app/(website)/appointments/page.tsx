import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function AppointmentsPage({
  searchParams,
}: {
  searchParams: Promise<{
    doctorId?: string;
    departmentId?: string;
    branchId?: string;
  }>;
}) {
  const sp = await searchParams;
  const q = new URLSearchParams();
  if (sp.doctorId) q.set("doctorId", sp.doctorId);
  if (sp.departmentId) q.set("departmentId", sp.departmentId);
  if (sp.branchId) q.set("branchId", sp.branchId);
  const qs = q.toString();
  redirect(qs ? `/request-appointment?${qs}` : "/request-appointment");
}
