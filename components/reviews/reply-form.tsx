"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { reviewApi } from "@/lib/reviews/service";
import { REVIEW_RULES } from "@/lib/reviews/constants";
import { useApp } from "@/lib/store";
import type { Review, ReviewReply } from "@/types";

// ─── ReplyForm — owner reply composer (create or edit) ───────────────────────

export function ReplyForm({
  review,
  existing,
  onDone,
  onCancel,
}: {
  review: Review;
  existing?: string;
  onDone: (reply: ReviewReply) => void;
  onCancel: () => void;
}) {
  const { user } = useApp();
  const [comment, setComment] = useState(existing ?? "");
  const [busy, setBusy] = useState(false);
  const left = REVIEW_RULES.replyMax - comment.length;

  const submit = async () => {
    if (!user) return;
    if (comment.trim().length < 2) return toast.error("Write a reply first");
    setBusy(true);
    const res = existing
      ? await reviewApi.editReply({ reviewId: review.id, comment: comment.trim() })
      : await reviewApi.reply({ reviewId: review.id, comment: comment.trim() });
    setBusy(false);
    if (res.ok) {
      toast.success(existing ? "Reply updated" : "Reply posted");
      onDone(res.data.reply as ReviewReply);
    } else {
      // Mock mode fallback — apply locally so the demo flow still works.
      if (res.error === "Network error — check your connection and try again.") {
        const reply: ReviewReply = {
          id: review.reply?.id ?? `rpl-${Date.now()}`,
          reviewId: review.id,
          ownerId: user.id,
          ownerName: user.name,
          comment: comment.trim(),
          editedAt: existing ? new Date().toISOString() : undefined,
          createdAt: review.reply?.createdAt ?? new Date().toISOString(),
        };
        toast.success(existing ? "Reply updated" : "Reply posted");
        onDone(reply);
      } else {
        toast.error(res.error);
      }
    }
  };

  return (
    <div className="mt-4 rounded-xl border border-gold/40 bg-gold/5 p-4">
      <p className="mb-2 text-xs font-bold uppercase tracking-wide text-muted-foreground">
        {existing ? "Edit your reply" : "Reply as owner"}
      </p>
      <Textarea
        value={comment}
        onChange={(e) => setComment(e.target.value.slice(0, REVIEW_RULES.replyMax))}
        placeholder="Thank you for your feedback…"
        rows={3}
        autoFocus
      />
      <div className="mt-2 flex items-center justify-between">
        <p className="text-[11px] text-muted-foreground">
          {left} characters left · Replies can't be deleted — only edited within 48h or removed by LORA Admin.
        </p>
      </div>
      <div className="mt-3 flex gap-2">
        <Button variant="gold" size="sm" onClick={submit} disabled={busy || !comment.trim()}>
          {busy ? "Posting…" : existing ? "Save reply" : "Post reply"}
        </Button>
        <Button variant="ghost" size="sm" onClick={onCancel}>Cancel</Button>
      </div>
    </div>
  );
}
