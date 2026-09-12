"use client";

import { Banknote, CreditCard, Smartphone } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PaymentMethod } from "@/types";

const ICONS: Record<PaymentMethod, typeof Banknote> = {
  cash: Banknote,
  momo: Smartphone,
  card: CreditCard,
};

const LABELS: Record<PaymentMethod, string> = {
  cash: "Cash",
  momo: "MoMo",
  card: "Card",
};

export function PayAtPickupBadge({
  methods = ["cash", "momo", "card"],
  className,
}: {
  methods?: PaymentMethod[];
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full bg-emerald-600/90 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white backdrop-blur",
        className
      )}
      title="Pay at pickup — no online charge"
    >
      <Banknote className="h-3 w-3" />
      Pay at pickup
      <span className="mx-0.5 opacity-50">·</span>
      {methods.map((m) => {
        const Icon = ICONS[m];
        return (
          <span key={m} className="inline-flex items-center gap-0.5" title={LABELS[m]}>
            <Icon className="h-3 w-3" />
          </span>
        );
      })}
    </span>
  );
}
