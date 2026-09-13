"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useVehicles } from "@/lib/lookup";
import { formatMoney } from "@/lib/utils";
import type { LongTermLease } from "@/types";

export default function LongTermLeasesPage() {
  const vehicles = useVehicles();
  const [leases, setLeases] = useState<LongTermLease[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/long-term?status=draft")
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => setLeases(data as LongTermLease[]))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const vehicleFor = (id: string) => vehicles.find((v) => v.id === id);

  return (
    <main className="container py-10">
      <h1 className="font-display text-2xl font-extrabold tracking-tight">Long-Term Leases</h1>
      <p className="mt-1 text-sm text-muted-foreground">Monthly car leases — 30% cheaper than daily × 30.</p>

      {loading ? (
        <p className="mt-6 text-sm text-muted-foreground">Loading…</p>
      ) : leases.length === 0 ? (
        <p className="mt-6 text-sm text-muted-foreground">No long-term offers yet. Owners can list vehicles.</p>
      ) : (
        <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {leases.map((l) => {
            const v = vehicleFor(l.vehicleId);
            return (
              <Card key={l.id} className="overflow-hidden">
                {v && v.images[0] && (
                  <div
                    className="h-40 bg-cover bg-center"
                    style={{ backgroundImage: `url(${v.images[0]})` }}
                  />
                )}
                <CardContent className="space-y-2 p-5">
                  <p className="font-display font-bold">
                    {v ? `${v.make} ${v.model}` : "Vehicle"} · {l.startDate} → {l.endDate}
                  </p>
                  <p className="text-2xl font-extrabold text-navy-800 dark:text-gold">
                    {formatMoney(l.monthlyPrice, "RWF")}<span className="text-sm font-normal text-muted-foreground">/mo</span>
                  </p>
                  <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                    {l.maintenanceIncluded && <span>Maintenance included</span>}
                    {l.swapAllowed && <span>Quarterly swap</span>}
                    {l.autoRenewal && <span>Auto-renewal</span>}
                  </div>
                  <Button variant="gold" className="w-full" disabled={!v}>
                    Request lease
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </main>
  );
}
