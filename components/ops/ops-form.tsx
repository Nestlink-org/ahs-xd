"use client";

import { useActionState, useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus } from "lucide-react";
import { addOperation } from "@/actions/operations";

function SubmitBtn() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full cursor-pointer">
      {pending ? (
        <span className="flex items-center gap-2">
          <span className="h-4 w-4 rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground animate-spin" />
          Saving...
        </span>
      ) : (
        "Add Deal"
      )}
    </Button>
  );
}

export function OpsForm() {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<"SafeSport" | "ResultShield" | "">("");
  const [state, action] = useActionState(addOperation, undefined);
  const today = new Date().toISOString().split("T")[0];

  useEffect(() => {
    if (state?.success) {
      setOpen(false);
      setType("");
    }
  }, [state?.success]);

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) setType("");
      }}
    >
      <DialogTrigger asChild>
        <Button size="sm" className="gap-2 cursor-pointer">
          <Plus className="h-4 w-4" />
          Add Deal
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>New Deal</DialogTitle>
        </DialogHeader>

        <form action={action} className="flex flex-col gap-4">
          {/* Common fields */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs">Date</Label>
              <Input
                name="date"
                type="date"
                defaultValue={today}
                required
                className="bg-input/50 h-9"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs">Product</Label>
              <Select
                name="type"
                required
                onValueChange={(v) =>
                  setType(v as "SafeSport" | "ResultShield")
                }
              >
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Select product" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SafeSport">SafeSport</SelectItem>
                  <SelectItem value="ResultShield">ResultShield</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* SafeSport fields */}
          {type === "SafeSport" && (
            <>
              <div className="rounded-xl border border-purple-500/20 bg-purple-500/5 px-4 py-3">
                <p className="text-xs font-medium text-purple-400 mb-3 uppercase tracking-wide">
                  SafeSport — Athlete Protection
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <Label className="text-xs">Client name</Label>
                    <Input
                      name="client"
                      placeholder="e.g. Nairobi FC"
                      required
                      className="bg-input/50 h-9"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label className="text-xs">School / Organisation</Label>
                    <Input
                      name="school"
                      placeholder="e.g. St. Mary's School"
                      className="bg-input/50 h-9"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label className="text-xs">No. of Athletes</Label>
                    <Input
                      name="athletes"
                      type="number"
                      min="0"
                      defaultValue="0"
                      className="bg-input/50 h-9"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label className="text-xs">Revenue</Label>
                    <Input
                      name="revenue"
                      type="number"
                      min="0"
                      step="0.01"
                      defaultValue="0"
                      className="bg-input/50 h-9"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label className="text-xs">Cost</Label>
                    <Input
                      name="cost"
                      type="number"
                      min="0"
                      step="0.01"
                      defaultValue="0"
                      className="bg-input/50 h-9"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label className="text-xs">Status</Label>
                    <Select name="status" defaultValue="Lead">
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
                  <div className="flex flex-col gap-1.5 col-span-2">
                    <Label className="text-xs">Contract signed</Label>
                    <Select name="contract" defaultValue="false">
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
              </div>
              {/* Hidden — not applicable for SafeSport */}
              <input type="hidden" name="insuranceCompany" value="" />
              <input type="hidden" name="policyType" value="" />
            </>
          )}

          {/* ResultShield fields */}
          {type === "ResultShield" && (
            <>
              <div className="rounded-xl border border-orange-500/20 bg-orange-500/5 px-4 py-3">
                <p className="text-xs font-medium text-orange-400 mb-3 uppercase tracking-wide">
                  ResultShield — AI Fraud Detection
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <Label className="text-xs">Insurance company</Label>
                    <Input
                      name="client"
                      placeholder="e.g. Jubilee Insurance"
                      required
                      className="bg-input/50 h-9"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label className="text-xs">Revenue</Label>
                    <Input
                      name="revenue"
                      type="number"
                      min="0"
                      step="0.01"
                      defaultValue="0"
                      className="bg-input/50 h-9"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label className="text-xs">Cost</Label>
                    <Input
                      name="cost"
                      type="number"
                      min="0"
                      step="0.01"
                      defaultValue="0"
                      className="bg-input/50 h-9"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label className="text-xs">Status</Label>
                    <Select name="status" defaultValue="Lead">
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
                    <Label className="text-xs">Contract signed</Label>
                    <Select name="contract" defaultValue="false">
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
              </div>
              {/* Hidden — not applicable for ResultShield */}
              <input type="hidden" name="athletes" value="0" />
              <input type="hidden" name="school" value="" />
            </>
          )}

          {!type && (
            <div className="rounded-xl border border-border/60 bg-muted/30 px-4 py-6 text-center text-sm text-muted-foreground">
              Select a product to see the relevant fields
            </div>
          )}

          {type && (
            <p className="text-xs text-muted-foreground bg-muted/40 border border-border/60 rounded-lg px-3 py-2">
              If status is{" "}
              <span className="font-medium text-foreground">Closed</span>,
              revenue and cost auto-sync to Finance.
            </p>
          )}

          {state?.message && !state.success && (
            <p className="text-sm text-destructive">{state.message}</p>
          )}

          {type && <SubmitBtn />}
        </form>
      </DialogContent>
    </Dialog>
  );
}
