"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Eye, EyeOff, Flag, MessageSquareReply, Star, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { StatCard } from "@/components/stat-card";
import { RatingStars } from "@/components/reviews/rating-stars";
import { DeleteConfirmationModal } from "@/components/reviews/delete-confirmation-modal";
import { applyReviewFilters, DEFAULT_FILTERS, ReviewFilters, type ReviewFilterState } from "@/components/reviews/review-filters";
import { reviewApi } from "@/lib/reviews/service";
import { ratingBreakdown } from "@/lib/reviews/analytics";
import { useAllUsers, useVehicles } from "@/lib/lookup";
import { useApp } from "@/lib/store";
import { cn, fmtDate } from "@/lib/utils";
import type { Review } from "@/types";

// ─── /admin/reviews — platform-wide moderation command center ───────────────

const STATUS_BADGE: Record<Review["status"], { label: string; variant: "success" | "warning" | "destructive" | "secondary" }> = {
  published: { label: "Published", variant: "success" },
  flagged: { label: "Flagged", variant: "warning" },
  hidden: { label: "Hidden", variant: "secondary" },
  removed: { label: "Removed", variant: "destructive" },
};

export default function AdminReviewsPage() {
  const { user, reviews, removeReviewLocal, setReviewStatusLocal } = useApp();
  const vehicles = useVehicles();
  const users = useAllUsers();
  const [filters, setFilters] = useState<ReviewFilterState>(DEFAULT_FILTERS);
  const [deleting, setDeleting] = useState<{ review: Review; replyOnly: boolean } | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  if (!user) return null;

  const published = reviews.filter((r) => r.status === "published");
  const bd = useMemo(() => ratingBreakdown(published), [reviews]);
  const flagged = reviews.filter((r) => r.status === "flagged" || r.flagCount > 0);
  const unreplied = published.filter((r) => !r.reply);

  const list = applyReviewFilters(reviews, filters, (r) => {
    const v = vehicles.find((x) => x.id === r.vehicleId);
    const o = users.find((x) => x.id === r.ownerId);
    return `${v ? `${v.make} ${v.model} ${v.plate}` : ""} ${o?.name ?? ""}`;
  });

  const moderate = async (r: Review, action: "hide" | "restore" | "dismiss_flags") => {
    const res = await reviewApi.adminModerate({ reviewId: r.id, action });
    if (res.ok) {
      setReviewStatusLocal(r.id, res.data.status as Review["status"]);
      toast.success(`Review ${action === "hide" ? "hidden" : action === "restore" ? "restored" : "flags dismissed"}`);
    } else {
      // mock mode — apply locally
      const status = action === "hide" ? "hidden" : "published";
      setReviewStatusLocal(r.id, status);
      toast.success(`Review ${action === "hide" ? "hidden" : "restored"} (local)`);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-extrabold tracking-tight">Review Moderation</h1>
        <p className="text-sm text-muted-foreground">
          Every review and reply across the platform. Only admins can delete.
        </p>
      </div>

      {/* Overview cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={Star} label="Total reviews" value={String(reviews.length)} sub={`${bd.average.toFixed(1)}★ platform average`} />
        <StatCard icon={Flag} label="Flagged" value={String(flagged.length)} sub="Pending moderation" trend={flagged.length ? "down" : undefined} />
        <StatCard icon={MessageSquareReply} label="Unreplied" value={String(unreplied.length)} sub="Published, no owner reply" />
        <StatCard icon={Trash2} label="Hidden" value={String(reviews.filter((r) => r.status === "hidden").length)} sub="Soft-hidden from public" />
      </div>

      <ReviewFilters value={filters} onChange={setFilters} admin />

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="px-4 py-3">Review</th>
                  <th className="px-4 py-3">Vehicle</th>
                  <th className="px-4 py-3">Rating</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Flags</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {list.map((r) => {
                  const v = vehicles.find((x) => x.id === r.vehicleId);
                  const owner = users.find((x) => x.id === r.ownerId);
                  const s = STATUS_BADGE[r.status];
                  const open = expanded === r.id;
                  return (
                    <tr key={r.id} className="border-b border-border align-top last:border-0">
                      <td className="max-w-xs px-4 py-3">
                        <button className="text-left" onClick={() => setExpanded(open ? null : r.id)}>
                          <p className="font-semibold">{r.customerName}</p>
                          <p className="text-xs text-muted-foreground">{fmtDate(r.createdAt)}</p>
                          <p className={cn("mt-1 text-xs text-muted-foreground", !open && "line-clamp-2")}>
                            {r.comment}
                          </p>
                          {open && r.reply && (
                            <p className="mt-2 rounded-lg border-l-2 border-gold bg-secondary/60 p-2 text-xs italic">
                              Owner: {r.reply.comment}
                            </p>
                          )}
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-xs font-medium">{v ? `${v.make} ${v.model}` : "—"}</p>
                        <p className="text-[11px] text-muted-foreground">{v?.plate} · {owner?.name ?? "—"}</p>
                      </td>
                      <td className="px-4 py-3"><RatingStars value={r.rating} size="sm" /></td>
                      <td className="px-4 py-3"><Badge variant={s.variant}>{s.label}</Badge></td>
                      <td className="px-4 py-3">
                        {r.flagCount > 0 ? (
                          <span className="text-xs font-semibold text-amber-600 dark:text-amber-400">
                            🚩 {r.flagCount}{r.flagReason ? ` · ${r.flagReason}` : ""}
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-1">
                          {r.status !== "published" && (
                            <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={() => moderate(r, "restore")}>
                              <Eye className="h-3.5 w-3.5" /> Restore
                            </Button>
                          )}
                          {r.status === "published" && (
                            <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={() => moderate(r, "hide")}>
                              <EyeOff className="h-3.5 w-3.5" /> Hide
                            </Button>
                          )}
                          {r.flagCount > 0 && r.status === "flagged" && (
                            <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={() => moderate(r, "dismiss_flags")}>
                              Dismiss
                            </Button>
                          )}
                          {r.reply && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 text-xs text-destructive"
                              onClick={() => setDeleting({ review: r, replyOnly: true })}
                            >
                              Del reply
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 text-xs text-destructive"
                            onClick={() => setDeleting({ review: r, replyOnly: false })}
                          >
                            <Trash2 className="h-3.5 w-3.5" /> Delete
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {list.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center text-sm text-muted-foreground">
                      No reviews match these filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <DeleteConfirmationModal
        review={deleting?.review ?? null}
        replyOnly={deleting?.replyOnly ?? false}
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
        onDeleted={(id, replyOnly) => removeReviewLocal(id, replyOnly)}
      />
    </div>
  );
}
