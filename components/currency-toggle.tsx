"use client";

import { useApp } from "@/lib/store";
import { cn } from "@/lib/utils";

export function CurrencyToggle() {
  const { currency, setCurrency } = useApp();
  return (
    <div className="flex items-center rounded-full border border-border bg-secondary/50 p-0.5 text-xs font-bold">
      {(["RWF", "USD"] as const).map((c) => (
        <button
          key={c}
          onClick={() => setCurrency(c)}
          className={cn(
            "rounded-full px-2.5 py-1 transition-colors",
            currency === c
              ? "bg-navy-800 text-gold dark:bg-gold dark:text-navy-900"
              : "text-muted-foreground hover:text-foreground"
          )}
          aria-pressed={currency === c}
        >
          {c}
        </button>
      ))}
    </div>
  );
}
