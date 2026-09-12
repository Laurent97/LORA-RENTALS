"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { MapPin, Star } from "lucide-react";
import { RWANDA_LOCATIONS } from "@/lib/constants";
import { useApp } from "@/lib/store";
import { cn } from "@/lib/utils";
import type { LocationEntry } from "@/types";

interface Props {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
  id?: string;
}

const FALLBACK: LocationEntry[] = RWANDA_LOCATIONS.map((name, i) => ({
  id: `loc-${i}`,
  name,
  province: name.startsWith("Kigali") ? "Kigali City" : "Rwanda",
  isPopular: ["Kigali — Gasabo", "Kigali International Airport", "Musanze", "Rubavu", "Huye"].includes(name),
}));

export function LocationAutocomplete({ value, onChange, placeholder = "Search a place in Rwanda…", className, id }: Props) {
  const dbLocations = useApp((s) => s.locations);
  const locations = dbLocations.length ? dbLocations : FALLBACK;

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState(value);
  const [hi, setHi] = useState(0);
  const boxRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  useEffect(() => setQuery(value), [value]);

  // close on outside click
  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = q
      ? locations.filter(
          (l) => l.name.toLowerCase().includes(q) || l.province.toLowerCase().includes(q)
        )
      : locations;
    return [...list].sort((a, b) => Number(b.isPopular) - Number(a.isPopular)).slice(0, 8);
  }, [query, locations]);

  const pick = (l: LocationEntry) => {
    setQuery(l.name);
    onChange(l.name);
    setOpen(false);
  };

  const onKey = (e: React.KeyboardEvent) => {
    if (!open && (e.key === "ArrowDown" || e.key === "Enter")) {
      setOpen(true);
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHi((h) => Math.min(h + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHi((h) => Math.max(h - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (results[hi]) pick(results[hi]);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  useEffect(() => {
    listRef.current?.children[hi]?.scrollIntoView({ block: "nearest" });
  }, [hi]);

  return (
    <div ref={boxRef} className={cn("relative", className)}>
      <div className="relative">
        <MapPin className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          id={id}
          role="combobox"
          aria-expanded={open}
          aria-autocomplete="list"
          aria-controls={id ? `${id}-list` : undefined}
          value={query}
          placeholder={placeholder}
          autoComplete="off"
          onChange={(e) => {
            setQuery(e.target.value);
            onChange(e.target.value);
            setHi(0);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKey}
          className="flex h-11 w-full rounded-xl border border-input bg-background pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground [color-scheme:light] dark:[color-scheme:dark] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      </div>

      {open && results.length > 0 && (
        <ul
          ref={listRef}
          id={id ? `${id}-list` : undefined}
          role="listbox"
          className="absolute z-50 mt-1.5 max-h-64 w-full overflow-auto rounded-xl border border-border bg-card p-1 text-card-foreground shadow-xl"
        >
          {results.map((l, i) => {
            const active = i === hi;
            return (
            <li
              key={l.id}
              role="option"
              aria-selected={active}
              onMouseEnter={() => setHi(i)}
              onClick={() => pick(l)}
              className={cn(
                "flex cursor-pointer items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm text-foreground",
                active && "bg-secondary text-secondary-foreground"
              )}
            >
              <MapPin className={cn("h-4 w-4 shrink-0", active ? "text-secondary-foreground/70" : "text-muted-foreground")} />
                <span className="flex-1 text-foreground">
                <span className={cn("font-medium", active ? "text-secondary-foreground" : "text-foreground")}>{l.name}</span>
                <span className={cn("ml-2 text-xs", active ? "text-secondary-foreground/70" : "text-muted-foreground")}>{l.province}</span>
              </span>
              {l.isPopular && (
                <span className="flex items-center gap-1 rounded-full bg-gold/15 px-2 py-0.5 text-[10px] font-bold text-gold-600 dark:text-gold">
                  <Star className="h-2.5 w-2.5 fill-current" /> Popular
                </span>
              )}
            </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
