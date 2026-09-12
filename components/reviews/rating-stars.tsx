"use client";

import { useState } from "react";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

// ─── RatingStars ─────────────────────────────────────────────────────────────
// Display mode: gold filled stars (supports halves for averages).
// Interactive mode: large tappable stars with hover preview + keyboard support.

export function RatingStars({
  value,
  onChange,
  size = "md",
  className,
}: {
  value: number;
  onChange?: (v: number) => void;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const [hover, setHover] = useState(0);
  const interactive = !!onChange;
  const px = size === "lg" ? 40 : size === "md" ? 22 : 16;
  const shown = hover || value;

  const star = (i: number) => {
    const fill = Math.min(1, Math.max(0, shown - i)); // 0..1 per star
    return (
      <span key={i} className="relative inline-block" style={{ width: px, height: px }}>
        <Star style={{ width: px, height: px }} className="absolute inset-0 text-border" />
        <span className="absolute inset-0 overflow-hidden" style={{ width: `${fill * 100}%` }}>
          <Star style={{ width: px, height: px }} className="fill-gold text-gold" />
        </span>
      </span>
    );
  };

  if (!interactive) {
    return (
      <span className={cn("inline-flex items-center gap-0.5", className)} aria-label={`${value} out of 5 stars`}>
        {[0, 1, 2, 3, 4].map(star)}
      </span>
    );
  }

  return (
    <div
      className={cn("inline-flex items-center gap-1.5", className)}
      role="radiogroup"
      aria-label="Star rating"
      onMouseLeave={() => setHover(0)}
    >
      {[1, 2, 3, 4, 5].map((v) => (
        <button
          key={v}
          type="button"
          role="radio"
          aria-checked={value === v}
          aria-label={`${v} star${v > 1 ? "s" : ""}`}
          className="rounded-lg p-0.5 transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
          onMouseEnter={() => setHover(v)}
          onClick={() => onChange(v)}
          onKeyDown={(e) => {
            if (e.key === "ArrowRight" || e.key === "ArrowUp") onChange(Math.min(5, value + 1));
            if (e.key === "ArrowLeft" || e.key === "ArrowDown") onChange(Math.max(1, value - 1));
          }}
        >
          {star(v - 1)}
        </button>
      ))}
    </div>
  );
}
