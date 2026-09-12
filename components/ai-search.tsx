"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useApp } from "@/lib/store";
import type { ParsedSearch } from "@/types";

const CHIP_LABEL: Record<keyof ParsedSearch, (v: unknown) => string> = {
  type: (v) => `Type: ${String(v)}`,
  location: (v) => `📍 ${String(v)}`,
  days: (v) => `${v} days`,
  startDate: (v) => `From ${String(v)}`,
  endDate: (v) => `To ${String(v)}`,
  seats: (v) => `${v} seats`,
  maxPrice: (v) => `Under RWF ${Number(v).toLocaleString()}`,
};

export function AiSearch() {
  const router = useRouter();
  const { user } = useApp();
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [parsed, setParsed] = useState<ParsedSearch | null>(null);

  const search = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!q.trim()) return;
    setLoading(true);
    setParsed(null);
    try {
      const res = await fetch("/api/ai-search", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ query: q }),
      });
      const data = await res.json();
      const p = (data.parsed ?? {}) as ParsedSearch;
      setParsed(p);
      // log the query for analytics (best-effort)
      fetch("/api/log-search", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ userId: user?.id, rawQuery: q, parsed: p }),
      }).catch(() => {});
      // navigate to browse with parsed filters
      const params = new URLSearchParams();
      if (p.type) params.set("type", p.type);
      if (p.location) params.set("location", p.location);
      if (p.startDate) params.set("start", p.startDate);
      if (p.endDate) params.set("end", p.endDate);
      setTimeout(() => router.push(`/browse?${params.toString()}`), 900);
    } catch {
      // graceful degrade — plain text search
      router.push(`/browse?q=${encodeURIComponent(q)}`);
    } finally {
      setLoading(false);
    }
  };

  const chips = parsed
    ? (Object.entries(parsed) as [keyof ParsedSearch, unknown][]).filter(([, v]) => v != null)
    : [];

  return (
    <div className="w-full">
      <form onSubmit={search} className="relative">
        <Sparkles className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gold" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder='Try "4x4 in Musanze next weekend" or "luxury car Kigali for 3 days"'
          aria-label="AI search"
          className="h-12 w-full rounded-2xl border border-gold/40 bg-card pl-11 pr-28 text-sm text-foreground shadow-lg placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-gold"
        />
        <Button
          type="submit"
          variant="gold"
          size="sm"
          disabled={loading}
          className="absolute right-2 top-1/2 -translate-y-1/2"
        >
          {loading ? "Thinking…" : "AI Search"}
        </Button>
      </form>

      {chips.length > 0 && (
        <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
          <span className="text-xs font-semibold text-muted-foreground">AI understood:</span>
          {chips.map(([k, v]) => (
            <span
              key={k}
              className="inline-flex items-center gap-1 rounded-full bg-gold/15 px-2.5 py-1 text-[11px] font-semibold text-gold-700 dark:text-gold"
            >
              {CHIP_LABEL[k](v)}
              <button
                type="button"
                aria-label="Remove filter"
                onClick={() => setParsed((p) => (p ? { ...p, [k]: undefined } : p))}
                className="opacity-60 hover:opacity-100"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
