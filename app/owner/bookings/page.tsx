"use client";

import { useState } from "react";
import { toast } from "sonner";
import Link from "next/link";
import { CalendarDays, Check, ClipboardCheck, KeyRound, RotateCcw, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StatusBadge } from "@/components/status-badge";
import { EmptyState } from "@/components/empty-state";
import { SlaCountdown } from "@/components/sla-countdown";
import { PAYMENT_METHOD_LABELS } from "@/lib/constants";
import { useAllUsers, useVehicles } from "@/lib/lookup";
import { useApp } from "@/lib/store";
import { fmtDate, formatMoney, bookingRef } from "@/lib/utils";
import type { Booking } from "@/types";

const GROUPS: Record<string, (b: Booking) => boolean> = {
  requests: (b) => b.status === "requested",
  active: (b) => ["confirmed", "picked_up"].includes(b.status),
  history: (b) => ["returned", "completed", "cancelled", "declined"].includes(b.status),
};

export default function OwnerBookingsPage() {
  const { user, bookings, updateBookingStatus, currency } = useApp();
  const vehicles = useVehicles();
  const users = useAllUsers();
  const [tab, setTab] = useState("requests");
  if (!user) return null;

  const mine = bookings.filter((b) => b.ownerId === user.id);
  const list = mine.filter(GROUPS[tab]);

  const act = (b: Booking, status: Booking["status"], msg: string) => {
    updateBookingStatus(b.id, status);
    toast.success(msg);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-extrabold tracking-tight">Bookings</h1>
        <p className="text-sm text-muted-foreground">Approve requests, track pickups & returns</p>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          {(["requests", "active", "history"] as const).map((t) => (
            <TabsTrigger key={t} value={t} className="capitalize">
              {t} ({mine.filter(GROUPS[t]).length})
            </TabsTrigger>
          ))}
        </TabsList>

        {Object.keys(GROUPS).map((t) => (
          <TabsContent key={t} value={t}>
            {list.length === 0 ? (
              <EmptyState
                icon={CalendarDays}
                title={`No ${t}`}
                description="Bookings for your vehicles will appear here."
              />
            ) : (
              <div className="space-y-4">
                {list.map((b) => {
                  const v = vehicles.find((x) => x.id === b.vehicleId);
                  const customer = users.find((u) => u.id === b.customerId);
                  return (
                    <Card key={b.id}>
                      <CardContent className="p-5">
                        <div className="flex flex-wrap items-start justify-between gap-4">
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="font-display font-bold">
                                {v ? `${v.make} ${v.model}` : "Vehicle"} · {bookingRef(b.id)}
                              </p>
                              <StatusBadge status={b.status} />
                              {b.status === "requested" && (
                                <SlaCountdown deadline={b.ownerResponseDeadline} />
                              )}
                            </div>
                            <p className="mt-1 text-xs text-muted-foreground">
                              {customer?.name ?? "Customer"} · {customer?.phone}
                            </p>
                            <p className="mt-0.5 text-xs text-muted-foreground">
                              {fmtDate(b.startDate)} → {fmtDate(b.endDate)} · pickup: {b.pickupLocation}
                            </p>
                            <p className="mt-0.5 text-xs text-muted-foreground">
                              Pays {PAYMENT_METHOD_LABELS[b.paymentMethod]} at {b.paymentPoint}
                              {b.paymentConfirmed ? " · confirmed" : ""}
                            </p>
                          </div>
                          <p className="font-display text-lg font-extrabold text-navy-800 dark:text-gold">
                            {formatMoney(b.totalPrice, currency)}
                          </p>
                        </div>
                        <div className="mt-4 flex flex-wrap gap-2 border-t border-border pt-4">
                          {b.status === "requested" && (
                            <>
                              <Button variant="gold" size="sm" onClick={() => act(b, "confirmed", "Booking confirmed — customer notified")}>
                                <Check className="h-3.5 w-3.5" /> Accept
                              </Button>
                              <Button variant="outline" size="sm" onClick={() => act(b, "declined", "Request declined")}>
                                <X className="h-3.5 w-3.5" /> Decline
                              </Button>
                            </>
                          )}
                          {b.status === "confirmed" && (
                            <>
                              <Button variant="gold" size="sm" onClick={() => act(b, "picked_up", "Marked as picked up — scan customer QR to verify")}>
                                <KeyRound className="h-3.5 w-3.5" /> Mark picked up
                              </Button>
                              <Link href={`/inspect/${b.id}`}>
                                <Button variant="outline" size="sm">
                                  <ClipboardCheck className="h-3.5 w-3.5" /> Pickup inspection
                                </Button>
                              </Link>
                            </>
                          )}
                          {b.status === "picked_up" && (
                            <>
                              <Button variant="gold" size="sm" onClick={() => act(b, "returned", "Marked as returned — complete inspection")}>
                                <RotateCcw className="h-3.5 w-3.5" /> Mark returned
                              </Button>
                              <Link href={`/inspect/${b.id}`}>
                                <Button variant="outline" size="sm">
                                  <ClipboardCheck className="h-3.5 w-3.5" /> Return inspection
                                </Button>
                              </Link>
                            </>
                          )}
                          {b.status === "returned" && (
                            <Button variant="outline" size="sm" onClick={() => act(b, "completed", "Rental completed")}>
                              <Check className="h-3.5 w-3.5" /> Complete rental
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
