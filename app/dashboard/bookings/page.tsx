"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { CalendarDays, Download, MapPin, Phone, QrCode, Share2, Star, XCircle } from "lucide-react";
import { getSupabase } from "@/lib/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StatusBadge } from "@/components/status-badge";
import { EmptyState } from "@/components/empty-state";
import { SafetyWarning } from "@/components/safety/SafetyWarning";
import { TripTimeline } from "@/components/trip-timeline";
import { SosButton } from "@/components/sos-button";
import { TripTracker } from "@/components/trip-tracker";
import { BOOKING_TIMELINE, PAYMENT_METHOD_LABELS } from "@/lib/constants";
import { useVehicles } from "@/lib/lookup";
import { useApp } from "@/lib/store";
import { buildBookingPickupUrl, buildBookingQrPayload, cn, fmtDate, formatMoney, qrUrl, bookingRef } from "@/lib/utils";
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
  const [driverBookings, setDriverBookings] = useState<{ bookingId: string; status: string; driverName: string; phone: string | null; whatsapp: string | null; photoUrl: string | null }[]>([]);
  if (!user) return null;

  useEffect(() => {
    const sb = getSupabase();
    sb?.auth.getSession().then((s) => {
      fetch("/api/driver-bookings?as=customer", {
        headers: { Authorization: `Bearer ${s.data.session?.access_token ?? ""}` },
      })
        .then(async (r) => {
          const data = (await r.json().catch(() => [])) as any[];
          if (!Array.isArray(data)) return;
          setDriverBookings(
            data.map((x) => ({
              bookingId: String(x.bookingId),
              status: String(x.status),
              driverName: x.driver?.fullName ?? "Driver",
              phone: x.driver?.phone ?? null,
              whatsapp: x.driver?.whatsapp ?? null,
              photoUrl: x.driver?.photoUrl ?? null,
            }))
          );
        })
        .catch(() => {});
    });
  }, [user?.id]);

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

      <SafetyWarning variant="banner" dismissible showReport={false} />

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
                              <Image src={v.images[0]} alt="" fill sizes="128px" className="object-cover" />
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
                            {(() => {
                              const db = b.rentalMode === "with_driver" ? driverBookings.find((d) => d.bookingId === b.id) : null;
                              if (!db) return null;
                              return (
                                <div className="mt-3 rounded-xl bg-navy-50 p-3 text-sm dark:bg-navy-900/20">
                                  <p className="font-semibold text-navy-800 dark:text-gold">Chauffeur: {db.driverName}</p>
                                  {db.status === "confirmed" || db.status === "in_progress" || db.status === "completed" ? (
                                    <p className="flex items-center gap-1 text-muted-foreground">
                                      <Phone className="h-3 w-3" />
                                      <a href={`tel:${db.phone?.replace(/\s/g, "")}`} className="underline">{db.phone}</a>
                                      {db.whatsapp && <span className="text-xs">· WhatsApp: {db.whatsapp}</span>}
                                    </p>
                                  ) : (
                                    <p className="text-xs text-muted-foreground">Driver will confirm shortly. Phone revealed once confirmed.</p>
                                  )}
                                </div>
                              );
                            })()}
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
                          {b.status === "picked_up" && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                const token = b.qrToken ?? b.qrCode;
                                const link = `${window.location.origin}/track/${encodeURIComponent(token)}`;
                                navigator.clipboard.writeText(link);
                                toast.success("Live tracking link copied");
                              }}
                            >
                              <Share2 className="h-3.5 w-3.5" /> Share live trip
                            </Button>
                          )}
                          <Button variant="outline" size="sm" onClick={() => window.open(`/api/receipts/${bookingRef(b.id)}`, "_blank")}>
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
      {activeTrip && <TripTracker booking={activeTrip} />}

      <Dialog open={!!qrBooking} onOpenChange={() => setQrBooking(null)}>
        <DialogContent className="text-center" onClose={() => setQrBooking(null)}>
          <DialogHeader>
            <DialogTitle>Pickup QR code</DialogTitle>
            <DialogDescription>
              Show this at the office or to your owner at pickup — {qrBooking && bookingRef(qrBooking.id)}
            </DialogDescription>
          </DialogHeader>
          {qrBooking && (
            <>
              <SafetyWarning variant="compact" showReport={false} />
              <div className="mx-auto w-fit rounded-2xl border border-border bg-white p-4 text-left">
                {(() => {
                  const v = vehicles.find((x) => x.id === qrBooking.vehicleId);
                  return (
                    <>
                      <Image
                        src={qrUrl(buildBookingPickupUrl(buildBookingQrPayload({
                          token: qrBooking.qrToken ?? qrBooking.qrCode,
                          ref: bookingRef(qrBooking.id),
                          make: v?.make ?? "",
                          model: v?.model ?? "",
                          year: v?.year ?? "",
                          plate: v?.plate ?? "",
                          start: fmtDate(qrBooking.startDate),
                          end: fmtDate(qrBooking.endDate),
                          pickup: qrBooking.pickupLocation,
                          total: qrBooking.totalPrice,
                        })))}
                        alt="Pickup QR"
                        width={220}
                        height={220}
                      />
                      <div className="mt-3 space-y-1 border-t border-border pt-3 text-xs text-navy-800">
                        <p className="font-bold">{bookingRef(qrBooking.id)}</p>
                        {v && <p>{v.year} {v.make} {v.model}</p>}
                        <p>{fmtDate(qrBooking.startDate)} → {fmtDate(qrBooking.endDate)}</p>
                        <p>Pick-up: {qrBooking.pickupLocation}</p>
                        <p className="font-semibold">{formatMoney(qrBooking.totalPrice, currency)}</p>
                      </div>
                    </>
                  );
                })()}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
