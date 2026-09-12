"use client";

import { Award, Crown, Sparkles, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/empty-state";
import { LOYALTY_TIERS, useApp } from "@/lib/store";
import { cn, fmtDate, formatMoney } from "@/lib/utils";

const TIER_ICON = { bronze: Award, silver: Star, gold: Crown, platinum: Sparkles };
const TIER_COLOR: Record<string, string> = {
  bronze: "text-amber-700",
  silver: "text-slate-400",
  gold: "text-gold",
  platinum: "text-violet-400",
};

export default function LoyaltyPage() {
  const { user, loyalty, pointsTx, currency } = useApp();
  if (!user) return null;

  const acct = loyalty.find((l) => l.userId === user.id);
  const points = acct?.points ?? 0;
  const tier = acct?.tier ?? "bronze";
  const txs = pointsTx.filter((t) => t.userId === user.id);
  const rwfValue = points * 10; // 1 point = RWF 10 off

  const currentIdx = LOYALTY_TIERS.findIndex((t) => t.tier === tier);
  const next = LOYALTY_TIERS[currentIdx + 1];
  const progress = next
    ? Math.min(100, Math.round(((points - LOYALTY_TIERS[currentIdx].min) / (next.min - LOYALTY_TIERS[currentIdx].min)) * 100))
    : 100;

  const TierIcon = TIER_ICON[tier];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-extrabold tracking-tight">LORA Points</h1>
        <p className="text-sm text-muted-foreground">Earn on every completed rental — redeem for discounts, never fees.</p>
      </div>

      {/* Balance card */}
      <Card className="overflow-hidden border-gold/40 bg-gradient-to-br from-navy-900 to-navy-950 text-white">
        <CardContent className="p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-gold">Your balance</p>
              <p className="mt-1 font-display text-4xl font-extrabold">{points.toLocaleString()} pts</p>
              <p className="mt-1 text-sm text-white/70">
                = {formatMoney(rwfValue, currency)} off your next rental
              </p>
            </div>
            <div className="text-right">
              <span className={cn("inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-sm font-bold", TIER_COLOR[tier])}>
                <TierIcon className="h-4 w-4" /> {tier.charAt(0).toUpperCase() + tier.slice(1)}
              </span>
              {next && (
                <p className="mt-2 text-xs text-white/60">
                  {next.min - points} pts to {next.label}
                </p>
              )}
            </div>
          </div>
          {next && (
            <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10">
              <div className="h-full rounded-full bg-gold transition-all" style={{ width: `${progress}%` }} />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tiers */}
      <div className="grid gap-3 sm:grid-cols-4">
        {LOYALTY_TIERS.map((t) => {
          const Icon = TIER_ICON[t.tier];
          const active = t.tier === tier;
          return (
            <Card key={t.tier} className={cn(active && "border-gold ring-1 ring-gold")}>
              <CardContent className="p-4 text-center">
                <Icon className={cn("mx-auto h-6 w-6", TIER_COLOR[t.tier])} />
                <p className="mt-2 font-display font-bold">{t.label}</p>
                <p className="text-xs text-muted-foreground">{t.min.toLocaleString()}+ pts</p>
                {active && <Badge variant="gold" className="mt-2">Current</Badge>}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* History */}
      <section>
        <h2 className="mb-3 font-display text-lg font-bold">Points history</h2>
        {txs.length === 0 ? (
          <EmptyState
            icon={Star}
            title="No points yet"
            description="Complete a rental to start earning — 1 point per RWF 1,000 spent."
          />
        ) : (
          <Card>
            <CardContent className="divide-y divide-border p-0">
              {txs.map((t) => (
                <div key={t.id} className="flex items-center justify-between px-5 py-3">
                  <div>
                    <p className="text-sm font-medium">{t.reason}</p>
                    <p className="text-xs text-muted-foreground">{fmtDate(t.createdAt)}</p>
                  </div>
                  <span className={cn("font-display font-bold", t.delta > 0 ? "text-emerald-600" : "text-destructive")}>
                    {t.delta > 0 ? "+" : ""}{t.delta}
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </section>
    </div>
  );
}
