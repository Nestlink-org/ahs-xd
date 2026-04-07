import { AddTransaction } from "./add-transaction";
import { TransactionTable } from "./transaction-table";
import { FinanceCharts } from "./finance-charts";

export function FinanceExpenses({
  data,
  canAdmin,
}: {
  data: any;
  canAdmin: boolean;
}) {
  const { transactions, monthlyTrend, categoryBreakdown, config } = data;

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold">Expenses</h1>
          <p className="text-sm text-muted-foreground mt-1">
            All transactions · filter, search and manage
          </p>
        </div>
        {canAdmin && (
          <AddTransaction
            primaryBalance={data.kpi.primaryBalance}
            profitBalance={data.kpi.profitBalance}
            currency={data.config.currency}
          />
        )}
      </div>

      {/* Expense donut + category bar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-3">
          <FinanceCharts
            monthlyTrend={monthlyTrend}
            categoryBreakdown={categoryBreakdown}
            serviceBreakdown={data.serviceBreakdown}
            currency={config.currency}
          />
        </div>
      </div>

      <TransactionTable
        transactions={transactions}
        currency={config.currency}
        canDelete={canAdmin}
      />
    </div>
  );
}
