import type { Review } from "@/types";

// ─── Aggregation helpers — pure functions over Review[] ─────────────────────

export interface RatingBreakdown {
  average: number;
  total: number;
  /** index 0 = 1★ … index 4 = 5★ */
  counts: [number, number, number, number, number];
  /** index 0 = 1★ … index 4 = 5★, 0–100 */
  percents: [number, number, number, number, number];
}

export const ratingBreakdown = (reviews: Review[]): RatingBreakdown => {
  const counts: [number, number, number, number, number] = [0, 0, 0, 0, 0];
  let sum = 0;
  for (const r of reviews) {
    const i = Math.min(5, Math.max(1, Math.round(r.rating))) - 1;
    counts[i]++;
    sum += r.rating;
  }
  const total = reviews.length;
  return {
    average: total ? Math.round((sum / total) * 10) / 10 : 0,
    total,
    counts,
    percents: counts.map((c) => (total ? Math.round((c / total) * 100) : 0)) as RatingBreakdown["percents"],
  };
};

export interface OwnerReviewStats {
  average: number;
  total: number;
  replied: number;
  unreplied: number;
  responseRate: number; // 0–100
  avgReplyHours: number | null;
  topTags: { tag: string; count: number }[];
}

export const ownerStats = (reviews: Review[]): OwnerReviewStats => {
  const bd = ratingBreakdown(reviews);
  const replied = reviews.filter((r) => r.reply);
  const tagMap = new Map<string, number>();
  for (const r of reviews) for (const t of r.tags) tagMap.set(t, (tagMap.get(t) ?? 0) + 1);
  const replyTimes = replied
    .map((r) => (new Date(r.reply!.createdAt).getTime() - new Date(r.createdAt).getTime()) / 36e5)
    .filter((h) => h >= 0);
  return {
    average: bd.average,
    total: bd.total,
    replied: replied.length,
    unreplied: bd.total - replied.length,
    responseRate: bd.total ? Math.round((replied.length / bd.total) * 100) : 0,
    avgReplyHours: replyTimes.length
      ? Math.round((replyTimes.reduce((a, b) => a + b, 0) / replyTimes.length) * 10) / 10
      : null,
    topTags: Array.from(tagMap.entries())
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6),
  };
};

/** Reviews per month for the last `months` months — for trend charts. */
export const ratingTrend = (reviews: Review[], months = 6): { month: string; avg: number; count: number }[] => {
  const now = new Date();
  const buckets = new Map<string, { sum: number; count: number }>();
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    buckets.set(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`, { sum: 0, count: 0 });
  }
  for (const r of reviews) {
    const d = new Date(r.createdAt);
    const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const b = buckets.get(k);
    if (b) {
      b.sum += r.rating;
      b.count++;
    }
  }
  return Array.from(buckets.entries()).map(([month, b]) => ({
    month,
    avg: b.count ? Math.round((b.sum / b.count) * 10) / 10 : 0,
    count: b.count,
  }));
};
