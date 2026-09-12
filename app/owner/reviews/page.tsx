"use client";

import { useMemo, useState } from "react";
import { MessageSquareReply, Star, TrendingUp } from "lucide-react";
import { StatCard } from "@/components/stat-card";
import { RatingBreakdown } from "@/components/reviews/rating-breakdown";
import { ReviewList } from "@/components/reviews/review-list";
import { applyReviewFilters, DEFAULT_FILTERS, ReviewFilters, type ReviewFilterState } from "@/components/reviews/review-filters";
import { ownerStats, ratingBreakdown } from "@/lib/reviews/analytics";
import { useVehicles } from "@/lib/lookup";
import { useApp } from "@/lib/store";
import type { Review } from "@/types";

// ─── /owner/reviews — reviews on the owner's vehicles + reply tools ─────────

export default function OwnerReviewsPage() {
  const { user, reviews, upsertReviewLocal } = useApp();
  const vehicles = useVehicles();
  const [filters, setFilters] = useState<ReviewFilterState>(DEFAULT_FILTERS);
  if (!user) return null;

  const mine = reviews.filter((r) => r.ownerId === user.id && r.status !== "removed");
  const stats = useMemo(() => ownerStats(mine.filter((r) => r.status === "published")), [reviews, user.id]);
  const list = applyReviewFilters(mine, filters, (r) => {
    const v = vehicles.find((x) => x.id === r.vehicleId);
    return v ? `${v.make} ${v.model} ${v.plate}` : "";
  });

  const onChanged = (r: Review) => upsertReviewLocal(r);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-extrabold tracking-tight">Reviews</h1>
        <p className="text-sm text-muted-foreground">
          What customers say about your fleet — reply to build trust.
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard icon={Star} label="Average rating" value={stats.total ? stats.average.toFixed(1) : "—"} sub={`${stats.total} published reviews`} />
        <StatCard
          icon={MessageSquareReply}
          label="Response rate"
          value={`${stats.responseRate}%`}
          sub={stats.unreplied ? `${stats.unreplied} awaiting reply` : "All replied 🎉"}
        />
        <StatCard
          icon={TrendingUp}
          label="Avg reply time"
          value={stats.avgReplyHours != null ? `${stats.avgReplyHours}h` : "—"}
          sub={stats.topTags[0] ? `Top tag: ${stats.topTags[0].tag}` : undefined}
        />
      </div>

      <RatingBreakdown breakdown={ratingBreakdown(mine.filter((r) => r.status === "published"))} />

      <ReviewFilters value={filters} onChange={setFilters} />

      <ReviewList
        reviews={list}
        onChanged={onChanged}
        emptyTitle="No reviews match"
        emptyDescription="Try a different filter — or wait for your next completed trip."
      />
    </div>
  );
}
