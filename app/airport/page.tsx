"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { BadgeCheck, Car, Clock, Plane, PlaneLanding, UserCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useVehicles } from "@/lib/lookup";
import { useApp } from "@/lib/store";
import { formatMoney } from "@/lib/utils";
import type { AirportBooking, Booking } from "@/types";

const MEET_GREET_FEE = 15000; // RWF

const STEPS = [
  { icon: Plane, title: "Share your flight", desc: "We track your arrival — delays included." },
  { icon: UserCheck, title: "Meet & greet", desc: "A LORA agent waits at arrivals with your name board." },
  { icon: Car, title: "Drive away", desc: "Keys handed over at the terminal. No shuttle, no queue." },
];

export default function AirportPickupPage() {
  const router = useRouter();
  const { user, addBooking, addAirportBooking, currency } = useApp();
  const fleet = useVehicles().filter((v) => v.airportApproved && v.status === "available");

  const [vehicleId, setVehicleId] = useState("");
  const [flight, setFlight] = useState("");
  const [arrival, setArrival] = useState("");
  const [meetGreet, setMeetGreet] = useState(true);
  const [saving, setSaving] = useState(false);

  const vehicle = fleet.find((v) => v.id === vehicleId) ?? fleet[0];
  const total = vehicle ? vehicle.pricePerDay + (meetGreet ? MEET_GREET_FEE : 0) : 0;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      router.push("/login?next=/airport");
      return;
    }
    if (!vehicle || !flight.trim() || !arrival) {
      toast.error("Choose a car and enter your flight details");
      return;
    }
    setSaving(true);
    const booking: Booking = {
      id: crypto.randomUUID(),
      customerId: user.id,
      vehicleId: vehicle.id,
      ownerId: vehicle.ownerId,
      startDate: arrival,
      endDate: arrival,
      pickupLocation: "Kigali International Airport",
      returnLocation: "Kigali International Airport",
      extras: meetGreet ? ["meet_greet"] : [],
      totalPrice: total,
      bookingFee: 0,
      status: "requested",
      paymentMethod: "cash",
      paymentPoint: "pickup",
      paymentConfirmed: false,
      qrCode: `LRA-${Date.now().toString(36).toUpperCase()}`,
      qrToken: crypto.randomUUID(),
      ownerResponseDeadline: new Date(Date.now() + 4 * 3600_000).toISOString(),
      driverName: user.name,
      driverLicense: "",
      driverIdNumber: "",
      createdAt: new Date().toISOString(),
    };
    addBooking(booking);
    const ap: AirportBooking = {
      id: crypto.randomUUID(),
      bookingId: booking.id,
      flightNumber: flight.trim().toUpperCase(),
      arrivalTime: arrival,
      meetGreet: meetGreet,
      createdAt: new Date().toISOString(),
    };
    addAirportBooking(ap);
    setSaving(false);
    toast.success("Airport pickup requested — we'll confirm your flight tracking");
    router.push("/dashboard/bookings");
  };

  return (
    <main>
      {/* Hero */}
      <section className="bg-navy-950 py-20 text-white">
        <div className="container max-w-3xl text-center">
          <Badge variant="gold" className="mb-4"><PlaneLanding className="mr-1 h-3 w-3" /> Kigali International Airport</Badge>
          <h1 className="font-display text-4xl font-extrabold tracking-tight md:text-5xl">
            Land. Meet. Drive.
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-silver/90">
            Your car waits at arrivals — tracked to your flight, with an optional meet & greet agent holding your name board.
          </p>
        </div>
      </section>

      {/* How it works */}
      <section className="container -mt-8 relative z-10">
        <div className="grid gap-4 rounded-2xl border border-border bg-card p-6 shadow-xl sm:grid-cols-3">
          {STEPS.map((s, i) => (
            <div key={s.title} className="flex gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-navy-800 dark:bg-gold">
                <s.icon className="h-5 w-5 text-gold dark:text-navy-900" />
              </div>
              <div>
                <p className="text-sm font-bold">{i + 1}. {s.title}</p>
                <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Booking form */}
      <section className="container max-w-2xl py-14">
        <Card>
          <CardContent className="p-6 md:p-8">
            <h2 className="font-display text-2xl font-bold">Book airport pickup</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Only airport-approved vehicles are shown — they're cleared for terminal handover.
            </p>
            <form onSubmit={submit} className="mt-6 space-y-4">
              <div>
                <Label className="mb-1.5 block">Vehicle</Label>
                <div className="space-y-2">
                  {fleet.length === 0 && (
                    <p className="rounded-xl bg-secondary p-3 text-sm text-muted-foreground">
                      No airport-approved vehicles right now — <Link href="/browse" className="font-semibold text-gold-600 dark:text-gold">browse all cars</Link>.
                    </p>
                  )}
                  {fleet.map((v) => (
                    <label
                      key={v.id}
                      className={`flex cursor-pointer flex-wrap items-center justify-between gap-3 rounded-xl border p-3 transition-colors ${
                        vehicle?.id === v.id ? "border-gold bg-gold/5" : "border-border hover:border-gold/50"
                      }`}
                    >
                      <span className="flex min-w-0 items-center gap-3">
                        <input
                          type="radio"
                          name="vehicle"
                          checked={vehicle?.id === v.id}
                          onChange={() => setVehicleId(v.id)}
                          className="shrink-0 accent-gold"
                        />
                        <span className="min-w-0">
                          <span className="block text-sm font-semibold">{v.make} {v.model}</span>
                          <span className="text-xs text-muted-foreground">{v.plate} · {v.seats} seats</span>
                        </span>
                      </span>
                      <span className="shrink-0 font-display font-bold text-navy-800 dark:text-gold">
                        {formatMoney(v.pricePerDay, currency)}<span className="text-xs font-normal text-muted-foreground">/day</span>
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label className="mb-1.5 block">Flight number</Label>
                  <Input required value={flight} onChange={(e) => setFlight(e.target.value)} placeholder="WB 452" />
                </div>
                <div>
                  <Label className="mb-1.5 block">Arrival date</Label>
                  <Input required type="date" value={arrival} onChange={(e) => setArrival(e.target.value)} />
                </div>
              </div>

              <label className="flex cursor-pointer items-center justify-between rounded-xl border border-border p-4">
                <span className="flex items-center gap-3">
                  <UserCheck className="h-5 w-5 text-gold" />
                  <span>
                    <span className="block text-sm font-semibold">Meet & greet</span>
                    <span className="text-xs text-muted-foreground">Agent waits at arrivals with your name board</span>
                  </span>
                </span>
                <input
                  type="checkbox"
                  checked={meetGreet}
                  onChange={(e) => setMeetGreet(e.target.checked)}
                  className="h-5 w-5 accent-gold"
                />
              </label>

              <div className="flex items-center justify-between rounded-xl bg-secondary/60 p-4 text-sm">
                <span className="text-muted-foreground">Day rate {meetGreet ? `+ ${formatMoney(MEET_GREET_FEE, currency)} meet & greet` : ""}</span>
                <span className="font-display text-lg font-extrabold text-navy-800 dark:text-gold">{formatMoney(total, currency)}</span>
              </div>

              <Button variant="gold" size="lg" className="w-full" disabled={saving || !vehicle}>
                <Plane className="h-4 w-4" /> {saving ? "Requesting…" : "Request airport pickup"}
              </Button>
              <p className="flex items-center justify-center gap-1 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" /> We track your flight — delays are covered free.
              </p>
            </form>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
