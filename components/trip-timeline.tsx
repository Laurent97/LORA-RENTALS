"use client";

import { Check, Circle } from "lucide-react";
import { BOOKING_TIMELINE, BOOKING_STATUS_LABELS } from "@/lib/constants";
import { cn, fmtDateTime } from "@/lib/utils";
import type { Booking } from "@/types";

// Maps each timeline step to the timestamp field that records when it happened.
function stepTime(b: Booking, step: string): string | undefined {
  switch (step) {
    case "requested": return b.createdAt;
    case "confirmed": return b.ownerRespondedAt;
    case "picked_up": return b.pickedUpAt;
    case "returned": return b.returnedAt;
    case "completed": return b.status === "completed" ? b.returnedAt : undefined;
    default: return undefined;
  }
}

export function TripTimeline({ booking, vertical }: { booking: Booking; vertical?: boolean }) {
  const cancelled = ["cancelled", "declined"].includes(booking.status);
  const currentIdx = cancelled ? -1 : BOOKING_TIMELINE.indexOf(booking.status as never);

  if (cancelled) {
    return (
      <p className="rounded-xl bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive">
        This booking was {booking.status}.
      </p>
    );
  }

  return (
    <ol
      className={cn(
        "flex",
        vertical ? "flex-col gap-0" : "items-start"
      )}
      aria-label="Trip progress"
    >
      {BOOKING_TIMELINE.map((step, i) => {
        const done = i <= currentIdx;
        const current = i === currentIdx;
        const when = stepTime(booking, step);
        return (
          <li
            key={step}
            className={cn(
              "flex",
              vertical ? "gap-3 pb-5 last:pb-0" : "flex-1 flex-col items-center"
            )}
          >
            <div className={cn("flex items-center", vertical ? "flex-col" : "w-full")}>
              <span
                className={cn(
                  "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 transition-all",
                  done
                    ? "border-emerald-500 bg-emerald-500 text-white"
                    : "border-border bg-card text-muted-foreground",
                  current && "animate-pulse border-gold bg-gold text-navy-900"
                )}
              >
                {done && !current ? <Check className="h-4 w-4" /> : <Circle className={cn("h-3 w-3", current && "fill-current")} />}
              </span>
              {!vertical && i < BOOKING_TIMELINE.length - 1 && (
                <span
                  className={cn(
                    "mx-1 h-0.5 flex-1 -translate-y-4 self-start",
                    i < currentIdx ? "bg-emerald-500" : "bg-border"
                  )}
                  style={{ marginTop: 16 }}
                />
              )}
              {vertical && i < BOOKING_TIMELINE.length - 1 && (
                <span className={cn("my-1 w-0.5 flex-1", i < currentIdx ? "bg-emerald-500" : "bg-border")} style={{ minHeight: 20 }} />
              )}
            </div>
            <div className={cn(vertical ? "pt-1" : "mt-2 text-center")}>
              <p className={cn("text-xs font-semibold", current && "text-gold-600 dark:text-gold")}>
                {BOOKING_STATUS_LABELS[step]}
              </p>
              {when && (
                <p className="mt-0.5 text-[10px] text-muted-foreground">{fmtDateTime(when)}</p>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
