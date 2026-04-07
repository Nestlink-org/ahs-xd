"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import {
  LayoutDashboard,
  GitBranch,
  Settings2,
  Wallet,
  BarChart3,
  Users,
  LogOut,
  Menu,
  TrendingDown,
  Landmark,
} from "lucide-react";
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarTrigger,
  SidebarInset,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/theme_switcher";
import { Greeting } from "@/components/dashboard/greeting";
import type { SessionPayload } from "@/lib/session";
import { logoutAction } from "@/actions/auth";

// ─── Role badge colours ───────────────────────────────────────────────────────

const ROLE_LABEL: Record<string, string> = {
  superadmin: "Superadmin",
  admin: "CEO",
  finance: "Finance",
  ops: "Operations",
  sales: "Sales",
  viewer: "Viewer",
};

const ROLE_BADGE: Record<string, string> = {
  superadmin: "bg-primary/15 text-primary border-primary/30",
  admin: "bg-blue-500/15 text-blue-400 border-blue-400/30",
  finance: "bg-yellow-500/15 text-yellow-400 border-yellow-400/30",
  ops: "bg-purple-500/15 text-purple-400 border-purple-400/30",
  sales: "bg-orange-500/15 text-orange-400 border-orange-400/30",
  viewer: "bg-muted text-muted-foreground border-border",
};

// ─── Nav per role ─────────────────────────────────────────────────────────────

type NavItem = { href: string; label: string; icon: React.ElementType };

const NAV_BY_ROLE: Record<string, NavItem[]> = {
  superadmin: [
    { href: "/dashboard/superadmin", label: "Users", icon: Users },
    { href: "/dashboard/ceo", label: "CEO View", icon: LayoutDashboard },
    { href: "/dashboard/finance", label: "Overview", icon: Wallet },
    {
      href: "/dashboard/finance?tab=expenses",
      label: "Expenses",
      icon: TrendingDown,
    },
    {
      href: "/dashboard/finance?tab=wallets",
      label: "Wallets",
      icon: Landmark,
    },
    { href: "/dashboard/ops", label: "Operations", icon: Settings2 },
    { href: "/dashboard/sales", label: "Sales", icon: GitBranch },
  ],
  admin: [
    { href: "/dashboard/ceo", label: "Overview", icon: LayoutDashboard },
    {
      href: "/dashboard/ceo?tab=expenses",
      label: "Expenses",
      icon: TrendingDown,
    },
    { href: "/dashboard/ceo?tab=wallets", label: "Wallets", icon: Landmark },
  ],
  finance: [
    { href: "/dashboard/finance", label: "Overview", icon: Wallet },
    {
      href: "/dashboard/finance?tab=expenses",
      label: "Expenses",
      icon: TrendingDown,
    },
    {
      href: "/dashboard/finance?tab=wallets",
      label: "Wallets",
      icon: Landmark,
    },
  ],
  ops: [
    { href: "/dashboard/ops", label: "Overview", icon: LayoutDashboard },
    {
      href: "/dashboard/ops?tab=expenses",
      label: "Expenses",
      icon: TrendingDown,
    },
    { href: "/dashboard/ops?tab=wallets", label: "Wallets", icon: Landmark },
  ],
  sales: [
    { href: "/dashboard/sales", label: "Overview", icon: LayoutDashboard },
    {
      href: "/dashboard/sales?tab=expenses",
      label: "Expenses",
      icon: TrendingDown,
    },
    { href: "/dashboard/sales?tab=wallets", label: "Wallets", icon: Landmark },
  ],
  viewer: [
    { href: "/dashboard/viewer", label: "Overview", icon: BarChart3 },
    {
      href: "/dashboard/viewer?tab=expenses",
      label: "Expenses",
      icon: TrendingDown,
    },
    { href: "/dashboard/viewer?tab=wallets", label: "Wallets", icon: Landmark },
  ],
};

// ─── Shell ────────────────────────────────────────────────────────────────────

export function DashboardShell({
  children,
  session,
}: {
  children: React.ReactNode;
  session: SessionPayload;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentTab = searchParams.get("tab") ?? "";
  const role = session.role;
  const navItems = NAV_BY_ROLE[role] ?? NAV_BY_ROLE.viewer;

  function isActive(href: string) {
    const [hrefPath, hrefQuery] = href.split("?");
    const hrefTab = hrefQuery
      ? (new URLSearchParams(hrefQuery).get("tab") ?? "")
      : "";
    const pathMatch =
      pathname === hrefPath || pathname.startsWith(hrefPath + "/");
    if (hrefTab) return pathMatch && currentTab === hrefTab;
    // For links without tab param, only active if no tab is set
    if (pathname === hrefPath && !hrefTab) return currentTab === "";
    return pathMatch && !hrefTab && currentTab === "";
  }

  const currentLabel =
    navItems.find((n) => isActive(n.href))?.label ?? "Dashboard";
  const initials = session.email.split("@")[0].slice(0, 2).toUpperCase();

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <Sidebar className="border-r border-border/60">
          {/* Brand */}
          <SidebarHeader className="h-16 flex flex-row items-center gap-3 px-4 border-b border-border/60">
            <div className="relative h-8 w-8 shrink-0">
              <Image
                src="/logo.png"
                alt="AHS"
                fill
                sizes="32px"
                className="object-contain"
              />
            </div>
            <div className="flex flex-col leading-none">
              <span className="font-realce text-base tracking-widest uppercase bg-linear-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent">
                AHS-XD
                <sup className="text-[9px] text-muted-foreground font-sans ml-0.5 not-italic tracking-normal">
                  v2.7
                </sup>
              </span>
              <span className="text-[9px] text-muted-foreground tracking-[0.2em] uppercase">
                Executive Dashboard
              </span>
            </div>
          </SidebarHeader>

          {/* Nav */}
          <SidebarContent className="py-3 px-2">
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive(item.href)}
                    className="gap-3 h-10 rounded-none"
                  >
                    <Link href={item.href}>
                      <item.icon className="h-4 w-4 shrink-0" />
                      <span>{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarContent>

          <SidebarSeparator />

          {/* User + logout */}
          <SidebarFooter className="p-3">
            <div className="flex items-center gap-3 px-2 py-2 rounded-xl bg-sidebar-accent/50">
              <Avatar className="h-8 w-8 shrink-0">
                <AvatarFallback className="text-xs bg-primary/20 text-primary font-semibold">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-sidebar-foreground truncate">
                  {session.email}
                </p>
                <Badge
                  variant="outline"
                  className={`text-[9px] px-1.5 py-0 mt-0.5 h-4 border ${ROLE_BADGE[role] ?? ROLE_BADGE.viewer}`}
                >
                  {ROLE_LABEL[role] ?? role}
                </Badge>
              </div>
              <form action={logoutAction}>
                <button
                  type="submit"
                  title="Sign out"
                  className="h-8 w-8 flex items-center justify-center rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
                >
                  <LogOut className="h-3.5 w-3.5" />
                </button>
              </form>
            </div>
          </SidebarFooter>
        </Sidebar>

        {/* Main */}
        <SidebarInset className="flex flex-col min-w-0 flex-1">
          <header className="h-14 flex items-center justify-between gap-3 px-4 border-b border-border/60 bg-background/80 backdrop-blur-sm sticky top-0 z-10">
            <div className="flex items-center gap-3">
              <SidebarTrigger className="md:hidden h-8 w-8 flex items-center justify-center rounded-lg hover:bg-muted transition-colors cursor-pointer">
                <Menu className="h-4 w-4" />
              </SidebarTrigger>
              <div className="h-4 w-px bg-border/60 md:hidden" />
              <div className="flex flex-col">
                <span className="text-sm font-medium text-foreground leading-tight">
                  {currentLabel}
                </span>
                <Greeting name={session.name} />
              </div>
            </div>
            <ThemeToggle />
          </header>

          <main className="flex-1 p-4 md:p-6 overflow-auto">{children}</main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
