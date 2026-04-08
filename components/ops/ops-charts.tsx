"use client";

import { useState } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
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

const PIE_COLORS = ["#a78bfa", "#f97316", "#a3e635", "#60a5fa", "#f43f5e"];

function fmt(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return String(Math.round(n));
}

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

// ─── Calls & Meetings interactive bar chart ───────────────────────────────────

type TrendPoint = { date: string; calls: number; meetings: number };

function CallsMeetingsChart({ data }: { data: TrendPoint[] }) {
  const today = new Date().toISOString().split("T")[0];
  const twoWeeksAgo = new Date(Date.now() - 14 * 86400000)
    .toISOString()
    .split("T")[0];

  const [from, setFrom] = useState(twoWeeksAgo);
  const [to, setTo] = useState(today);
  const [view, setView] = useState<"both" | "calls" | "meetings">("both");

  const filtered = data.filter((d) => d.date >= from && d.date <= to);

  // Totals for the selected range
  const totalCalls = filtered.reduce((s, d) => s + d.calls, 0);
  const totalMeetings = filtered.reduce((s, d) => s + d.meetings, 0);

  return (
    <div className="rounded-xl border border-border/60 bg-card p-5 flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <p className="text-sm font-semibold text-foreground">
            Calls & Meetings
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {totalCalls} calls · {totalMeetings} meetings
          </p>
        </div>
        {/* View toggle */}
        <div className="flex gap-1">
          {(["both", "calls", "meetings"] as const).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`px-2.5 py-1 rounded-md text-xs font-medium capitalize transition-all cursor-pointer border ${
                view === v
                  ? "bg-foreground text-background border-foreground"
                  : "border-border/60 text-muted-foreground hover:bg-muted/50"
              }`}
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      {/* Date range */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-muted-foreground">From</span>
          <input
            type="date"
            value={from}
            max={to}
            onChange={(e) => setFrom(e.target.value)}
            className="h-8 rounded-md border border-input bg-input/50 px-2 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-muted-foreground">To</span>
          <input
            type="date"
            value={to}
            min={from}
            max={today}
            onChange={(e) => setTo(e.target.value)}
            className="h-8 rounded-md border border-input bg-input/50 px-2 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </div>
        <button
          onClick={() => {
            setFrom(twoWeeksAgo);
            setTo(today);
          }}
          className="text-xs text-primary hover:underline cursor-pointer"
        >
          Reset
        </button>
      </div>

      {/* Chart */}
      {filtered.length === 0 ? (
        <div className="h-40 flex items-center justify-center text-sm text-muted-foreground">
          No data for selected range
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={180}>
          <BarChart
            data={filtered}
            margin={{ top: 4, right: 4, left: 0, bottom: 0 }}
            barCategoryGap="40%"
            barGap={2}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="var(--border)"
              strokeOpacity={0.4}
              vertical={false}
            />
            <XAxis
              dataKey="date"
              {...axisProps}
              tickFormatter={(v) => v.slice(5)}
            />
            <YAxis {...axisProps} width={28} allowDecimals={false} />
            <Tooltip
              contentStyle={tooltipStyle}
              labelFormatter={(v) =>
                new Date(v).toLocaleDateString("en-KE", {
                  day: "2-digit",
                  month: "short",
                })
              }
            />
            <Legend
              wrapperStyle={{ fontSize: 11 }}
              iconType="circle"
              iconSize={8}
            />
            {(view === "both" || view === "calls") && (
              <Bar
                dataKey="calls"
                name="Calls"
                fill="#60a5fa"
                radius={[3, 3, 0, 0]}
                maxBarSize={80}
              />
            )}
            {(view === "both" || view === "meetings") && (
              <Bar
                dataKey="meetings"
                name="Meetings"
                fill="#a78bfa"
                radius={[3, 3, 0, 0]}
                maxBarSize={80}
              />
            )}
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}

export function OpsCharts({
  execStats,
  opsStats,
  currency = "KES",
}: {
  execStats: any;
  opsStats: any;
  currency?: string;
}) {
  // Build execution trend
  const execTrend = (execStats.trend ?? []).map((d: any) => ({
    date: d._id,
    calls: d.calls,
    meetings: d.meetings,
  }));

  // Build revenue by product
  const productRevenue = (opsStats.productBreakdown ?? []).map((p: any) => ({
    name: p._id,
    revenue: p.revenue,
    deals: p.count,
  }));

  // Status distribution
  const statusDist = (opsStats.statusDistribution ?? []).map((s: any) => ({
    name: s._id,
    value: s.count,
  }));

  // Monthly revenue trend
  const revMap: Record<string, any> = {};
  (opsStats.monthlyRevTrend ?? []).forEach((d: any) => {
    const key = `${MONTHS[d._id.month - 1]} ${String(d._id.year).slice(2)}`;
    if (!revMap[key])
      revMap[key] = { month: key, SafeSport: 0, ResultShield: 0 };
    revMap[key][d._id.type] = d.revenue;
  });
  const revTrend = Object.values(revMap);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Calls & Meetings — interactive bar chart with date filter */}
      <CallsMeetingsChart data={execTrend} />

      {/* Revenue by product */}
      <div className="rounded-xl border border-border/60 bg-card p-5 flex flex-col gap-4">
        <div>
          <p className="text-sm font-semibold text-foreground">
            Revenue by Product
          </p>
          <p className="text-xs text-muted-foreground">Closed deals</p>
        </div>
        {productRevenue.length === 0 ? (
          <div className="h-40 flex items-center justify-center text-sm text-muted-foreground">
            No closed deals yet
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={180}>
            <BarChart
              data={productRevenue}
              margin={{ top: 4, right: 4, left: 0, bottom: 0 }}
              barCategoryGap="40%"
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="var(--border)"
                strokeOpacity={0.4}
                vertical={false}
              />
              <XAxis dataKey="name" {...axisProps} />
              <YAxis tickFormatter={fmt} {...axisProps} width={40} />
              <Tooltip
                formatter={(v) => [
                  `${currency} ${Number(v).toLocaleString()}`,
                  "",
                ]}
                contentStyle={tooltipStyle}
              />
              <Bar
                dataKey="revenue"
                name="Revenue"
                radius={[4, 4, 0, 0]}
                maxBarSize={60}
              >
                {productRevenue.map((_: any, i: number) => (
                  <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Deal status distribution */}
      <div className="rounded-xl border border-border/60 bg-card p-5 flex flex-col gap-4">
        <div>
          <p className="text-sm font-semibold text-foreground">Deal Status</p>
          <p className="text-xs text-muted-foreground">
            All deals distribution
          </p>
        </div>
        {statusDist.length === 0 ? (
          <div className="h-40 flex items-center justify-center text-sm text-muted-foreground">
            No deals yet
          </div>
        ) : (
          <>
            <ResponsiveContainer width="100%" height={140}>
              <PieChart>
                <Pie
                  data={statusDist}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={60}
                  paddingAngle={3}
                >
                  {statusDist.map((_: any, i: number) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex items-center justify-center gap-4">
              {statusDist.map((s: any, i: number) => (
                <div key={s.name} className="flex items-center gap-1.5 text-xs">
                  <div
                    className="h-2 w-2 rounded-full"
                    style={{ background: PIE_COLORS[i % PIE_COLORS.length] }}
                  />
                  <span className="text-muted-foreground">{s.name}</span>
                  <span className="font-semibold">{s.value}</span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Monthly revenue trend by product */}
      <div className="rounded-xl border border-border/60 bg-card p-5 flex flex-col gap-4">
        <div>
          <p className="text-sm font-semibold text-foreground">
            Monthly Revenue Trend
          </p>
          <p className="text-xs text-muted-foreground">
            SafeSport vs ResultShield
          </p>
        </div>
        {revTrend.length === 0 ? (
          <div className="h-40 flex items-center justify-center text-sm text-muted-foreground">
            No data yet
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={180}>
            <BarChart
              data={revTrend}
              margin={{ top: 4, right: 4, left: 0, bottom: 0 }}
              barCategoryGap="30%"
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
                formatter={(v) => [
                  `${currency} ${Number(v).toLocaleString()}`,
                  "",
                ]}
                contentStyle={tooltipStyle}
              />
              <Legend
                wrapperStyle={{ fontSize: 11 }}
                iconType="circle"
                iconSize={8}
              />
              <Bar
                dataKey="SafeSport"
                name="SafeSport"
                fill="#a78bfa"
                radius={[3, 3, 0, 0]}
                maxBarSize={40}
              />
              <Bar
                dataKey="ResultShield"
                name="ResultShield"
                fill="#f97316"
                radius={[3, 3, 0, 0]}
                maxBarSize={40}
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
