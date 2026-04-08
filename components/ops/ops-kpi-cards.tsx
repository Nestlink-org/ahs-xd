import {
  Phone,
  Users,
  TrendingUp,
  Target,
  BarChart2,
  Zap,
  DollarSign,
} from "lucide-react";

function fmt(n: number, currency = "KES") {
  if (n >= 1_000_000) return `${currency} ${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${currency} ${(n / 1_000).toFixed(0)}K`;
  return `${currency} ${n.toLocaleString()}`;
}

function KpiCard({
  label,
  value,
  sub,
  icon: Icon,
  gradient,
  iconClass,
}: {
  label: string;
  value: string;
  sub?: string;
  icon: React.ElementType;
  gradient: string;
  iconClass: string;
}) {
  return (
    <div
      className={`rounded-2xl border border-border/60 p-4 flex flex-col gap-3 ${gradient}`}
    >
      <div
        className={`h-9 w-9 rounded-xl flex items-center justify-center ${iconClass}`}
      >
        <Icon className="h-4 w-4" />
      </div>
      <div>
        <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">
          {label}
        </p>
        <p className="font-realce text-xl tabular-nums mt-0.5 text-foreground">
          {value}
        </p>
        {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

export function OpsKpiCards({
  execStats,
  opsStats,
  currency = "KES",
}: {
  execStats: any;
  opsStats: any;
  currency?: string;
}) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
      <KpiCard
        label="Calls Today"
        value={String(execStats.callsToday)}
        sub={`${execStats.callsPerDay.toFixed(1)} avg/day`}
        icon={Phone}
        gradient="bg-linear-to-br from-blue-500/10 via-blue-500/5 to-transparent"
        iconClass="bg-blue-500/20 text-blue-400"
      />
      <KpiCard
        label="Meetings This Week"
        value={String(execStats.meetingsWeek)}
        sub={`${execStats.totalMeetings} this month`}
        icon={Users}
        gradient="bg-linear-to-br from-purple-500/10 via-purple-500/5 to-transparent"
        iconClass="bg-purple-500/20 text-purple-400"
      />
      <KpiCard
        label="Conversion Rate"
        value={`${execStats.conversionRate.toFixed(1)}%`}
        sub="Closings / Meetings"
        icon={Target}
        gradient={
          execStats.conversionRate < 20
            ? "bg-linear-to-br from-red-500/10 via-red-500/5 to-transparent"
            : "bg-linear-to-br from-primary/10 via-primary/5 to-transparent"
        }
        iconClass={
          execStats.conversionRate < 20
            ? "bg-red-500/20 text-red-400"
            : "bg-primary/20 text-primary"
        }
      />
      <KpiCard
        label="Deals Closed"
        value={String(opsStats.dealsClosed)}
        sub="All time"
        icon={Zap}
        gradient="bg-linear-to-br from-orange-500/10 via-orange-500/5 to-transparent"
        iconClass="bg-orange-500/20 text-orange-400"
      />
      <KpiCard
        label="Revenue Won"
        value={fmt(execStats.totalRevenueWon, currency)}
        sub="From execution logs"
        icon={DollarSign}
        gradient="bg-linear-to-br from-primary/10 via-primary/5 to-transparent"
        iconClass="bg-primary/20 text-primary"
      />
      <KpiCard
        label="Pipeline"
        value={fmt(opsStats.totalPipeline, currency)}
        sub={`${opsStats.pipelineCoverage.toFixed(0)}% coverage`}
        icon={BarChart2}
        gradient="bg-linear-to-br from-yellow-500/10 via-yellow-500/5 to-transparent"
        iconClass="bg-yellow-500/20 text-yellow-400"
      />
      <KpiCard
        label="Total Athletes"
        value={String(opsStats.totalAthletes)}
        sub="SafeSport"
        icon={Users}
        gradient="bg-linear-to-br from-emerald-500/10 via-emerald-500/5 to-transparent"
        iconClass="bg-emerald-500/20 text-emerald-400"
      />
      <KpiCard
        label="Revenue / Athlete"
        value={fmt(opsStats.revenuePerAthlete, currency)}
        sub="SafeSport"
        icon={TrendingUp}
        gradient="bg-linear-to-br from-cyan-500/10 via-cyan-500/5 to-transparent"
        iconClass="bg-cyan-500/20 text-cyan-400"
      />
    </div>
  );
}
