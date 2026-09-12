"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PLATFORM, RWANDA_LOCATIONS } from "@/lib/constants";

export default function AdminSettingsPage() {
  const [commission, setCommission] = useState<number>(PLATFORM.commissionPct);
  const [saving, setSaving] = useState(false);

  const save = (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      toast.success("Platform settings saved");
    }, 600);
  };

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="font-display text-2xl font-extrabold tracking-tight">Platform Settings</h1>
        <p className="text-sm text-muted-foreground">Commission, locations, languages & configuration</p>
      </div>

      <form onSubmit={save} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Commission</CardTitle>
            <CardDescription>Platform cut on each completed rental. Booking fee is always RWF 0 — non-negotiable.</CardDescription>
          </CardHeader>
          <CardContent>
            <Label htmlFor="commission" className="mb-1.5 block">Commission %</Label>
            <Input
              id="commission"
              type="number"
              min={0}
              max={40}
              value={commission}
              onChange={(e) => setCommission(Number(e.target.value))}
              className="w-32"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Service locations</CardTitle>
            <CardDescription>Cities & districts where LORA operates</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {RWANDA_LOCATIONS.map((l) => (
                <span key={l} className="rounded-full bg-secondary px-3 py-1.5 text-xs font-medium">{l}</span>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Localization</CardTitle>
            <CardDescription>Currency & languages</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Primary currency</span><span className="font-semibold">RWF (Rwandan Franc)</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Display toggle</span><span className="font-semibold">USD @ ~1,300 RWF</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Languages</span><span className="font-semibold">English · Kinyarwanda · French (i18n-ready)</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Payments</span><span className="font-semibold">Cash · MTN MoMo · Card — at office/pickup only</span></div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Integrations</CardTitle>
            <CardDescription>Plug in when ready — see README</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Supabase (auth · DB · realtime)</span><span className="font-mono text-xs">NEXT_PUBLIC_SUPABASE_URL</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Cloudinary (images)</span><span className="font-mono text-xs">NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Mapbox (pickup maps)</span><span className="font-mono text-xs">NEXT_PUBLIC_MAPBOX_TOKEN</span></div>
          </CardContent>
        </Card>

        <Button type="submit" variant="gold" disabled={saving}>
          <Save className="h-4 w-4" /> {saving ? "Saving…" : "Save settings"}
        </Button>
      </form>
    </div>
  );
}
