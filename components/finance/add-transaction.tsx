"use client";

import { useActionState, useState, useTransition } from "react";
import { useFormStatus } from "react-dom";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Plus,
  X,
  CheckCircle,
  TrendingUp,
  TrendingDown,
  Pencil,
} from "lucide-react";
import {
  addTransaction,
  addBatchExpenses,
  type BatchExpenseItem,
} from "@/actions/finance";

const REVENUE_PLATFORMS = [
  "ResultShield",
  "SafeSport",
  "Wiba",
  "Internal",
  "Other",
];
const EXPENSE_CATEGORIES = [
  "Rent",
  "Services",
  "Software",
  "Salaries",
  "Marketing",
  "Other",
];
const WALLETS = [
  { value: "primary", label: "Primary Wallet" },
  { value: "profit", label: "Profit Wallet" },
];

const today = () => new Date().toISOString().split("T")[0];

// ─── Revenue form ─────────────────────────────────────────────────────────────

function SubmitBtn({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      disabled={pending}
      className="w-full h-10 font-semibold cursor-pointer"
    >
      {pending ? (
        <span className="flex items-center gap-2">
          <span className="h-4 w-4 rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground animate-spin" />
          Saving...
        </span>
      ) : (
        label
      )}
    </Button>
  );
}

function RevenueForm({ onClose }: { onClose: () => void }) {
  const [state, action] = useActionState(addTransaction, undefined);
  if (state?.success) onClose();

  return (
    <form action={action} className="flex flex-col gap-4">
      <input type="hidden" name="type" value="revenue" />
      <input type="hidden" name="category" value="Revenue" />

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <Label>Platform</Label>
          <Select name="platform" required>
            <SelectTrigger>
              <SelectValue placeholder="Select" />
            </SelectTrigger>
            <SelectContent>
              {REVENUE_PLATFORMS.map((p) => (
                <SelectItem key={p} value={p}>
                  {p}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

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
        </div>

        <div className="flex flex-col gap-1.5">
          <Label>Wallet</Label>
          <Select name="wallet" defaultValue="primary" required>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {WALLETS.map((w) => (
                <SelectItem key={w.value} value={w.value}>
                  {w.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label>Date</Label>
          <Input
            name="date"
            type="date"
            defaultValue={today()}
            required
            className="bg-input/50"
          />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label>
          Notes{" "}
          <span className="text-muted-foreground text-xs">(optional)</span>
        </Label>
        <Textarea
          name="notes"
          placeholder="Add context..."
          rows={2}
          className="bg-input/50 resize-none"
        />
      </div>

      {state?.message && !state.success && (
        <p className="text-sm text-destructive">{state.message}</p>
      )}

      <SubmitBtn label="Add Revenue" />
    </form>
  );
}

// ─── Batch expense form — bubble UX ──────────────────────────────────────────

type ExpenseRow = {
  id: number;
  service: string;
  category: string;
  amount: string;
  notes: string;
  wallet: "primary" | "profit";
};

function emptyDraft(): Omit<ExpenseRow, "id"> {
  return {
    service: "",
    category: "",
    amount: "",
    notes: "",
    wallet: "primary",
  };
}

function ExpenseBatchForm({
  onClose,
  primaryBalance = 0,
  profitBalance = 0,
  currency = "KES",
}: {
  onClose: () => void;
  primaryBalance?: number;
  profitBalance?: number;
  currency?: string;
}) {
  const [queued, setQueued] = useState<ExpenseRow[]>([]);
  const [draft, setDraft] = useState<Omit<ExpenseRow, "id">>(emptyDraft());
  const [editingId, setEditingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);
  const [isPending, startTransition] = useTransition();

  // Running totals
  const primaryTotal = queued
    .filter((r) => r.wallet === "primary")
    .reduce((s, r) => s + (parseFloat(r.amount) || 0), 0);
  const profitTotal = queued
    .filter((r) => r.wallet === "profit")
    .reduce((s, r) => s + (parseFloat(r.amount) || 0), 0);
  const primaryRemaining = primaryBalance - primaryTotal;
  const profitRemaining = profitBalance - profitTotal;
  const totalAmount = queued.reduce(
    (s, r) => s + (parseFloat(r.amount) || 0),
    0,
  );

  function handleAddToQueue() {
    if (!draft.service.trim()) {
      setError("Service name is required.");
      return;
    }
    if (!draft.category) {
      setError("Category is required.");
      return;
    }
    if (!draft.amount || parseFloat(draft.amount) <= 0) {
      setError("Enter a valid amount.");
      return;
    }
    setError(null);

    if (editingId !== null) {
      // Update existing bubble
      setQueued((prev) =>
        prev.map((r) => (r.id === editingId ? { ...r, ...draft } : r)),
      );
      setEditingId(null);
    } else {
      setQueued((prev) => [...prev, { id: Date.now(), ...draft }]);
    }
    setDraft(emptyDraft());
  }

  function handleBubbleClick(row: ExpenseRow) {
    setDraft({
      service: row.service,
      category: row.category,
      amount: row.amount,
      notes: row.notes,
      wallet: row.wallet,
    });
    setEditingId(row.id);
    setError(null);
  }

  function handleRemoveBubble(id: number, e: React.MouseEvent) {
    e.stopPropagation();
    setQueued((prev) => prev.filter((r) => r.id !== id));
    if (editingId === id) {
      setEditingId(null);
      setDraft(emptyDraft());
    }
  }

  function handleCancelEdit() {
    setEditingId(null);
    setDraft(emptyDraft());
    setError(null);
  }

  function handleSubmit() {
    if (!queued.length) {
      setError("Add at least one expense.");
      return;
    }
    const items: BatchExpenseItem[] = queued.map((r) => ({
      service: r.service,
      category: r.category,
      amount: parseFloat(r.amount),
      notes: r.notes,
      wallet: r.wallet,
      date: today(),
    }));
    startTransition(async () => {
      const res = await addBatchExpenses(items);
      setResult(res);
      if (res.success) setTimeout(onClose, 800);
    });
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Balance tracker */}
      <div className="grid grid-cols-2 gap-2 text-xs">
        {[
          { label: "Primary remaining", value: primaryRemaining },
          { label: "Profit remaining", value: profitRemaining },
        ].map(({ label, value }) => (
          <div
            key={label}
            className={`rounded-lg px-3 py-2 border ${value < 0 ? "bg-destructive/10 border-destructive/30" : "bg-muted/40 border-border/60"}`}
          >
            <p className="text-muted-foreground">{label}</p>
            <p
              className={`font-semibold tabular-nums ${value < 0 ? "text-destructive" : "text-foreground"}`}
            >
              {currency}{" "}
              {value.toLocaleString("en-KE", { minimumFractionDigits: 0 })}
            </p>
          </div>
        ))}
      </div>

      {/* Queued expense bubbles */}
      {queued.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {queued.map((row) => (
            <button
              key={row.id}
              onClick={() => handleBubbleClick(row)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium transition-all cursor-pointer ${
                editingId === row.id
                  ? "bg-primary/20 border-primary/50 text-primary"
                  : "bg-muted/60 border-border/60 text-foreground hover:bg-muted"
              }`}
            >
              {editingId === row.id && <Pencil className="h-3 w-3" />}
              <span>{row.service}</span>
              <span className="text-muted-foreground">·</span>
              <span className="tabular-nums">
                {currency}{" "}
                {parseFloat(row.amount).toLocaleString("en-KE", {
                  minimumFractionDigits: 0,
                })}
              </span>
              <span
                onClick={(e) => handleRemoveBubble(row.id, e)}
                className="ml-1 text-muted-foreground hover:text-destructive transition-colors"
              >
                <X className="h-3 w-3" />
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Single entry form */}
      <div
        className={`rounded-xl border p-3 flex flex-col gap-3 ${editingId !== null ? "border-primary/40 bg-primary/5" : "border-border/60 bg-muted/20"}`}
      >
        {editingId !== null && (
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-primary">
              Editing expense
            </span>
            <button
              onClick={handleCancelEdit}
              className="text-xs text-muted-foreground hover:text-foreground cursor-pointer"
            >
              Cancel
            </button>
          </div>
        )}

        <div className="grid grid-cols-2 gap-2">
          <div className="flex flex-col gap-1">
            <Label className="text-xs">Service name</Label>
            <Input
              value={draft.service}
              onChange={(e) =>
                setDraft((d) => ({ ...d, service: e.target.value }))
              }
              placeholder="e.g. Contabo VPS"
              className="h-9 bg-input/50 text-sm"
            />
          </div>

          <div className="flex flex-col gap-1">
            <Label className="text-xs">Category</Label>
            <Select
              value={draft.category}
              onValueChange={(v) => setDraft((d) => ({ ...d, category: v }))}
            >
              <SelectTrigger className="h-9 text-sm">
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent>
                {EXPENSE_CATEGORIES.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1">
            <Label className="text-xs">Amount</Label>
            <Input
              value={draft.amount}
              onChange={(e) =>
                setDraft((d) => ({ ...d, amount: e.target.value }))
              }
              type="number"
              min="0.01"
              step="0.01"
              placeholder="0.00"
              className="h-9 bg-input/50 text-sm"
            />
          </div>

          <div className="flex flex-col gap-1">
            <Label className="text-xs">Wallet</Label>
            <Select
              value={draft.wallet}
              onValueChange={(v) =>
                setDraft((d) => ({ ...d, wallet: v as "primary" | "profit" }))
              }
            >
              <SelectTrigger className="h-9 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {WALLETS.map((w) => (
                  <SelectItem key={w.value} value={w.value}>
                    {w.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1 col-span-2">
            <Label className="text-xs">
              Notes <span className="text-muted-foreground">(optional)</span>
            </Label>
            <textarea
              value={draft.notes}
              onChange={(e) =>
                setDraft((d) => ({ ...d, notes: e.target.value }))
              }
              placeholder="Add context..."
              rows={2}
              className="w-full resize-none rounded-md border border-input bg-input/50 px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>
        </div>

        {error && <p className="text-xs text-destructive">{error}</p>}

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleAddToQueue}
          className="w-full cursor-pointer gap-2"
        >
          {editingId !== null ? (
            <>
              <Pencil className="h-3.5 w-3.5" />
              Update expense
            </>
          ) : (
            <>
              <Plus className="h-3.5 w-3.5" />
              Add to queue
            </>
          )}
        </Button>
      </div>

      {/* Submit all */}
      {queued.length > 0 && (
        <div className="flex items-center justify-between pt-1 border-t border-border/60">
          <div className="text-sm">
            <span className="text-muted-foreground">
              {queued.length} expense{queued.length > 1 ? "s" : ""} ·{" "}
            </span>
            <span className="font-semibold tabular-nums">
              {currency}{" "}
              {totalAmount.toLocaleString("en-KE", {
                minimumFractionDigits: 0,
              })}
            </span>
          </div>
          <Button
            onClick={handleSubmit}
            disabled={isPending || primaryRemaining < 0 || profitRemaining < 0}
            className="cursor-pointer"
          >
            {isPending ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground animate-spin" />
                Saving...
              </span>
            ) : (
              `Save ${queued.length > 1 ? "all" : "expense"}`
            )}
          </Button>
        </div>
      )}

      {result && (
        <div
          className={`flex items-center gap-2 text-sm ${result.success ? "text-primary" : "text-destructive"}`}
        >
          {result.success && <CheckCircle className="h-4 w-4" />}
          {result.message}
        </div>
      )}
    </div>
  );
}

// ─── Main dialog ──────────────────────────────────────────────────────────────

export function AddTransaction({
  primaryBalance,
  profitBalance,
  currency,
}: {
  primaryBalance?: number;
  profitBalance?: number;
  currency?: string;
}) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<"revenue" | "expense">("revenue");

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-2 cursor-pointer">
          <Plus className="h-4 w-4" />
          Add Transaction
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>New Transaction</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => setTab("revenue")}
            className={`h-10 rounded-lg border text-sm font-medium flex items-center justify-center gap-2 transition-all cursor-pointer ${
              tab === "revenue"
                ? "bg-primary/15 border-primary/40 text-primary"
                : "border-border/60 text-muted-foreground hover:bg-muted/50"
            }`}
          >
            <TrendingUp className="h-4 w-4" />
            Revenue
          </button>
          <button
            onClick={() => setTab("expense")}
            className={`h-10 rounded-lg border text-sm font-medium flex items-center justify-center gap-2 transition-all cursor-pointer ${
              tab === "expense"
                ? "bg-destructive/15 border-destructive/40 text-destructive"
                : "border-border/60 text-muted-foreground hover:bg-muted/50"
            }`}
          >
            <TrendingDown className="h-4 w-4" />
            Expense
          </button>
        </div>

        {tab === "revenue" ? (
          <RevenueForm onClose={() => setOpen(false)} />
        ) : (
          <ExpenseBatchForm
            onClose={() => setOpen(false)}
            primaryBalance={primaryBalance}
            profitBalance={profitBalance}
            currency={currency}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
