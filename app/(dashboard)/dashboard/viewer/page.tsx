import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { getFinanceData } from "@/actions/finance";
import { FinanceOverview } from "@/components/finance/finance-overview";
import { FinanceExpenses } from "@/components/finance/finance-expenses";
import { FinanceWallets } from "@/components/finance/finance-wallets";

type SearchParams = Promise<{ tab?: string }>;

export default async function ViewerDashboard({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  const { tab = "overview" } = await searchParams;
  const data = await getFinanceData("month");

  if (tab === "expenses")
    return <FinanceExpenses data={data} canAdmin={false} />;
  if (tab === "wallets") return <FinanceWallets data={data} canAdmin={false} />;
  return <FinanceOverview data={data} canAdmin={false} />;
}
