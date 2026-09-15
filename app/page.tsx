"use client";

import { useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  BadgeCheck,
  Banknote,
  CalendarCheck,
  Car,
  MapPin,
  QrCode,
  Search,
  ShieldCheck,
  Smartphone,
  Star,
  Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SearchBar } from "@/components/search-bar";
import { AiSearch } from "@/components/ai-search";
import { CarCard } from "@/components/car-card";
import { useVehicles } from "@/lib/lookup";
import { useApp } from "@/lib/store";
import { BRAND, RWANDA_LOCATIONS } from "@/lib/constants";

const TRUST = [
  { icon: BadgeCheck, title: "Verified owners", desc: "ID, license, registration and insurance checked." },
  { icon: ShieldCheck, title: "Insured fleet", desc: "Every listed vehicle carries valid insurance." },
  { icon: Banknote, title: "Pay at pickup", desc: "Cash, MoMo, or card when you collect the car." },
  { icon: QrCode, title: "QR pickup", desc: "Show your code, confirm, and drive in seconds." },
];

const STEPS = [
  { icon: Search, title: "Find a car", desc: "Filter by type, location, and price across the fleet." },
  { icon: CalendarCheck, title: "Book instantly", desc: "Reserve online. The owner confirms within minutes." },
  { icon: Wallet, title: "Pay on collection", desc: "Pick up the car and pay at the office or owner." },
];

const CATEGORIES = [
  { label: "Sedan", icon: Car, type: "sedan" },
  { label: "SUV", icon: Car, type: "suv" },
  { label: "4x4", icon: Car, type: "4x4" },
  { label: "Luxury", icon: Star, type: "luxury" },
  { label: "Minivan", icon: Car, type: "minivan" },
  { label: "Pickup", icon: Car, type: "pickup" },
];

export default function HomePage() {
  const { hydrated, hydrate } = useApp((s) => ({ hydrated: s.hydrated, hydrate: s.hydrate }));
  const vehicles = useVehicles()
    .filter((v) => v.status === "available")
    .sort((a, b) => {
      if (a.featured && !b.featured) return -1;
      if (!a.featured && b.featured) return 1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

  useEffect(() => {
    if (!hydrated) void hydrate();
  }, [hydrated, hydrate]);

  return (
    <main className="bg-background">
      {/* ── Hero / Search ────────────────────────────────── */}
      <section className="border-b border-border bg-navy-950 py-16 text-white md:py-24">
        <div className="container">
          <div className="mx-auto max-w-3xl text-center">
            <Badge variant="gold" className="mb-4 border border-gold/30 bg-gold/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider">
              {BRAND.name}
            </Badge>
            <h1 className="font-display text-4xl font-extrabold tracking-tight md:text-6xl">
              Find a car in Rwanda
            </h1>
            <p className="mx-auto mt-4 max-w-xl text-base text-silver/85 md:text-lg">
              Verified owners. Instant booking. Pay when you pick up the keys.
            </p>
          </div>

          <div className="mx-auto mt-10 max-w-4xl">
            <div className="rounded-2xl border border-gold/30 bg-card p-5 text-foreground shadow-2xl">
              <SearchBar />
            </div>
            <div className="mx-auto mt-4 max-w-2xl">
              <AiSearch />
            </div>
          </div>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3 text-xs text-silver/70">
            {RWANDA_LOCATIONS.slice(0, 6).map((l) => (
              <Link
                key={l}
                href={`/browse?location=${encodeURIComponent(l)}`}
                className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 transition-colors hover:bg-white/10"
              >
                <MapPin className="h-3 w-3 text-gold" /> {l}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── Trust badges ─────────────────────────────────── */}
      <section className="container -mt-8 relative z-10">
        <div className="grid gap-4 rounded-2xl border border-border bg-card p-6 shadow-xl sm:grid-cols-2 lg:grid-cols-4">
          {TRUST.map((t) => (
            <div key={t.title} className="flex gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-navy-800 dark:bg-gold">
                <t.icon className="h-5 w-5 text-gold dark:text-navy-900" />
              </div>
              <div>
                <p className="text-sm font-bold">{t.title}</p>
                <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{t.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Categories ───────────────────────────────────── */}
      <section className="container py-12 md:py-16">
        <h2 className="mb-6 text-center font-display text-2xl font-bold">Browse by category</h2>
        <div className="flex flex-wrap justify-center gap-3">
          {CATEGORIES.map((c) => (
            <Link
              key={c.type}
              href={`/browse?type=${c.type}`}
              className="flex items-center gap-2 rounded-full border border-border bg-card px-5 py-2.5 text-sm font-semibold shadow-sm transition-all hover:-translate-y-0.5 hover:border-gold/50 hover:text-gold"
            >
              <c.icon className="h-4 w-4" /> {c.label}
            </Link>
          ))}
        </div>
      </section>

      {/* ── Fleet ────────────────────────────────────────── */}
      <section className="container pb-16 md:pb-24">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-gold-600 dark:text-gold">Our fleet</p>
            <h2 className="mt-1 font-display text-3xl font-extrabold tracking-tight md:text-4xl">
              Browse all vehicles
            </h2>
          </div>
          <Link href="/browse" className="text-sm font-semibold text-navy-700 hover:text-gold dark:text-gold/90 dark:hover:text-gold">
            View all <ArrowRight className="inline h-4 w-4" />
          </Link>
        </div>

        {vehicles.length === 0 ? (
          <div className="rounded-2xl border border-border bg-card p-10 text-center">
            <Car className="mx-auto h-10 w-10 text-muted-foreground" />
            <p className="mt-4 text-lg font-semibold">No cars listed yet</p>
            <p className="mt-1 text-sm text-muted-foreground">Fleet will appear here once owners add their vehicles.</p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {vehicles.map((v) => (
              <CarCard key={v.id} vehicle={v} />
            ))}
          </div>
        )}
      </section>

      {/* ── How it works ─────────────────────────────────── */}
      <section className="bg-navy-950 py-16 text-white md:py-24">
        <div className="container">
          <div className="mx-auto mb-12 max-w-2xl text-center">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-gold">How it works</p>
            <h2 className="mt-2 font-display text-3xl font-extrabold md:text-4xl">
              Three steps to your rental
            </h2>
          </div>
          <div className="grid gap-8 md:grid-cols-3">
            {STEPS.map((s, i) => (
              <div key={s.title} className="relative rounded-2xl border border-white/10 bg-white/5 p-6">
                <span className="absolute -top-3 left-6 rounded-full bg-gold px-2.5 py-0.5 text-xs font-extrabold text-navy-900">
                  {i + 1}
                </span>
                <s.icon className="mb-4 h-8 w-8 text-gold" />
                <h3 className="font-display text-lg font-bold">{s.title}</h3>
                <p className="mt-2 text-sm text-silver/80">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Owner CTA ────────────────────────────────────── */}
      <section className="container py-16 md:py-24">
        <div className="grid items-center gap-10 rounded-3xl border border-border bg-gradient-to-br from-navy-800 to-navy-950 p-8 text-white md:grid-cols-2 md:p-14">
          <div>
            <Badge variant="gold" className="mb-4">For car owners</Badge>
            <h2 className="font-display text-3xl font-extrabold md:text-4xl">
              Earn from your car
            </h2>
            <p className="mt-4 text-silver/85">
              List your vehicle on {BRAND.name} and reach verified renters. You set the price and approve every trip.
            </p>
            <ul className="mt-6 space-y-2.5 text-sm text-silver/90">
              <li className="flex items-center gap-2"><BadgeCheck className="h-4 w-4 text-gold" /> Verified renter base</li>
              <li className="flex items-center gap-2"><Banknote className="h-4 w-4 text-gold" /> Transparent payouts</li>
              <li className="flex items-center gap-2"><Smartphone className="h-4 w-4 text-gold" /> Manage from your phone</li>
            </ul>
            <Link href="/register?role=owner" className="mt-8 inline-block">
              <Button variant="gold" size="lg">
                List your car <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
          <div className="relative hidden aspect-[4/3] overflow-hidden rounded-2xl md:block">
            <Image
              src="https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?f_auto&q_auto&w_1200"
              alt="Car owner"
              fill
              sizes="(max-width: 768px) 0, 40vw"
              className="object-cover"
            />
          </div>
        </div>
      </section>

      {/* ── Final CTA ────────────────────────────────────── */}
      <section className="border-t border-border bg-secondary/50 py-16">
        <div className="container text-center">
          <Car className="mx-auto mb-4 h-10 w-10 text-gold" />
          <h2 className="font-display text-3xl font-extrabold md:text-4xl">
            Ready to drive?
          </h2>
          <p className="mx-auto mt-3 max-w-md text-muted-foreground">
            Browse the fleet and book your next trip today.
          </p>
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <Link href="/browse">
              <Button variant="gold" size="lg">Browse cars</Button>
            </Link>
            <Link href="/contact">
              <Button variant="outline" size="lg">Talk to us</Button>
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
