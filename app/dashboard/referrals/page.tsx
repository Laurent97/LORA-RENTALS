"use client";

import Image from "next/image";
import { useState } from "react";
import { toast } from "sonner";
import { Copy, Gift, MessageCircle, Share2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/empty-state";
import { useApp } from "@/lib/store";
import { fmtDate, formatMoney, qrUrl, whatsappLink } from "@/lib/utils";
import { BRAND } from "@/lib/constants";
import type { Referral } from "@/types";

const REFERRAL_REWARD = 10000; // RWF credited to both sides on first completed booking

export default function ReferralsPage() {
  const { user, referrals, addReferral, currency } = useApp();
  const [copied, setCopied] = useState(false);
  if (!user) return null;

  const code = user.referralCode ?? `LORA-${user.id.slice(0, 5).toUpperCase()}`;
  const link = `https://lorarentals.rw/register?ref=${code}`;
  const mine = referrals.filter((r) => r.referrerId === user.id);
  const earned = mine
    .filter((r) => r.status === "rewarded")
    .reduce((s, r) => s + r.rewardAmount, 0);

  const share = () => {
    // register the referral row lazily on first share
    if (!mine.length) {
      const r: Referral = {
        id: crypto.randomUUID(),
        referrerId: user.id,
        code,
        status: "pending",
        rewardAmount: REFERRAL_REWARD,
        createdAt: new Date().toISOString(),
      };
      addReferral(r);
    }
  };

  const copy = async () => {
    share();
    await navigator.clipboard.writeText(link);
    setCopied(true);
    toast.success("Referral link copied");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-extrabold tracking-tight">Invite & Earn</h1>
        <p className="text-sm text-muted-foreground">
          Give friends {formatMoney(REFERRAL_REWARD, currency)} off their first rental — you get the same when they complete it.
        </p>
      </div>

      <Card className="overflow-hidden border-gold/40 bg-gradient-to-br from-navy-900 to-navy-950 text-white">
        <CardContent className="p-6">
          <div className="flex flex-wrap items-center gap-6">
            <div className="flex-1">
              <p className="text-xs font-semibold uppercase tracking-widest text-gold">Your referral code</p>
              <p className="mt-1 font-mono text-3xl font-extrabold tracking-wider">{code}</p>
              <p className="mt-2 break-all text-xs text-white/60">{link}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button variant="gold" size="sm" onClick={copy}>
                  <Copy className="h-3.5 w-3.5" /> {copied ? "Copied!" : "Copy link"}
                </Button>
                <a
                  href={whatsappLink(BRAND.whatsapp, `Rent a car in Rwanda with LORA — use my code ${code} for ${formatMoney(REFERRAL_REWARD, "RWF")} off: ${link}`)}
                  target="_blank"
                  rel="noreferrer"
                  onClick={share}
                >
                  <Button variant="outline" size="sm" className="border-white/30 bg-transparent text-white hover:bg-white/10">
                    <MessageCircle className="h-3.5 w-3.5" /> WhatsApp
                  </Button>
                </a>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-white/30 bg-transparent text-white hover:bg-white/10"
                  onClick={() => {
                    share();
                    if (navigator.share) navigator.share({ title: "LORA Rentals", text: `Use my code ${code}`, url: link });
                    else copy();
                  }}
                >
                  <Share2 className="h-3.5 w-3.5" /> Share
                </Button>
              </div>
            </div>
            <div className="rounded-2xl bg-white p-3">
              <Image src={qrUrl(link, 140)} alt="Referral QR" width={140} height={140} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: "Friends invited", value: String(mine.length) },
          { label: "Completed rentals", value: String(mine.filter((r) => r.status !== "pending").length) },
          { label: "Rewards earned", value: formatMoney(earned, currency) },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="p-5 text-center">
              <p className="font-display text-2xl font-extrabold">{s.value}</p>
              <p className="mt-1 text-xs text-muted-foreground">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Referral list */}
      <section>
        <h2 className="mb-3 font-display text-lg font-bold">Your referrals</h2>
        {mine.length === 0 ? (
          <EmptyState
            icon={Gift}
            title="No referrals yet"
            description="Share your link — when a friend completes their first rental you both earn."
          />
        ) : (
          <Card>
            <CardContent className="divide-y divide-border p-0">
              {mine.map((r) => (
                <div key={r.id} className="flex items-center justify-between px-5 py-3">
                  <div>
                    <p className="font-mono text-sm font-semibold">{r.code}</p>
                    <p className="text-xs text-muted-foreground">{fmtDate(r.createdAt)}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold">{formatMoney(r.rewardAmount, currency)}</span>
                    <Badge variant={r.status === "rewarded" ? "success" : r.status === "completed" ? "info" : "secondary"}>
                      {r.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </section>
    </div>
  );
}
