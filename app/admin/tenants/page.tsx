"use client";

import { useEffect, useState } from "react";
import { Globe, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { getSupabase } from "@/lib/supabase/client";
import { toast } from "sonner";

const COUNTRIES: Record<string, string> = { RW: "Rwanda", KE: "Kenya", UG: "Uganda", TZ: "Tanzania", CD: "DR Congo" };

export default function AdminTenantsPage() {
  const [tenants, setTenants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  const fetchData = async () => {
    const sb = getSupabase();
    const session = sb ? await sb.auth.getSession() : null;
    const token = session?.data.session?.access_token;
    const res = await fetch("/api/admin/tenants", { headers: token ? { Authorization: `Bearer ${token}` } : {} });
    const json = await res.json().catch(() => ({}));
    setTenants(json.tenants ?? []);
    setLoading(false);
  };

  useEffect(() => { void fetchData(); }, []);

  const save = async (t: any) => {
    const sb = getSupabase();
    const session = sb ? await sb.auth.getSession() : null;
    const token = session?.data.session?.access_token;
    setSaving(t.country);
    const res = await fetch("/api/admin/tenants", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        country: t.country,
        vat_rate: Number(t.vat_rate),
        booking_fee: Number(t.booking_fee),
        payment_rails: t.payment_rails,
      }),
    });
    if (res.ok) { toast.success(`${COUNTRIES[t.country]} settings saved`); } else { toast.error("Could not save"); }
    setSaving(null);
  };

  const update = (c: string, k: keyof any, v: any) => {
    setTenants((prev) => prev.map((t) => t.country === c ? { ...t, [k]: v } : t));
  };

  return (
    <main className="container space-y-6 py-10">
      <div>
        <h1 className="font-display text-2xl font-extrabold tracking-tight">Multi-Tenant Countries</h1>
        <p className="text-sm text-muted-foreground">Per-country currency, VAT, booking fee, and payment rails for East Africa expansion.</p>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {tenants.map((t) => (
            <Card key={t.country}>
              <CardContent className="p-5">
                <div className="mb-4 flex items-center gap-2">
                  <Globe className="h-5 w-5" style={{ color: "#0A1F44" }} />
                  <p className="font-display font-bold">{COUNTRIES[t.country]} · {t.country}</p>
                </div>
                <div className="space-y-3 text-sm text-muted-foreground">
                  <p>Currency: <strong className="text-foreground">{t.currency}</strong></p>
                  <p>Phone prefix: <strong className="text-foreground">{t.phone_prefix}</strong></p>
                </div>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <div>
                    <Label className="mb-1.5 block">VAT %</Label>
                    <Input type="number" step="0.01" value={t.vat_rate} onChange={(e) => update(t.country, "vat_rate", e.target.value)} />
                  </div>
                  <div>
                    <Label className="mb-1.5 block">Booking fee</Label>
                    <Input type="number" value={t.booking_fee} onChange={(e) => update(t.country, "booking_fee", e.target.value)} />
                  </div>
                </div>
                <div className="mt-4">
                  <Label className="mb-1.5 block">Payment rails (comma separated)</Label>
                  <Input value={(t.payment_rails ?? []).join(", ")} onChange={(e) => update(t.country, "payment_rails", e.target.value.split(",").map((x) => x.trim()).filter(Boolean))} />
                </div>
                <Button className="mt-5 w-full" variant="gold" onClick={() => save(t)} disabled={saving === t.country}>
                  <Save className="mr-2 h-4 w-4" /> {saving === t.country ? "Saving…" : "Save"}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </main>
  );
}
