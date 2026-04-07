"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { transferToProfit } from "@/actions/finance";

function fmt(n: number, currency = "KES") {
  return `${currency} ${n.toLocaleString("en-KE", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;
}

function SubmitBtn() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full cursor-pointer">
      {pending ? "Transferring..." : "Confirm Transfer"}
    </Button>
  );
}

// ─── Gauge ────────────────────────────────────────────────────────────────────

function WalletGauge({
  balance,
  totalIn,
  totalOut,
  color,
  currency,
}: {
  balance: number;
  totalIn: number;
  totalOut: number;
  color: string;
  currency: string;
}) {
  const [hovered, setHovered] = useState(false);
  const usedPct = totalIn > 0 ? Math.min((totalOut / totalIn) * 100, 100) : 0;

  const r = 60;
  const cx = 90,
    cy = 90;
  const circ = 2 * Math.PI * r; // full circle circumference
  const half = circ / 2; // semicircle length

  const usedLen = (usedPct / 100) * half;
  const remainLen = half - usedLen;

  // rotate(180) so arc opens upward: left=0%, right=100%
  const T = "rotate(180, 90, 90)";

  return (
    <div className="flex flex-col items-center gap-2">
      <div
        style={{
          width: 180,
          height: 100,
          position: "relative",
          overflow: "hidden",
          cursor: "pointer",
        }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <svg
          width={180}
          height={180}
          viewBox="0 0 180 180"
          style={{ position: "absolute", top: 0, left: 0 }}
        >
          {/* Track */}
          <circle
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke="currentColor"
            strokeOpacity={0.12}
            strokeWidth={16}
            strokeDasharray={`${half} ${circ}`}
            strokeLinecap="round"
            transform={T}
            className="text-foreground"
          />

          {/* Remaining — wallet color (drawn first, behind red) */}
          {remainLen > 1 && (
            <circle
              cx={cx}
              cy={cy}
              r={r}
              fill="none"
              stroke={color}
              strokeWidth={16}
              strokeDasharray={`${remainLen} ${circ}`}
              strokeDashoffset={-usedLen}
              strokeLinecap="round"
              transform={T}
              style={{
                transition:
                  "stroke-dasharray 0.7s ease, stroke-dashoffset 0.7s ease",
              }}
            />
          )}

          {/* Used — red, drawn on top
              strokeLinecap="round" makes the RIGHT end (the tip) curve outward
              toward 100%, giving the "pointing toward full" effect */}
          {usedLen > 1 && (
            <circle
              cx={cx}
              cy={cy}
              r={r}
              fill="none"
              stroke="#ef4444"
              strokeWidth={16}
              strokeDasharray={`${usedLen} ${circ}`}
              strokeDashoffset={0}
              strokeLinecap="round"
              transform={T}
              style={{ transition: "stroke-dasharray 0.7s ease" }}
            />
          )}
        </svg>

        {/* Hover overlay */}
        {hovered ? (
          <div className="absolute inset-0 flex items-end justify-center pb-1">
            <div className="flex items-center gap-3 bg-card border border-border/60 rounded-xl px-4 py-2.5 shadow-lg backdrop-blur-sm">
              <div className="flex flex-col items-center gap-0.5">
                <span className="text-[9px] text-muted-foreground uppercase tracking-widest">
                  Spent
                </span>
                <span className="font-realce text-sm text-destructive tabular-nums leading-none">
                  {usedPct.toFixed(1)}%
                </span>
              </div>
              <div className="w-px h-5 bg-border/60" />
              <div className="flex flex-col items-center gap-0.5">
                <span className="text-[9px] text-muted-foreground uppercase tracking-widest">
                  Left
                </span>
                <span
                  className="font-realce text-sm tabular-nums leading-none"
                  style={{ color }}
                >
                  {(100 - usedPct).toFixed(1)}%
                </span>
              </div>
              <div className="w-px h-5 bg-border/60" />
              <div className="flex flex-col items-center gap-0.5">
                <span className="text-[9px] text-muted-foreground uppercase tracking-widest">
                  Out
                </span>
                <span className="font-realce text-sm text-foreground tabular-nums leading-none">
                  {fmt(totalOut, currency)}
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="absolute bottom-0 left-0 right-0 flex flex-col items-center pb-1">
            <span className="font-realce text-xl leading-none text-foreground">
              {usedPct.toFixed(0)}%
            </span>
            <span className="text-[10px] text-muted-foreground">used</span>
          </div>
        )}
      </div>

      <p className="font-realce text-xl tabular-nums text-foreground">
        {fmt(balance, currency)}
      </p>
      <p className="text-xs text-muted-foreground -mt-1">available balance</p>

      <div className="flex items-center gap-4 text-xs">
        <div className="flex items-center gap-1.5">
          <div className="h-2 w-2 rounded-full" style={{ background: color }} />
          <span className="text-muted-foreground">In</span>
          <span className="font-medium tabular-nums">
            {fmt(totalIn, currency)}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-2 w-2 rounded-full bg-red-500" />
          <span className="text-muted-foreground">Out</span>
          <span className="font-medium tabular-nums">
            {fmt(totalOut, currency)}
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── Wallet card ──────────────────────────────────────────────────────────────

function WalletCard({
  title,
  tag,
  balance,
  totalIn,
  totalOut,
  color,
  gradientClass,
  currency,
  children,
}: {
  title: string;
  tag: string;
  balance: number;
  totalIn: number;
  totalOut: number;
  color: string;
  gradientClass: string;
  currency: string;
  children?: React.ReactNode;
}) {
  return (
    <div
      className={`rounded-2xl border border-border/60 p-5 flex flex-col gap-4 ${gradientClass}`}
    >
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-foreground">{title}</p>
        <span className="text-xs text-muted-foreground px-2 py-0.5 rounded-full border border-border/60 bg-background/50">
          {tag}
        </span>
      </div>
      <WalletGauge
        balance={balance}
        totalIn={totalIn}
        totalOut={totalOut}
        color={color}
        currency={currency}
      />
      {children}
    </div>
  );
}

// ─── Export ───────────────────────────────────────────────────────────────────

export function WalletCards({
  primaryBalance,
  profitBalance,
  primaryGauge = { totalIn: 0, totalOut: 0 },
  profitGauge = { totalIn: 0, totalOut: 0 },
  currency = "KES",
  canTransfer = false,
}: {
  primaryBalance: number;
  profitBalance: number;
  primaryGauge?: { totalIn: number; totalOut: number };
  profitGauge?: { totalIn: number; totalOut: number };
  currency?: string;
  canTransfer?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [state, action] = useActionState(transferToProfit, undefined);
  if (state?.success && open) setOpen(false);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <WalletCard
        title="Primary Wallet"
        tag="Operating"
        balance={primaryBalance}
        totalIn={primaryGauge.totalIn}
        totalOut={primaryGauge.totalOut}
        color="#60a5fa"
        gradientClass="bg-linear-to-br from-blue-500/10 via-blue-500/5 to-transparent"
        currency={currency}
      >
        {canTransfer && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="gap-2 cursor-pointer w-full"
              >
                <ArrowRight className="h-3.5 w-3.5" />
                Transfer to Profit
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-sm">
              <DialogHeader>
                <DialogTitle>Transfer to Profit Wallet</DialogTitle>
              </DialogHeader>
              <form action={action} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <Label>Amount</Label>
                  <Input
                    name="amount"
                    type="number"
                    min="0.01"
                    step="0.01"
                    placeholder="0.00"
                    required
                    className="bg-input/50"
                  />
                  <p className="text-xs text-muted-foreground">
                    Available: {fmt(primaryBalance, currency)}
                  </p>
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label>
                    Note{" "}
                    <span className="text-muted-foreground">(optional)</span>
                  </Label>
                  <Textarea
                    name="note"
                    rows={2}
                    className="bg-input/50 resize-none"
                    placeholder="Reason for transfer..."
                  />
                </div>
                {state?.message && !state.success && (
                  <p className="text-sm text-destructive">{state.message}</p>
                )}
                <SubmitBtn />
              </form>
            </DialogContent>
          </Dialog>
        )}
      </WalletCard>

      <WalletCard
        title="Profit Wallet"
        tag="Retained"
        balance={profitBalance}
        totalIn={profitGauge.totalIn}
        totalOut={profitGauge.totalOut}
        color="#a78bfa"
        gradientClass="bg-linear-to-br from-purple-500/10 via-purple-500/5 to-transparent"
        currency={currency}
      />
    </div>
  );
}
