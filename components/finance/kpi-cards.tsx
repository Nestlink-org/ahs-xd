import {
  TrendingUp,
  TrendingDown,
  Wallet,
  ArrowRightLeft,
  Flame,
  Clock,
} from "lucide-react";

type KPI = {
  revenue: number;
  expenses: number;
  netCashFlow: number;
  primaryBalance: number;
  profitBalance: number;
  monthlyBurn: number;
  runway: number;
};

function fmt(n: number, currency = "KES") {
  return `${currency} ${Math.abs(n).toLocaleString("en-KE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function KpiCard({
  label,
  value,
  sub,
  icon: Icon,
  color,
  negative,
}: {
  label: string;
  value: string;
  sub?: string;
  icon: React.ElementType;
  color: string;
  negative?: boolean;
}) {
  return (
    <div className="rounded-xl border border-border/60 bg-card p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
          {label}
        </span>
        <div
          className={`h-8 w-8 rounded-lg ${color} flex items-center justify-center`}
        >
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <div>
        <p
          className={`text-2xl font-bold tabular-nums ${negative ? "text-destructive" : "text-foreground"}`}
        >
          {value}
        </p>
        {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

export function KpiCards({
  kpi,
  currency = "KES",
}: {
  kpi: KPI;
  currency?: string;
}) {
  const isNegative = kpi.netCashFlow < 0;

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
      <KpiCard
        label="Total Revenue"
        value={fmt(kpi.revenue, currency)}
        icon={TrendingUp}
        color="bg-primary/10 text-primary"
      />
      <KpiCard
        label="Total Expenses"
        value={fmt(kpi.expenses, currency)}
        icon={TrendingDown}
        color="bg-destructive/10 text-destructive"
      />
      <KpiCard
        label="Net Cash Flow"
        value={`${isNegative ? "-" : "+"}${fmt(kpi.netCashFlow, currency)}`}
        icon={ArrowRightLeft}
        color={
          isNegative
            ? "bg-destructive/10 text-destructive"
            : "bg-green-500/10 text-green-400"
        }
        negative={isNegative}
      />
      <KpiCard
        label="Primary Wallet"
        value={fmt(kpi.primaryBalance, currency)}
        icon={Wallet}
        color="bg-blue-500/10 text-blue-400"
      />
      <KpiCard
        label="Profit Wallet"
        value={fmt(kpi.profitBalance, currency)}
        icon={Wallet}
        color="bg-purple-500/10 text-purple-400"
      />
      <KpiCard
        label="Monthly Burn"
        value={fmt(kpi.monthlyBurn, currency)}
        sub="avg expenses / month"
        icon={Flame}
        color="bg-orange-500/10 text-orange-400"
      />
      <KpiCard
        label="Runway"
        value={`${kpi.runway.toFixed(1)} mo`}
        sub="at current burn rate"
        icon={Clock}
        color={
          kpi.runway < 3
            ? "bg-destructive/10 text-destructive"
            : "bg-green-500/10 text-green-400"
        }
      />
    </div>
  );
}
