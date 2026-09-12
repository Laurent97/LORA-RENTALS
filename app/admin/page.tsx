"use client";

import { Activity, CalendarDays, Car, Users, Wallet } from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/stat-card";
import { StatusBadge } from "@/components/status-badge";
import { PLATFORM } from "@/lib/constants";
import { useAllUsers, useVehicles } from "@/lib/lookup";
import { useApp } from "@/lib/store";
import { fmtDate, formatMoney, bookingRef } from "@/lib/utils";

const BOOKINGS_TREND = [
  { m: "Apr", bookings: 18, revenue: 4.2 },
  { m: "May", bookings: 26, revenue: 6.1 },
  { m: "Jun", bookings: 34, revenue: 8.4 },
  { m: "Jul", bookings: 41, revenue: 10.2 },
  { m: "Aug", bookings: 52, revenue: 13.8 },
  { m: "Sep", bookings: 47, revenue: 12.5 },
];

const TOP_LOCATIONS = [
  { location: "Kigali — Gasabo", bookings: 96 },
  { location: "Kigali — Kicukiro", bookings: 71 },
  { location: "Musanze", bookings: 54 },
  { location: "Kigali — Nyarugenge", bookings: 48 },
  { location: "Rubavu", bookings: 33 },
  { location: "Huye", bookings: 21 },
];

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

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Bookings trend</CardTitle></CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={BOOKINGS_TREND}>
                <defs>
                  <linearGradient id="gBook" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#D4AF37" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#D4AF37" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="m" fontSize={12} stroke="hsl(var(--muted-foreground))" />
                <YAxis fontSize={12} stroke="hsl(var(--muted-foreground))" />
                <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid hsl(var(--border))", background: "hsl(var(--card))" }} />
                <Area type="monotone" dataKey="bookings" stroke="#D4AF37" strokeWidth={2.5} fill="url(#gBook)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Top locations</CardTitle></CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={TOP_LOCATIONS} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis type="number" fontSize={12} stroke="hsl(var(--muted-foreground))" />
                <YAxis type="category" dataKey="location" fontSize={11} width={130} stroke="hsl(var(--muted-foreground))" />
                <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid hsl(var(--border))", background: "hsl(var(--card))" }} />
                <Bar dataKey="bookings" fill="#0A1F44" radius={[0, 6, 6, 0]} className="dark:fill-gold" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

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
