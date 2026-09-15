"use client";

import { CalendarCheck, CalendarDays, Car, LayoutDashboard, ScanLine, Star, UserRound, Users, Wallet } from "lucide-react";
import { DashboardShell, type NavItem } from "@/components/layout/dashboard-shell";

const NAV: NavItem[] = [
  { href: "/owner", label: "Overview", icon: LayoutDashboard },
  { href: "/owner/fleet", label: "My Fleet", icon: Car },
  { href: "/owner/drivers", label: "Drivers", icon: Users },
  { href: "/owner/bookings", label: "Bookings", icon: CalendarDays },
  { href: "/owner/reviews", label: "Reviews", icon: Star },
  { href: "/owner/availability", label: "Availability", icon: CalendarCheck },
  { href: "/scan", label: "Pickup Scanner", icon: ScanLine },
  { href: "/owner/earnings", label: "Earnings", icon: Wallet },
  { href: "/owner/profile", label: "Profile & KYC", icon: UserRound },
];

export default function OwnerLayout({ children }: { children: React.ReactNode }) {
  return <DashboardShell role="owner" nav={NAV}>{children}</DashboardShell>;
}
