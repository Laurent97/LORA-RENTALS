"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { CalendarDays, Download, MapPin, QrCode, Star, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StatusBadge } from "@/components/status-badge";
import { EmptyState } from "@/components/empty-state";
import { TripTimeline } from "@/components/trip-timeline";
import { SosButton } from "@/components/sos-button";
import { BOOKING_TIMELINE, PAYMENT_METHOD_LABELS } from "@/lib/constants";
import { useVehicles } from "@/lib/lookup";
import { useApp } from "@/lib/store";
import { cn, fmtDate, formatMoney, qrUrl, bookingRef } from "@/lib/utils";
import type { Booking } from "@/types";

const GROUPS: Record<string, (b: Booking) => boolean> = {
  upcoming: (b) => ["requested", "confirmed"].includes(b.status),
  active: (b) => b.status === "picked_up",
  completed: (b) => ["returned", "completed"].includes(b.status),
  cancelled: (b) => ["cancelled", "declined"].includes(b.status),
};

export default function MyBookingsPage() {
  const { user, bookings, reviews, updateBookingStatus, currency } = useApp();
  const vehicles = useVehicles();
  const [tab, setTab] = useState("upcoming");
  const [qrBooking, setQrBooking] = useState<Booking | null>(null);
  if (!user) return null;

  const mine = bookings.filter((b) => b.customerId === user.id);
  const list = mine.filter(GROUPS[tab]);
  const activeTrip = mine.find((b) => b.status === "picked_up");

  const cancel = (b: Booking) => {
    updateBookingStatus(b.id, "cancelled");
    toast.success("Booking cancelled — no charge, ever.");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-extrabold tracking-tight">My Bookings</h1>
        <p className="text-sm text-muted-foreground">Track, manage and pay at pickup</p>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          {(["upcoming", "active", "completed", "cancelled"] as const).map((t) => (
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
                title={`No ${t} bookings`}
                description="When you reserve a car it will appear here."
                actionLabel="Browse cars"
                actionHref="/browse"
              />
            ) : (
              <div className="space-y-4">
                {list.map((b) => {
                  const v = vehicles.find((x) => x.id === b.vehicleId);
                  return (
                    <Card key={b.id}>
                      <CardContent className="p-5">
                        <div className="flex flex-wrap items-start gap-4">
                          {v && (
                            <div className="relative h-20 w-32 shrink-0 overflow-hidden rounded-xl bg-muted">
                              <Image src={v.images[0]} alt="" fill className="object-cover" />
                            </div>
                          )}
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="font-display font-bold">
                                {v ? `${v.make} ${v.model}` : "Vehicle"} · {bookingRef(b.id)}
                              </p>
                              <StatusBadge status={b.status} />
                            </div>
                            <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                              <CalendarDays className="h-3 w-3" /> {fmtDate(b.startDate)} → {fmtDate(b.endDate)}
                            </p>
                            <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                              <MapPin className="h-3 w-3" /> {b.pickupLocation}
                            </p>
                            <div className="mt-4">
                              <TripTimeline booking={b} />
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-display text-lg font-extrabold text-navy-800 dark:text-gold">
                              {formatMoney(b.totalPrice, currency)}
                            </p>
                            <p className="text-[11px] text-muted-foreground">
                              {PAYMENT_METHOD_LABELS[b.paymentMethod]} · {b.paymentPoint}
                              {b.paymentConfirmed ? " · paid" : " · due on arrival"}
                            </p>
                          </div>
                        </div>
                        <div className="mt-4 flex flex-wrap gap-2 border-t border-border pt-4">
                          <Button variant="outline" size="sm" onClick={() => setQrBooking(b)}>
                            <QrCode className="h-3.5 w-3.5" /> Pickup QR
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => toast.success("Receipt downloaded (demo)")}>
                            <Download className="h-3.5 w-3.5" /> Receipt
                          </Button>
                          {!b.paymentConfirmed && ["requested", "confirmed"].includes(b.status) && (
                            <Link href={`/dashboard/bookings/${b.id}/pay`} className="inline-flex h-9 items-center justify-center rounded-xl bg-gold px-3 text-xs font-semibold text-navy-900 shadow-sm transition-colors hover:bg-gold-300">
                              Pay with Mobile Money
                            </Link>
                          )}
                          {["requested", "confirmed"].includes(b.status) && (
                            <Button variant="ghost" size="sm" className="text-destructive" onClick={() => cancel(b)}>
                              <XCircle className="h-3.5 w-3.5" /> Cancel
                            </Button>
                          )}
                          {b.status === "completed" && !reviews.some((r) => r.bookingId === b.id) && (
                            <Link href={`/dashboard/bookings/${b.id}/review`}>
                              <Button variant="gold" size="sm">
                                <Star className="h-3.5 w-3.5" /> Leave a review
                              </Button>
                            </Link>
                          )}
                          {b.status === "completed" && reviews.some((r) => r.bookingId === b.id) && (
                            <Badge variant="success">Reviewed ✓</Badge>
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

      {activeTrip && <SosButton booking={activeTrip} />}

      <Dialog open={!!qrBooking} onOpenChange={() => setQrBooking(null)}>
        <DialogContent className="text-center" onClose={() => setQrBooking(null)}>
          <DialogHeader>
            <DialogTitle>Pickup QR code</DialogTitle>
            <DialogDescription>
              Show this at the office or to your owner at pickup — {qrBooking && bookingRef(qrBooking.id)}
            </DialogDescription>
          </DialogHeader>
          {qrBooking && (
            <div className="mx-auto w-fit rounded-2xl border border-border bg-white p-4">
              <Image src={qrUrl(`LORA:${qrBooking.qrToken ?? qrBooking.qrCode}`, 220)} alt="Pickup QR" width={220} height={220} />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
