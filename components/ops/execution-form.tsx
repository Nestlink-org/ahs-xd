"use client";

import { useActionState, useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ClipboardList } from "lucide-react";
import { saveExecutionLog } from "@/actions/execution";

function SubmitBtn() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="cursor-pointer">
      {pending ? (
        <span className="flex items-center gap-2">
          <span className="h-4 w-4 rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground animate-spin" />
          Saving...
        </span>
      ) : (
        "Save Log"
      )}
    </Button>
  );
}

export function ExecutionForm() {
  const [open, setOpen] = useState(false);
  const [state, action] = useActionState(saveExecutionLog, undefined);
  const today = new Date().toISOString().split("T")[0];

  useEffect(() => {
    if (state?.success) setOpen(false);
  }, [state?.success]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="gap-2 cursor-pointer">
          <ClipboardList className="h-4 w-4" />
          Log Today
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Daily Execution Log</DialogTitle>
        </DialogHeader>

        <form action={action} className="flex flex-col gap-4">
          {/* Date */}
          <div className="flex flex-col gap-1.5">
            <Label>Date</Label>
            <Input
              name="date"
              type="date"
              defaultValue={today}
              required
              className="bg-input/50 h-9"
            />
          </div>

          {/* Activity grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label>Calls</Label>
              <Input
                name="calls"
                type="number"
                min="0"
                defaultValue="0"
                className="bg-input/50 h-9 tabular-nums"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Meetings</Label>
              <Input
                name="meetings"
                type="number"
                min="0"
                defaultValue="0"
                className="bg-input/50 h-9 tabular-nums"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Follow-ups</Label>
              <Input
                name="followUps"
                type="number"
                min="0"
                defaultValue="0"
                className="bg-input/50 h-9 tabular-nums"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Closings</Label>
              <Input
                name="closings"
                type="number"
                min="0"
                defaultValue="0"
                className="bg-input/50 h-9 tabular-nums"
              />
            </div>
          </div>

          {/* Revenue */}
          <div className="flex flex-col gap-1.5">
            <Label>Revenue Won</Label>
            <Input
              name="revenueWon"
              type="number"
              min="0"
              step="0.01"
              defaultValue="0"
              placeholder="0.00"
              className="bg-input/50 h-9"
            />
          </div>

          {/* Notes */}
          <div className="flex flex-col gap-1.5">
            <Label>
              Notes{" "}
              <span className="text-muted-foreground text-xs">(optional)</span>
            </Label>
            <textarea
              name="notes"
              rows={2}
              placeholder="Key highlights, blockers, wins..."
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
              onClick={() => setOpen(false)}
              className="cursor-pointer"
            >
              Cancel
            </Button>
            <SubmitBtn />
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
