"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { FEATURES } from "@/lib/features";

export default function FeaturesDirectoryPage() {
  return (
    <main className="mx-auto max-w-6xl space-y-8 p-6 lg:p-12">
      <div className="text-center">
        <h1 className="font-display text-3xl font-extrabold tracking-tight">LORA Innovation Roadmap</h1>
        <p className="mt-2 text-muted-foreground">Explore every feature built for the most advanced car rental experience in East Africa.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Object.entries(FEATURES).map(([slug, f]) => (
          <Link key={slug} href={`/${slug}`} className="group">
            <Card className="h-full transition-all hover:border-gold">
              <CardContent className="p-5">
                <p className="font-display font-bold" style={{ color: "#0A1F44" }}>{f.title}</p>
                <p className="mt-1 text-xs font-semibold" style={{ color: "#D4AF37" }}>{f.tagline}</p>
                <p className="mt-3 line-clamp-3 text-sm text-muted-foreground">{f.description}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </main>
  );
}
