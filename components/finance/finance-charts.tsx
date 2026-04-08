"use client";

import { useState } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
} from "recharts";

// ─── Types ────────────────────────────────────────────────────────────────────

type MonthlyPoint = {
  _id: { year: number; month: number; type: string; wallet: string };
  total: number;
};
type CategoryPoint = { _id: string; total: number };

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

const PIE_COLORS = [
  "var(--color-chart-1)",
  "var(--color-chart-2)",
  "var(--color-chart-3)",
  "var(--color-chart-4)",
  "var(--color-chart-5)",
  "#a3e635",
];

const C = {
  revenue: "#a3e635", // primary green
  expense: "#ef4444", // red
  primary: "#60a5fa", // blue — primary wallet
  profit: "#a78bfa", // purple — profit wallet
};

// ─── Build chart data ─────────────────────────────────────────────────────────

type TrendRow = {
  month: string;
  revenue: number;
  expenses: number;
  primaryRevenue: number;
  profitRevenue: number;
  primaryExpenses: number;
  profitExpenses: number;
};

function buildTrend(raw: MonthlyPoint[]): TrendRow[] {
  const map: Record<string, TrendRow> = {};

  raw.forEach(({ _id, total }) => {
    const key = `${_id.year}-${String(_id.month).padStart(2, "0")}`;
    if (!map[key]) {
      map[key] = {
        month: `${MONTHS[_id.month - 1]} ${String(_id.year).slice(2)}`,
        revenue: 0,
        expenses: 0,
        primaryRevenue: 0,
        profitRevenue: 0,
        primaryExpenses: 0,
        profitExpenses: 0,
      };
    }
    const r = map[key];
    if (_id.type === "revenue") {
      r.revenue += total;
      if (_id.wallet === "primary") r.primaryRevenue += total;
      else r.profitRevenue += total;
    } else {
      r.expenses += total;
      if (_id.wallet === "primary") r.primaryExpenses += total;
      else r.profitExpenses += total;
    }
  });

  return Object.values(map);
}

function fmt(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return String(Math.round(n));
}

// ─── View modes ───────────────────────────────────────────────────────────────

type ViewMode =
  | "rev_vs_exp" // Total Revenue vs Expenses
  | "primary_vs_exp" // Primary wallet revenue vs Expenses
  | "profit_vs_exp" // Profit wallet revenue vs Expenses
  | "both_vs_exp" // Primary + Profit stacked vs Expenses
  | "primary_vs_profit"; // Primary wallet vs Profit wallet (capital vs retained)

const VIEW_OPTIONS: { value: ViewMode; label: string }[] = [
  { value: "rev_vs_exp", label: "Revenue vs Expenses" },
  { value: "primary_vs_exp", label: "Primary vs Expenses" },
  { value: "profit_vs_exp", label: "Profit vs Expenses" },
  { value: "both_vs_exp", label: "Primary + Profit vs Expenses" },
  { value: "primary_vs_profit", label: "Primary vs Profit" },
];

type TimeRange = "3m" | "6m" | "12m";

// ─── Main chart component ─────────────────────────────────────────────────────

function RevenueExpenseChart({
  trend,
  currency,
}: {
  trend: TrendRow[];
  currency: string;
}) {
  const [view, setView] = useState<ViewMode>("rev_vs_exp");
  const [range, setRange] = useState<TimeRange>("6m");

  const sliced =
    range === "3m" ? trend.slice(-3) : range === "6m" ? trend.slice(-6) : trend;

  const tooltipStyle = {
    backgroundColor: "var(--card)",
    border: "1px solid var(--border)",
    borderRadius: 10,
    fontSize: 12,
    boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
  };

  const axisProps = {
    tick: { fontSize: 11, fill: "var(--muted-foreground)" },
    tickLine: false,
    axisLine: false,
  };

  function renderBars() {
    switch (view) {
      case "rev_vs_exp":
        return (
          <>
            <Bar
              dataKey="revenue"
              name="Revenue"
              fill={C.revenue}
              radius={[3, 3, 0, 0]}
              maxBarSize={80}
            />
            <Bar
              dataKey="expenses"
              name="Expenses"
              fill={C.expense}
              radius={[3, 3, 0, 0]}
              maxBarSize={80}
            />
          </>
        );
      case "primary_vs_exp":
        return (
          <>
            <Bar
              dataKey="primaryRevenue"
              name="Primary Revenue"
              fill={C.primary}
              radius={[3, 3, 0, 0]}
              maxBarSize={80}
            />
            <Bar
              dataKey="expenses"
              name="Expenses"
              fill={C.expense}
              radius={[3, 3, 0, 0]}
              maxBarSize={80}
            />
          </>
        );
      case "profit_vs_exp":
        return (
          <>
            <Bar
              dataKey="profitRevenue"
              name="Profit Revenue"
              fill={C.profit}
              radius={[3, 3, 0, 0]}
              maxBarSize={80}
            />
            <Bar
              dataKey="expenses"
              name="Expenses"
              fill={C.expense}
              radius={[3, 3, 0, 0]}
              maxBarSize={80}
            />
          </>
        );
      case "both_vs_exp":
        return (
          <>
            <Bar
              dataKey="primaryRevenue"
              name="Primary"
              stackId="rev"
              fill={C.primary}
              radius={[0, 0, 0, 0]}
              maxBarSize={80}
            />
            <Bar
              dataKey="profitRevenue"
              name="Profit"
              stackId="rev"
              fill={C.profit}
              radius={[3, 3, 0, 0]}
              maxBarSize={80}
            />
            <Bar
              dataKey="expenses"
              name="Expenses"
              fill={C.expense}
              radius={[3, 3, 0, 0]}
              maxBarSize={80}
            />
          </>
        );
      case "primary_vs_profit":
        return (
          <>
            <Bar
              dataKey="primaryRevenue"
              name="Primary Wallet"
              fill={C.primary}
              radius={[3, 3, 0, 0]}
              maxBarSize={80}
            />
            <Bar
              dataKey="profitRevenue"
              name="Profit Wallet"
              fill={C.profit}
              radius={[3, 3, 0, 0]}
              maxBarSize={80}
            />
          </>
        );
    }
  }

  const viewLabel = VIEW_OPTIONS.find((v) => v.value === view)?.label ?? "";

  return (
    <div className="rounded-tl-4xl rounded-br-4xl border border-border/60 bg-card p-5 flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <p className="text-sm font-semibold text-foreground">{viewLabel}</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Bar chart ·{" "}
            {range === "3m"
              ? "Last 3 months"
              : range === "6m"
                ? "Last 6 months"
                : "All time"}
          </p>
        </div>

        {/* Time range */}
        <div className="flex items-center gap-1">
          {(["3m", "6m", "12m"] as TimeRange[]).map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all cursor-pointer ${
                range === r
                  ? "bg-primary/15 text-primary border border-primary/30"
                  : "text-muted-foreground hover:bg-muted/60 border border-transparent"
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* View mode selector */}
      <div className="flex flex-wrap gap-1.5">
        {VIEW_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => setView(opt.value)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-all cursor-pointer border ${
              view === opt.value
                ? "bg-foreground text-background border-foreground"
                : "border-border/60 text-muted-foreground hover:bg-muted/50"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Chart */}
      {sliced.length === 0 ? (
        <div className="h-48 flex items-center justify-center text-sm text-muted-foreground">
          No data for this period
        </div>
      ) : (
        <div className="w-full">
          <ResponsiveContainer width="100%" height={200}>
            <BarChart
              data={sliced}
              margin={{ top: 4, right: 4, left: 0, bottom: 0 }}
              barGap={2}
              barCategoryGap="40%"
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="var(--border)"
                strokeOpacity={0.4}
                vertical={false}
              />
              <XAxis dataKey="month" {...axisProps} />
              <YAxis tickFormatter={fmt} {...axisProps} width={40} />
              <Tooltip
                formatter={(v, name) => [
                  `${currency} ${Number(v).toLocaleString()}`,
                  name,
                ]}
                contentStyle={tooltipStyle}
                cursor={{ fill: "var(--muted)", opacity: 0.3 }}
              />
              <Legend
                wrapperStyle={{ fontSize: 11, paddingTop: 8 }}
                iconType="circle"
                iconSize={8}
              />
              {renderBars()}
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Net indicator */}
      {sliced.length > 0 && (
        <div className="flex items-center gap-4 pt-1 border-t border-border/40 flex-wrap">
          {sliced.slice(-1).map((d) => {
            const net = d.revenue - d.expenses;
            return (
              <div key={d.month} className="flex items-center gap-4 text-xs">
                <span className="text-muted-foreground">Latest month net:</span>
                <span
                  className={`font-semibold tabular-nums ${net >= 0 ? "text-primary" : "text-destructive"}`}
                >
                  {net >= 0 ? "+" : "−"}
                  {currency} {Math.abs(net).toLocaleString()}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Donut charts ─────────────────────────────────────────────────────────────

function DonutChart({
  categoryBreakdown,
  serviceBreakdown,
  currency,
}: {
  categoryBreakdown: CategoryPoint[];
  serviceBreakdown: CategoryPoint[];
  currency: string;
}) {
  const [view, setView] = useState<"category" | "service">("category");
  const data = view === "category" ? categoryBreakdown : serviceBreakdown;
  const hasService = serviceBreakdown.length > 0;

  return (
    <div className="rounded-tl-4xl rounded-br-4xl border border-border/60 bg-card p-5 flex flex-col gap-4 h-full">
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-foreground">
            {view === "category" ? "By Category" : "By Service"}
          </p>
          <p className="text-xs text-muted-foreground">Expense breakdown</p>
        </div>
        {hasService && (
          <div className="flex gap-1">
            {(["category", "service"] as const).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all cursor-pointer border ${
                  view === v
                    ? "bg-foreground text-background border-foreground"
                    : "border-border/60 text-muted-foreground hover:bg-muted/50"
                }`}
              >
                {v === "category" ? "Category" : "Service"}
              </button>
            ))}
          </div>
        )}
      </div>

      {data.length === 0 ? (
        <div className="flex-1 flex items-center justify-center text-sm text-muted-foreground py-8">
          No data
        </div>
      ) : (
        <>
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie
                data={data}
                dataKey="total"
                nameKey="_id"
                cx="50%"
                cy="50%"
                innerRadius={45}
                outerRadius={70}
                paddingAngle={3}
              >
                {data.map((_, i) => (
                  <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                formatter={(v) => [
                  `${currency} ${Number(v).toLocaleString()}`,
                  "",
                ]}
                contentStyle={{
                  backgroundColor: "var(--card)",
                  border: "1px solid var(--border)",
                  borderRadius: 10,
                  fontSize: 12,
                  boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-col gap-1.5">
            {data.slice(0, 5).map((c, i) => (
              <div
                key={c._id}
                className="flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-2">
                  <div
                    className="h-2 w-2 rounded-full shrink-0"
                    style={{ background: PIE_COLORS[i % PIE_COLORS.length] }}
                  />
                  <span className="text-muted-foreground truncate max-w-28">
                    {c._id}
                  </span>
                </div>
                <span className="font-medium tabular-nums">{fmt(c.total)}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ─── Exports ──────────────────────────────────────────────────────────────────

export function FinanceCharts({
  monthlyTrend,
  categoryBreakdown,
  serviceBreakdown = [],
  currency = "KES",
}: {
  monthlyTrend: MonthlyPoint[];
  categoryBreakdown: CategoryPoint[];
  serviceBreakdown?: CategoryPoint[];
  currency?: string;
}) {
  const trend = buildTrend(monthlyTrend);

  return (
    <div className="flex flex-col gap-4">
      {/* Main interactive bar chart + donut side by side */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <div className="lg:col-span-3">
          <RevenueExpenseChart trend={trend} currency={currency} />
        </div>
        <div className="lg:col-span-2 flex flex-col gap-4">
          <DonutChart
            categoryBreakdown={categoryBreakdown}
            serviceBreakdown={serviceBreakdown}
            currency={currency}
          />
        </div>
      </div>
    </div>
  );
}
