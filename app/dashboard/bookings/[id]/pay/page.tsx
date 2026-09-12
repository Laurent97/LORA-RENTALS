"use client";

import Link from "next/link";
import { ArrowLeft, Car } from "lucide-react";
import { notFound, useParams } from "next/navigation";
import { PayWithUSSD } from "@/components/pay-with-ussd";
import { useVehicles } from "@/lib/lookup";
import { useApp } from "@/lib/store";
import { formatMoney } from "@/lib/utils";

export default function BookingPaymentPage() {
  const { id } = useParams<{ id: string }>();
  const { bookings, user, currency } = useApp();
  const vehicles = useVehicles();
  const booking = bookings.find((item) => item.id === id && item.customerId === user?.id);
  if (!booking) return notFound();
  const vehicle = vehicles.find((item) => item.id === booking.vehicleId);
  return <main className="container max-w-5xl py-8 sm:py-12"><Link href="/dashboard/bookings" className="mb-7 inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" /> Back to bookings</Link><div className="mb-8 flex items-end justify-between gap-4"><div><p className="mb-2 flex items-center gap-2 text-sm font-semibold text-gold"><Car className="h-4 w-4" /> {vehicle ? `${vehicle.make} ${vehicle.model}` : "LORA rental"}</p><h1 className="font-display text-3xl font-extrabold tracking-tight">Complete your payment</h1><p className="mt-2 text-sm text-muted-foreground">Secure mobile money payment for {formatMoney(booking.totalPrice, currency)}.</p></div><div className="hidden rounded-2xl border border-gold/30 bg-gold/10 px-4 py-3 text-right sm:block"><p className="text-xs text-muted-foreground">Booking total</p><p className="font-display text-xl font-extrabold">{booking.totalPrice.toLocaleString()} RWF</p></div></div><div className="mx-auto max-w-xl"><PayWithUSSD bookingId={booking.id} amount={booking.totalPrice} /></div></main>;
}