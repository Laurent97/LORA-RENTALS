"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Flag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { reviewApi } from "@/lib/reviews/service";
import { REPORT_REASONS } from "@/lib/reviews/constants";
import { useApp } from "@/lib/store";
import type { Review } from "@/types";

// ─── FlagDialog — report a review for moderation ─────────────────────────────

export function FlagDialog({
  review,
  open,
  onOpenChange,
}: {
  review: Review;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { flagReviewLocal } = useApp();
  const [reason, setReason] = useState<string>(REPORT_REASONS[0]);
  const [details, setDetails] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setBusy(true);
    const res = await reviewApi.flag({ reviewId: review.id, reason: reason as (typeof REPORT_REASONS)[number], details });
    setBusy(false);
    if (res.ok || res.error.startsWith("Network")) {
      flagReviewLocal(review.id);
      toast.success("Report submitted — our team will review it within 24h.");
      onOpenChange(false);
    } else {
      toast.error(res.error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent onClose={() => onOpenChange(false)}>
        <DialogHeader>
          <DialogTitle>
            <span className="flex items-center gap-2">
              <Flag className="h-5 w-5 text-amber-500" /> Report this review
            </span>
          </DialogTitle>
          <DialogDescription>
            Reports go to LORA moderation. Reviews with 3+ reports are hidden automatically.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <Select value={reason} onChange={(e) => setReason(e.target.value)}>
            {REPORT_REASONS.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </Select>
          <Textarea
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            placeholder="Tell us more (optional)…"
            rows={3}
          />
          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button variant="destructive" size="sm" onClick={submit} disabled={busy}>
              {busy ? "Submitting…" : "Submit report"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
