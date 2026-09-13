"use client";

import Image from "next/image";
import Link from "next/link";
import { notFound, useParams, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import {
  ArrowLeft,
  ArrowRight,
  Banknote,
  CheckCircle2,
  CreditCard,
  MapPin,
  QrCode,
  Smartphone,
  Star,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { BOOKING_EXTRAS, PAYMENT_METHOD_LABELS } from "@/lib/constants";
import { LocationAutocomplete } from "@/components/location-autocomplete";
import { useHydrated, useVehicles } from "@/lib/lookup";
import { useApp } from "@/lib/store";
import { cn, formatMoney, qrUrl, rentalDays, bookingRef } from "@/lib/utils";
import type { Booking, PaymentMethod, PaymentPoint } from "@/types";

const STEPS = ["Dates & location", "Driver details", "Extras & payment", "Confirmed"];

export default function BookingPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const vehicles = useVehicles();
  const vehicle = vehicles.find((v) => v.id === id);
  const { user, currency, addBooking, loyalty, redeemPoints } = useApp();

  const [step, setStep] = useState(0);
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [pickup, setPickup] = useState(vehicle?.location ?? "");
  const [dropoff, setDropoff] = useState(vehicle?.location ?? "");
  const [driverName, setDriverName] = useState(user?.name ?? "");
  const [license, setLicense] = useState("");
  const [idNumber, setIdNumber] = useState("");
  const [extras, setExtras] = useState<string[]>([]);
  const [payMethod, setPayMethod] = useState<PaymentMethod>("cash");
  const [payPoint, setPayPoint] = useState<PaymentPoint>("pickup");
  const [confirmed, setConfirmed] = useState<Booking | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [usePoints, setUsePoints] = useState(false);
  const hydrated = useHydrated();

  useEffect(() => {
    if (hydrated && !user && vehicle) router.replace(`/login?next=/book/${vehicle.id}`);
  }, [hydrated, user, vehicle, router]);

  // Vehicle/user may resolve after hydration — sync defaults once available.
  const queryPrefilled = useRef(false);
  useEffect(() => {
    if (!vehicle || queryPrefilled.current) return;
    const s = searchParams.get("start") ?? "";
    const e = searchParams.get("end") ?? "";
    const p = searchParams.get("pickup") ?? searchParams.get("location") ?? vehicle.location;
    const d = searchParams.get("dropoff") ?? searchParams.get("location") ?? vehicle.location;
    if (s) setStart(s);
    if (e) setEnd(e);
    setPickup((prev) => prev || p);
    setDropoff((prev) => prev || d);
    queryPrefilled.current = true;
  }, [vehicle, searchParams]);

  useEffect(() => {
    if (vehicle) {
      setPickup((p) => p || vehicle.location);
      setDropoff((d) => d || vehicle.location);
    }
  }, [vehicle]);
  useEffect(() => {
    if (user) setDriverName((n) => n || user.name);
  }, [user]);

  const days = useMemo(
    () => (start && end ? rentalDays(start, end) : 0),
    [start, end]
  );

  if (!vehicle) {
    if (!hydrated) {
      return (
        <main className="container max-w-3xl py-8">
          <Skeleton className="h-8 w-1/3" />
          <Skeleton className="mt-4 h-64 w-full rounded-2xl" />
        </main>
      );
    }
    return notFound();
  }
  if (!user) return null;

  const extrasTotal = BOOKING_EXTRAS.filter((e) => extras.includes(e.id)).reduce(
    (s, e) => s + e.pricePerDay * Math.max(days, 1),
    0
  );
  const subtotal = vehicle.pricePerDay * Math.max(days, 1) + extrasTotal;
  const myPoints = loyalty.find((l) => l.userId === user.id)?.points ?? 0;
  // 1 point = RWF 10 off — cap at 20% of the subtotal
  const pointsDiscount = usePoints ? Math.min(myPoints * 10, Math.floor(subtotal * 0.2)) : 0;
  const pointsUsed = Math.ceil(pointsDiscount / 10);
  const total = subtotal - pointsDiscount;

  const canNext =
    step === 0 ? days > 0 && pickup && dropoff :
    step === 1 ? driverName.trim() && license.trim() && idNumber.trim() :
    true;

  const confirm = () => {
    setSubmitting(true);
    setTimeout(() => {
      const booking: Booking = {
        id: crypto.randomUUID(),
        customerId: user.id,
        vehicleId: vehicle.id,
        ownerId: vehicle.ownerId,
        startDate: start,
        endDate: end,
        pickupLocation: pickup,
        returnLocation: dropoff,
        extras,
        totalPrice: total,
        bookingFee: 0,
        status: "requested",
        paymentMethod: payMethod,
        paymentPoint: payPoint,
        paymentConfirmed: false,
        qrCode: `LRA-${Date.now().toString(36).toUpperCase()}`,
        qrToken: crypto.randomUUID(),
        ownerResponseDeadline: new Date(Date.now() + 4 * 3600_000).toISOString(),
        driverName,
        driverLicense: license,
        driverIdNumber: idNumber,
        createdAt: new Date().toISOString(),
      };
      addBooking(booking);
      if (pointsUsed > 0) redeemPoints(user.id, pointsUsed, booking.id);
      setConfirmed(booking);
      setStep(3);
      setSubmitting(false);
      toast.success("Booking request sent to the owner!");
    }, 900);
  };

  return (
    <main className="container max-w-4xl py-10">
      {/* Stepper */}
      <ol className="mb-8 flex items-center gap-2">
        {STEPS.map((s, i) => (
          <li key={s} className="flex flex-1 items-center gap-2">
            <span
              className={cn(
                "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold",
                i < step
                  ? "bg-emerald-500 text-white"
                  : i === step
                    ? "bg-navy-800 text-gold dark:bg-gold dark:text-navy-900"
                    : "bg-secondary text-muted-foreground"
              )}
            >
              {i < step ? <CheckCircle2 className="h-4 w-4" /> : i + 1}
            </span>
            <span className={cn("hidden text-xs font-medium sm:block", i === step ? "text-foreground" : "text-muted-foreground")}>
              {s}
            </span>
            {i < STEPS.length - 1 && <span className="h-px flex-1 bg-border" />}
          </li>
        ))}
      </ol>

      <div className="grid gap-8 lg:grid-cols-[1fr_minmax(300px,320px)]">
        <div className="min-w-0">
          {/* Step 0 — dates & locations */}
          {step === 0 && (
            <Card>
              <CardContent className="space-y-5 p-6">
                <h2 className="font-display text-xl font-bold">When & where?</h2>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <Label className="mb-1.5 block">Pickup date</Label>
                    <Input type="date" value={start} min={new Date().toISOString().slice(0, 10)} onChange={(e) => setStart(e.target.value)} />
                  </div>
                  <div>
                    <Label className="mb-1.5 block">Return date</Label>
                    <Input type="date" value={end} min={start} onChange={(e) => setEnd(e.target.value)} />
                  </div>
                </div>
                <div>
                  <Label className="mb-1.5 block">Pickup location</Label>
                  <LocationAutocomplete value={pickup} onChange={setPickup} placeholder="Where do you collect the car?" />
                </div>
                <div>
                  <Label className="mb-1.5 block">Return location</Label>
                  <LocationAutocomplete value={dropoff} onChange={setDropoff} placeholder="Where do you return it?" />
                </div>
                {days > 0 && (
                  <p className="rounded-xl bg-secondary/60 p-3 text-sm font-medium">
                    {days} day{days > 1 ? "s" : ""} · {formatMoney(vehicle.pricePerDay * days, currency)} rental
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Step 1 — driver details */}
          {step === 1 && (
            <Card>
              <CardContent className="space-y-5 p-6">
                <h2 className="font-display text-xl font-bold">Driver details</h2>
                <p className="text-sm text-muted-foreground">
                  Bring the original documents at pickup — the owner verifies them on-site.
                </p>
                <div>
                  <Label className="mb-1.5 block">Driver full name</Label>
                  <Input value={driverName} onChange={(e) => setDriverName(e.target.value)} placeholder="As on license" />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <Label className="mb-1.5 block">Driving license №</Label>
                    <Input value={license} onChange={(e) => setLicense(e.target.value)} placeholder="DL-2020-00000" />
                  </div>
                  <div>
                    <Label className="mb-1.5 block">National ID / Passport №</Label>
                    <Input value={idNumber} onChange={(e) => setIdNumber(e.target.value)} placeholder="1 1999 8 0000000 0 00" />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 2 — extras & payment */}
          {step === 2 && (
            <Card>
              <CardContent className="space-y-6 p-6">
                <div>
                  <h2 className="font-display text-xl font-bold">Extras</h2>
                  <div className="mt-3 space-y-2">
                    {BOOKING_EXTRAS.map((e) => (
                      <label
                        key={e.id}
                        className={cn(
                          "flex cursor-pointer items-center justify-between rounded-xl border p-3.5 transition-colors",
                          extras.includes(e.id) ? "border-gold bg-gold/10" : "border-border hover:border-navy-300"
                        )}
                      >
                        <span className="flex items-center gap-3 text-sm font-medium">
                          <input
                            type="checkbox"
                            className="h-4 w-4 accent-[#D4AF37]"
                            checked={extras.includes(e.id)}
                            onChange={() =>
                              setExtras((x) => x.includes(e.id) ? x.filter((i) => i !== e.id) : [...x, e.id])
                            }
                          />
                          {e.label}
                        </span>
                        <span className="text-sm font-semibold">
                          {e.pricePerDay === 0 ? "Free" : `+${formatMoney(e.pricePerDay, currency)}/day`}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <h2 className="font-display text-xl font-bold">Payment — on arrival only</h2>
                  <p className="mt-1 text-xs text-muted-foreground">No online charge. You pay when you get the keys.</p>
                  <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
                    {(
                      [
                        { v: "cash", label: "Cash", icon: Banknote },
                        { v: "momo", label: "MTN MoMo", icon: Smartphone },
                        { v: "card", label: "Card", icon: CreditCard },
                      ] as const
                    ).map((m) => (
                      <button
                        key={m.v}
                        type="button"
                        onClick={() => setPayMethod(m.v)}
                        className={cn(
                          "flex flex-col items-center gap-1.5 rounded-xl border-2 p-3 text-xs font-semibold",
                          payMethod === m.v ? "border-gold bg-gold/10" : "border-border"
                        )}
                      >
                        <m.icon className="h-5 w-5" />
                        {m.label}
                      </button>
                    ))}
                  </div>
                  <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {(
                      [
                        { v: "pickup", label: "Pay at pickup" },
                        { v: "office", label: "Pay at LORA office" },
                      ] as const
                    ).map((p) => (
                      <button
                        key={p.v}
                        type="button"
                        onClick={() => setPayPoint(p.v)}
                        className={cn(
                          "rounded-xl border-2 p-3 text-xs font-semibold",
                          payPoint === p.v ? "border-gold bg-gold/10" : "border-border"
                        )}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>

                  {/* Loyalty points redemption */}
                  {myPoints > 0 && (
                    <label className="mt-4 flex cursor-pointer items-center justify-between rounded-xl border border-gold/40 bg-gold/5 p-3">
                      <span className="flex items-center gap-2.5">
                        <Star className="h-4 w-4 text-gold" />
                        <span>
                          <span className="block text-sm font-semibold">Use LORA Points</span>
                          <span className="text-xs text-muted-foreground">
                            {myPoints.toLocaleString()} pts available · save {formatMoney(Math.min(myPoints * 10, Math.floor(subtotal * 0.2)), currency)}
                          </span>
                        </span>
                      </span>
                      <input
                        type="checkbox"
                        checked={usePoints}
                        onChange={(e) => setUsePoints(e.target.checked)}
                        className="h-5 w-5 accent-gold"
                      />
                    </label>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 3 — confirmation */}
          {step === 3 && confirmed && (
            <Card className="text-center">
              <CardContent className="p-8">
                <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/15">
                  <CheckCircle2 className="h-9 w-9 text-emerald-500" />
                </span>
                <h2 className="mt-4 font-display text-2xl font-extrabold">Request sent!</h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  Booking <strong>{bookingRef(confirmed.id)}</strong> is with the owner for approval.
                  You'll be notified once confirmed — usually within 4 hours.
                </p>
                <div className="mx-auto mt-6 w-fit rounded-2xl border border-border bg-white p-4">
                  <Image src={qrUrl(`LORA:${confirmed.qrToken ?? confirmed.qrCode}`)} alt="Pickup QR code" width={180} height={180} />
                  <p className="mt-2 flex items-center justify-center gap-1 text-xs font-semibold text-navy-800">
                    <QrCode className="h-3.5 w-3.5" /> Show at pickup
                  </p>
                </div>
                <div className="mt-6 flex flex-wrap justify-center gap-3">
                  <Link href="/dashboard/bookings">
                    <Button variant="gold">View my bookings</Button>
                  </Link>
                  <Link href="/browse">
                    <Button variant="outline">Browse more cars</Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Nav buttons */}
          {step < 3 && (
            <div className="mt-6 flex justify-between">
              <Button variant="ghost" onClick={() => (step === 0 ? router.back() : setStep(step - 1))}>
                <ArrowLeft className="h-4 w-4" /> Back
              </Button>
              {step < 2 ? (
                <Button variant="gold" disabled={!canNext} onClick={() => setStep(step + 1)}>
                  Continue <ArrowRight className="h-4 w-4" />
                </Button>
              ) : (
                <Button variant="gold" disabled={submitting} onClick={confirm}>
                  {submitting ? "Sending…" : "Confirm reservation — RWF 0 fee"}
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Summary sidebar */}
        <aside>
          <Card className="sticky top-20">
            <CardContent className="p-5">
              <div className="flex gap-3">
                <div className="relative h-16 w-24 shrink-0 overflow-hidden rounded-lg bg-muted">
                  <Image src={vehicle.images[0]} alt="" fill sizes="96px" className="object-cover" />
                </div>
                <div>
                  <p className="font-display text-sm font-bold">{vehicle.make} {vehicle.model}</p>
                  <p className="flex items-center gap-1 text-xs text-muted-foreground">
                    <MapPin className="h-3 w-3" /> {vehicle.location}
                  </p>
                </div>
              </div>
              <div className="mt-4 space-y-2 border-t border-border pt-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{formatMoney(vehicle.pricePerDay, currency)} × {Math.max(days, 1)} day{days !== 1 ? "s" : ""}</span>
                  <span className="font-medium">{formatMoney(vehicle.pricePerDay * Math.max(days, 1), currency)}</span>
                </div>
                {extrasTotal > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Extras</span>
                    <span className="font-medium">{formatMoney(extrasTotal, currency)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Booking fee</span>
                  <Badge variant="success">RWF 0</Badge>
                </div>
                <div className="flex justify-between border-t border-border pt-2 font-display text-base font-extrabold">
                  <span>Total due {payPoint === "office" ? "at office" : "at pickup"}</span>
                  <span className="text-navy-800 dark:text-gold">{formatMoney(total, currency)}</span>
                </div>
                <p className="pt-1 text-[11px] text-muted-foreground">
                  via {PAYMENT_METHOD_LABELS[payMethod]} · nothing charged online
                </p>
              </div>
            </CardContent>
          </Card>
        </aside>
      </div>
    </main>
  );
}
