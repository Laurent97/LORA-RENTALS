"use client";

import { useEffect, useState } from "react";
import { Zap, MapPin, Battery, Leaf, Fuel } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/empty-state";
import { cn } from "@/lib/utils";

export default function EvFleetPage() {
  const [data, setData] = useState<{ vehicles: any[]; stations: any[] }>({ vehicles: [], stations: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void fetch("/api/ev-fleet")
      .then((r) => r.json())
      .then((d) => { setData({ vehicles: d?.vehicles ?? [], stations: d?.stations ?? [] }); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  return (
    <main className="mx-auto max-w-6xl space-y-10 p-6 lg:p-12">
      <div className="text-center">
        <h1 className="font-display text-3xl font-extrabold tracking-tight" style={{ color: "#0A1F44" }}>LORA EV Fleet</h1>
        <p className="mt-2 text-muted-foreground">Electric vehicles, charging stations, and green rebates for Rwanda.</p>
      </div>

      {loading ? (
        <div className="py-20 text-center text-sm text-muted-foreground">Loading EV fleet…</div>
      ) : (
        <>
          <section>
            <div className="mb-4 flex items-center gap-2">
              <Zap className="h-5 w-5" style={{ color: "#0A1F44" }} />
              <h2 className="font-display text-xl font-bold">Electric Vehicles</h2>
            </div>
            {data.vehicles.length === 0 ? (
              <EmptyState icon={Fuel} title="No EVs listed" description="Electric vehicles will appear here once owners publish them." />
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {data.vehicles.map((v) => (
                  <Card key={v.id} className="overflow-hidden">
                    <CardContent className="p-0">
                      <div className="relative aspect-[16/10] bg-muted">
                        <Image src={v.vehicles?.images?.[0] ?? "https://images.unsplash.com/photo-1593941707874-ef25b8e4a188?w=800&q=80"} alt="" fill className="object-cover" />
                      </div>
                      <div className="p-5">
                        <div className="flex items-center justify-between">
                          <p className="font-display text-lg font-bold">{v.vehicles?.make} {v.vehicles?.model}</p>
                          <Badge className="bg-green-100 text-green-700">EV</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">{v.vehicles?.year} · {v.vehicles?.location}</p>
                        <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
                          <div className="rounded-lg bg-muted p-2 text-center"><Battery className="mx-auto h-4 w-4" style={{ color: "#0A1F44" }} />{v.battery_capacity_kwh} kWh</div>
                          <div className="rounded-lg bg-muted p-2 text-center"><MapPin className="mx-auto h-4 w-4" style={{ color: "#0A1F44" }} />{v.range_km} km</div>
                          <div className="rounded-lg bg-muted p-2 text-center"><Leaf className="mx-auto h-4 w-4" style={{ color: "#0A1F44" }} />{v.co2_saved_kg} kg CO₂</div>
                          <div className="rounded-lg bg-muted p-2 text-center"><Zap className="mx-auto h-4 w-4" style={{ color: "#0A1F44" }} />RWF {v.energy_cost_per_km}/km</div>
                        </div>
                        <p className="mt-3 text-xs text-muted-foreground">Connectors: {v.charge_type?.join(", ")}</p>
                        {v.green_rebate_pct > 0 && <p className="mt-1 text-xs font-semibold text-green-700">{v.green_rebate_pct}% green rebate</p>}
                        <Link href={`/cars/${v.vehicle_id}`} className={cn(buttonVariants({ variant: "gold" }), "mt-4 block w-full text-center")}>
                          View & book
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
              <Zap className="h-5 w-5" style={{ color: "#0A1F44" }} />
              <h2 className="font-display text-xl font-bold">Charging Stations</h2>
            </div>
            {data.stations.length === 0 ? (
              <EmptyState icon={Zap} title="No charging stations" description="EV charging station data will appear here once added." />
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {data.stations.map((s) => (
                  <Card key={s.id}>
                    <CardContent className="p-5">
                      <p className="font-display font-bold">{s.name}</p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1"><MapPin className="h-3 w-3" />{s.location}</p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {s.connector_types?.map((c: string) => <Badge key={c} variant="outline">{c}</Badge>)}
                      </div>
                      <p className="mt-3 text-sm font-semibold" style={{ color: "#0A1F44" }}>{s.power_kw} kW</p>
                      <p className="text-xs text-muted-foreground">Lat {s.lat}, Lng {s.lng}</p>
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
