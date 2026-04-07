import { getUsers, getUserStats } from "@/actions/users";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { UserManagement } from "@/components/dashboard";
import { UserMetrics } from "@/components/dashboard/user-metrics";

export default async function SuperAdminPage() {
  const session = await getSession();
  if (!session || session.role !== "superadmin") redirect("/dashboard");

  const [users, stats] = await Promise.all([getUsers(), getUserStats()]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">
          User Management
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage system users, roles and access
        </p>
      </div>
      <UserMetrics stats={stats} />
      <UserManagement users={users} currentUserId={session.userId} />
    </div>
  );
}
