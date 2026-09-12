"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/empty-state";
import { ReviewCard } from "@/components/reviews/review-card";
import { RatingStars } from "@/components/reviews/rating-stars";
import { canEditReview } from "@/lib/reviews/permissions";
import { useVehicles } from "@/lib/lookup";
import { useApp } from "@/lib/store";
import { bookingRef, fmtDate } from "@/lib/utils";
import type { Review } from "@/types";

// ─── /dashboard/reviews — the customer's own reviews ─────────────────────────

export default function MyReviewsPage() {
  const router = useRouter();
  const { user, reviews, bookings, upsertReviewLocal } = useApp();
  const vehicles = useVehicles();
  if (!user) return null;

  const mine = reviews.filter((r) => r.customerId === user.id);
  const reviewable = bookings.filter(
    (b) => b.customerId === user.id && b.status === "completed" && !reviews.some((r) => r.bookingId === b.id)
  );

  const onChanged = (r: Review) => upsertReviewLocal(r);
  const onEdit = (r: Review) => router.push(`/dashboard/bookings/${r.bookingId}/review`);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-extrabold tracking-tight">My Reviews</h1>
        <p className="text-sm text-muted-foreground">
          Reviews you've shared — editable for 7 days, until the owner replies.
        </p>
      </div>

      {/* Pending review prompts */}
      {reviewable.length > 0 && (
        <Card className="border-gold/40 bg-gold/5">
          <CardContent className="p-5">
            <p className="font-display text-sm font-bold">Trips waiting for your review ⭐</p>
            <div className="mt-3 space-y-2">
              {reviewable.map((b) => {
                const v = vehicles.find((x) => x.id === b.vehicleId);
                return (
                  <div key={b.id} className="flex items-center justify-between gap-3 rounded-xl bg-card p-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">
                        {v ? `${v.make} ${v.model}` : "Vehicle"} · {bookingRef(b.id)}
                      </p>
                      <p className="text-xs text-muted-foreground">{fmtDate(b.startDate)} → {fmtDate(b.endDate)}</p>
                    </div>
                    <Link href={`/dashboard/bookings/${b.id}/review`}>
                      <Button variant="gold" size="sm"><Star className="h-3.5 w-3.5" /> Leave a review</Button>
                    </Link>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {mine.length === 0 && reviewable.length === 0 ? (
        <EmptyState
          icon={Star}
          title="No reviews yet"
          description="Complete a trip and your review prompt will appear here."
          actionLabel="Browse cars"
          actionHref="/browse"
        />
      ) : (
        <div className="space-y-4">
          {mine.map((r) => (
            <div key={r.id} className="relative">
              {r.status !== "published" && (
                <Badge variant={r.status === "hidden" ? "warning" : "destructive"} className="absolute -top-2 left-4 z-10">
                  {r.status === "hidden" ? "Hidden by admin" : r.status === "flagged" ? "Under review" : "Removed"}
                </Badge>
              )}
              <ReviewCard review={r} onChanged={onChanged} onEdit={canEditReview(user, r) ? onEdit : undefined} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
