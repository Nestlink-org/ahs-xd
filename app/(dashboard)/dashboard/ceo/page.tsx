import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { getFinanceData } from "@/actions/finance";
import { getExecutionStats, getExecutionLogs } from "@/actions/execution";
import { getOpsStats, getOperations } from "@/actions/operations";
import { FinanceOverview } from "@/components/finance/finance-overview";
import { FinanceExpenses } from "@/components/finance/finance-expenses";
import { FinanceWallets } from "@/components/finance/finance-wallets";
import { CeoOverview } from "@/components/ceo/ceo-overview";

type SearchParams = Promise<{ tab?: string; view?: string }>;

export default async function CeoDashboard({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const session = await getSession();
  if (!session || !["superadmin", "admin"].includes(session.role)) {
    redirect("/login");
  }

  const { tab = "overview", view = "finance" } = await searchParams;
  const data = await getFinanceData("month");

  // Finance sub-tabs
  if (tab === "expenses")
    return <FinanceExpenses data={data} canAdmin={false} />;
  if (tab === "wallets")
    return <FinanceWallets data={data} canAdmin={false} canTransfer={false} />;

  // Overview — togglable Finance vs Ops
  const [execStats, opsStats] = await Promise.all([
    getExecutionStats(),
    getOpsStats(),
  ]);

  return (
    <CeoOverview
      financeData={data}
      execStats={execStats}
      opsStats={opsStats}
      activeView={view as "finance" | "ops"}
    />
  );
}
