"use client";

import { useRouter } from "next/navigation";
import { CalendarDays, MapPin, Search } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { LocationAutocomplete } from "@/components/location-autocomplete";
import { CAR_TYPES } from "@/lib/constants";

export function SearchBar({ compact }: { compact?: boolean }) {
  const router = useRouter();
  const [location, setLocation] = useState("");
  const [type, setType] = useState("");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (location) params.set("location", location);
    if (type) params.set("type", type);
    if (start) params.set("start", start);
    if (end) params.set("end", end);
    router.push(`/browse?${params.toString()}`);
  };

  return (
    <form
      onSubmit={submit}
      className={
        compact
          ? "grid gap-3 rounded-2xl border border-border bg-card p-4 shadow-lg sm:grid-cols-2 lg:grid-cols-5"
          : "grid gap-3 rounded-2xl border border-white/10 bg-white/95 p-4 shadow-2xl backdrop-blur dark:bg-navy-900/95 sm:grid-cols-2 lg:grid-cols-5"
      }
    >
      <label className="block">
        <span className="mb-1 flex items-center gap-1 text-xs font-semibold text-muted-foreground">
          <MapPin className="h-3 w-3" /> Pickup location
        </span>
        <LocationAutocomplete
          value={location}
          onChange={setLocation}
          placeholder="Anywhere in Rwanda"
        />
      </label>

      <label className="block">
        <span className="mb-1 block text-xs font-semibold text-muted-foreground">Car type</span>
        <Select value={type} onChange={(e) => setType(e.target.value)} aria-label="Car type" className="text-foreground [color-scheme:light] dark:[color-scheme:dark]">
          <option value="">All types</option>
          {CAR_TYPES.map((t) => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </Select>
      </label>

      <label className="block">
        <span className="mb-1 flex items-center gap-1 text-xs font-semibold text-muted-foreground">
          <CalendarDays className="h-3 w-3" /> Pickup date
        </span>
        <input
          type="date"
          value={start}
          onChange={(e) => setStart(e.target.value)}
          className="flex h-11 w-full rounded-xl border border-input bg-background px-4 text-sm text-foreground [color-scheme:light] dark:[color-scheme:dark] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      </label>

      <label className="block">
        <span className="mb-1 block text-xs font-semibold text-muted-foreground">Return date</span>
        <input
          type="date"
          value={end}
          min={start}
          onChange={(e) => setEnd(e.target.value)}
          className="flex h-11 w-full rounded-xl border border-input bg-background px-4 text-sm text-foreground [color-scheme:light] dark:[color-scheme:dark] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      </label>

      <div className="flex items-end sm:col-span-2 lg:col-span-1">
        <Button type="submit" variant="gold" size="lg" className="w-full">
          <Search className="h-4 w-4" /> Search
        </Button>
      </div>
    </form>
  );
}
