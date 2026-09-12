"use client";

import { CalendarCheck, CalendarDays, Car, LayoutDashboard, ScanLine, Wallet } from "lucide-react";
import { DashboardShell, type NavItem } from "@/components/layout/dashboard-shell";

const NAV: NavItem[] = [
  { href: "/owner", label: "Overview", icon: LayoutDashboard },
  { href: "/owner/fleet", label: "My Fleet", icon: Car },
  { href: "/owner/bookings", label: "Bookings", icon: CalendarDays },
  { href: "/owner/availability", label: "Availability", icon: CalendarCheck },
  { href: "/scan", label: "Pickup Scanner", icon: ScanLine },
  { href: "/owner/earnings", label: "Earnings", icon: Wallet },
];

export default function OwnerLayout({ children }: { children: React.ReactNode }) {
  return <DashboardShell role="owner" nav={NAV}>{children}</DashboardShell>;
}
