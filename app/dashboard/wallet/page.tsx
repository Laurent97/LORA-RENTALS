"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { useApp } from "@/lib/store";
import { getSupabase } from "@/lib/supabase/client";
import { formatMoney } from "@/lib/utils";
import type { Wallet, WalletTransaction } from "@/types";

export default function WalletPage() {
  const { user, currency } = useApp();
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [txs, setTxs] = useState<WalletTransaction[]>([]);
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("momo");
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchWallet = async () => {
    const sb = getSupabase();
    const token = sb ? (await sb.auth.getSession()).data.session?.access_token : undefined;
    const res = await fetch("/api/wallet", {
      headers: token ? { authorization: `Bearer ${token}` } : {},
    });
    if (res.ok) {
      const data = (await res.json()) as { wallet: Wallet; transactions: WalletTransaction[] };
      setWallet(data.wallet);
      setTxs(data.transactions);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (user) fetchWallet();
  }, [user?.id]);

  const topup = async (e: React.FormEvent) => {
    e.preventDefault();
    const v = Number(amount);
    if (!v || v <= 0) return;
    setSubmitting(true);
    const sb = getSupabase();
    const token = sb ? (await sb.auth.getSession()).data.session?.access_token : undefined;
    const res = await fetch("/api/wallet", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        ...(token ? { authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({
        type: "topup",
        amount: v,
        method,
        notes: "Customer top-up request",
      }),
    });
    if (res.ok) {
      setAmount("");
      await fetchWallet();
    }
    setSubmitting(false);
  };

  if (!user) return null;
  if (loading) return <main className="container py-10 text-sm text-muted-foreground">Loading wallet…</main>;

  return (
    <main className="container max-w-2xl space-y-6 py-10">
      <h1 className="font-display text-2xl font-extrabold tracking-tight">LORA Wallet</h1>

      <Card className="border-gold/40 bg-navy-900 text-white">
        <CardContent className="p-6">
          <p className="text-xs font-semibold uppercase tracking-widest text-gold">Balance</p>
          <p className="mt-1 font-display text-4xl font-extrabold">{formatMoney(wallet?.balance ?? 0, currency)}</p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-4 p-5">
          <h2 className="font-display font-bold">Top up</h2>
          <form onSubmit={topup} className="grid gap-4 sm:grid-cols-3">
            <div>
              <Label className="mb-1.5 block">Amount (RWF)</Label>
              <Input
                type="number"
                min={1000}
                step={1000}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
            </div>
            <div>
              <Label className="mb-1.5 block">Method</Label>
              <select
                value={method}
                onChange={(e) => setMethod(e.target.value)}
                className="h-11 w-full rounded-xl border border-border bg-card px-3 text-sm focus:outline-none focus:ring-2 focus:ring-gold"
              >
                <option value="momo">MTN MoMo</option>
                <option value="airtel">Airtel Money</option>
                <option value="ekash">eKash</option>
                <option value="bank">Bank</option>
              </select>
            </div>
            <div className="flex items-end">
              <Button type="submit" variant="gold" disabled={submitting} className="w-full">
                {submitting ? "Requesting…" : "Request top-up"}
              </Button>
            </div>
          </form>
          <p className="text-xs text-muted-foreground">
            Top-ups are held pending until an admin confirms the payment.
          </p>
        </CardContent>
      </Card>

      <section>
        <h2 className="mb-3 font-display text-lg font-bold">Transactions</h2>
        {txs.length === 0 ? (
          <p className="text-sm text-muted-foreground">No wallet activity yet.</p>
        ) : (
          <Card>
            <CardContent className="divide-y divide-border p-0">
              {txs.map((t) => (
                <div key={t.id} className="flex items-center justify-between px-5 py-3">
                  <div>
                    <p className="text-sm font-medium capitalize">
                      {t.type} <span className="text-muted-foreground">· {t.status}</span>
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(t.createdAt).toLocaleString()}
                      {t.method ? ` · ${t.method}` : ""}
                    </p>
                  </div>
                  <span
                    className={`font-display font-bold ${
                      t.amount > 0 ? "text-emerald-600" : "text-destructive"
                    }`}
                  >
                    {t.amount > 0 ? "+" : ""}
                    {t.amount.toLocaleString()} RWF
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </section>
    </main>
  );
}
