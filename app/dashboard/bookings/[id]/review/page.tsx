"use client";

import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, PartyPopper } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ReviewForm } from "@/components/reviews/review-form";
import { canCreateReview, canEditReview } from "@/lib/reviews/permissions";
import { useVehicles } from "@/lib/lookup";
import { useApp } from "@/lib/store";
import { bookingRef, fmtDate } from "@/lib/utils";
import type { Review } from "@/types";

// ─── /dashboard/bookings/[id]/review — leave or edit a review ───────────────

export default function LeaveReviewPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user, bookings, reviews, upsertReviewLocal } = useApp();
  const vehicles = useVehicles();
  const [done, setDone] = useState(false);

  const booking = bookings.find((b) => b.id === id);
  const existing = reviews.find((r) => r.bookingId === id);
  const vehicle = booking ? vehicles.find((v) => v.id === booking.vehicleId) : undefined;

  if (!user) return null;

  const allowed = existing ? canEditReview(user, existing) : canCreateReview(user, booking, existing);

  const onSubmitted = (review: Review) => {
    upsertReviewLocal(review);
    setDone(true);
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Link href="/dashboard/bookings" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back to bookings
      </Link>

      {done ? (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
          <Card>
            <CardContent className="flex flex-col items-center py-14 text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", delay: 0.1 }}
                className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-gold/15"
              >
                <PartyPopper className="h-10 w-10 text-gold" />
              </motion.div>
              <h1 className="font-display text-2xl font-extrabold">Thank you! ⭐</h1>
              <p className="mt-2 max-w-sm text-sm text-muted-foreground">
                Your review helps other Rwandan travelers pick the best rides — and helps great owners get noticed.
              </p>
              <div className="mt-6 flex gap-2">
                <Link href="/dashboard/reviews"><Button variant="gold" size="sm">My reviews</Button></Link>
                <Link href="/browse"><Button variant="outline" size="sm">Browse cars</Button></Link>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ) : !booking ? (
        <Card><CardContent className="py-14 text-center text-sm text-muted-foreground">Booking not found.</CardContent></Card>
      ) : !allowed ? (
        <Card>
          <CardContent className="py-14 text-center">
            <h1 className="font-display text-xl font-bold">
              {existing?.reply
                ? "This review is locked"
                : existing
                  ? "The edit window has closed"
                  : "This trip isn't reviewable yet"}
            </h1>
            <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
              {existing?.reply
                ? "The owner has replied, so the review can no longer be edited. Need it removed? Contact support."
                : existing
                  ? "Reviews can be edited once, within 7 days of posting."
                  : "Reviews open once your booking is marked completed."}
            </p>
            <Link href="/dashboard/bookings" className="mt-5 inline-block">
              <Button variant="outline" size="sm">Back to bookings</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Trip summary */}
          <Card>
            <CardContent className="flex items-center gap-4 p-5">
              {vehicle && (
                <div className="relative h-16 w-24 shrink-0 overflow-hidden rounded-xl bg-muted">
                  <Image src={vehicle.images[0]} alt="" fill className="object-cover" />
                </div>
              )}
              <div>
                <p className="font-display font-bold">
                  {vehicle ? `${vehicle.make} ${vehicle.model} ${vehicle.year}` : "Vehicle"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {bookingRef(booking.id)} · {fmtDate(booking.startDate)} → {fmtDate(booking.endDate)}
                </p>
              </div>
            </CardContent>
          </Card>

          <div>
            <h1 className="font-display text-2xl font-extrabold tracking-tight">
              {existing ? "Edit your review" : "How was your trip?"}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {existing
                ? "You can edit once, within 7 days of posting — until the owner replies."
                : "Share the details that mattered — the car, the owner, the pickup."}
            </p>
          </div>

          <Card>
            <CardContent className="p-6">
              <ReviewForm bookingId={booking.id} existing={existing} onSubmitted={onSubmitted} />
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
