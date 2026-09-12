"use client";

import { CalendarDays, Gift, Heart, LayoutDashboard, Star, UserRound } from "lucide-react";
import { DashboardShell, type NavItem } from "@/components/layout/dashboard-shell";

const NAV: NavItem[] = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/bookings", label: "My Bookings", icon: CalendarDays },
  { href: "/dashboard/favorites", label: "Favorites", icon: Heart },
  { href: "/dashboard/loyalty", label: "Loyalty", icon: Star },
  { href: "/dashboard/referrals", label: "Invite & Earn", icon: Gift },
  { href: "/dashboard/profile", label: "Profile", icon: UserRound },
];

export default function CustomerLayout({ children }: { children: React.ReactNode }) {
  return <DashboardShell role="customer" nav={NAV}>{children}</DashboardShell>;
}
