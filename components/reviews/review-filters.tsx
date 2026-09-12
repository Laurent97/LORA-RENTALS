"use client";

import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { ReviewStatus } from "@/types";

// ─── ReviewFilters — shared filter bar for owner/admin review lists ─────────

export interface ReviewFilterState {
  status: "all" | ReviewStatus | "replied" | "unreplied";
  rating: number; // 0 = all
  sort: "newest" | "highest" | "lowest";
  query: string;
}

export const DEFAULT_FILTERS: ReviewFilterState = { status: "all", rating: 0, sort: "newest", query: "" };

const STATUS_TABS: { value: ReviewFilterState["status"]; label: string }[] = [
  { value: "all", label: "All" },
  { value: "unreplied", label: "Unreplied" },
  { value: "replied", label: "Replied" },
  { value: "flagged", label: "Flagged" },
  { value: "hidden", label: "Hidden" },
];

export function ReviewFilters({
  value,
  onChange,
  admin = false,
}: {
  value: ReviewFilterState;
  onChange: (f: ReviewFilterState) => void;
  admin?: boolean;
}) {
  const tabs = admin ? [...STATUS_TABS, { value: "removed" as const, label: "Removed" }] : STATUS_TABS;
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-1.5">
        {tabs.map((t) => (
          <button
            key={t.value}
            onClick={() => onChange({ ...value, status: t.value })}
            className={cn(
              "rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors",
              value.status === t.value
                ? "bg-navy-800 text-gold dark:bg-gold dark:text-navy-900"
                : "bg-secondary text-muted-foreground hover:text-foreground"
            )}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div className="flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={value.query}
            onChange={(e) => onChange({ ...value, query: e.target.value })}
            placeholder="Search reviews, customers, plates…"
            className="pl-9"
          />
        </div>
        <Select
          value={String(value.rating)}
          onChange={(e) => onChange({ ...value, rating: Number(e.target.value) })}
          className="sm:w-40"
        >
          <option value="0">All ratings</option>
          {[5, 4, 3, 2, 1].map((r) => (
            <option key={r} value={r}>{r}★ only</option>
          ))}
        </Select>
        <Select
          value={value.sort}
          onChange={(e) => onChange({ ...value, sort: e.target.value as ReviewFilterState["sort"] })}
          className="sm:w-40"
        >
          <option value="newest">Newest first</option>
          <option value="highest">Highest rated</option>
          <option value="lowest">Lowest rated</option>
        </Select>
      </div>
    </div>
  );
}

export function applyReviewFilters<T extends { status: ReviewStatus; rating: number; createdAt: string; comment: string; title?: string; customerName: string; reply?: unknown }>(
  reviews: T[],
  f: ReviewFilterState,
  extraText?: (r: T) => string
): T[] {
  let list = reviews;
  if (f.status === "replied") list = list.filter((r) => !!r.reply);
  else if (f.status === "unreplied") list = list.filter((r) => !r.reply && r.status === "published");
  else if (f.status !== "all") list = list.filter((r) => r.status === f.status);
  if (f.rating) list = list.filter((r) => r.rating === f.rating);
  if (f.query.trim()) {
    const q = f.query.trim().toLowerCase();
    list = list.filter((r) =>
      [r.comment, r.title ?? "", r.customerName, extraText?.(r) ?? ""]
        .join(" ")
        .toLowerCase()
        .includes(q)
    );
  }
  return [...list].sort((a, b) =>
    f.sort === "newest"
      ? b.createdAt.localeCompare(a.createdAt)
      : f.sort === "highest"
        ? b.rating - a.rating
        : a.rating - b.rating
  );
}
