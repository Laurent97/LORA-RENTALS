"use client";

import Image from "next/image";
import { useState } from "react";
import { BadgeCheck, Flag, Pencil, ThumbsUp, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RatingStars } from "./rating-stars";
import { ReplyForm } from "./reply-form";
import { FlagDialog } from "./flag-dialog";
import { reviewApi } from "@/lib/reviews/service";
import { canEditReply, canEditReview, canFlag, canReply } from "@/lib/reviews/permissions";
import { cn, fmtDate, initials } from "@/lib/utils";
import { useApp } from "@/lib/store";
import type { Review } from "@/types";

// ─── ReviewCard — public review display with reply, votes & actions ──────────

export function ReviewCard({
  review,
  onChanged,
  onEdit,
  onAdminDelete,
  showVehicle,
}: {
  review: Review;
  onChanged?: (r: Review) => void;
  onEdit?: (r: Review) => void;
  onAdminDelete?: (r: Review, replyOnly: boolean) => void;
  showVehicle?: string; // e.g. "Toyota RAV4 · Kigali"
}) {
  const { user, vehicles } = useApp();
  const [helpful, setHelpful] = useState(review.helpfulCount);
  const [voted, setVoted] = useState(false);
  const [flagOpen, setFlagOpen] = useState(false);
  const [replying, setReplying] = useState(false);
  const [editingReply, setEditingReply] = useState(false);

  const vehicle = vehicles.find((v) => v.id === review.vehicleId);
  const vehicleLabel = showVehicle ?? (vehicle ? `${vehicle.make} ${vehicle.model}` : undefined);
  const isAdmin = user?.role === "admin";

  const vote = async () => {
    if (!user) return toast.error("Sign in to vote");
    const res = await reviewApi.helpful(review.id);
    if (res.ok) {
      setHelpful(res.data.helpfulCount);
      setVoted(res.data.voted);
    } else {
      // mock mode — toggle locally
      setVoted((v) => !v);
      setHelpful((h) => h + (voted ? -1 : 1));
    }
  };

  return (
    <article className="rounded-2xl border border-border bg-card p-5 shadow-sm">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-navy-800 text-xs font-bold text-gold dark:bg-gold dark:text-navy-900">
            {initials(review.customerName)}
          </span>
          <div className="min-w-0">
            <p className="flex flex-wrap items-center gap-1.5 text-sm font-semibold">
              {review.customerName}
              {review.isVerifiedBooking && (
                <span className="inline-flex items-center gap-0.5 text-[11px] font-medium text-sky-600 dark:text-sky-400">
                  <BadgeCheck className="h-3.5 w-3.5" /> Verified booking
                </span>
              )}
            </p>
            <p className="text-xs text-muted-foreground">
              {fmtDate(review.createdAt)}
              {review.editedAt && " · Edited"}
              {vehicleLabel && ` · ${vehicleLabel}`}
            </p>
          </div>
        </div>
        <RatingStars value={review.rating} size="sm" />
      </div>

      {/* Body */}
      {review.title && <p className="mt-3 font-display text-sm font-bold">{review.title}</p>}
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{review.comment}</p>

      {review.photos.length > 0 && (
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
          {review.photos.map((src) => (
            <div key={src} className="relative h-20 w-28 shrink-0 overflow-hidden rounded-xl border border-border">
              <Image src={src} alt="Review photo" fill className="object-cover" />
            </div>
          ))}
        </div>
      )}

      {review.tags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {review.tags.map((t) => (
            <Badge key={t} variant="secondary" className="text-[11px]">{t}</Badge>
          ))}
        </div>
      )}

      {/* Owner reply */}
      {review.reply && !editingReply && (
        <div className="mt-4 rounded-xl border-l-4 border-gold bg-secondary/60 p-4">
          <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
            Owner's reply{vehicleLabel ? ` — ${vehicleLabel}` : ""}
          </p>
          <p className="mt-1.5 text-sm leading-relaxed">{review.reply.comment}</p>
          <p className="mt-2 text-xs text-muted-foreground">
            — {review.reply.ownerName ?? "Owner"}, LORA Verified Owner · {fmtDate(review.reply.createdAt)}
            {review.reply.editedAt && " · Edited"}
          </p>
          <div className="mt-2 flex gap-2">
            {canEditReply(user, review.reply) && (
              <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setEditingReply(true)}>
                <Pencil className="h-3 w-3" /> Edit reply
              </Button>
            )}
            {isAdmin && onAdminDelete && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs text-destructive"
                onClick={() => onAdminDelete(review, true)}
              >
                <Trash2 className="h-3 w-3" /> Delete reply
              </Button>
            )}
          </div>
        </div>
      )}
      {editingReply && review.reply && (
        <ReplyForm
          review={review}
          existing={review.reply.comment}
          onDone={(reply) => {
            setEditingReply(false);
            onChanged?.({ ...review, reply });
          }}
          onCancel={() => setEditingReply(false)}
        />
      )}

      {/* Reply CTA for owners */}
      {canReply(user, review) && !replying && (
        <Button variant="outline" size="sm" className="mt-4" onClick={() => setReplying(true)}>
          Reply as owner
        </Button>
      )}
      {replying && (
        <ReplyForm
          review={review}
          onDone={(reply) => {
            setReplying(false);
            onChanged?.({ ...review, reply });
          }}
          onCancel={() => setReplying(false)}
        />
      )}

      {/* Footer actions */}
      <div className="mt-4 flex flex-wrap items-center gap-1 border-t border-border pt-3">
        <Button
          variant="ghost"
          size="sm"
          className={cn("h-8 text-xs", voted && "text-gold")}
          onClick={vote}
        >
          <ThumbsUp className={cn("h-3.5 w-3.5", voted && "fill-gold")} /> Helpful ({helpful})
        </Button>
        {canFlag(user, review) && (
          <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={() => setFlagOpen(true)}>
            <Flag className="h-3.5 w-3.5" /> Report
          </Button>
        )}
        {canEditReview(user, review) && onEdit && (
          <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={() => onEdit(review)}>
            <Pencil className="h-3.5 w-3.5" /> Edit
          </Button>
        )}
        {isAdmin && onAdminDelete && (
          <Button
            variant="ghost"
            size="sm"
            className="ml-auto h-8 text-xs text-destructive"
            onClick={() => onAdminDelete(review, false)}
          >
            <Trash2 className="h-3.5 w-3.5" /> Delete
          </Button>
        )}
      </div>

      <FlagDialog review={review} open={flagOpen} onOpenChange={setFlagOpen} />
    </article>
  );
}
