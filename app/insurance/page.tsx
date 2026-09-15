"use client";

import { useEffect, useState } from "react";
import { Shield, Truck, Check, Car, ShieldCheck } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/empty-state";
import { cn } from "@/lib/utils";

export default function InsurancePage() {
  const [data, setData] = useState<{ insurance: any[]; roadside: any[] }>({ insurance: [], roadside: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void fetch("/api/insurance/catalog")
      .then((r) => r.json())
      .then((d) => { setData({ insurance: d?.insurance ?? [], roadside: d?.roadside ?? [] }); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  return (
    <main className="mx-auto max-w-6xl space-y-10 p-6 lg:p-12">
      <div className="text-center">
        <h1 className="font-display text-3xl font-extrabold tracking-tight" style={{ color: "#0A1F44" }}>Insurance & Roadside Assistance</h1>
        <p className="mt-2 text-muted-foreground">Add protection bundles to any rental and drive Rwanda with confidence.</p>
      </div>

      {loading ? (
        <div className="py-20 text-center text-sm text-muted-foreground">Loading plans…</div>
      ) : (
        <>
          <section>
            <div className="mb-4 flex items-center gap-2">
              <ShieldCheck className="h-5 w-5" style={{ color: "#0A1F44" }} />
              <h2 className="font-display text-xl font-bold">Insurance Add-ons</h2>
            </div>
            {data.insurance.length === 0 ? (
              <EmptyState icon={Shield} title="No insurance bundles" description="Owners have not published insurance add-ons yet." />
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {data.insurance.map((i) => (
                  <Card key={i.id} className="overflow-hidden">
                    <CardContent className="p-0">
                      <div className="bg-navy-900 p-5 text-white" style={{ background: "#0A1F44" }}>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-display text-lg font-bold capitalize">{i.tier}</p>
                            <p className="text-xs text-gray-300">{i.vehicle?.year} {i.vehicle?.make} {i.vehicle?.model}</p>
                          </div>
                          <Badge className="bg-gold/20 text-gold" style={{ color: "#D4AF37", background: "rgba(212,175,55,0.2)" }}>{i.tier}</Badge>
                        </div>
                      </div>
                      <div className="p-5">
                        <p className="font-display text-2xl font-extrabold" style={{ color: "#0A1F44" }}>RWF {Number(i.daily_price).toLocaleString()}<span className="text-sm font-normal text-muted-foreground">/day</span></p>
                        <p className="mt-1 text-xs text-muted-foreground">Liability cap: RWF {Number(i.liability_cap).toLocaleString()} · Deductible: RWF {Number(i.deductible).toLocaleString()}</p>
                        <ul className="mt-4 space-y-1.5 text-sm text-muted-foreground">
                          {i.coverage?.map((c: string, idx: number) => (
                            <li key={idx} className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-green-600" /> {c}</li>
                          ))}
                        </ul>
                        <Link href={`/cars/${i.vehicle_id}`} className={cn(buttonVariants({ variant: "gold" }), "mt-5 block w-full text-center")}>
                          View car & book
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </section>

          <section>
            <div className="mb-4 flex items-center gap-2">
              <Truck className="h-5 w-5" style={{ color: "#0A1F44" }} />
              <h2 className="font-display text-xl font-bold">Roadside Assistance Plans</h2>
            </div>
            {data.roadside.length === 0 ? (
              <EmptyState icon={Car} title="No roadside plans" description="Roadside assistance plans will appear here once owners add them." />
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {data.roadside.map((r) => (
                  <Card key={r.id} className="overflow-hidden">
                    <CardContent className="p-0">
                      <div className="p-5">
                        <div className="mb-3 flex items-start gap-3">
                          <div className="relative h-14 w-20 overflow-hidden rounded-lg bg-muted">
                            {r.vehicle?.images?.[0] ? <Image src={r.vehicle.images[0]} alt="" fill className="object-cover" /> : <Car className="h-6 w-6 m-4 text-muted-foreground" />}
                          </div>
                          <div>
                            <p className="font-semibold">{r.vehicle?.year} {r.vehicle?.make} {r.vehicle?.model}</p>
                            <p className="text-xs text-muted-foreground">{r.provider_name}</p>
                          </div>
                        </div>
                        <p className="font-display text-xl font-extrabold" style={{ color: "#0A1F44" }}>RWF {Number(r.daily_price).toLocaleString()}<span className="text-sm font-normal text-muted-foreground">/day</span></p>
                        {r.response_minutes && <p className="mt-1 text-xs text-muted-foreground">Avg. response {r.response_minutes} min</p>}
                        <ul className="mt-4 space-y-1.5 text-sm text-muted-foreground">
                          {r.services?.map((s: string, idx: number) => (
                            <li key={idx} className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-green-600" /> {s}</li>
                          ))}
                        </ul>
                        <Link href={`/cars/${r.vehicle_id}`} className={cn(buttonVariants({ variant: "outline" }), "mt-5 block w-full text-center")}>
                          View car
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </main>
  );
}
