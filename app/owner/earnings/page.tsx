"use client";

import { Download, Wallet } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/stat-card";
import { PLATFORM, PAYMENT_METHOD_LABELS } from "@/lib/constants";
import { useVehicles } from "@/lib/lookup";
import { useApp } from "@/lib/store";
import { fmtDate, formatMoney, bookingRef } from "@/lib/utils";

export default function EarningsPage() {
  const { user, bookings, currency } = useApp();
  const vehicles = useVehicles();
  if (!user) return null;

  const mine = bookings.filter(
    (b) => b.ownerId === user.id && ["completed", "returned", "picked_up", "confirmed"].includes(b.status)
  );
  const gross = mine.reduce((s, b) => s + b.totalPrice, 0);
  const commission = gross * (PLATFORM.commissionPct / 100);
  const net = gross - commission;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-extrabold tracking-tight">Earnings & Payouts</h1>
          <p className="text-sm text-muted-foreground">
            Payouts via {user.payoutMethod === "bank" ? "bank transfer" : "MTN MoMo"} · {user.payoutDetails ?? "set up in profile"}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => toast.success("Statement PDF downloaded (demo)")}>
          <Download className="h-4 w-4" /> Statement
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard icon={Wallet} label="Gross rentals" value={formatMoney(gross, currency)} />
        <StatCard icon={Wallet} label={`Platform commission (${PLATFORM.commissionPct}%)`} value={formatMoney(commission, currency)} />
        <StatCard icon={Wallet} label="Net to you" value={formatMoney(net, currency)} trend="up" sub="paid at office/pickup, tracked by admin" />
      </div>

      <Card>
        <CardHeader><CardTitle>Payout ledger</CardTitle></CardHeader>
        <CardContent>
          {mine.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">No earnings yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                    <th className="pb-3 pr-4">Booking</th>
                    <th className="pb-3 pr-4">Vehicle</th>
                    <th className="pb-3 pr-4">Dates</th>
                    <th className="pb-3 pr-4">Payment</th>
                    <th className="pb-3 pr-4 text-right">Gross</th>
                    <th className="pb-3 pr-4 text-right">Net</th>
                    <th className="pb-3 text-right">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {mine.map((b) => {
                    const v = vehicles.find((x) => x.id === b.vehicleId);
                    const netB = b.totalPrice * (1 - PLATFORM.commissionPct / 100);
                    return (
                      <tr key={b.id} className="border-b border-border/60 last:border-0">
                        <td className="py-3 pr-4 font-mono text-xs">{bookingRef(b.id)}</td>
                        <td className="py-3 pr-4">{v ? `${v.make} ${v.model}` : "—"}</td>
                        <td className="py-3 pr-4 text-xs text-muted-foreground">{fmtDate(b.startDate)} → {fmtDate(b.endDate)}</td>
                        <td className="py-3 pr-4 text-xs">{PAYMENT_METHOD_LABELS[b.paymentMethod]} · {b.paymentPoint}</td>
                        <td className="py-3 pr-4 text-right font-medium">{formatMoney(b.totalPrice, currency)}</td>
                        <td className="py-3 pr-4 text-right font-semibold text-navy-800 dark:text-gold">{formatMoney(netB, currency)}</td>
                        <td className="py-3 text-right">
                          <Badge variant={b.paymentConfirmed ? "success" : "warning"}>
                            {b.paymentConfirmed ? "Paid" : "Pending"}
                          </Badge>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
