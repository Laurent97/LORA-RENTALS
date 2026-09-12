"use client";

import { useEffect, useState } from "react";
import { Timer } from "lucide-react";
import { cn } from "@/lib/utils";

function useNow(intervalMs = 30_000) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(t);
  }, [intervalMs]);
  return now;
}

export function SlaCountdown({ deadline, className }: { deadline?: string; className?: string }) {
  const now = useNow();
  if (!deadline) return null;
  const ms = new Date(deadline).getTime() - now;
  if (ms <= 0) {
    return (
      <span className={cn("inline-flex items-center gap-1 rounded-full bg-destructive/10 px-2.5 py-1 text-[11px] font-bold text-destructive", className)}>
        <Timer className="h-3 w-3" /> Overdue — escalated
      </span>
    );
  }
  const h = Math.floor(ms / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  const urgent = ms < 3_600_000;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold",
        urgent ? "bg-destructive/10 text-destructive" : "bg-gold/15 text-gold-600 dark:text-gold",
        className
      )}
      title="Owner response deadline"
    >
      <Timer className="h-3 w-3" /> Respond within {h}h {m}m
    </span>
  );
}
