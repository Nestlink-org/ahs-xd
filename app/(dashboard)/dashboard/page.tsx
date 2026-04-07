import { getSession } from "@/lib/session";
import { getRoleHome } from "@/lib/roles";
import { redirect } from "next/navigation";

// /dashboard always redirects to the role-specific home
export default async function DashboardIndex() {
  const session = await getSession();
  if (!session) redirect("/login");
  redirect(getRoleHome(session.role));
}
