"use client";

import { useRouter, usePathname } from "next/navigation";
import { FinanceOverview } from "@/components/finance/finance-overview";
import { OpsKpiCards } from "@/components/ops/ops-kpi-cards";
import { OpsCharts } from "@/components/ops/ops-charts";
import { BarChart2, Wallet } from "lucide-react";

export function CeoOverview({
  financeData,
  execStats,
  opsStats,
  activeView,
}: {
  financeData: any;
  execStats: any;
  opsStats: any;
  activeView: "finance" | "ops";
}) {
  const router = useRouter();
  const pathname = usePathname();

  function setView(v: "finance" | "ops") {
    router.push(`${pathname}?view=${v}`);
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header + toggle */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold font-realce">CEO Overview</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Real-time execution, finance and operations intelligence
          </p>
        </div>

        {/* Toggle */}
        <div className="flex items-center gap-1 rounded-xl border border-border/60 bg-muted/30 p-1">
          <button
            onClick={() => setView("finance")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer ${
              activeView === "finance"
                ? "bg-card text-foreground shadow-sm border border-border/60"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Wallet className="h-4 w-4" />
            Finance
          </button>
          <button
            onClick={() => setView("ops")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer ${
              activeView === "ops"
                ? "bg-card text-foreground shadow-sm border border-border/60"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <BarChart2 className="h-4 w-4" />
            Operations
          </button>
        </div>
      </div>

      {/* Content */}
      {activeView === "finance" ? (
        <FinanceOverview
          data={financeData}
          canAdmin={false}
          canTransfer={false}
        />
      ) : (
        <div className="flex flex-col gap-6">
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
      )}
    </div>
  );
}
