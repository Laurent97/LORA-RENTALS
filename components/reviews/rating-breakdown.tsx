"use client";

import { motion } from "framer-motion";
import { RatingStars } from "./rating-stars";
import type { RatingBreakdown as Breakdown } from "@/lib/reviews/analytics";

// ─── RatingBreakdown — average + per-star distribution bars ─────────────────

export function RatingBreakdown({ breakdown }: { breakdown: Breakdown }) {
  return (
    <div className="flex flex-col gap-5 rounded-2xl border border-border bg-card p-5 sm:flex-row sm:items-center sm:gap-8">
      <div className="text-center sm:w-32">
        <p className="font-display text-5xl font-extrabold text-navy-800 dark:text-gold">
          {breakdown.total ? breakdown.average.toFixed(1) : "—"}
        </p>
        <RatingStars value={breakdown.average} size="sm" className="mt-2 justify-center" />
        <p className="mt-1.5 text-xs text-muted-foreground">
          {breakdown.total} review{breakdown.total === 1 ? "" : "s"}
        </p>
      </div>
      <div className="flex-1 space-y-1.5">
        {[5, 4, 3, 2, 1].map((star) => {
          const pct = breakdown.percents[star - 1];
          const count = breakdown.counts[star - 1];
          return (
            <div key={star} className="flex items-center gap-2.5 text-xs">
              <span className="w-4 shrink-0 text-right font-semibold">{star}★</span>
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-secondary">
                <motion.div
                  className="h-full rounded-full bg-gold"
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: 0.6, ease: "easeOut" }}
                />
              </div>
              <span className="w-10 shrink-0 text-muted-foreground">
                {pct}% <span className="text-[10px]">({count})</span>
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
