"use client";

import Link from "next/link";
import { CalendarDays, Car, Clock, Star, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/stat-card";
import { StatusBadge } from "@/components/status-badge";
import { EmptyState } from "@/components/empty-state";
import { PLATFORM } from "@/lib/constants";
import { useVehicles } from "@/lib/lookup";
import { useApp } from "@/lib/store";
import { fmtDate, formatMoney } from "@/lib/utils";

export default function OwnerDashboard() {
  const { user, bookings, currency } = useApp();
  const vehicles = useVehicles();
  if (!user) return null;

  const fleet = vehicles.filter((v) => v.ownerId === user.id);
  const mine = bookings.filter((b) => b.ownerId === user.id);
  const pending = mine.filter((b) => b.status === "requested");
  const active = mine.filter((b) => ["confirmed", "picked_up"].includes(b.status));
  const earned = mine
    .filter((b) => ["completed", "returned", "picked_up"].includes(b.status))
    .reduce((s, b) => s + b.totalPrice * (1 - PLATFORM.commissionPct / 100), 0);
  const avgRating =
    fleet.filter((f) => f.rating > 0).reduce((s, f) => s + f.rating, 0) /
    Math.max(fleet.filter((f) => f.rating > 0).length, 1);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-extrabold tracking-tight">Owner Overview</h1>
          <p className="text-sm text-muted-foreground">{user.businessName ?? "Your fleet"} · Kigali, Rwanda</p>
        </div>
        <Link href="/owner/fleet">
          <Button variant="gold" size="sm">+ Add vehicle</Button>
        </Link>
      </div>

      {user.kycStatus !== "verified" && (
        <Card className="border-amber-500/40 bg-amber-500/10">
          <CardContent className="flex items-center gap-3 p-4">
            <Clock className="h-5 w-5 text-amber-500" />
            <p className="text-sm">
              <strong>KYC pending.</strong> Upload your documents in Profile — an admin will verify you before cars go live.
            </p>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={Wallet} label="Net earnings" value={formatMoney(earned, currency)} sub={`after ${PLATFORM.commissionPct}% commission`} />
        <StatCard icon={CalendarDays} label="Pending requests" value={String(pending.length)} sub={pending.length ? "respond within 4h" : "all clear"} trend={pending.length ? "up" : undefined} />
        <StatCard icon={Car} label="Fleet size" value={String(fleet.length)} sub={`${active.length} active rentals`} />
        <StatCard icon={Star} label="Avg rating" value={avgRating ? avgRating.toFixed(1) : "—"} />
      </div>

      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-lg font-bold">Incoming requests</h2>
          <Link href="/owner/bookings">
            <Button variant="ghost" size="sm">Manage all →</Button>
          </Link>
        </div>
        {pending.length === 0 ? (
          <EmptyState
            icon={CalendarDays}
            title="No pending requests"
            description="New booking requests will appear here for your approval."
          />
        ) : (
          <div className="space-y-3">
            {pending.map((b) => {
              const v = vehicles.find((x) => x.id === b.vehicleId);
              return (
                <Card key={b.id}>
                  <CardContent className="flex flex-wrap items-center gap-4 p-4">
                    <div className="flex-1">
                      <p className="font-display font-bold">{v ? `${v.make} ${v.model}` : "Vehicle"}</p>
                      <p className="text-xs text-muted-foreground">
                        {fmtDate(b.startDate)} → {fmtDate(b.endDate)} · {b.pickupLocation}
                      </p>
                    </div>
                    <Badge variant="warning">Awaiting your approval</Badge>
                    <p className="font-display font-bold text-navy-800 dark:text-gold">
                      {formatMoney(b.totalPrice, currency)}
                    </p>
                    <StatusBadge status={b.status} />
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
