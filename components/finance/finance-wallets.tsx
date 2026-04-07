import { WalletCards } from "./wallet-cards";
import { AddTransaction } from "./add-transaction";

function fmt(n: number, currency = "KES") {
  return `${currency} ${n.toLocaleString("en-KE", { minimumFractionDigits: 2 })}`;
}

export function FinanceWallets({
  data,
  canAdmin,
}: {
  data: any;
  canAdmin: boolean;
}) {
  const { kpi, config, transactions } = data;

  const primaryTx = transactions
    .filter((t: any) => t.wallet === "primary")
    .slice(0, 10);
  const profitTx = transactions
    .filter((t: any) => t.wallet === "profit")
    .slice(0, 10);

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold">Wallets</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Balances, transfers and recent activity
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

      <WalletCards
        primaryBalance={kpi.primaryBalance}
        profitBalance={kpi.profitBalance}
        primaryGauge={kpi.primaryGauge}
        profitGauge={kpi.profitGauge}
        currency={config.currency}
        canTransfer={canAdmin}
      />

      {/* Recent activity per wallet */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <WalletHistory
          title="Primary Wallet"
          transactions={primaryTx}
          currency={config.currency}
        />
        <WalletHistory
          title="Profit Wallet"
          transactions={profitTx}
          currency={config.currency}
        />
      </div>
    </div>
  );
}

function WalletHistory({
  title,
  transactions,
  currency,
}: {
  title: string;
  transactions: any[];
  currency: string;
}) {
  return (
    <div className="rounded-2xl border border-border/60 bg-card p-5 flex flex-col gap-4">
      <p className="text-sm font-semibold text-foreground">{title} · Recent</p>
      {transactions.length === 0 ? (
        <p className="text-sm text-muted-foreground py-6 text-center">
          No transactions yet
        </p>
      ) : (
        <div className="flex flex-col divide-y divide-border/40">
          {transactions.map((tx: any) => (
            <div
              key={tx._id}
              className="flex items-center justify-between py-2.5 gap-3"
            >
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {tx.category}
                </p>
                <p className="text-xs text-muted-foreground">
                  {new Date(tx.date).toLocaleDateString("en-KE", {
                    day: "2-digit",
                    month: "short",
                  })}
                  {" · "}
                  {tx.platform}
                </p>
              </div>
              <span
                className={`text-sm font-semibold tabular-nums shrink-0 ${
                  tx.type === "revenue" ? "text-primary" : "text-destructive"
                }`}
              >
                {tx.type === "revenue" ? "+" : "−"}
                {fmt(tx.amount, currency)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
