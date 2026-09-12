"use client";

import { useState } from "react";
import { AlertTriangle, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { RatingStars } from "./rating-stars";
import { reviewApi } from "@/lib/reviews/service";
import { DELETE_REASONS } from "@/lib/reviews/constants";
import { fmtDate } from "@/lib/utils";
import type { Review } from "@/types";

// ─── DeleteConfirmationModal — admin-only permanent delete ──────────────────
// Requires a reason + typing "DELETE". Both parties are emailed by the server.

export function DeleteConfirmationModal({
  review,
  replyOnly,
  open,
  onOpenChange,
  onDeleted,
}: {
  review: Review | null;
  replyOnly: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDeleted: (reviewId: string, replyOnly: boolean) => void;
}) {
  const [reason, setReason] = useState<string>(DELETE_REASONS[0]);
  const [note, setNote] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);

  const close = () => {
    onOpenChange(false);
    setConfirm("");
    setNote("");
  };

  const submit = async () => {
    if (!review) return;
    setBusy(true);
    const res = await reviewApi.adminDelete({
      reviewId: review.id,
      replyOnly,
      reason,
      note,
      confirm: "DELETE",
    });
    setBusy(false);
    if (res.ok) {
      toast.success(replyOnly ? "Reply deleted" : "Review deleted — both parties notified");
      onDeleted(review.id, replyOnly);
      close();
    } else {
      toast.error(res.error);
    }
  };

  if (!review) return null;

  return (
    <Dialog open={open} onOpenChange={(o) => (o ? onOpenChange(o) : close())}>
      <DialogContent onClose={close}>
        <DialogHeader>
          <DialogTitle>
            <span className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              {replyOnly ? "Delete this reply permanently?" : "Delete this review permanently?"}
            </span>
          </DialogTitle>
        </DialogHeader>

        <div className="rounded-xl border border-border bg-secondary/50 p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold">{review.customerName}</p>
            <RatingStars value={review.rating} size="sm" />
          </div>
          <p className="mt-1 text-xs text-muted-foreground">{fmtDate(review.createdAt)}</p>
          <p className="mt-2 line-clamp-2 text-sm italic text-muted-foreground">
            "{replyOnly ? review.reply?.comment : review.comment}"
          </p>
        </div>

        <p className="mt-3 text-sm text-muted-foreground">
          This action <strong className="text-foreground">cannot be undone</strong>.{" "}
          {replyOnly
            ? "The owner's reply will be permanently removed."
            : "The review and its reply will be permanently removed from LORA."}{" "}
          The customer and owner will be notified by email.
        </p>

        <div className="mt-4 space-y-3">
          <div>
            <label className="mb-1 block text-xs font-semibold">Reason for deletion (required)</label>
            <Select value={reason} onChange={(e) => setReason(e.target.value)}>
              {DELETE_REASONS.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </Select>
          </div>
          <Textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Internal notes (optional)…"
            rows={2}
          />
          <div>
            <label className="mb-1 block text-xs font-semibold">
              Type <span className="font-mono text-destructive">DELETE</span> to confirm
            </label>
            <Input
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="DELETE"
              autoComplete="off"
            />
          </div>
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={close}>Cancel</Button>
          <Button
            variant="destructive"
            size="sm"
            disabled={confirm !== "DELETE" || busy}
            onClick={submit}
          >
            <Trash2 className="h-3.5 w-3.5" /> {busy ? "Deleting…" : "Yes, delete permanently"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
