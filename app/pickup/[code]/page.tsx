"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import Image from "next/image";
import { CalendarDays, Car, CheckCircle2, MapPin, QrCode, Shield, User as UserIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SafetyWarning } from "@/components/safety/SafetyWarning";
import { useApp } from "@/lib/store";
import { BRAND } from "@/lib/constants";
import { decodeBookingQrPayload, fmtDate, formatMoney, bookingRef } from "@/lib/utils";
import type { Booking, User, Vehicle } from "@/types";

type LookupResult = {
  booking: Booking;
  ref: string;
  vehicle: Vehicle | null;
  customer: User | null;
  owner: User | null;
};

export default function PickupPassPage() {
  const { code } = useParams<{ code: string }>();
  const { user, currency } = useApp();
  const [data, setData] = useState<LookupResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!code) return;
    const payload = decodeBookingQrPayload(code) ?? code;
    fetch(`/api/pickup/lookup?code=${encodeURIComponent(payload)}`)
      .then(async (res) => {
        const json = (await res.json().catch(() => ({}))) as {
          booking?: Booking;
          ref?: string;
          vehicle?: Vehicle | null;
          customer?: User | null;
          owner?: User | null;
          error?: string;
        };
        if (!res.ok) throw new Error(json.error ?? "Could not load booking");
        setData(json as LookupResult);
      })
      .catch((err) => setError((err as Error).message))
      .finally(() => setLoading(false));
  }, [code]);

  if (loading) {
    return (
      <main className="container flex min-h-screen max-w-lg items-center justify-center py-12">
        <p className="text-muted-foreground">Loading pickup pass…</p>
      </main>
    );
  }

  if (error || !data) {
    return (
      <main className="container max-w-lg py-12 text-center">
        <h1 className="font-display text-xl font-bold">No booking found</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {error || "This QR code or reference does not match any booking."}
        </p>
        <p className="mt-4 text-xs text-muted-foreground">
          Book securely through {BRAND.siteUrl}
        </p>
      </main>
    );
  }

  const { booking, ref, vehicle, customer, owner } = data;
  const isOwner = user?.id === booking.ownerId;
  const isPickedUp = booking.status === "picked_up" || booking.status === "completed";

  return (
    <main className="container max-w-lg py-8">
      <div className="mb-6 text-center">
        <Shield className="mx-auto h-10 w-10 text-gold" />
        <h1 className="mt-3 font-display text-2xl font-extrabold">LORA Pickup Pass</h1>
        <p className="text-sm text-muted-foreground">
          {isPickedUp ? "This rental has already been collected" : "Show this to the owner or driver at pickup"}
        </p>
      </div>

      <SafetyWarning variant="compact" showReport={false} showAcknowledgeButton={false} />

      <Card className="mt-6 overflow-hidden">
        <CardContent className="p-0">
          <div className="bg-navy-800 p-6 text-center text-white">
            <p className="text-xs uppercase tracking-wider text-silver">Booking</p>
            <p className="font-mono text-2xl font-bold text-gold">{ref}</p>
            <p className="mt-1 text-sm text-silver">{vehicle ? `${vehicle.year} ${vehicle.make} ${vehicle.model}` : "Vehicle"}</p>
            {vehicle?.plate && <p className="text-xs text-silver">Plate: {vehicle.plate}</p>}
          </div>

          <div className="p-6">
            <div className="mb-4 flex items-center justify-center">
              {vehicle?.images?.[0] ? (
                <div className="relative h-32 w-48 overflow-hidden rounded-xl">
                  <Image src={vehicle.images[0]} alt="" fill className="object-cover" />
                </div>
              ) : (
                <div className="flex h-32 w-48 items-center justify-center rounded-xl bg-muted">
                  <Car className="h-10 w-10 text-muted-foreground" />
                </div>
              )}
            </div>

            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-2">
                <CalendarDays className="h-4 w-4 text-gold" />
                <span className="text-muted-foreground">Dates</span>
                <span className="ml-auto font-medium">{fmtDate(booking.startDate)} → {fmtDate(booking.endDate)}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-gold" />
                <span className="text-muted-foreground">Pickup</span>
                <span className="ml-auto text-right font-medium">{booking.pickupLocation}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-gold" />
                <span className="text-muted-foreground">Return</span>
                <span className="ml-auto text-right font-medium">{booking.returnLocation}</span>
              </div>
              <div className="flex items-center gap-2">
                <UserIcon className="h-4 w-4 text-gold" />
                <span className="text-muted-foreground">Customer</span>
                <span className="ml-auto font-medium">{customer?.name ?? "—"}</span>
              </div>
              <div className="flex items-center gap-2">
                <UserIcon className="h-4 w-4 text-gold" />
                <span className="text-muted-foreground">Owner</span>
                <span className="ml-auto font-medium">{owner?.name ?? "—"}</span>
              </div>
              <div className="flex items-center gap-2">
                <QrCode className="h-4 w-4 text-gold" />
                <span className="text-muted-foreground">Status</span>
                <span className="ml-auto"><Badge variant={isPickedUp ? "success" : "warning"} className="capitalize">{booking.status.replace("_", " ")}</Badge></span>
              </div>
              <div className="flex items-center gap-2 border-t pt-3">
                <span className="text-muted-foreground">Total</span>
                <span className="ml-auto font-display text-lg font-extrabold text-navy-800 dark:text-gold">
                  {formatMoney(booking.totalPrice, currency)}
                </span>
              </div>
            </div>

            {isPickedUp ? (
              <div className="mt-6 rounded-xl bg-emerald-500/10 p-4 text-center text-sm text-emerald-600">
                <CheckCircle2 className="mx-auto h-6 w-6" />
                <p className="mt-1 font-semibold">Already picked up</p>
              </div>
            ) : (
              <div className="mt-6 rounded-xl bg-navy-50 p-4 text-center text-sm text-muted-foreground dark:bg-navy-900/30">
                Pay only at pickup — never in advance.
                Report scams: {BRAND.phone}
              </div>
            )}

            {isOwner && !isPickedUp && (
              <Link href="/scan">
                <Button variant="gold" className="mt-6 w-full">
                  <QrCode className="mr-2 h-4 w-4" /> Confirm pickup in scanner
                </Button>
              </Link>
            )}

            <div className="mt-4 text-center">
              <p className="text-xs text-muted-foreground">
                {BRAND.name} · {BRAND.phone} · {BRAND.siteUrl}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
