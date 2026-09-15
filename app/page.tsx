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
  PlaneLanding,
  QrCode,
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
import { Rating } from "@/components/rating";
import { TESTIMONIALS } from "@/lib/data";
import { useVehicles } from "@/lib/lookup";
import { useApp } from "@/lib/store";
import { BRAND, RWANDA_LOCATIONS } from "@/lib/constants";

const TRUST = [
  { icon: Banknote, title: "RWF 0 booking fee", desc: "Reserve free. Pay at the office or at pickup — cash, MoMo, or card." },
  { icon: BadgeCheck, title: "Verified owners", desc: "Every owner passes KYC: ID, license, registration & insurance." },
  { icon: QrCode, title: "QR-code pickup", desc: "Show your code, grab the keys. Pickup confirmed in seconds." },
  { icon: ShieldCheck, title: "Insured fleet", desc: "All listed vehicles carry valid insurance and inspection." },
];

const STEPS = [
  { icon: MapPin, title: "Search & reserve", desc: "Pick your car, dates and pickup point across Rwanda." },
  { icon: CalendarCheck, title: "Owner confirms", desc: "Verified owners respond fast — average under 4 hours." },
  { icon: Wallet, title: "Pay at pickup", desc: "Cash, MTN MoMo, or card on-site. Zero online fees, ever." },
];

export default function HomePage() {
  const { hydrated, hydrate } = useApp((s) => ({ hydrated: s.hydrated, hydrate: s.hydrate }));
  const vehicles = useVehicles()
    .filter((v) => v.verified && !v.deletedAt && v.status !== "pending_approval")
    .sort((a, b) => {
      if (a.featured && !b.featured) return -1;
      if (!a.featured && b.featured) return 1;
      if (a.status === "available" && b.status !== "available") return -1;
      if (a.status !== "available" && b.status === "available") return 1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

  useEffect(() => {
    if (!hydrated) void hydrate();
  }, [hydrated, hydrate]);

  return (
    <main>
      {/* ── Hero ─────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-navy-950 text-white">
        <Image
          src="https://images.unsplash.com/photo-1503376780353-7e6692767b70?f_auto&q_auto&w_2000"
          alt=""
          fill
          sizes="100vw"
          priority
          className="object-cover opacity-25"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-navy-950/60 via-navy-950/80 to-navy-950" />
        <div className="container relative py-20 md:py-28">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="font-display text-4xl font-extrabold tracking-tight md:text-6xl">
              Drive Rwanda with
              <span className="text-gradient-gold"> confidence</span>
            </h1>
            <p className="mx-auto mt-5 max-w-xl text-base text-silver/90 md:text-lg">
              Private cars from verified owners across Kigali, Musanze, Rubavu and
              beyond. Reserve online and pay at pickup.
            </p>
          </div>
          <div className="mx-auto mt-10 max-w-5xl">
            <SearchBar />
            <div className="mx-auto mt-4 max-w-2xl">
              <AiSearch />
            </div>
          </div>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-silver/70">
            {RWANDA_LOCATIONS.slice(0, 6).map((l) => (
              <span key={l} className="flex items-center gap-1">
                <MapPin className="h-3 w-3 text-gold" /> {l}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── Trust badges ─────────────────────────────────── */}
      <section className="container -mt-8 relative z-10">
        <div className="grid gap-4 rounded-2xl border border-border bg-card p-6 shadow-xl sm:grid-cols-2 lg:grid-cols-4">
          {TRUST.map((t) => (
            <div key={t.title} className="flex gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-navy-800 dark:bg-gold">
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

      {/* ── Fleet ────────────────────────────────────────── */}
      <section className="container py-16 md:py-24">
        <div className="mb-8">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-gold-600 dark:text-gold">Our fleet</p>
          <h2 className="mt-1 font-display text-3xl font-extrabold tracking-tight md:text-4xl">
            Browse all vehicles
          </h2>
        </div>
        {vehicles.length === 0 ? (
          <p className="text-sm text-muted-foreground">No vehicles available right now.</p>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {vehicles.map((v) => (
              <CarCard key={v.id} vehicle={v} />
            ))}
          </div>
        )}
      </section>

      {/* ── Airport pickup tile ──────────────────────────── */}
      <section className="container pb-16 md:pb-24">
        <Link href="/airport" className="group block overflow-hidden rounded-3xl border border-gold/40 bg-gradient-to-r from-navy-900 to-navy-950 p-8 text-white transition-shadow hover:shadow-2xl md:p-10">
          <div className="flex flex-wrap items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gold text-navy-900">
                <PlaneLanding className="h-7 w-7" />
              </span>
              <div>
                <p className="font-display text-xl font-extrabold md:text-2xl">Kigali Airport Pickup</p>
                <p className="mt-1 max-w-md text-sm text-silver/80">
                  Land at KGL and drive away — we track your flight and meet you at arrivals.
                </p>
              </div>
            </div>
            <span className="flex items-center gap-2 font-display font-bold text-gold transition-transform group-hover:translate-x-1">
              Book airport pickup <ArrowRight className="h-5 w-5" />
            </span>
          </div>
        </Link>
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
              <div key={s.title} className="relative rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur">
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
              Your car could be earning right now
            </h2>
            <p className="mt-4 text-silver/85">
              List your vehicle on {BRAND.name} and reach thousands of renters.
              You control pricing, availability, and approvals — we handle the rest.
            </p>
            <ul className="mt-6 space-y-2.5 text-sm text-silver/90">
              <li className="flex items-center gap-2"><BadgeCheck className="h-4 w-4 text-gold" /> Verified renter base</li>
              <li className="flex items-center gap-2"><Banknote className="h-4 w-4 text-gold" /> Transparent payouts, tracked at office</li>
              <li className="flex items-center gap-2"><Smartphone className="h-4 w-4 text-gold" /> Manage everything from your phone</li>
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
              alt="Car owner handing over keys"
              fill
              sizes="(max-width: 768px) 0, 40vw"
              className="object-cover"
            />
          </div>
        </div>
      </section>

      {/* ── Testimonials ─────────────────────────────────── */}
      <section className="container pb-16 md:pb-24">
        <div className="mx-auto mb-10 max-w-2xl text-center">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-gold-600 dark:text-gold">Testimonials</p>
          <h2 className="mt-2 font-display text-3xl font-extrabold md:text-4xl">
            Customer reviews
          </h2>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {TESTIMONIALS.map((t) => (
            <figure key={t.id} className="rounded-2xl border border-border bg-card p-6 shadow-sm">
              <Rating value={t.rating} size="md" />
              <blockquote className="mt-4 text-sm leading-relaxed text-muted-foreground">
                "{t.quote}"
              </blockquote>
              <figcaption className="mt-5 flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-navy-800 text-xs font-bold text-gold dark:bg-gold dark:text-navy-900">
                  {t.name.split(" ").map((n) => n[0]).join("")}
                </span>
                <div>
                  <p className="text-sm font-bold">{t.name}</p>
                  <p className="flex items-center gap-1 text-xs text-muted-foreground">
                    <MapPin className="h-3 w-3" /> {t.location}
                  </p>
                </div>
              </figcaption>
            </figure>
          ))}
        </div>
      </section>

      {/* ── Final CTA ────────────────────────────────────── */}
      <section className="border-t border-border bg-secondary/50 py-16">
        <div className="container text-center">
          <Car className="mx-auto mb-4 h-10 w-10 text-gold" />
          <h2 className="font-display text-3xl font-extrabold md:text-4xl">
            Ready to hit the road?
          </h2>
          <p className="mx-auto mt-3 max-w-md text-muted-foreground">
            Browse verified cars and reserve your next trip.
          </p>
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <Link href="/browse">
              <Button variant="gold" size="lg">Browse cars</Button>
            </Link>
            <Link href="/contact">
              <Button variant="outline" size="lg">Talk to us</Button>
            </Link>
          </div>
          <p className="mt-6 flex items-center justify-center gap-1 text-xs text-muted-foreground">
            <Star className="h-3.5 w-3.5 fill-gold text-gold" /> 4.8 average · 800+ trips completed · Kigali, Rwanda
          </p>
        </div>
      </section>
    </main>
  );
}
