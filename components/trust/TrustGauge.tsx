"use client";

import { useState } from "react";
import type { TrustScore } from "@/types";

const TIER_COLORS: Record<TrustScore["tier"], string> = {
  bronze: "text-amber-700",
  silver: "text-slate-400",
  gold: "text-yellow-500",
  platinum: "text-cyan-400",
  diamond: "text-purple-500",
};

const TIER_BG: Record<TrustScore["tier"], string> = {
  bronze: "bg-amber-700",
  silver: "bg-slate-400",
  gold: "bg-yellow-500",
  platinum: "bg-cyan-400",
  diamond: "bg-purple-500",
};

const LABELS: { key: keyof TrustScore; label: string }[] = [
  { key: "kyc", label: "KYC" },
  { key: "response", label: "Response" },
  { key: "cancellation", label: "Cancellation" },
  { key: "rating", label: "Rating" },
  { key: "damage", label: "Damage" },
  { key: "punctuality", label: "Punctuality" },
  { key: "repeatCustomer", label: "Repeat customer" },
  { key: "dispute", label: "Disputes" },
];

export function TrustGauge({ score, size = 64 }: { score: TrustScore; size?: number }) {
  const [show, setShow] = useState(false);
  const r = size / 2 - 4;
  const c = 2 * Math.PI * r;
  const offset = c - (score.total / 100) * c;
  const color = TIER_COLORS[score.tier];
  const fill = TIER_BG[score.tier];

  return (
    <div
      className="relative inline-flex items-center gap-2"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      <div className="relative" style={{ width: size, height: size }}>
        <svg className="-rotate-90" width={size} height={size}>
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            stroke="currentColor"
            strokeWidth="6"
            fill="none"
            className="text-muted-foreground/20"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            stroke="currentColor"
            strokeWidth="6"
            fill="none"
            strokeDasharray={c}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className={color}
          />
        </svg>
        <span
          className={`absolute inset-0 flex items-center justify-center text-[10px] font-bold uppercase ${color}`}
        >
          {score.total}
        </span>
      </div>
      <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-bold text-white ${fill}`}>
        {score.tier}
      </span>

      {show && (
        <div className="absolute left-full top-0 z-50 ml-2 w-56 rounded-xl border border-gold/20 bg-card p-3 shadow-lg">
          <p className="mb-2 text-xs font-semibold text-foreground">Trust breakdown</p>
          <div className="space-y-1">
            {LABELS.map(({ key, label }) => (
              <div key={key} className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">{label}</span>
                <span className="font-medium">{score[key] as number}</span>
              </div>
            ))}
          </div>
          <p className="mt-2 text-[10px] text-muted-foreground">Total out of 100</p>
        </div>
      )}
    </div>
  );
}
