"use client";

import { Award, BadgeCheck, Building2, CalendarDays, Car, FileText, Globe, LayoutDashboard, Mail, MapPin, Megaphone, ScanLine, Settings, Share2, ShieldAlert, Siren, Star, User, Users, WalletCards } from "lucide-react";
import { DashboardShell, type NavItem } from "@/components/layout/dashboard-shell";

const NAV: NavItem[] = [
  { href: "/admin", label: "Command Center", icon: LayoutDashboard },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/vehicles", label: "Vehicles", icon: Car },
  { href: "/admin/bookings", label: "Bookings", icon: CalendarDays },
  { href: "/admin/payments", label: "Payments", icon: WalletCards },
  { href: "/admin/drivers", label: "Drivers", icon: User },
  { href: "/admin/badges", label: "Driver Badges", icon: Award },
  { href: "/admin/kyc", label: "KYC Approvals", icon: BadgeCheck },
  { href: "/admin/sos", label: "SOS Alerts", icon: Siren },
  { href: "/admin/scam-reports", label: "Scam Reports", icon: ShieldAlert },
  { href: "/admin/geofence", label: "Geofence", icon: MapPin },
  { href: "/admin/blog", label: "Blog CMS", icon: FileText },
  { href: "/admin/tenants", label: "Tenants", icon: Globe },
  { href: "/admin/corporate", label: "Corporate", icon: Building2 },
  { href: "/admin/messages", label: "Messages", icon: Megaphone },
  { href: "/admin/shares", label: "Share Analytics", icon: Share2 },
  { href: "/admin/emails", label: "Emails", icon: Mail },
  { href: "/scan", label: "Pickup Scanner", icon: ScanLine },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <DashboardShell role="admin" nav={NAV}>{children}</DashboardShell>;
}
