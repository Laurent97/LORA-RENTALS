"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LogOut, type LucideIcon } from "lucide-react";
import { useEffect } from "react";
import { Logo } from "./logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { CurrencyToggle } from "@/components/currency-toggle";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useApp } from "@/lib/store";
import { cn, initials } from "@/lib/utils";
import type { UserRole } from "@/types";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

const ROLE_LABEL: Record<UserRole, string> = {
  customer: "Customer",
  owner: "Car Owner",
  admin: "Super Admin",
};

export function DashboardShell({
  role,
  nav,
  children,
}: {
  role: UserRole;
  nav: NavItem[];
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, authReady, logout } = useApp();

  // Mock route guard — replace with Supabase middleware later
  useEffect(() => {
    if (!authReady) return;
    if (!user) router.replace("/login");
    else if (user.role !== role) {
      const dest = { customer: "/dashboard", owner: "/owner", admin: "/admin" }[user.role];
      router.replace(dest);
    }
  }, [authReady, user, role, router]);

  if (!authReady || !user || user.role !== role) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-gold border-t-transparent" />
      </div>
    );
  }

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar — desktop */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-border bg-card lg:flex">
        <div className="flex h-16 items-center border-b border-border px-5">
          <Logo />
        </div>
        <div className="px-5 py-4">
          <Badge variant="gold" className="w-full justify-center py-1.5">
            {ROLE_LABEL[role]} Portal
          </Badge>
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto px-3" aria-label="Dashboard">
          {nav.map((item) => {
            const active =
              item.href === `/${role === "customer" ? "dashboard" : role}`
                ? pathname === item.href
                : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                  active
                    ? "bg-navy-800 text-gold dark:bg-gold dark:text-navy-900"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-border p-4">
          <div className="mb-3 flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-navy-800 text-xs font-bold text-gold dark:bg-gold dark:text-navy-900">
              {initials(user.name)}
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{user.name}</p>
              <p className="truncate text-xs text-muted-foreground">{user.email}</p>
            </div>
          </div>
          <Button variant="outline" size="sm" className="w-full" onClick={handleLogout}>
            <LogOut className="mr-2 h-3.5 w-3.5" /> Sign out
          </Button>
        </div>
      </aside>

      {/* Top bar */}
      <div className="lg:pl-64">
        <header className="glass sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border px-4 lg:px-8">
          <div className="lg:hidden">
            <Logo compact />
          </div>
          <div className="hidden lg:block">
            <p className="text-sm text-muted-foreground">
              Welcome back, <span className="font-semibold text-foreground">{user.name.split(" ")[0]}</span>
            </p>
          </div>
          <div className="flex items-center gap-2">
            <CurrencyToggle />
            <ThemeToggle />
            <Button variant="ghost" size="icon" className="lg:hidden" onClick={handleLogout} aria-label="Sign out">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </header>

        {/* Mobile sub-nav */}
        <nav className="flex gap-1 overflow-x-auto border-b border-border bg-card px-3 py-2 scrollbar-hide lg:hidden" aria-label="Dashboard sections">
          {nav.map((item) => {
            const active =
              item.href === `/${role === "customer" ? "dashboard" : role}`
                ? pathname === item.href
                : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-semibold",
                  active
                    ? "bg-navy-800 text-gold dark:bg-gold dark:text-navy-900"
                    : "text-muted-foreground"
                )}
              >
                <item.icon className="h-3.5 w-3.5" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <main className="p-4 pb-24 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
