"use client";

import Link from "next/link";
import { CalendarDays, Car, Heart, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { StatCard } from "@/components/stat-card";
import { StatusBadge } from "@/components/status-badge";
import { EmptyState } from "@/components/empty-state";
import { SafetyWarning } from "@/components/safety/SafetyWarning";
import { useVehicles } from "@/lib/lookup";
import { useApp } from "@/lib/store";
import { fmtDate, formatMoney } from "@/lib/utils";

export default function CustomerDashboard() {
  const { user, bookings, favorites, currency } = useApp();
  const vehicles = useVehicles();
  if (!user) return null;

  const mine = bookings.filter((b) => b.customerId === user.id);
  const upcoming = mine.filter((b) => ["requested", "confirmed"].includes(b.status));
  const active = mine.filter((b) => b.status === "picked_up");
  const spent = mine
    .filter((b) => ["completed", "returned", "picked_up"].includes(b.status))
    .reduce((s, b) => s + b.totalPrice, 0);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl font-extrabold tracking-tight">Overview</h1>
        <p className="text-sm text-muted-foreground">Your rentals at a glance</p>
      </div>

      <SafetyWarning variant="banner" dismissible />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={CalendarDays} label="Upcoming" value={String(upcoming.length)} />
        <StatCard icon={Car} label="Active rentals" value={String(active.length)} />
        <StatCard icon={Heart} label="Saved cars" value={String(favorites.length)} />
        <StatCard icon={Star} label="Total spent" value={formatMoney(spent, currency)} sub="paid at pickup" />
      </div>

      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-lg font-bold">Recent bookings</h2>
          <Link href="/dashboard/bookings">
            <Button variant="ghost" size="sm">View all →</Button>
          </Link>
        </div>
        {mine.length === 0 ? (
          <EmptyState
            title="No bookings yet"
            description="Browse our verified fleet and reserve your first car — pay at pickup."
            actionLabel="Browse cars"
            actionHref="/browse"
          />
        ) : (
          <div className="space-y-3">
            {mine.slice(0, 4).map((b) => {
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
