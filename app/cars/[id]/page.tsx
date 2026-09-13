"use client";

import Image from "next/image";
import Link from "next/link";
import { notFound, useParams } from "next/navigation";
import { useState } from "react";
import {
  BadgeCheck,
  Banknote,
  CalendarDays,
  Fuel,
  Heart,
  MapPin,
  MessageCircle,
  Settings2,
  ShieldCheck,
  Users,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Rating } from "@/components/rating";
import { RatingBreakdown } from "@/components/reviews/rating-breakdown";
import { ReviewList } from "@/components/reviews/review-list";
import { ReviewForm } from "@/components/reviews/review-form";
import { canCreateReview } from "@/lib/reviews/permissions";
import { ratingBreakdown } from "@/lib/reviews/analytics";
import { MapPlaceholder } from "@/components/map-placeholder";
import { CarCard } from "@/components/car-card";
import { Skeleton } from "@/components/ui/skeleton";
import { AvailabilityCalendar } from "@/components/availability-calendar";
import { VerifiedBadge } from "@/components/verified-badge";
import { useAllUsers, useHydrated, useReviews, useVehicles } from "@/lib/lookup";
import { useApp } from "@/lib/store";
import { BRAND } from "@/lib/constants";
import { cn, fmtDate, formatMoney, initials, whatsappLink } from "@/lib/utils";

export default function CarDetailPage() {
  const { id } = useParams<{ id: string }>();
  const vehicles = useVehicles();
  const users = useAllUsers();
  const allReviews = useReviews();
  const vehicle = vehicles.find((v) => v.id === id);
  const { favorites, toggleFavorite, currency, user, bookings, upsertReviewLocal } = useApp();
  const hydrated = useHydrated();
  const [imgIdx, setImgIdx] = useState(0);

  // While hydrating, the store still holds mock ids — don't 404 yet.
  if (!vehicle) {
    if (!hydrated) {
      return (
        <main className="container py-8">
          <Skeleton className="aspect-[16/10] w-full rounded-2xl" />
          <Skeleton className="mt-6 h-8 w-1/3" />
          <Skeleton className="mt-3 h-4 w-1/2" />
        </main>
      );
    }
    return notFound();
  }

  const owner = users.find((u) => u.id === vehicle.ownerId);
  const reviews = allReviews.filter((r) => r.vehicleId === vehicle.id && r.status === "published");
  const completedBooking = user
    ? bookings.find((b) => b.customerId === user.id && b.vehicleId === vehicle.id && b.status === "completed")
    : undefined;
  const existingReview = completedBooking
    ? allReviews.find((r) => r.bookingId === completedBooking.id)
    : undefined;
  const canReview = canCreateReview(user, completedBooking, existingReview);
  const similar = vehicles.filter(
    (v) => v.id !== vehicle.id && v.status === "available" && (v.type === vehicle.type || v.location === vehicle.location)
  ).slice(0, 3);
  const fav = favorites.includes(vehicle.id);

  return (
    <main className="container py-8">
      {/* Gallery */}
      <div className="grid gap-3 lg:grid-cols-[2fr_1fr]">
        <div className="relative aspect-[16/10] overflow-hidden rounded-2xl bg-muted">
          <Image
            src={vehicle.images[imgIdx]}
            alt={`${vehicle.make} ${vehicle.model}`}
            fill
            sizes="(max-width: 1024px) 100vw, 67vw"
            priority
            className="object-cover"
          />
          <button
            onClick={() => toggleFavorite(vehicle.id)}
            aria-label="Save to favorites"
            className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-card/90 backdrop-blur transition-transform hover:scale-110"
          >
            <Heart className={cn("h-5 w-5", fav ? "fill-red-500 text-red-500" : "text-muted-foreground")} />
          </button>
        </div>
        <div className="hidden grid-cols-2 gap-3 lg:grid lg:grid-cols-1">
          {vehicle.images.slice(0, 3).map((src, i) => (
            <button
              key={src}
              onClick={() => setImgIdx(i)}
              className={cn(
                "relative overflow-hidden rounded-2xl bg-muted",
                imgIdx === i && "ring-2 ring-gold"
              )}
            >
              <div className="relative aspect-[16/7]">
                <Image src={src} alt="" fill sizes="(max-width: 1024px) 0, 33vw" className="object-cover" />
              </div>
            </button>
          ))}
        </div>
      </div>
      {/* mobile thumbs */}
      <div className="mt-3 flex gap-2 overflow-x-auto lg:hidden">
        {vehicle.images.map((src, i) => (
          <button
            key={src}
            onClick={() => setImgIdx(i)}
            className={cn("relative h-16 w-24 shrink-0 overflow-hidden rounded-lg", imgIdx === i && "ring-2 ring-gold")}
          >
            <Image src={src} alt="" fill sizes="96px" className="object-cover" />
          </button>
        ))}
      </div>

      <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_minmax(300px,380px)]">
        {/* Left column */}
        <div className="min-w-0">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-display text-3xl font-extrabold tracking-tight">
                  {vehicle.make} {vehicle.model}
                </h1>
                {vehicle.verified && (
                  <Badge variant="gold"><BadgeCheck className="h-3 w-3" /> Verified</Badge>
                )}
              </div>
              <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4" /> {vehicle.location} · {vehicle.year} · {vehicle.plate}
              </p>
            </div>
            <Rating value={vehicle.rating} count={vehicle.reviewCount} size="md" />
          </div>

          {/* Specs */}
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { icon: Users, label: `${vehicle.seats} seats` },
              { icon: Settings2, label: vehicle.transmission },
              { icon: Fuel, label: vehicle.fuel },
              { icon: CalendarDays, label: `${vehicle.tripsCompleted} trips` },
            ].map((s) => (
              <div key={s.label} className="flex items-center gap-2.5 rounded-xl border border-border bg-card p-3">
                <s.icon className="h-4 w-4 text-navy-600 dark:text-gold" />
                <span className="text-sm font-medium capitalize">{s.label}</span>
              </div>
            ))}
          </div>

          {/* Description */}
          <div className="mt-8">
            <h2 className="font-display text-xl font-bold">About this car</h2>
            <p className="mt-3 leading-relaxed text-muted-foreground">{vehicle.description}</p>
          </div>

          {/* Features */}
          <div className="mt-8">
            <h2 className="font-display text-xl font-bold">Features</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {vehicle.features.map((f) => (
                <Badge key={f} variant="secondary" className="px-3 py-1.5">{f}</Badge>
              ))}
            </div>
          </div>

          {/* Availability */}
          <div className="mt-8">
            <h2 className="mb-3 font-display text-xl font-bold">Availability</h2>
            <AvailabilityCalendar vehicleId={vehicle.id} />
          </div>

          {/* Owner */}
          {owner && (
            <Card className="mt-8">
              <CardContent className="flex flex-wrap items-center gap-4 p-5">
                <span className="flex h-14 w-14 items-center justify-center rounded-full bg-navy-800 text-sm font-bold text-gold dark:bg-gold dark:text-navy-900">
                  {initials(owner.name)}
                </span>
                <div className="flex-1">
                  <p className="flex items-center gap-1.5 font-display font-bold">
                    {owner.businessName ?? owner.name}
                    {owner.kycStatus === "verified" && <VerifiedBadge />}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {owner.kycStatus === "verified" ? "Verified owner" : "Owner"}
                    {owner.avgResponseMinutes != null
                      ? ` · Responds in ~${owner.avgResponseMinutes}min`
                      : " · Responds within ~4h"}
                    {owner.avgResponseMinutes != null && owner.avgResponseMinutes < 30 && (
                      <span className="ml-1 font-semibold text-gold-600 dark:text-gold">⚡ Fast Responder</span>
                    )}
                  </p>
                </div>
                <a
                  href={whatsappLink(BRAND.whatsapp, `Hi! I'm interested in the ${vehicle.make} ${vehicle.model} (${vehicle.plate}) on LORA RENTALS.`)}
                  target="_blank"
                  rel="noreferrer"
                >
                  <Button variant="outline" size="sm">
                    <MessageCircle className="h-4 w-4 text-emerald-500" /> WhatsApp
                  </Button>
                </a>
              </CardContent>
            </Card>
          )}

          {/* Pickup location */}
          <div className="mt-8">
            <h2 className="mb-3 font-display text-xl font-bold">Pickup location</h2>
            <MapPlaceholder location={vehicle.location} coordinates={vehicle.coordinates} />
          </div>

          {/* Reviews */}
          <div className="mt-8">
            <h2 className="mb-4 font-display text-xl font-bold">
              Reviews {reviews.length > 0 && <span className="text-muted-foreground">({reviews.length})</span>}
            </h2>
            {canReview && completedBooking && (
              <Card className="mb-5 border-gold/40 bg-gold/5">
                <CardContent className="p-5">
                  <h3 className="font-display text-lg font-bold">Share your experience</h3>
                  <p className="mt-1 mb-5 text-sm text-muted-foreground">Tell other travelers about this car, the owner, and pickup.</p>
                  <ReviewForm
                    bookingId={completedBooking.id}
                    onSubmitted={(review) => upsertReviewLocal(review)}
                  />
                </CardContent>
              </Card>
            )}
            {!user && (
              <p className="mb-4 rounded-xl border border-border bg-secondary/50 p-4 text-sm text-muted-foreground">
                <Link href={`/login?next=/cars/${vehicle.id}`} className="font-semibold text-navy-700 underline dark:text-gold">Sign in</Link> to write a review after completing a rental.
              </p>
            )}
            {user && !canReview && !existingReview && (
              <p className="mb-4 rounded-xl border border-border bg-secondary/50 p-4 text-sm text-muted-foreground">
                Reviews are available after you complete a rental of this car. You can leave one from <Link href="/dashboard/bookings" className="font-semibold text-navy-700 underline dark:text-gold">My bookings</Link>.
              </p>
            )}
            {reviews.length === 0 ? (
              <p className="text-sm text-muted-foreground">No reviews yet — be the first to rent this car.</p>
            ) : (
              <div className="space-y-5">
                <RatingBreakdown breakdown={ratingBreakdown(reviews)} />
                <ReviewList
                  reviews={reviews}
                  onChanged={upsertReviewLocal}
                  emptyTitle="No reviews yet"
                  emptyDescription="Be the first to rent this car."
                />
              </div>
            )}
          </div>
        </div>

        {/* Booking card */}
        <aside>
          <Card className="sticky top-20 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-baseline justify-between">
                <p className="font-display text-3xl font-extrabold text-navy-800 dark:text-gold">
                  {formatMoney(vehicle.pricePerDay, currency)}
                </p>
                <span className="text-sm text-muted-foreground">per day</span>
              </div>

              <div className="mt-4 space-y-2 rounded-xl bg-secondary/60 p-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Booking fee</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">RWF 0</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Payment</span>
                  <span className="font-semibold">At office or pickup</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Methods</span>
                  <span className="font-semibold">Cash · MoMo · Card</span>
                </div>
              </div>

              <Link href={user ? `/book/${vehicle.id}` : `/login?next=/book/${vehicle.id}`} className="mt-5 block">
                <Button variant="gold" size="lg" className="w-full">
                  Reserve — Pay at Pickup
                </Button>
              </Link>

              <div className="mt-4 flex items-center justify-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><ShieldCheck className="h-3.5 w-3.5 text-emerald-500" /> Insured</span>
                <span className="flex items-center gap-1"><Banknote className="h-3.5 w-3.5 text-gold" /> No online fees</span>
              </div>
            </CardContent>
          </Card>
        </aside>
      </div>

      {/* Similar cars */}
      {similar.length > 0 && (
        <section className="mt-16">
          <h2 className="mb-6 font-display text-2xl font-extrabold">You may also like</h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {similar.map((v) => <CarCard key={v.id} vehicle={v} />)}
          </div>
        </section>
      )}
    </main>
  );
}
