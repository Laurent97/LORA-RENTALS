"use client";

import { BadgeCheck } from "lucide-react";
import { cn } from "@/lib/utils";

export function VerifiedBadge({
  className,
  showLabel = false,
}: {
  className?: string;
  showLabel?: boolean;
}) {
  return (
    <span
      className={cn("inline-flex items-center gap-1 text-sky-500", className)}
      title="Identity & vehicle documents verified by LORA Rentals"
    >
      <BadgeCheck className="h-4 w-4 fill-sky-500 text-white dark:text-navy-950" />
      {showLabel && <span className="text-xs font-semibold">Verified by LORA</span>}
    </span>
  );
}
