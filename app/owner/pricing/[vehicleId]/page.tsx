"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { useVehicles } from "@/lib/lookup";
import { useApp } from "@/lib/store";
import { getSupabase } from "@/lib/supabase/client";
import type { PricingRules } from "@/types";

export default function PricingRulesPage() {
  const { vehicleId } = useParams<{ vehicleId: string }>();
  const { user } = useApp();
  const vehicles = useVehicles();
  const vehicle = vehicles.find((v) => v.id === vehicleId);

  const [rules, setRules] = useState<PricingRules | null>(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!vehicleId) return;
    fetch(`/api/pricing?vehicleId=${vehicleId}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((r) => {
        if (r) setRules(r as PricingRules);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [vehicleId]);

  if (!user) return null;
  if (!vehicle) return <main className="container py-10 text-center">Vehicle not found.</main>;
  if (vehicle.ownerId !== user.id && user.role !== "admin") {
    return <main className="container py-10 text-center">Not your vehicle.</main>;
  }

  const set = (k: keyof PricingRules, v: unknown) => setRules((r) => (r ? { ...r, [k]: v } : r));

  const save = async () => {
    if (!rules) return;
    setSaving(true);
    const sb = getSupabase();
    const token = sb ? (await sb.auth.getSession()).data.session?.access_token : undefined;
    const { vehicleId: _rv, ...ruleFields } = rules;
    try {
      const res = await fetch("/api/pricing", {
        method: "PUT",
        headers: {
          "content-type": "application/json",
          ...(token ? { authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          vehicleId,
          ...ruleFields,
          highDemandDates: ruleFields.highDemandDates
            .flatMap((d) => d.split(/[,\n]/))
            .map((x) => x.trim())
            .filter(Boolean),
        }),
      });
      if (!res.ok) throw new Error("save failed");
      toast.success("Pricing rules saved");
    } catch {
      toast.error("Could not save pricing rules");
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="container max-w-2xl py-10">
      <Link href="/owner/fleet" className="text-sm text-muted-foreground hover:underline">
        <ArrowLeft className="mr-1 inline h-4 w-4" /> Back to fleet
      </Link>
      <h1 className="mt-4 font-display text-2xl font-extrabold">
        Pricing rules · {vehicle.make} {vehicle.model}
      </h1>

      {loading ? (
        <p className="mt-6 text-sm text-muted-foreground">Loading…</p>
      ) : rules ? (
        <Card className="mt-6">
          <CardContent className="space-y-4 p-5">
            <label className="flex items-center gap-2 text-sm font-medium">
              <input
                type="checkbox"
                checked={rules.enabled}
                onChange={(e) => set("enabled", e.target.checked)}
                className="h-4 w-4 accent-gold"
              />
              Enable dynamic pricing
            </label>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label className="mb-1.5 block">Weekend surcharge %</Label>
                <Input
                  type="number"
                  min={0}
                  max={100}
                  value={rules.weekendSurchargePct}
                  onChange={(e) => set("weekendSurchargePct", Number(e.target.value))}
                />
              </div>
              <div>
                <Label className="mb-1.5 block">High demand bump %</Label>
                <Input
                  type="number"
                  min={0}
                  max={100}
                  value={rules.highDemandBumpPct}
                  onChange={(e) => set("highDemandBumpPct", Number(e.target.value))}
                />
              </div>
              <div>
                <Label className="mb-1.5 block">7+ day discount %</Label>
                <Input
                  type="number"
                  min={0}
                  max={100}
                  value={rules.longRental7DiscountPct}
                  onChange={(e) => set("longRental7DiscountPct", Number(e.target.value))}
                />
              </div>
              <div>
                <Label className="mb-1.5 block">30+ day discount %</Label>
                <Input
                  type="number"
                  min={0}
                  max={100}
                  value={rules.longRental30DiscountPct}
                  onChange={(e) => set("longRental30DiscountPct", Number(e.target.value))}
                />
              </div>
              <div>
                <Label className="mb-1.5 block">Last minute discount %</Label>
                <Input
                  type="number"
                  min={0}
                  max={100}
                  value={rules.lastMinuteDiscountPct}
                  onChange={(e) => set("lastMinuteDiscountPct", Number(e.target.value))}
                />
              </div>
              <div>
                <Label className="mb-1.5 block">Early bird discount %</Label>
                <Input
                  type="number"
                  min={0}
                  max={100}
                  value={rules.earlyBirdDiscountPct}
                  onChange={(e) => set("earlyBirdDiscountPct", Number(e.target.value))}
                />
              </div>
              <div>
                <Label className="mb-1.5 block">Early bird days ahead</Label>
                <Input
                  type="number"
                  min={0}
                  value={rules.earlyBirdDays}
                  onChange={(e) => set("earlyBirdDays", Number(e.target.value))}
                />
              </div>
            </div>

            <div>
              <Label className="mb-1.5 block">High demand dates (YYYY-MM-DD, comma or newline)</Label>
              <Textarea
                value={rules.highDemandDates.join("\n")}
                onChange={(e) =>
                  set(
                    "highDemandDates",
                    e.target.value
                      .split(/[,\n]/)
                      .map((x) => x.trim())
                      .filter(Boolean)
                  )
                }
                rows={4}
              />
            </div>

            <Button variant="gold" onClick={save} disabled={saving} className="w-full">
              {saving ? "Saving…" : "Save rules"}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <p className="mt-6 text-sm text-muted-foreground">No rules loaded.</p>
      )}
    </main>
  );
}
