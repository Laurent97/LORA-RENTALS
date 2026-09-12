"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Download, Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { StatusBadge } from "@/components/status-badge";
import { BOOKING_STATUS_LABELS, PAYMENT_METHOD_LABELS } from "@/lib/constants";
import { useAllUsers, useVehicles } from "@/lib/lookup";
import { useApp } from "@/lib/store";
import { fmtDate, formatMoney, bookingRef } from "@/lib/utils";
import type { BookingStatus } from "@/types";

export default function AdminBookingsPage() {
  const { bookings, updateBookingStatus, currency } = useApp();
  const vehicles = useVehicles();
  const users = useAllUsers();
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<BookingStatus | "">("");

  const list = bookings.filter((b) => {
    const v = vehicles.find((x) => x.id === b.vehicleId);
    const c = users.find((u) => u.id === b.customerId);
    const hay = `${b.id} ${v?.make} ${v?.model} ${c?.name}`.toLowerCase();
    return (!status || b.status === status) && (!q || hay.includes(q.toLowerCase()));
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-extrabold tracking-tight">Bookings Management</h1>
          <p className="text-sm text-muted-foreground">{list.length} bookings · full control & overrides</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => toast.success("CSV exported (demo)")}>
            <Download className="h-4 w-4" /> Export
          </Button>
          <Button variant="gold" size="sm" onClick={() => toast.info("Manual booking for walk-in customers — form plugs in here")}>
            <Plus className="h-4 w-4" /> Walk-in booking
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-0">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input className="pl-10" placeholder="Search ref, vehicle, customer…" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <Select value={status} onChange={(e) => setStatus(e.target.value as BookingStatus | "")} className="w-full sm:w-48">
          <option value="">All statuses</option>
          {Object.entries(BOOKING_STATUS_LABELS).map(([v, l]) => (
            <option key={v} value={v}>{l}</option>
          ))}
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="p-4">Ref</th>
                  <th className="p-4">Customer</th>
                  <th className="p-4">Vehicle</th>
                  <th className="p-4">Dates</th>
                  <th className="p-4">Payment</th>
                  <th className="p-4 text-right">Total</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Override</th>
                </tr>
              </thead>
              <tbody>
                {list.map((b) => {
                  const v = vehicles.find((x) => x.id === b.vehicleId);
                  const c = users.find((u) => u.id === b.customerId);
                  return (
                    <tr key={b.id} className="border-b border-border/60 last:border-0 hover:bg-secondary/40">
                      <td className="p-4 font-mono text-xs">{bookingRef(b.id)}</td>
                      <td className="p-4">
                        <p className="font-medium">{c?.name ?? "—"}</p>
                        <p className="text-xs text-muted-foreground">{c?.phone}</p>
                      </td>
                      <td className="p-4 text-xs">{v ? `${v.make} ${v.model}` : "—"}</td>
                      <td className="p-4 text-xs text-muted-foreground">{fmtDate(b.startDate)} → {fmtDate(b.endDate)}</td>
                      <td className="p-4 text-xs">
                        {PAYMENT_METHOD_LABELS[b.paymentMethod]} · {b.paymentPoint}
                        <span className={b.paymentConfirmed ? " text-emerald-500" : " text-amber-500"}>
                          {" "}· {b.paymentConfirmed ? "confirmed" : "unconfirmed"}
                        </span>
                      </td>
                      <td className="p-4 text-right font-semibold">{formatMoney(b.totalPrice, currency)}</td>
                      <td className="p-4"><StatusBadge status={b.status} /></td>
                      <td className="p-4">
                        <div className="flex justify-end">
                          <Select
                            value={b.status}
                            onChange={(e) => {
                              updateBookingStatus(b.id, e.target.value as BookingStatus);
                              toast.success(`Booking ${bookingRef(b.id)} → ${e.target.value.replace("_", " ")}`);
                            }}
                            className="h-8 w-full sm:w-36 text-xs"
                            aria-label="Override status"
                          >
                            {Object.entries(BOOKING_STATUS_LABELS).map(([v, l]) => (
                              <option key={v} value={v}>{l}</option>
                            ))}
                          </Select>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
