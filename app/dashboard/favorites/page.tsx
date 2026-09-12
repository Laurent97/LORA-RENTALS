"use client";

import { Heart } from "lucide-react";
import { CarCard } from "@/components/car-card";
import { EmptyState } from "@/components/empty-state";
import { useVehicles } from "@/lib/lookup";
import { useApp } from "@/lib/store";

export default function FavoritesPage() {
  const { favorites } = useApp();
  const cars = useVehicles().filter((v) => favorites.includes(v.id));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-extrabold tracking-tight">Favorites</h1>
        <p className="text-sm text-muted-foreground">Cars you've saved for later</p>
      </div>
      {cars.length === 0 ? (
        <EmptyState
          icon={Heart}
          title="No favorites yet"
          description="Tap the heart on any car to save it here for quick access."
          actionLabel="Browse cars"
          actionHref="/browse"
        />
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {cars.map((v) => <CarCard key={v.id} vehicle={v} />)}
        </div>
      )}
    </div>
  );
}
