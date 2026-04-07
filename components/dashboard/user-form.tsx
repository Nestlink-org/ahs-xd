"use client";

import { useActionState, useEffect } from "react";
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
import { DialogFooter } from "@/components/ui/dialog";
import { createUser, updateUser } from "@/actions/users";

const ROLES = [
  { value: "superadmin", label: "Superadmin" },
  { value: "admin", label: "CEO" },
  { value: "finance", label: "Finance" },
  { value: "ops", label: "Operations" },
  { value: "sales", label: "Sales" },
  { value: "viewer", label: "Viewer" },
] as const;

type User = {
  _id: string;
  name: string;
  email: string;
  role: string;
};

export function UserForm({
  user,
  onClose,
  isSelf = false,
}: {
  user?: User;
  onClose: () => void;
  isSelf?: boolean;
}) {
  const isEdit = !!user;
  const action = isEdit ? updateUser : createUser;
  const [state, formAction, pending] = useActionState(action, undefined);

  useEffect(() => {
    if (state?.success) onClose();
  }, [state?.success]);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {isEdit && <input type="hidden" name="id" value={user._id} />}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="name">Full name</Label>
          <Input
            id="name"
            name="name"
            defaultValue={user?.name}
            placeholder="John Doe"
            required
          />
        </div>

        {!isEdit && (
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="user@company.com"
              required
            />
          </div>
        )}

        {!isSelf && (
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="role">Role</Label>
            <Select name="role" defaultValue={user?.role ?? "viewer"}>
              <SelectTrigger id="role">
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                {ROLES.map((r) => (
                  <SelectItem key={r.value} value={r.value}>
                    {r.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
        {isSelf && (
          <input type="hidden" name="role" value={user?.role ?? "superadmin"} />
        )}
      </div>

      {!isEdit && (
        <p className="text-xs text-muted-foreground bg-muted/50 border border-border/60 rounded-lg px-3 py-2">
          A temporary password{" "}
          <span className="font-mono font-medium text-foreground">
            Pass123!
          </span>{" "}
          will be assigned. The user will be prompted to set a new password on
          first login.
        </p>
      )}

      {state?.message && !state.success && (
        <p className="text-sm text-destructive">{state.message}</p>
      )}

      <DialogFooter className="pt-2">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" disabled={pending}>
          {pending ? "Saving..." : isEdit ? "Save changes" : "Create user"}
        </Button>
      </DialogFooter>
    </form>
  );
}
