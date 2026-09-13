"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, LogOut, Menu, User as UserIcon, X } from "lucide-react";
import { useState } from "react";
import { Logo } from "./logo";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { CurrencyToggle } from "@/components/currency-toggle";
import { LanguageSwitcher } from "@/components/language-switcher";
import { PWAInstallButton } from "@/components/pwa/PWAInstallButton";
import { useApp } from "@/lib/store";
import { cn, initials } from "@/lib/utils";

const NAV = [
  { href: "/browse", label: "Browse Cars" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

const DASHBOARD_HREF: Record<string, string> = {
  customer: "/dashboard",
  owner: "/owner",
  admin: "/admin",
};

export function Header() {
  const pathname = usePathname();
  const { user, logout } = useApp();
  const [open, setOpen] = useState(false);

  return (
    <header className="glass sticky top-0 z-40 border-b border-border/60">
      <div className="container flex h-16 items-center justify-between gap-4">
        <Logo />

        <nav className="hidden items-center gap-1 md:flex" aria-label="Main">
          {NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className={cn(
                "rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                pathname.startsWith(n.href)
                  ? "text-navy-800 dark:text-gold"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {n.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <div className="hidden sm:block">
            <CurrencyToggle />
          </div>
          <LanguageSwitcher />
          <ThemeToggle />
          <PWAInstallButton />
          {user ? (
            <div className="flex items-center gap-2">
              <Link href={DASHBOARD_HREF[user.role]}>
                <Button variant="outline" size="sm" className="gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-navy-800 text-[10px] font-bold text-gold dark:bg-gold dark:text-navy-900">
                    {initials(user.name)}
                  </span>
                  <span className="hidden sm:inline">
                    <LayoutDashboard className="mr-1 inline h-3.5 w-3.5" />
                    Dashboard
                  </span>
                </Button>
              </Link>
              <Button variant="ghost" size="icon" onClick={logout} aria-label="Log out">
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div className="hidden items-center gap-2 sm:flex">
              <Link href="/login">
                <Button variant="ghost" size="sm">
                  <UserIcon className="mr-1 h-4 w-4" /> Sign in
                </Button>
              </Link>
              <Link href="/register">
                <Button variant="gold" size="sm">
                  List your car
                </Button>
              </Link>
            </div>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setOpen(!open)}
            aria-label="Menu"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {open && (
        <nav className="border-t border-border bg-card p-4 md:hidden" aria-label="Mobile">
          <div className="flex flex-col gap-1">
            {NAV.map((n) => (
              <Link
                key={n.href}
                href={n.href}
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-2.5 text-sm font-medium hover:bg-secondary"
              >
                {n.label}
              </Link>
            ))}
            {!user && (
              <>
                <Link href="/login" onClick={() => setOpen(false)} className="rounded-lg px-3 py-2.5 text-sm font-medium hover:bg-secondary">
                  Sign in
                </Link>
                <Link href="/register" onClick={() => setOpen(false)} className="rounded-lg px-3 py-2.5 text-sm font-bold text-gold-600 dark:text-gold hover:bg-secondary">
                  List your car →
                </Link>
              </>
            )}
            <div className="mt-3 px-3">
              <PWAInstallButton className="w-full justify-center" />
            </div>
            <div className="mt-2 px-3">
              <CurrencyToggle />
            </div>
          </div>
        </nav>
      )}
    </header>
  );
}
