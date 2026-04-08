"use client";

import { useActionState, useEffect, useState } from "react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Pencil } from "lucide-react";
import { updateExecutionLog } from "@/actions/execution";

type Log = {
  _id: string;
  date: string;
  calls: number;
  meetings: number;
  followUps: number;
  closings: number;
  revenueWon: number;
  notes: string;
};

const PERIODS = ["week", "month", "all"] as const;

function SubmitBtn() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="cursor-pointer">
      {pending ? "Saving..." : "Save changes"}
    </Button>
  );
}

function EditLogDialog({ log, onClose }: { log: Log; onClose: () => void }) {
  const [state, action] = useActionState(updateExecutionLog, undefined);

  useEffect(() => {
    if (state?.success) onClose();
  }, [state?.success]);

  const dateVal = new Date(log.date).toISOString().split("T")[0];

  return (
    <DialogContent className="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>Edit Execution Log</DialogTitle>
      </DialogHeader>
      <form action={action} className="flex flex-col gap-4">
        <input type="hidden" name="id" value={log._id} />

        <div className="flex flex-col gap-1.5">
          <Label>Date</Label>
          <Input
            name="date"
            type="date"
            defaultValue={dateVal}
            required
            className="bg-input/50 h-9 w-44"
            readOnly
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <Label>Calls</Label>
            <Input
              name="calls"
              type="number"
              min="0"
              defaultValue={log.calls}
              className="bg-input/50 h-9"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Meetings</Label>
            <Input
              name="meetings"
              type="number"
              min="0"
              defaultValue={log.meetings}
              className="bg-input/50 h-9"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Follow-ups</Label>
            <Input
              name="followUps"
              type="number"
              min="0"
              defaultValue={log.followUps}
              className="bg-input/50 h-9"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Closings</Label>
            <Input
              name="closings"
              type="number"
              min="0"
              defaultValue={log.closings}
              className="bg-input/50 h-9"
            />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label>Revenue Won</Label>
          <Input
            name="revenueWon"
            type="number"
            min="0"
            step="0.01"
            defaultValue={log.revenueWon}
            className="bg-input/50 h-9"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label>
            Notes{" "}
            <span className="text-muted-foreground text-xs">(optional)</span>
          </Label>
          <textarea
            name="notes"
            rows={2}
            defaultValue={log.notes}
            className="w-full resize-none rounded-md border border-input bg-input/50 px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </div>

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

export function ExecutionTable({
  logs,
  currency = "KES",
  canEdit = false,
}: {
  logs: Log[];
  currency?: string;
  canEdit?: boolean;
}) {
  const [period, setPeriod] = useState<"week" | "month" | "all">("month");
  const [editing, setEditing] = useState<Log | null>(null);

  const now = new Date();
  const filtered = logs.filter((l) => {
    const d = new Date(l.date);
    if (period === "week") return d >= new Date(now.getTime() - 7 * 86400000);
    if (period === "month")
      return (
        d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
      );
    return true;
  });

  const totals = filtered.reduce(
    (acc, l) => ({
      calls: acc.calls + l.calls,
      meetings: acc.meetings + l.meetings,
      followUps: acc.followUps + l.followUps,
      closings: acc.closings + l.closings,
      revenueWon: acc.revenueWon + l.revenueWon,
    }),
    { calls: 0, meetings: 0, followUps: 0, closings: 0, revenueWon: 0 },
  );

  return (
    <>
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <p className="text-sm font-semibold text-foreground">
            Execution History
          </p>
          <div className="flex gap-1">
            {PERIODS.map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-3 py-1 rounded-md text-xs font-medium capitalize transition-all cursor-pointer border ${
                  period === p
                    ? "bg-primary/15 text-primary border-primary/30"
                    : "border-border/60 text-muted-foreground hover:bg-muted/50"
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-border/60 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30 hover:bg-muted/30">
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Calls</TableHead>
                <TableHead className="text-right">Meetings</TableHead>
                <TableHead className="text-right hidden sm:table-cell">
                  Follow-ups
                </TableHead>
                <TableHead className="text-right hidden sm:table-cell">
                  Closings
                </TableHead>
                <TableHead className="text-right">Revenue Won</TableHead>
                {canEdit && <TableHead className="w-10" />}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="text-center py-10 text-muted-foreground text-sm"
                  >
                    No logs for this period
                  </TableCell>
                </TableRow>
              )}
              {filtered.map((log) => (
                <TableRow
                  key={log._id}
                  className={`group ${canEdit ? "cursor-pointer hover:bg-muted/30" : ""}`}
                  onClick={() => canEdit && setEditing(log)}
                >
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(log.date).toLocaleDateString("en-KE", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </TableCell>
                  <TableCell className="text-right text-sm font-medium">
                    {log.calls}
                  </TableCell>
                  <TableCell className="text-right text-sm font-medium">
                    {log.meetings}
                  </TableCell>
                  <TableCell className="text-right text-sm hidden sm:table-cell">
                    {log.followUps}
                  </TableCell>
                  <TableCell className="text-right text-sm hidden sm:table-cell">
                    {log.closings}
                  </TableCell>
                  <TableCell className="text-right text-sm font-semibold text-primary tabular-nums">
                    {currency} {log.revenueWon.toLocaleString()}
                  </TableCell>
                  {canEdit && (
                    <TableCell>
                      <Pencil className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    </TableCell>
                  )}
                </TableRow>
              ))}
              {filtered.length > 0 && (
                <TableRow className="bg-muted/20 font-semibold">
                  <TableCell className="text-xs text-muted-foreground">
                    Totals
                  </TableCell>
                  <TableCell className="text-right text-sm">
                    {totals.calls}
                  </TableCell>
                  <TableCell className="text-right text-sm">
                    {totals.meetings}
                  </TableCell>
                  <TableCell className="text-right text-sm hidden sm:table-cell">
                    {totals.followUps}
                  </TableCell>
                  <TableCell className="text-right text-sm hidden sm:table-cell">
                    {totals.closings}
                  </TableCell>
                  <TableCell className="text-right text-sm text-primary tabular-nums">
                    {currency} {totals.revenueWon.toLocaleString()}
                  </TableCell>
                  {canEdit && <TableCell />}
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        {canEdit && (
          <p className="text-xs text-muted-foreground">Click a row to edit</p>
        )}
      </div>

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        {editing && (
          <EditLogDialog log={editing} onClose={() => setEditing(null)} />
        )}
      </Dialog>
    </>
  );
}
