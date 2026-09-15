"use client";

import { useEffect, useState } from "react";
import { MapPin, Clock, Languages, Star, MessageCircle } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/empty-state";
import { cn, whatsappLink } from "@/lib/utils";
import { BRAND } from "@/lib/constants";

export default function ToursPage() {
  const [tours, setTours] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void fetch("/api/tours")
      .then((r) => r.json())
      .then((data) => { setTours(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  return (
    <main className="mx-auto max-w-6xl space-y-8 p-6 lg:p-12">
      <div className="text-center">
        <h1 className="font-display text-3xl font-extrabold tracking-tight" style={{ color: "#0A1F44" }}>Chauffeur & Guided Tours</h1>
        <p className="mt-2 text-muted-foreground">Professional, vetted drivers for city tours, airport pickups, and Rwanda adventures.</p>
      </div>

      {loading ? (
        <div className="py-20 text-center text-sm text-muted-foreground">Loading tours…</div>
      ) : tours.length === 0 ? (
        <EmptyState icon={MapPin} title="No tours yet" description="Tours and chauffeur packages will appear here once owners add them." />
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {tours.map((t) => (
            <Card key={t.id} className="overflow-hidden">
              <CardContent className="p-0">
                <div className="bg-navy-900 p-5 text-white" style={{ background: "#0A1F44" }}>
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-display text-lg font-bold">{t.title}</p>
                      <p className="text-xs text-gray-300">{t.durationHours} hours · RWF {Number(t.price).toLocaleString()}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-gold" style={{ color: "#D4AF37" }}>RWF {Number(t.price).toLocaleString()}</p>
                    </div>
                  </div>
                </div>
                <div className="p-5">
                  {t.driver && (
                    <div className="mb-4 flex items-start gap-3 border-b border-border pb-4">
                      <div className="relative h-14 w-14 overflow-hidden rounded-full bg-muted">
                        {t.driver.photoUrl ? <Image src={t.driver.photoUrl} alt="" fill className="object-cover" /> : <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">No photo</div>}
                      </div>
                      <div>
                        <p className="font-semibold">{t.driver.fullName}</p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1"><Star className="h-3 w-3" /> {t.driver.ratingAvg} · {t.driver.reviewCount} trips · {t.driver.yearsOfExperience} yrs</p>
                        <p className="text-xs text-muted-foreground">{t.driver.languages?.join(", ")}</p>
                      </div>
                    </div>
                  )}
                  <p className="text-sm text-muted-foreground">{t.description}</p>
                  <div className="mt-4 flex flex-wrap gap-2 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {t.durationHours}h</span>
                    <span className="flex items-center gap-1"><Languages className="h-3 w-3" /> {t.languages?.join(", ")}</span>
                  </div>
                  {t.itinerary?.length > 0 && (
                    <ul className="mt-4 space-y-1 text-sm text-muted-foreground">
                      {t.itinerary.map((item: string, i: number) => <li key={i} className="flex gap-2"><span className="text-gold" style={{ color: "#D4AF37" }}>•</span>{item}</li>)}
                    </ul>
                  )}
                  <div className="mt-5 flex gap-2">
                    <Link
                      href={whatsappLink(BRAND.whatsapp, `Hi LORA, I'm interested in the tour: ${t.title}`)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={cn(buttonVariants({ variant: "gold" }), "flex-1 justify-center")}
                    >
                      <MessageCircle className="mr-2 h-4 w-4" /> Book via WhatsApp
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </main>
  );
}
