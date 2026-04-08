import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { getFinanceData } from "@/actions/finance";
import { getExecutionStats, getExecutionLogs } from "@/actions/execution";
import { getOpsStats, getOperations } from "@/actions/operations";
import { OpsKpiCards } from "@/components/ops/ops-kpi-cards";
import { OpsCharts } from "@/components/ops/ops-charts";
import { ExecutionForm } from "@/components/ops/execution-form";
import { ExecutionTable } from "@/components/ops/execution-table";
import { OpsForm } from "@/components/ops/ops-form";
import { OpsTable } from "@/components/ops/ops-table";

type SearchParams = Promise<{ tab?: string }>;

export default async function OpsDashboard({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const session = await getSession();
  if (
    !session ||
    !["superadmin", "admin", "ops", "sales"].includes(session.role)
  ) {
    redirect("/login");
  }

  const { tab = "overview" } = await searchParams;
  const canEdit = ["superadmin", "admin", "ops"].includes(session.role);

  const [execStats, opsStats, financeData] = await Promise.all([
    getExecutionStats(),
    getOpsStats(),
    getFinanceData("month"),
  ]);

  if (tab === "execution") {
    const logs = await getExecutionLogs("month");
    return (
      <div className="flex flex-col gap-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-semibold font-realce">
              Execution Log
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Daily activity tracking
            </p>
          </div>
        </div>
        {canEdit && <ExecutionForm />}
        <ExecutionTable
          logs={logs}
          currency={financeData.config.currency}
          canEdit={canEdit}
        />
      </div>
    );
  }

  if (tab === "deals") {
    const operations = await getOperations();
    return (
      <div className="flex flex-col gap-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-semibold">Deals & Operations</h1>
            <p className="text-sm text-muted-foreground mt-1">
              SafeSport · ResultShield
            </p>
          </div>
          {canEdit && <OpsForm />}
        </div>
        <OpsTable
          operations={operations}
          currency={financeData.config.currency}
          canEdit={canEdit}
        />
      </div>
    );
  }

  // Overview
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold font-realce">Operations</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Execution · Pipeline · Performance
          </p>
        </div>
        {canEdit && <OpsForm />}
      </div>

      <OpsKpiCards
        execStats={execStats}
        opsStats={opsStats}
        currency={financeData.config.currency}
      />

      <OpsCharts
        execStats={execStats}
        opsStats={opsStats}
        currency={financeData.config.currency}
      />
    </div>
  );
}
