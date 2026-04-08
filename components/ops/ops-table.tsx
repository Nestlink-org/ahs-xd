"use client";

import { useActionState, useEffect, useState, useTransition } from "react";
import { useFormStatus } from "react-dom";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, CheckCircle2, Pencil } from "lucide-react";
import { updateOperation } from "@/actions/operations";

type Op = {
  _id: string;
  date: string;
  type: string;
  client: string;
  school: string;
  athletes: number;
  revenue: number;
  cost: number;
  status: string;
  contract: boolean;
  financeLinked: boolean;
};

const STATUS_BADGE: Record<string, string> = {
  Lead: "bg-yellow-500/15 text-yellow-400 border-yellow-400/30",
  Ongoing: "bg-blue-500/15 text-blue-400 border-blue-400/30",
  Closed: "bg-primary/15 text-primary border-primary/30",
};

const TYPE_BADGE: Record<string, string> = {
  SafeSport: "bg-purple-500/15 text-purple-400 border-purple-400/30",
  ResultShield: "bg-orange-500/15 text-orange-400 border-orange-400/30",
};

function SubmitBtn() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="cursor-pointer">
      {pending ? "Saving..." : "Save changes"}
    </Button>
  );
}

function EditOpDialog({ op, onClose }: { op: Op; onClose: () => void }) {
  const [state, action] = useActionState(updateOperation, undefined);
  const [type, setType] = useState(op.type);
  const dateVal = new Date(op.date).toISOString().split("T")[0];

  useEffect(() => {
    if (state?.success) onClose();
  }, [state?.success]);

  return (
    <DialogContent className="sm:max-w-lg">
      <DialogHeader>
        <DialogTitle>Edit Deal — {op.client}</DialogTitle>
      </DialogHeader>
      <form action={action} className="flex flex-col gap-4">
        <input type="hidden" name="id" value={op._id} />

        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <Label>Date</Label>
            <Input
              name="date"
              type="date"
              defaultValue={dateVal}
              required
              className="bg-input/50 h-9"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Product</Label>
            <Select
              name="type"
              defaultValue={op.type}
              onValueChange={(v) => setType(v)}
            >
              <SelectTrigger className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="SafeSport">SafeSport</SelectItem>
                <SelectItem value="ResultShield">ResultShield</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>
              {type === "ResultShield" ? "Insurance Company" : "Client"}
            </Label>
            <Input
              name="client"
              defaultValue={op.client}
              required
              className="bg-input/50 h-9"
            />
          </div>

          {type === "SafeSport" && (
            <div className="flex flex-col gap-1.5">
              <Label>School / Organisation</Label>
              <Input
                name="school"
                defaultValue={op.school}
                className="bg-input/50 h-9"
              />
            </div>
          )}
          {type === "ResultShield" && (
            <input type="hidden" name="school" value="" />
          )}

          {type === "SafeSport" && (
            <div className="flex flex-col gap-1.5">
              <Label>Athletes</Label>
              <Input
                name="athletes"
                type="number"
                min="0"
                defaultValue={op.athletes}
                className="bg-input/50 h-9"
              />
            </div>
          )}
          {type === "ResultShield" && (
            <input type="hidden" name="athletes" value="0" />
          )}

          <div className="flex flex-col gap-1.5">
            <Label>Revenue</Label>
            <Input
              name="revenue"
              type="number"
              min="0"
              step="0.01"
              defaultValue={op.revenue}
              className="bg-input/50 h-9"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Cost</Label>
            <Input
              name="cost"
              type="number"
              min="0"
              step="0.01"
              defaultValue={op.cost}
              className="bg-input/50 h-9"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Status</Label>
            <Select name="status" defaultValue={op.status}>
              <SelectTrigger className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Lead">Lead</SelectItem>
                <SelectItem value="Ongoing">Ongoing</SelectItem>
                <SelectItem value="Closed">Closed</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Contract</Label>
            <Select name="contract" defaultValue={String(op.contract)}>
              <SelectTrigger className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="false">No</SelectItem>
                <SelectItem value="true">Yes</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {op.financeLinked && (
          <p className="text-xs text-muted-foreground bg-muted/40 border border-border/60 rounded-lg px-3 py-2">
            Finance already synced for this deal. Revenue/cost changes won't
            re-sync automatically.
          </p>
        )}

        {state?.message && !state.success && (
          <p className="text-sm text-destructive">{state.message}</p>
        )}

        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="cursor-pointer"
          >
            Cancel
          </Button>
          <SubmitBtn />
        </div>
      </form>
    </DialogContent>
  );
}

export function OpsTable({
  operations,
  currency = "KES",
  canEdit = false,
}: {
  operations: Op[];
  currency?: string;
  canEdit?: boolean;
}) {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [editing, setEditing] = useState<Op | null>(null);

  const filtered = operations.filter((op) => {
    const matchSearch =
      !search ||
      op.client.toLowerCase().includes(search.toLowerCase()) ||
      op.school.toLowerCase().includes(search.toLowerCase());
    const matchType = typeFilter === "all" || op.type === typeFilter;
    const matchStatus = statusFilter === "all" || op.status === statusFilter;
    return matchSearch && matchType && matchStatus;
  });

  return (
    <>
      <div className="flex flex-col gap-3">
        {/* Filters */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative flex-1 min-w-40">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Search client or school..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 h-9 bg-input/50"
            />
          </div>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="h-9 w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All types</SelectItem>
              <SelectItem value="SafeSport">SafeSport</SelectItem>
              <SelectItem value="ResultShield">ResultShield</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-9 w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="Lead">Lead</SelectItem>
              <SelectItem value="Ongoing">Ongoing</SelectItem>
              <SelectItem value="Closed">Closed</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="rounded-xl border border-border/60 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30 hover:bg-muted/30">
                <TableHead>Date</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Client</TableHead>
                <TableHead className="hidden md:table-cell text-right">
                  Athletes
                </TableHead>
                <TableHead className="text-right">Revenue</TableHead>
                <TableHead className="hidden md:table-cell text-right">
                  Cost
                </TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="hidden sm:table-cell">Contract</TableHead>
                {canEdit && <TableHead className="w-10" />}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={9}
                    className="text-center py-10 text-muted-foreground text-sm"
                  >
                    No operations found
                  </TableCell>
                </TableRow>
              )}
              {filtered.map((op) => (
                <TableRow
                  key={op._id}
                  className={`group ${canEdit ? "cursor-pointer hover:bg-muted/30" : ""}`}
                  onClick={() => canEdit && setEditing(op)}
                >
                  <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                    {new Date(op.date).toLocaleDateString("en-KE", {
                      day: "2-digit",
                      month: "short",
                    })}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={`text-xs ${TYPE_BADGE[op.type] ?? ""}`}
                    >
                      {op.type}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {op.client}
                      </p>
                      {op.school && (
                        <p className="text-xs text-muted-foreground">
                          {op.school}
                        </p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-right text-sm">
                    {op.athletes}
                  </TableCell>
                  <TableCell className="text-right text-sm font-semibold text-primary tabular-nums">
                    {currency} {op.revenue.toLocaleString()}
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-right text-sm text-destructive tabular-nums">
                    {currency} {op.cost.toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={`text-xs ${STATUS_BADGE[op.status] ?? ""}`}
                    >
                      {op.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    {op.contract ? (
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  {canEdit && (
                    <TableCell>
                      <Pencil className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            {filtered.length} of {operations.length} deals
          </p>
          {canEdit && (
            <p className="text-xs text-muted-foreground">Click a row to edit</p>
          )}
        </div>
      </div>

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        {editing && (
          <EditOpDialog op={editing} onClose={() => setEditing(null)} />
        )}
      </Dialog>
    </>
  );
}
