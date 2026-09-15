"use client";

import { Shield, Star, CalendarDays, Banknote, Award } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { useApp } from "@/lib/store";

const nav = [
  { href: "/driver/dashboard", label: "Dashboard", icon: Award },
  { href: "/driver/availability", label: "Availability", icon: CalendarDays },
  { href: "/driver/bookings", label: "Bookings", icon: CalendarDays },
  { href: "/driver/earnings", label: "Earnings", icon: Banknote },
  { href: "/driver/badge", label: "Badge", icon: Award },
];

export default function DriverDashboardPage() {
  const { user } = useApp();
  return (
    <DashboardShell role="driver" nav={nav}>
      <div className="space-y-6 p-4 lg:p-8">
        <div>
          <h1 className="font-display text-2xl font-extrabold">Welcome, {user?.name}</h1>
          <p className="text-sm text-muted-foreground">Your driver dashboard.</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <Card>
            <CardContent className="p-5 text-center">
              <Banknote className="mx-auto h-6 w-6 text-gold" />
              <p className="mt-2 text-2xl font-extrabold">0</p>
              <p className="text-xs text-muted-foreground">RWF earned</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5 text-center">
              <CalendarDays className="mx-auto h-6 w-6 text-gold" />
              <p className="mt-2 text-2xl font-extrabold">0</p>
              <p className="text-xs text-muted-foreground">Upcoming trips</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5 text-center">
              <Star className="mx-auto h-6 w-6 text-gold" />
              <p className="mt-2 text-2xl font-extrabold">—</p>
              <p className="text-xs text-muted-foreground">Rating</p>
            </CardContent>
          </Card>
        </div>

        <div className="rounded-2xl border border-gold/30 bg-navy-50 p-6 dark:bg-navy-900/20">
          <div className="flex items-start gap-3">
            <Shield className="h-6 w-6 text-gold" />
            <div>
              <h3 className="font-bold text-navy-800 dark:text-gold">Verification status</h3>
              <p className="text-sm text-muted-foreground">
                Your application is under review. Once approved, customers can book you.
              </p>
            </div>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
