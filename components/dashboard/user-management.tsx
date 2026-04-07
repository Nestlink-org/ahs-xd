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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  MoreHorizontal,
  UserX,
  UserCheck,
  Pencil,
  Trash2,
  ShieldAlert,
  Clock,
} from "lucide-react";
import { toggleSuspendUser, softDeleteUser } from "@/actions/users";
import { UserForm } from "@/components/dashboard/user-form";

type User = {
  _id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  mustChangePassword: boolean;
  lastLogin: string | null;
  createdAt: string;
};

const ROLE_BADGE: Record<string, string> = {
  superadmin: "bg-primary/15 text-primary border-primary/30",
  admin: "bg-blue-500/15 text-blue-400 border-blue-400/30",
  finance: "bg-yellow-500/15 text-yellow-400 border-yellow-400/30",
  ops: "bg-purple-500/15 text-purple-400 border-purple-400/30",
  sales: "bg-orange-500/15 text-orange-400 border-orange-400/30",
  viewer: "bg-muted text-muted-foreground border-border",
};

const ROLE_LABEL: Record<string, string> = {
  superadmin: "Superadmin",
  admin: "CEO",
  finance: "Finance",
  ops: "Operations",
  sales: "Sales",
  viewer: "Viewer",
};

function formatDate(d: string | null) {
  if (!d) return "Never";
  return new Date(d).toLocaleDateString("en-ZA", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function UserManagement({
  users,
  currentUserId,
}: {
  users: User[];
  currentUserId: string;
}) {
  const [editUser, setEditUser] = useState<User | null>(null);
  const [deleteUser, setDeleteUser] = useState<User | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSuspend(user: User) {
    startTransition(async () => {
      await toggleSuspendUser(user._id, user.isActive);
    });
  }

  function handleDelete(user: User) {
    startTransition(async () => {
      await softDeleteUser(user._id);
      setDeleteUser(null);
    });
  }

  return (
    <>
      {/* Table */}
      <div className="rounded-xl border border-border/60 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30 hover:bg-muted/30">
              <TableHead className="w-[260px]">User</TableHead>
              <TableHead>Role</TableHead>
              <TableHead className="hidden md:table-cell">Status</TableHead>
              <TableHead className="hidden lg:table-cell">Last login</TableHead>
              <TableHead className="hidden lg:table-cell">Created</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="text-center py-12 text-muted-foreground text-sm"
                >
                  No users found
                </TableCell>
              </TableRow>
            )}
            {users.map((user) => (
              <TableRow key={user._id} className="group">
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8 shrink-0">
                      <AvatarFallback className="text-xs bg-primary/10 text-primary font-semibold">
                        {user.name.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="text-sm font-medium text-foreground truncate">
                          {user.name}
                        </p>
                        {user._id === currentUserId && (
                          <span className="text-[10px] text-muted-foreground">
                            (you)
                          </span>
                        )}
                        {user.mustChangePassword && (
                          <span title="Pending first login">
                            <Clock className="h-3 w-3 text-yellow-400 shrink-0" />
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground truncate">
                        {user.email}
                      </p>
                    </div>
                  </div>
                </TableCell>

                <TableCell>
                  <Badge
                    variant="outline"
                    className={`text-xs ${ROLE_BADGE[user.role] ?? ROLE_BADGE.viewer}`}
                  >
                    {ROLE_LABEL[user.role] ?? user.role}
                  </Badge>
                </TableCell>

                <TableCell className="hidden md:table-cell">
                  {user.mustChangePassword ? (
                    <Badge
                      variant="outline"
                      className="bg-yellow-500/10 text-yellow-400 border-yellow-500/20 text-xs"
                    >
                      Pending setup
                    </Badge>
                  ) : (
                    <Badge
                      variant="outline"
                      className={
                        user.isActive
                          ? "bg-green-500/10 text-green-400 border-green-500/20 text-xs"
                          : "bg-destructive/10 text-destructive border-destructive/20 text-xs"
                      }
                    >
                      {user.isActive ? "Active" : "Suspended"}
                    </Badge>
                  )}
                </TableCell>

                <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">
                  {formatDate(user.lastLogin)}
                </TableCell>

                <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">
                  {formatDate(user.createdAt)}
                </TableCell>

                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-44">
                      <DropdownMenuItem onClick={() => setEditUser(user)}>
                        <Pencil className="h-3.5 w-3.5 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      {user._id !== currentUserId && (
                        <>
                          <DropdownMenuItem
                            onClick={() => handleSuspend(user)}
                            disabled={user.role === "superadmin" || isPending}
                          >
                            {user.isActive ? (
                              <>
                                <UserX className="h-3.5 w-3.5 mr-2" />
                                Suspend
                              </>
                            ) : (
                              <>
                                <UserCheck className="h-3.5 w-3.5 mr-2" />
                                Reactivate
                              </>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={() => setDeleteUser(user)}
                            disabled={user.role === "superadmin"}
                          >
                            <Trash2 className="h-3.5 w-3.5 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Edit dialog */}
      <Dialog open={!!editUser} onOpenChange={(o) => !o && setEditUser(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit user</DialogTitle>
          </DialogHeader>
          {editUser && (
            <UserForm
              user={editUser}
              isSelf={editUser._id === currentUserId}
              onClose={() => setEditUser(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <Dialog
        open={!!deleteUser}
        onOpenChange={(o) => !o && setDeleteUser(null)}
      >
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-destructive" />
              Delete user
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to delete{" "}
            <span className="font-medium text-foreground">
              {deleteUser?.name}
            </span>
            ? This cannot be undone.
          </p>
          <DialogFooter className="pt-2">
            <Button variant="outline" onClick={() => setDeleteUser(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={isPending}
              onClick={() => deleteUser && handleDelete(deleteUser)}
            >
              {isPending ? "Deleting..." : "Delete user"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
