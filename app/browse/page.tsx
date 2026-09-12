"use client";

import { Suspense, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { LayoutGrid, List, SlidersHorizontal, X } from "lucide-react";
import { CarCard } from "@/components/car-card";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { CAR_TYPES, FUEL_TYPES, RWANDA_LOCATIONS, TRANSMISSIONS } from "@/lib/constants";
import { useVehicles } from "@/lib/lookup";
import { cn, formatRWF } from "@/lib/utils";
import type { CarType, FuelType, Transmission } from "@/types";

const SORTS = [
  { value: "popular", label: "Most popular" },
  { value: "price-asc", label: "Price: low → high" },
  { value: "price-desc", label: "Price: high → low" },
  { value: "rating", label: "Top rated" },
];

function BrowseContent() {
  const params = useSearchParams();
  const [type, setType] = useState<CarType | "">((params.get("type") as CarType) ?? "");
  const [location, setLocation] = useState(params.get("location") ?? "");
  const [transmission, setTransmission] = useState<Transmission | "">("");
  const [fuel, setFuel] = useState<FuelType | "">("");
  const [seats, setSeats] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [sort, setSort] = useState("popular");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [showFilters, setShowFilters] = useState(false);
  const vehicles = useVehicles();

  const results = useMemo(() => {
    let list = vehicles.filter((v) => v.status === "available");
    if (type) list = list.filter((v) => v.type === type);
    if (location) list = list.filter((v) => v.location === location);
    if (transmission) list = list.filter((v) => v.transmission === transmission);
    if (fuel) list = list.filter((v) => v.fuel === fuel);
    if (seats) list = list.filter((v) => v.seats >= Number(seats));
    if (maxPrice) list = list.filter((v) => v.pricePerDay <= Number(maxPrice));
    switch (sort) {
      case "price-asc": return [...list].sort((a, b) => a.pricePerDay - b.pricePerDay);
      case "price-desc": return [...list].sort((a, b) => b.pricePerDay - a.pricePerDay);
      case "rating": return [...list].sort((a, b) => b.rating - a.rating);
      default: return [...list].sort((a, b) => b.tripsCompleted - a.tripsCompleted);
    }
  }, [vehicles, type, location, transmission, fuel, seats, maxPrice, sort]);

  const activeFilters = [type, location, transmission, fuel, seats, maxPrice].filter(Boolean).length;
  const clearAll = () => {
    setType(""); setLocation(""); setTransmission(""); setFuel(""); setSeats(""); setMaxPrice("");
  };

  const filters = (
    <div className="space-y-5">
      <div>
        <Label className="mb-2 block">Car type</Label>
        <div className="flex flex-wrap gap-2">
          {CAR_TYPES.map((t) => (
            <button
              key={t.value}
              onClick={() => setType(type === t.value ? "" : t.value)}
              className={cn(
                "rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors",
                type === t.value
                  ? "border-navy-800 bg-navy-800 text-gold dark:border-gold dark:bg-gold dark:text-navy-900"
                  : "border-border hover:border-navy-400"
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>
      <div>
        <Label htmlFor="f-loc" className="mb-2 block">Location</Label>
        <Select id="f-loc" value={location} onChange={(e) => setLocation(e.target.value)}>
          <option value="">All locations</option>
          {RWANDA_LOCATIONS.map((l) => <option key={l} value={l}>{l}</option>)}
        </Select>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <Label htmlFor="f-trans" className="mb-2 block">Transmission</Label>
          <Select id="f-trans" value={transmission} onChange={(e) => setTransmission(e.target.value as Transmission | "")}>
            <option value="">Any</option>
            {TRANSMISSIONS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
          </Select>
        </div>
        <div>
          <Label htmlFor="f-fuel" className="mb-2 block">Fuel</Label>
          <Select id="f-fuel" value={fuel} onChange={(e) => setFuel(e.target.value as FuelType | "")}>
            <option value="">Any</option>
            {FUEL_TYPES.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
          </Select>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <Label htmlFor="f-seats" className="mb-2 block">Min seats</Label>
          <Select id="f-seats" value={seats} onChange={(e) => setSeats(e.target.value)}>
            <option value="">Any</option>
            {[2, 4, 5, 7, 14].map((s) => <option key={s} value={s}>{s}+</option>)}
          </Select>
        </div>
        <div>
          <Label htmlFor="f-price" className="mb-2 block">Max price/day</Label>
          <Input
            id="f-price"
            type="number"
            min={0}
            step={5000}
            placeholder="e.g. 100000"
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
          />
        </div>
      </div>
      {activeFilters > 0 && (
        <Button variant="ghost" size="sm" onClick={clearAll} className="w-full">
          <X className="h-3.5 w-3.5" /> Clear {activeFilters} filter{activeFilters > 1 ? "s" : ""}
        </Button>
      )}
    </div>
  );

  return (
    <main className="container py-8">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-extrabold tracking-tight">Browse cars</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {results.length} vehicle{results.length !== 1 ? "s" : ""} available · Pay at pickup, {formatRWF(0)} booking fee
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="lg:hidden"
            onClick={() => setShowFilters(!showFilters)}
          >
            <SlidersHorizontal className="h-4 w-4" /> Filters
            {activeFilters > 0 && <span className="ml-1 rounded-full bg-gold px-1.5 text-[10px] font-bold text-navy-900">{activeFilters}</span>}
          </Button>
          <Select value={sort} onChange={(e) => setSort(e.target.value)} className="w-full sm:w-44" aria-label="Sort by">
            {SORTS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </Select>
          <div className="hidden rounded-xl border border-border p-0.5 sm:flex">
            <button
              onClick={() => setView("grid")}
              aria-label="Grid view"
              className={cn("rounded-lg p-2", view === "grid" ? "bg-navy-800 text-gold dark:bg-gold dark:text-navy-900" : "text-muted-foreground")}
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button
              onClick={() => setView("list")}
              aria-label="List view"
              className={cn("rounded-lg p-2", view === "list" ? "bg-navy-800 text-gold dark:bg-gold dark:text-navy-900" : "text-muted-foreground")}
            >
              <List className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-[260px_1fr]">
        <aside className={cn("lg:block", showFilters ? "block" : "hidden")}>
          <div className="sticky top-20 rounded-2xl border border-border bg-card p-5">
            <h2 className="mb-4 font-display text-sm font-bold uppercase tracking-wider">Filters</h2>
            {filters}
          </div>
        </aside>

        <div>
          {results.length === 0 ? (
            <EmptyState
              title="No cars match your filters"
              description="Try widening your price range or choosing a different location."
              actionLabel="Clear filters"
              actionHref="/browse"
            />
          ) : view === "grid" ? (
            <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {results.map((v) => <CarCard key={v.id} vehicle={v} />)}
            </div>
          ) : (
            <div className="space-y-4">
              {results.map((v) => <CarCard key={v.id} vehicle={v} />)}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

export default function BrowsePage() {
  return (
    <Suspense
      fallback={
        <main className="container py-8">
          <Skeleton className="mb-6 h-10 w-64" />
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="aspect-[4/3]" />
            ))}
          </div>
        </main>
      }
    >
      <BrowseContent />
    </Suspense>
  );
}
