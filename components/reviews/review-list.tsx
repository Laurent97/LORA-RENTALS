"use client";

import { Star } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { ReviewCard } from "./review-card";
import type { Review } from "@/types";

// ─── ReviewList — stack of review cards with an empty state ─────────────────

export function ReviewList({
  reviews,
  onChanged,
  onEdit,
  onAdminDelete,
  emptyTitle = "No reviews yet",
  emptyDescription = "Reviews will appear here once customers share their trips.",
}: {
  reviews: Review[];
  onChanged?: (r: Review) => void;
  onEdit?: (r: Review) => void;
  onAdminDelete?: (r: Review, replyOnly: boolean) => void;
  emptyTitle?: string;
  emptyDescription?: string;
}) {
  if (reviews.length === 0) {
    return <EmptyState icon={Star} title={emptyTitle} description={emptyDescription} />;
  }
  return (
    <div className="space-y-4">
      {reviews.map((r) => (
        <ReviewCard key={r.id} review={r} onChanged={onChanged} onEdit={onEdit} onAdminDelete={onAdminDelete} />
      ))}
    </div>
  );
}
