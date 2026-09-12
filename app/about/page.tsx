import { BadgeCheck, Car, MapPin, ShieldCheck, Users } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "About Us" };

const STATS = [
  { icon: Car, value: "120+", label: "Vehicles listed" },
  { icon: Users, value: "2,400+", label: "Happy customers" },
  { icon: MapPin, value: "12", label: "Locations in Rwanda" },
  { icon: ShieldCheck, value: "100%", label: "Verified owners" },
];

export default function AboutPage() {
  return (
    <main className="container py-16">
      <div className="mx-auto max-w-3xl">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-gold-600 dark:text-gold">About us</p>
        <h1 className="mt-2 font-display text-4xl font-extrabold tracking-tight">
          LORA RENTALS LTD
        </h1>
        <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
          Born in Kigali, built for Rwanda. LORA RENTALS LTD connects people who
          need a car with verified owners who have one — without the friction of
          traditional rental agencies and without a single franc of online booking
          fees.
        </p>
        <p className="mt-4 leading-relaxed text-muted-foreground">
          Whether you're landing at Kigali International Airport, heading to
          Volcanoes National Park for gorilla trekking, or running a project in
          Huye, our platform gets you behind the wheel in minutes. Reserve online,
          pay at the office or at pickup — cash, MTN MoMo, or card.
        </p>
      </div>

      <div className="mx-auto mt-14 grid max-w-4xl gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {STATS.map((s) => (
          <div key={s.label} className="rounded-2xl border border-border bg-card p-6 text-center">
            <s.icon className="mx-auto h-7 w-7 text-gold" />
            <p className="mt-3 font-display text-3xl font-extrabold">{s.value}</p>
            <p className="mt-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="mx-auto mt-14 max-w-3xl rounded-3xl border border-border bg-navy-950 p-10 text-center text-white">
        <BadgeCheck className="mx-auto h-10 w-10 text-gold" />
        <h2 className="mt-4 font-display text-2xl font-extrabold">Our promise</h2>
        <p className="mx-auto mt-3 max-w-xl text-silver/85">
          Every vehicle inspected. Every owner verified. Every price transparent.
          And never — ever — a booking fee.
        </p>
      </div>
    </main>
  );
}
