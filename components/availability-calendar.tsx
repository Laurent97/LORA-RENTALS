"use client";

import { useMemo, useState } from "react";
import {
  addDays,
  addMonths,
  endOfMonth,
  endOfWeek,
  format,
  isBefore,
  isSameDay,
  isSameMonth,
  isWithinInterval,
  parseISO,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useApp } from "@/lib/store";
import { cn } from "@/lib/utils";

const ACTIVE = ["confirmed", "picked_up"];

export function AvailabilityCalendar({
  vehicleId,
  selected,
  onSelect,
  mode = "view",
}: {
  vehicleId: string;
  selected?: { start?: string; end?: string };
  onSelect?: (date: string) => void;
  mode?: "view" | "manage"; // manage = owner can toggle blocked days
}) {
  const { bookings, availability, setAvailability } = useApp();
  const [month, setMonth] = useState(startOfMonth(new Date()));

  const blocked = useMemo(() => {
    const dates = new Set<string>();
    // owner-blocked days
    availability
      .filter((a) => a.vehicleId === vehicleId && a.status === "blocked")
      .forEach((a) => dates.add(a.date));
    // active bookings block their whole range
    bookings
      .filter((b) => b.vehicleId === vehicleId && ACTIVE.includes(b.status))
      .forEach((b) => {
        let d = parseISO(b.startDate);
        const end = parseISO(b.endDate);
        while (d <= end) {
          dates.add(format(d, "yyyy-MM-dd"));
          d = addDays(d, 1);
        }
      });
    return dates;
  }, [availability, bookings, vehicleId]);

  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(month), { weekStartsOn: 1 });
    const end = endOfWeek(endOfMonth(month), { weekStartsOn: 1 });
    const out: Date[] = [];
    let d = start;
    while (d <= end) {
      out.push(d);
      d = addDays(d, 1);
    }
    return out;
  }, [month]);

  const today = new Date();
  const selStart = selected?.start ? parseISO(selected.start) : null;
  const selEnd = selected?.end ? parseISO(selected.end) : null;

  const click = (d: Date) => {
    const iso = format(d, "yyyy-MM-dd");
    if (isBefore(d, today) && !isSameDay(d, today)) return;
    if (mode === "manage") {
      setAvailability(vehicleId, [iso], blocked.has(iso) ? "available" : "blocked");
    } else {
      onSelect?.(iso);
    }
  };

  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="mb-3 flex items-center justify-between">
        <p className="font-display font-bold">{format(month, "MMMM yyyy")}</p>
        <div className="flex gap-1">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setMonth(addMonths(month, -1))} aria-label="Previous month">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setMonth(addMonths(month, 1))} aria-label="Next month">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-semibold uppercase text-muted-foreground">
        {["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"].map((d) => (
          <span key={d} className="py-1">{d}</span>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {days.map((d) => {
          const iso = format(d, "yyyy-MM-dd");
          const isBlocked = blocked.has(iso);
          const past = isBefore(d, today) && !isSameDay(d, today);
          const inMonth = isSameMonth(d, month);
          const isSel =
            (selStart && isSameDay(d, selStart)) ||
            (selEnd && isSameDay(d, selEnd));
          const inRange =
            selStart && selEnd && isWithinInterval(d, { start: selStart, end: selEnd });
          return (
            <button
              key={iso}
              type="button"
              disabled={past}
              onClick={() => click(d)}
              className={cn(
                "aspect-square rounded-lg text-xs font-medium transition-colors",
                !inMonth && "opacity-30",
                past && "cursor-not-allowed opacity-25",
                isBlocked && "bg-secondary text-muted-foreground line-through",
                !isBlocked && !past && "bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/20 dark:text-emerald-400",
                inRange && "bg-gold/25 text-foreground",
                isSel && "bg-gold font-bold text-navy-900 hover:bg-gold"
              )}
              title={isBlocked ? "Unavailable" : "Available"}
            >
              {format(d, "d")}
            </button>
          );
        })}
      </div>

      <div className="mt-3 flex flex-wrap gap-3 text-[10px] font-medium text-muted-foreground">
        <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded bg-emerald-500/40" /> Available</span>
        <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded bg-secondary" /> Booked / blocked</span>
        <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded bg-gold" /> Selected</span>
      </div>
      {mode === "manage" && (
        <p className="mt-2 text-xs text-muted-foreground">Tap a day to block or unblock it.</p>
      )}
    </div>
  );
}
