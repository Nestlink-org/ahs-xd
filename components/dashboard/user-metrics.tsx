"use client";

import { useState } from "react";
import { Users, UserCheck, UserX, Clock, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { UserForm } from "@/components/dashboard/user-form";

type Stats = {
  total: number;
  active: number;
  suspended: number;
  pending: number;
  byRole: { _id: string; count: number }[];
};

const METRIC_CARDS = [
  {
    key: "total",
    label: "Total users",
    icon: Users,
    color: "text-primary",
    bg: "bg-primary/10",
  },
  {
    key: "active",
    label: "Active",
    icon: UserCheck,
    color: "text-green-400",
    bg: "bg-green-500/10",
  },
  {
    key: "suspended",
    label: "Suspended",
    icon: UserX,
    color: "text-destructive",
    bg: "bg-destructive/10",
  },
  {
    key: "pending",
    label: "Pending setup",
    icon: Clock,
    color: "text-yellow-400",
    bg: "bg-yellow-500/10",
  },
];

export function UserMetrics({ stats }: { stats: Stats }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {METRIC_CARDS.map((card) => {
          const value = stats[card.key as keyof Stats] as number;
          return (
            <div
              key={card.key}
              className="rounded-tl-4xl rounded-br-4xl border border-border/60 bg-card p-4 flex flex-col gap-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                  {card.label}
                </span>
                <div
                  className={`h-8 w-8 rounded-lg ${card.bg} flex items-center justify-center`}
                >
                  <card.icon className={`h-4 w-4 ${card.color}`} />
                </div>
              </div>
              <p className="text-3xl font-bold text-foreground tabular-nums">
                {value}
              </p>
            </div>
          );
        })}
      </div>

      {/* Role breakdown + shortcut */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          {stats.byRole.map((r) => (
            <span
              key={r._id}
              className="text-xs px-2.5 py-1 rounded-full border border-border/60 bg-muted/50 text-muted-foreground capitalize"
            >
              {r._id}{" "}
              <span className="font-semibold text-foreground ml-1">
                {r.count}
              </span>
            </span>
          ))}
        </div>
        <Button
          size="sm"
          onClick={() => setOpen(true)}
          className="gap-2 shrink-0"
        >
          <Plus className="h-4 w-4" />
          Add user
        </Button>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Create new user</DialogTitle>
          </DialogHeader>
          <UserForm onClose={() => setOpen(false)} />
        </DialogContent>
      </Dialog>
    </>
  );
}
