"use client";

import { useEffect, useState } from "react";
import { Banknote, CircleDollarSign, Clock, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { getSupabase } from "@/lib/supabase/client";

const nav = [
  { href: "/driver", label: "Dashboard", icon: Banknote },
  { href: "/driver/bookings", label: "Bookings", icon: Clock },
  { href: "/driver/earnings", label: "Earnings", icon: Wallet },
];

export default function DriverEarningsPage() {
  const [state, setState] = useState({ earnings: [] as any[], totals: { pending: 0, available: 0, paid: 0, total: 0 } });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const sb = getSupabase();
    sb?.auth.getSession().then((s) => {
      fetch("/api/driver-earnings", {
        headers: { Authorization: `Bearer ${s.data.session?.access_token ?? ""}` },
      })
        .then(async (r) => {
          const json = (await r.json().catch(() => ({ earnings: [], totals: { pending: 0, available: 0, paid: 0, total: 0 } }))) as any;
          setState({ earnings: json.earnings ?? [], totals: json.totals ?? { pending: 0, available: 0, paid: 0, total: 0 } });
        })
        .catch(() => {})
        .finally(() => setLoading(false));
    });
  }, []);

  return (
    <DashboardShell role="driver" nav={nav}>
      <div className="p-4 lg:p-8">
        <h1 className="font-display text-2xl font-extrabold">Earnings</h1>

        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <Card>
            <CardContent className="p-5 text-center">
              <Clock className="mx-auto h-6 w-6 text-gold" />
              <p className="mt-2 text-2xl font-extrabold">{state.totals.pending.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">Pending (RWF)</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5 text-center">
              <Wallet className="mx-auto h-6 w-6 text-gold" />
              <p className="mt-2 text-2xl font-extrabold">{state.totals.available.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">Available (RWF)</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5 text-center">
              <CircleDollarSign className="mx-auto h-6 w-6 text-gold" />
              <p className="mt-2 text-2xl font-extrabold">{state.totals.paid.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">Paid (RWF)</p>
            </CardContent>
          </Card>
        </div>

        <Card className="mt-6">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <p className="font-semibold">Available to withdraw</p>
              <p className="font-display text-2xl font-extrabold text-gold">{state.totals.available.toLocaleString()} RWF</p>
            </div>
            <Button className="mt-4 w-full" variant="gold" disabled={state.totals.available <= 0}>
              Withdraw to MoMo / Bank
            </Button>
          </CardContent>
        </Card>

        <h2 className="mt-8 font-display text-lg font-bold">Transactions</h2>
        {loading ? (
          <p className="py-10 text-sm text-muted-foreground">Loading…</p>
        ) : state.earnings.length === 0 ? (
          <p className="py-10 text-sm text-muted-foreground">No earnings yet. Complete trips to get paid.</p>
        ) : (
          <div className="mt-4 space-y-3">
            {state.earnings.map((e) => (
              <div key={e.id} className="flex items-center justify-between rounded-2xl border p-4">
                <div>
                  <p className="font-semibold capitalize">{e.type.replace("_", " ")}</p>
                  <p className="text-xs text-muted-foreground">{new Date(e.createdAt).toLocaleDateString()} · {e.status}</p>
                </div>
                <p className="font-extrabold">{e.amountRwf.toLocaleString()} RWF</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
