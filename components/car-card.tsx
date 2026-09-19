"use client";

import Image from "next/image";
import Link from "next/link";
import { BadgeCheck, Fuel, Heart, MapPin, Settings2, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Rating } from "@/components/rating";
import { PayAtPickupBadge } from "@/components/pay-at-pickup-badge";
import { ShareButton } from "@/components/share/ShareButton";
import { useApp } from "@/lib/store";
import { cn, formatMoney } from "@/lib/utils";
import type { Vehicle } from "@/types";

export function CarCard({ vehicle }: { vehicle: Vehicle }) {
  const { favorites, toggleFavorite, currency } = useApp();
  const fav = favorites.includes(vehicle.id);

  return (
    <Link
      href={`/cars/${vehicle.id}`}
      className="group block overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
    >
      <div className="relative aspect-[16/10] overflow-hidden bg-muted">
        <Image
          src={vehicle.images[0]}
          alt={`${vehicle.make} ${vehicle.model}`}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute left-3 top-3 flex gap-2">
          {vehicle.verified && (
            <Badge variant="gold" className="bg-card/90 backdrop-blur">
              <BadgeCheck className="h-3 w-3" /> Verified
            </Badge>
          )}
        </div>
        <div className="absolute right-3 top-3 z-10">
          <ShareButton
            listing={{
              id: vehicle.id,
              type: "car",
              url: `/cars/${vehicle.id}`,
              title: `${vehicle.make} ${vehicle.model} ${vehicle.year}`,
              description: `${vehicle.location} · ${vehicle.features.slice(0, 3).join(" · ")} · ${vehicle.seats} seats · ${vehicle.transmission}`,
              image: vehicle.images[0] ?? "",
              price: `${formatMoney(vehicle.pricePerDay, currency)}/day`,
            }}
          />
        </div>
        <button
          onClick={(e) => {
            e.preventDefault();
            toggleFavorite(vehicle.id);
          }}
          aria-label={fav ? "Remove from favorites" : "Save to favorites"}
          className="absolute right-14 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-card/90 backdrop-blur transition-transform hover:scale-110"
        >
          <Heart
            className={cn("h-4 w-4", fav ? "fill-red-500 text-red-500" : "text-muted-foreground")}
          />
        </button>
        <PayAtPickupBadge
          methods={vehicle.paymentMethods}
          className="absolute bottom-3 left-3"
        />
      </div>

      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="font-display font-bold leading-tight">
              {vehicle.make} {vehicle.model}
            </h3>
            <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
              <MapPin className="h-3 w-3" /> {vehicle.location}
            </p>
          </div>
          <Rating value={vehicle.rating} count={vehicle.reviewCount} />
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
          <span className="flex min-w-0 items-center gap-1"><Users className="h-3.5 w-3.5" />{vehicle.seats}</span>
          <span className="flex min-w-0 items-center gap-1"><Settings2 className="h-3.5 w-3.5" />{vehicle.transmission}</span>
          <span className="flex min-w-0 items-center gap-1"><Fuel className="h-3.5 w-3.5" />{vehicle.fuel}</span>
          <span className="ml-auto min-w-0 rounded-md bg-secondary px-1.5 py-0.5 font-semibold uppercase">{vehicle.type}</span>
        </div>

        <div className="mt-3 flex items-baseline justify-between border-t border-border pt-3">
          <p className="font-display text-lg font-extrabold text-navy-800 dark:text-gold">
            {formatMoney(vehicle.pricePerDay, currency)}
            <span className="text-xs font-medium text-muted-foreground"> /day</span>
          </p>
          <span className="text-xs font-semibold text-navy-600 opacity-0 transition-opacity group-hover:opacity-100 dark:text-gold">
            View →
          </span>
        </div>
      </div>
    </Link>
  );
}
