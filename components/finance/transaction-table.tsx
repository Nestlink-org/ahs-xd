"use client";

import { useState, useTransition } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Trash2, MoreHorizontal, Search } from "lucide-react";
import { deleteTransaction } from "@/actions/finance";

type Tx = {
  _id: string;
  date: string;
  type: "revenue" | "expense";
  category: string;
  platform: string;
  amount: number;
  wallet: "primary" | "profit";
  notes: string;
};

function fmt(n: number, currency = "KES") {
  return `${currency} ${n.toLocaleString("en-KE", { minimumFractionDigits: 2 })}`;
}

export function TransactionTable({
  transactions,
  currency = "KES",
  canDelete = false,
}: {
  transactions: Tx[];
  currency?: string;
  canDelete?: boolean;
}) {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | "revenue" | "expense">(
    "all",
  );
  const [walletFilter, setWalletFilter] = useState<
    "all" | "primary" | "profit"
  >("all");
  const [isPending, startTransition] = useTransition();

  const filtered = transactions.filter((tx) => {
    const matchSearch =
      !search ||
      tx.category.toLowerCase().includes(search.toLowerCase()) ||
      tx.platform.toLowerCase().includes(search.toLowerCase()) ||
      tx.notes.toLowerCase().includes(search.toLowerCase());
    const matchType = typeFilter === "all" || tx.type === typeFilter;
    const matchWallet = walletFilter === "all" || tx.wallet === walletFilter;
    return matchSearch && matchType && matchWallet;
  });

  function handleDelete(id: string) {
    startTransition(async () => {
      await deleteTransaction(id);
    });
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Filters */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search transactions..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 h-9 bg-input/50"
          />
        </div>
        <div className="flex gap-1">
          {(["all", "revenue", "expense"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setTypeFilter(f)}
              className={`px-3 h-9 rounded-lg text-xs font-medium capitalize transition-all cursor-pointer ${
                typeFilter === f
                  ? "bg-primary/15 text-primary border border-primary/30"
                  : "border border-border/60 text-muted-foreground hover:bg-muted/50"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
        <div className="flex gap-1">
          {(["all", "primary", "profit"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setWalletFilter(f)}
              className={`px-3 h-9 rounded-lg text-xs font-medium capitalize transition-all cursor-pointer ${
                walletFilter === f
                  ? "bg-primary/15 text-primary border border-primary/30"
                  : "border border-border/60 text-muted-foreground hover:bg-muted/50"
              }`}
            >
              {f === "all" ? "All wallets" : `${f} wallet`}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border/60 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30 hover:bg-muted/30">
              <TableHead>Date</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Category</TableHead>
              <TableHead className="hidden md:table-cell">Platform</TableHead>
              <TableHead className="hidden md:table-cell">Wallet</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              {canDelete && <TableHead className="w-10" />}
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="text-center py-12 text-muted-foreground text-sm"
                >
                  No transactions found
                </TableCell>
              </TableRow>
            )}
            {filtered.map((tx) => (
              <TableRow key={tx._id} className="group">
                <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                  {new Date(tx.date).toLocaleDateString("en-KE", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })}
                </TableCell>
                <TableCell>
                  <Badge
                    variant="outline"
                    className={
                      tx.type === "revenue"
                        ? "bg-primary/10 text-primary border-primary/30 text-xs"
                        : "bg-destructive/10 text-destructive border-destructive/30 text-xs"
                    }
                  >
                    {tx.type}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm font-medium">
                  {tx.category}
                </TableCell>
                <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                  {tx.platform}
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  <Badge
                    variant="outline"
                    className={
                      tx.wallet === "primary"
                        ? "bg-blue-500/10 text-blue-400 border-blue-400/30 text-xs"
                        : "bg-purple-500/10 text-purple-400 border-purple-400/30 text-xs"
                    }
                  >
                    {tx.wallet}
                  </Badge>
                </TableCell>
                <TableCell
                  className={`text-right text-sm font-semibold tabular-nums ${
                    tx.type === "revenue" ? "text-primary" : "text-destructive"
                  }`}
                >
                  {tx.type === "revenue" ? "+" : "-"}
                  {fmt(tx.amount, currency)}
                </TableCell>
                {canDelete && (
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive cursor-pointer"
                          disabled={isPending}
                          onClick={() => handleDelete(tx._id)}
                        >
                          <Trash2 className="h-3.5 w-3.5 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <p className="text-xs text-muted-foreground text-right">
        Showing {filtered.length} of {transactions.length} transactions
      </p>
    </div>
  );
}
