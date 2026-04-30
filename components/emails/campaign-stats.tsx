"use client";

import { Card } from "@/components/ui/card";
import { Mail, Send, CheckCircle2, XCircle } from "lucide-react";

type Campaign = {
  status: "draft" | "queued" | "sending" | "sent" | "failed";
  sentCount: number;
  failedCount: number;
  recipients: string[];
};

export function CampaignStats({ campaigns }: { campaigns: Campaign[] }) {
  const totalCampaigns = campaigns.length;
  const sentCampaigns = campaigns.filter((c) => c.status === "sent").length;
  const draftCampaigns = campaigns.filter((c) => c.status === "draft").length;
  const totalEmailsSent = campaigns.reduce((sum, c) => sum + c.sentCount, 0);
  const totalEmailsFailed = campaigns.reduce(
    (sum, c) => sum + c.failedCount,
    0,
  );
  const successRate =
    totalEmailsSent + totalEmailsFailed > 0
      ? (
          (totalEmailsSent / (totalEmailsSent + totalEmailsFailed)) *
          100
        ).toFixed(1)
      : "0";

  const stats = [
    {
      label: "Total Campaigns",
      value: totalCampaigns,
      icon: Mail,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
      borderColor: "border-blue-500/20",
    },
    /*{
      label: "Sent Campaigns",
      value: sentCampaigns,
      icon: Send,
      color: "text-primary",
      bgColor: "bg-primary/10",
      borderColor: "border-primary/20",
    },
    {
      label: "Draft Campaigns",
      value: draftCampaigns,
      icon: Mail,
      color: "text-yellow-500",
      bgColor: "bg-yellow-500/10",
      borderColor: "border-yellow-500/20",
    },*/
    {
      label: "Emails Sent",
      value: totalEmailsSent.toLocaleString(),
      icon: CheckCircle2,
      color: "text-green-500",
      bgColor: "bg-green-500/10",
      borderColor: "border-green-500/20",
    },
    {
      label: "Success Rate",
      value: `${successRate}%`,
      icon: CheckCircle2,
      color: "text-primary",
      bgColor: "bg-primary/10",
      borderColor: "border-primary/20",
    },
    {
      label: "Failed Emails",
      value: totalEmailsFailed.toLocaleString(),
      icon: XCircle,
      color: "text-destructive",
      bgColor: "bg-destructive/10",
      borderColor: "border-destructive/20",
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat) => (
        <Card
          key={stat.label}
          className={`p-4 border ${stat.borderColor} ${stat.bgColor} rounded-none`}
        >
          <div className="flex items-start justify-between">
            <div className="flex flex-col gap-1">
              <p className="text-xs text-muted-foreground font-extrabold">
                {stat.label}
              </p>
              <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
            </div>
            <stat.icon className={`h-5 w-5 ${stat.color}`} />
          </div>
        </Card>
      ))}
    </div>
  );
}
