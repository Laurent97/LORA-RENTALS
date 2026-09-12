import Link from "next/link";
import { cn } from "@/lib/utils";

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" fill="none" className={cn("h-9 w-9", className)} aria-hidden>
      {/* Shield */}
      <path
        d="M24 3L6 10v12c0 11.1 7.7 21.4 18 23 10.3-1.6 18-11.9 18-23V10L24 3z"
        className="fill-navy-800 dark:fill-gold"
      />
      {/* Road / car silhouette */}
      <path
        d="M13 28l2.6-7.2c.5-1.4 1.8-2.3 3.3-2.3h10.2c1.5 0 2.8.9 3.3 2.3L35 28v6.5c0 .8-.7 1.5-1.5 1.5h-1.6c-.8 0-1.5-.7-1.5-1.5V33H17.6v1.5c0 .8-.7 1.5-1.5 1.5h-1.6c-.8 0-1.5-.7-1.5-1.5V28z"
        className="fill-gold dark:fill-navy-900"
      />
      <circle cx="18.5" cy="28.5" r="1.6" className="fill-navy-800 dark:fill-gold" />
      <circle cx="29.5" cy="28.5" r="1.6" className="fill-navy-800 dark:fill-gold" />
      {/* Road dashes */}
      <path d="M24 8v3M24 13v3" strokeWidth="1.8" strokeLinecap="round" className="stroke-gold dark:stroke-navy-900" />
    </svg>
  );
}

export function Logo({ className, compact }: { className?: string; compact?: boolean }) {
  return (
    <Link href="/" className={cn("flex items-center gap-2.5", className)} aria-label="LORA RENTALS LTD home">
      <LogoMark />
      {!compact && (
        <div className="leading-tight">
          <div className="font-display text-base font-extrabold tracking-tight text-navy-800 dark:text-white">
            LORA <span className="text-gold">RENTALS</span>
          </div>
          <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            LTD · Rwanda
          </div>
        </div>
      )}
    </Link>
  );
}
