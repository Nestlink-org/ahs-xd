import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { getFinanceData } from "@/actions/finance";
import { getExecutionStats, getExecutionLogs } from "@/actions/execution";
import { getOpsStats, getOperations } from "@/actions/operations";
import { FinanceOverview } from "@/components/finance/finance-overview";
import { FinanceExpenses } from "@/components/finance/finance-expenses";
import { FinanceWallets } from "@/components/finance/finance-wallets";
import { CeoOverview } from "@/components/ceo/ceo-overview";
import { DriveExplorer } from "@/components/drive/drive-explorer";

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
  const data = await getFinanceData("all");

  // Finance sub-tabs
  if (tab === "expenses")
    return <FinanceExpenses data={data} canAdmin={false} />;
  if (tab === "wallets")
    return <FinanceWallets data={data} canAdmin={false} canTransfer={false} />;

  // XDDrive tab
  if (tab === "xddrive") {
    return (
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-semibold font-realce">XDDrive</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Financial document management
          </p>
        </div>
        <DriveExplorer />
      </div>
    );
  }

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
