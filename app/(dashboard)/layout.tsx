import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/dashboard/shell";
import { RealtimeRefresh } from "@/components/dashboard/realtime-refresh";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  return (
    <DashboardShell session={session}>
      <RealtimeRefresh />
      {children}
    </DashboardShell>
  );
}
