"use client";

import { Activity, CalendarDays, Car, Users, Wallet } from "lucide-react";
import dynamic from "next/dynamic";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/stat-card";
import { StatusBadge } from "@/components/status-badge";
import { PLATFORM } from "@/lib/constants";
import { useAllUsers, useVehicles } from "@/lib/lookup";
import { useApp } from "@/lib/store";
import { fmtDate, formatMoney, bookingRef } from "@/lib/utils";

const AdminCharts = dynamic(() => import("@/components/admin/charts").then((m) => m.AdminCharts), {
  ssr: false,
  loading: () => <div className="h-64 w-full animate-pulse rounded-2xl bg-muted" />,
});

export default function AdminDashboard() {
  const { bookings, currency } = useApp();
  const vehicles = useVehicles();
  const users = useAllUsers();

  const totalRevenue = bookings.reduce((s, b) => s + b.totalPrice, 0);
  const commission = totalRevenue * (PLATFORM.commissionPct / 100);
  const activeRentals = bookings.filter((b) => b.status === "picked_up").length;
  const pendingKyc = users.filter((u) => u.kycStatus === "pending").length;
  const pendingVehicles = vehicles.filter((v) => v.status === "pending_approval").length;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl font-extrabold tracking-tight">Command Center</h1>
        <p className="text-sm text-muted-foreground">Platform-wide overview · LORA RENTALS LTD</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={CalendarDays} label="Total bookings" value={String(bookings.length + 214)} sub="+12% vs last month" trend="up" />
        <StatCard icon={Car} label="Active rentals" value={String(activeRentals)} sub={`${vehicles.length} vehicles listed`} />
        <StatCard icon={Wallet} label="Commission earned" value={formatMoney(commission, currency)} sub={`${PLATFORM.commissionPct}% platform fee`} trend="up" />
        <StatCard icon={Users} label="Users" value={String(users.length + 2400)} sub={`${pendingKyc} KYC pending`} trend={pendingKyc ? "up" : undefined} />
      </div>

      {(pendingKyc > 0 || pendingVehicles > 0) && (
        <Card className="border-gold/40 bg-gold/5">
          <CardContent className="flex flex-wrap items-center gap-3 p-4">
            <Activity className="h-5 w-5 text-gold" />
            <p className="text-sm font-medium">Action needed:</p>
            {pendingKyc > 0 && <Badge variant="warning">{pendingKyc} KYC to review</Badge>}
            {pendingVehicles > 0 && <Badge variant="info">{pendingVehicles} vehicle{pendingVehicles > 1 ? "s" : ""} to approve</Badge>}
          </CardContent>
        </Card>
      )}

      <AdminCharts />

      <Card>
        <CardHeader><CardTitle>Recent activity</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-3">
            {bookings.slice(0, 5).map((b) => {
              const v = vehicles.find((x) => x.id === b.vehicleId);
              const c = users.find((u) => u.id === b.customerId);
              return (
                <div key={b.id} className="flex flex-wrap items-center gap-3 rounded-xl border border-border p-3">
                  <span className="font-mono text-xs text-muted-foreground">{bookingRef(b.id)}</span>
                  <span className="text-sm font-medium">{c?.name ?? "Customer"}</span>
                  <span className="text-sm text-muted-foreground">
                    booked {v ? `${v.make} ${v.model}` : "a vehicle"} · {fmtDate(b.startDate)}
                  </span>
                  <span className="ml-auto flex items-center gap-3">
                    <span className="text-sm font-bold">{formatMoney(b.totalPrice, currency)}</span>
                    <StatusBadge status={b.status} />
                  </span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
