"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RatingStars } from "./rating-stars";
import { PhotoUploader } from "./photo-uploader";
import { reviewApi } from "@/lib/reviews/service";
import { REVIEW_RULES, REVIEW_TAGS } from "@/lib/reviews/constants";
import { createReviewSchema, updateReviewSchema } from "@/lib/reviews/validators";
import { cn } from "@/lib/utils";
import type { Review } from "@/types";

// ─── ReviewForm — create or edit a review ────────────────────────────────────
// Drafts auto-save to localStorage every 10s while composing.

export function ReviewForm({
  bookingId,
  existing,
  onSubmitted,
}: {
  bookingId: string;
  existing?: Review;
  onSubmitted: (review: Review, flagged: boolean) => void;
}) {
  const draftKey = `review-draft:${bookingId}`;
  const [rating, setRating] = useState(existing?.rating ?? 0);
  const [title, setTitle] = useState(existing?.title ?? "");
  const [comment, setComment] = useState(existing?.comment ?? "");
  const [photos, setPhotos] = useState<string[]>(existing?.photos ?? []);
  const [tags, setTags] = useState<string[]>(existing?.tags ?? []);
  const [confirmed, setConfirmed] = useState(false);
  const [busy, setBusy] = useState(false);

  // Restore draft (create mode only)
  useEffect(() => {
    if (existing) return;
    try {
      const raw = localStorage.getItem(draftKey);
      if (raw) {
        const d = JSON.parse(raw);
        setRating(d.rating ?? 0);
        setTitle(d.title ?? "");
        setComment(d.comment ?? "");
        setPhotos(d.photos ?? []);
        setTags(d.tags ?? []);
      }
    } catch { /* ignore */ }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draftKey]);

  // Auto-save draft every 10s
  useEffect(() => {
    if (existing) return;
    const t = setInterval(() => {
      if (rating || title || comment || photos.length || tags.length) {
        localStorage.setItem(draftKey, JSON.stringify({ rating, title, comment, photos, tags }));
      }
    }, 10_000);
    return () => clearInterval(t);
  }, [existing, draftKey, rating, title, comment, photos, tags]);

  const toggleTag = (t: string) =>
    setTags((cur) => (cur.includes(t) ? cur.filter((x) => x !== t) : [...cur, t]));

  const commentLeft = REVIEW_RULES.commentMax - comment.length;
  const valid = useMemo(
    () =>
      rating >= 1 &&
      comment.trim().length >= REVIEW_RULES.commentMin &&
      (existing ? true : confirmed),
    [rating, comment, confirmed, existing]
  );

  const submit = async () => {
    setBusy(true);
    let res: Awaited<ReturnType<typeof reviewApi.create>>;
    if (existing) {
      const payload = updateReviewSchema.safeParse({ reviewId: existing.id, rating, title, comment, photos, tags });
      if (!payload.success) {
        setBusy(false);
        toast.error(payload.error.issues[0]?.message ?? "Check the form");
        return;
      }
      res = await reviewApi.update(payload.data);
    } else {
      const payload = createReviewSchema.safeParse({ bookingId, rating, title, comment, photos, tags, confirmed });
      if (!payload.success) {
        setBusy(false);
        toast.error(payload.error.issues[0]?.message ?? "Check the form");
        return;
      }
      res = await reviewApi.create(payload.data);
    }
    setBusy(false);
    if (res.ok) {
      localStorage.removeItem(draftKey);
      const flagged = (res.data as { flagged?: boolean }).flagged === true;
      toast.success(flagged ? "Review submitted — it's with our moderation team." : existing ? "Review updated" : "Thank you! Your review is live ⭐");
      onSubmitted((res.data as { review: Review }).review, flagged);
    } else {
      toast.error(res.error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Rating */}
      <div>
        <Label className="mb-2 block">Your rating *</Label>
        <RatingStars value={rating} onChange={setRating} size="lg" />
        <p className="mt-1 text-xs text-muted-foreground">
          {["Tap a star", "Poor", "Fair", "Good", "Very good", "Excellent"][rating]}
        </p>
      </div>

      {/* Title */}
      <div>
        <Label htmlFor="rev-title" className="mb-2 block">Title (optional)</Label>
        <Input
          id="rev-title"
          value={title}
          onChange={(e) => setTitle(e.target.value.slice(0, REVIEW_RULES.titleMax))}
          placeholder="Sum it up in a line"
          maxLength={REVIEW_RULES.titleMax}
        />
      </div>

      {/* Comment */}
      <div>
        <Label htmlFor="rev-comment" className="mb-2 block">Your review *</Label>
        <Textarea
          id="rev-comment"
          value={comment}
          onChange={(e) => setComment(e.target.value.slice(0, REVIEW_RULES.commentMax))}
          placeholder="How was the car? The owner? Pickup and return? Your review helps other Rwandan travelers pick the best rides."
          rows={5}
        />
        <p className={cn("mt-1 text-right text-[11px]", comment.trim().length < REVIEW_RULES.commentMin ? "text-amber-500" : "text-muted-foreground")}>
          {comment.trim().length < REVIEW_RULES.commentMin
            ? `${REVIEW_RULES.commentMin - comment.trim().length} more characters needed`
            : `${commentLeft} characters left`}
        </p>
      </div>

      {/* Photos */}
      <div>
        <Label className="mb-2 block">Photos (optional)</Label>
        <PhotoUploader photos={photos} onChange={setPhotos} />
      </div>

      {/* Tags */}
      <div>
        <Label className="mb-2 block">What stood out? (optional)</Label>
        <div className="flex flex-wrap gap-2">
          {REVIEW_TAGS.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => toggleTag(t)}
              className={cn(
                "rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors",
                tags.includes(t)
                  ? "border-gold bg-gold/15 text-gold-700 dark:text-gold"
                  : "border-border text-muted-foreground hover:border-gold/50"
              )}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Honesty checkbox */}
      {!existing && (
        <label className="flex cursor-pointer items-start gap-2.5 rounded-xl border border-border p-3.5 text-sm">
          <input
            type="checkbox"
            checked={confirmed}
            onChange={(e) => setConfirmed(e.target.checked)}
            className="mt-0.5 h-4 w-4 accent-[#D4AF37]"
          />
          <span>I confirm this is my honest experience with this rental.</span>
        </label>
      )}

      <Button variant="gold" size="lg" className="w-full" onClick={submit} disabled={!valid || busy}>
        {busy ? "Submitting…" : existing ? "Save changes" : "Publish review"}
        {!busy && <CheckCircle2 className="h-4 w-4" />}
      </Button>
    </div>
  );
}
