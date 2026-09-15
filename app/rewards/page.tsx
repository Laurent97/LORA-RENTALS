"use client";

import { useEffect, useState } from "react";
import { Gift, Coins, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/empty-state";
import { useApp } from "@/lib/store";
import { getSupabase } from "@/lib/supabase/client";
import { toast } from "sonner";

export default function RewardsPage() {
  const { user } = useApp();
  const [rewards, setRewards] = useState<any[]>([]);
  const [balance, setBalance] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [redeeming, setRedeeming] = useState<string | null>(null);

  const load = async () => {
    const [cat, bal] = await Promise.all([
      fetch("/api/rewards").then((r) => r.json()).catch(() => ({ rewards: [] })),
      (async () => {
        const sb = getSupabase();
        if (!sb || !user) return null;
        const { data } = await sb.from("loyalty_accounts").select("balance").eq("user_id", user.id).single();
        return data?.balance ?? null;
      })(),
    ]);
    setRewards(cat.rewards ?? []);
    setBalance(bal);
    setLoading(false);
  };

  useEffect(() => { void load(); }, [user]);

  const redeem = async (id: string) => {
    const sb = getSupabase();
    const session = sb ? await sb.auth.getSession() : null;
    const token = session?.data.session?.access_token;
    if (!token) { toast.error("Sign in to redeem rewards"); return; }
    setRedeeming(id);
    const res = await fetch("/api/rewards", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ rewardId: id }),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) { toast.error(json.error || "Could not redeem"); setRedeeming(null); return; }
    toast.success(`Redeemed: ${json.label} — code ${json.code}`);
    await load();
    setRedeeming(null);
  };

  return (
    <main className="mx-auto max-w-6xl space-y-8 p-6 lg:p-12">
      <div className="text-center">
        <h1 className="font-display text-3xl font-extrabold tracking-tight" style={{ color: "#0A1F44" }}>LORA Rewards Marketplace</h1>
        <p className="mt-2 text-muted-foreground">Redeem loyalty points for partner perks across Rwanda.</p>
        {balance !== null && (
          <p className="mt-3 inline-flex items-center gap-1 rounded-full bg-navy-100 px-4 py-1.5 text-sm font-bold" style={{ color: "#0A1F44", background: "#0A1F4410" }}>
            <Coins className="h-4 w-4" /> {balance.toLocaleString()} points
          </p>
        )}
      </div>

      {loading ? (
        <div className="py-20 text-center text-sm text-muted-foreground">Loading rewards…</div>
      ) : rewards.length === 0 ? (
        <EmptyState icon={Gift} title="No rewards" description="Rewards will be added to the catalog soon." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {rewards.map((r) => (
            <Card key={r.id}>
              <CardContent className="p-5">
                <div className="mb-3 flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gold/20">
                    <Gift className="h-5 w-5" style={{ color: "#D4AF37" }} />
                  </div>
                  <div>
                    <p className="font-display font-bold">{r.label}</p>
                    <p className="text-xs text-muted-foreground">{r.partner_name}</p>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">{r.description}</p>
                <p className="mt-3 font-display text-lg font-extrabold" style={{ color: "#0A1F44" }}>{r.points_cost.toLocaleString()} pts</p>
                {r.stock !== null && <Badge variant="outline" className="mt-1">{r.stock} left</Badge>}
                <Button
                  variant="gold"
                  className="mt-4 w-full"
                  disabled={redeeming === r.id || (balance !== null && balance < r.points_cost)}
                  onClick={() => redeem(r.id)}
                >
                  {redeeming === r.id ? "Redeeming…" : balance !== null && balance < r.points_cost ? "Not enough points" : "Redeem"}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </main>
  );
}
