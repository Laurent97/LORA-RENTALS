"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays, Home, Search, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { useApp } from "@/lib/store";

const TABS = [
  { href: "/", label: "Home", icon: Home },
  { href: "/browse", label: "Search", icon: Search },
  { href: "/dashboard/bookings", label: "Bookings", icon: CalendarDays },
  { href: "/dashboard", label: "Profile", icon: User },
];

export function MobileNav() {
  const pathname = usePathname();
  const user = useApp((s) => s.user);

  // Hide on dashboard routes (they have their own shell)
  if (pathname.startsWith("/owner") || pathname.startsWith("/admin") || pathname.startsWith("/dashboard"))
    return null;

  return (
    <nav
      className="glass fixed inset-x-0 bottom-0 z-40 border-t border-border pb-[env(safe-area-inset-bottom)] md:hidden"
      aria-label="Bottom navigation"
    >
      <div className="grid grid-cols-4">
        {TABS.map((t) => {
          const href = !user && t.href.startsWith("/dashboard") ? "/login" : t.href;
          const active = pathname === t.href;
          return (
            <Link
              key={t.label}
              href={href}
              className={cn(
                "flex min-h-[56px] flex-col items-center justify-center gap-1 text-[11px] font-medium transition-colors",
                active ? "text-navy-800 dark:text-gold" : "text-muted-foreground"
              )}
            >
              <t.icon className={cn("h-5 w-5", active && "stroke-[2.5]")} />
              {t.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
