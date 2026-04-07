export type UserRole =
  | "superadmin"
  | "admin"
  | "finance"
  | "ops"
  | "sales"
  | "viewer";

/** Where each role lands after login */
export const ROLE_HOME: Record<UserRole, string> = {
  superadmin: "/dashboard/superadmin",
  admin: "/dashboard/ceo",
  finance: "/dashboard/finance",
  ops: "/dashboard/ops",
  sales: "/dashboard/sales",
  viewer: "/dashboard/viewer",
};

/** Which routes each role can access (used by proxy + page guards) */
export const ROLE_ALLOWED_ROUTES: Record<string, UserRole[]> = {
  "/dashboard/superadmin": ["superadmin"],
  "/dashboard/ceo": ["superadmin", "admin"],
  "/dashboard/finance": ["superadmin", "admin", "finance", "sales"],
  "/dashboard/ops": ["superadmin", "admin", "ops"],
  "/dashboard/sales": ["superadmin", "admin", "sales"],
  "/dashboard/viewer": [
    "superadmin",
    "admin",
    "finance",
    "ops",
    "sales",
    "viewer",
  ],
};

export function getRoleHome(role: string): string {
  return ROLE_HOME[role as UserRole] ?? "/dashboard/viewer";
}
