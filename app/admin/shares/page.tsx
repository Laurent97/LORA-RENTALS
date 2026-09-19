"use client";

import { useEffect, useState } from "react";
import { Share2, TrendingUp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useApp } from "@/lib/store";
import { getSupabase } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

export default function AdminSharesPage() {
  const { user } = useApp();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || user.role !== "admin") return;
    const load = async () => {
      const sb = getSupabase();
      const token = (await sb?.auth.getSession())?.data.session?.access_token;
      const res = await fetch("/api/shares/analytics", {
        headers: { Authorization: `Bearer ${token ?? ""}` },
      });
      const json = await res.json().catch(() => ({}));
      setData(json);
      setLoading(false);
    };
    void load();
  }, [user]);

  if (!user || user.role !== "admin") return <p className="p-8 text-center text-muted-foreground">Admin access only.</p>;
  if (loading) return <p className="p-8 text-center text-muted-foreground">Loading…</p>;

  const platforms = data?.byPlatform ?? [];
  const top = data?.topListings ?? [];

  return (
    <main className="container py-8">
      <div className="mb-6 flex items-center gap-3">
        <Share2 className="h-7 w-7 text-gold" />
        <h1 className="font-display text-2xl font-extrabold">Share Analytics</h1>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Total shares", value: data?.total ?? 0 },
          { label: "Top platform", value: platforms[0]?.platform ?? "—" },
          { label: "Top listing shares", value: top[0]?.shares ?? 0 },
          { label: "Recent shares", value: (data?.recent ?? []).length },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="p-5 text-center">
              <p className="text-3xl font-extrabold text-gold">{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardContent className="p-6">
            <div className="mb-4 flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-gold" />
              <h2 className="font-display text-lg font-bold">Shares by platform</h2>
            </div>
            {platforms.length === 0 ? (
              <p className="text-sm text-muted-foreground">No share data yet.</p>
            ) : (
              <div className="space-y-3">
                {platforms.map((p: any) => (
                  <div key={p.platform}>
                    <div className="mb-1 flex justify-between text-sm">
                      <span className="capitalize">{p.platform}</span>
                      <span className="font-semibold">{p.count}</span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className={cn("h-full rounded-full bg-gold")}
                        style={{ width: `${Math.min(100, (p.count / (data?.total || 1)) * 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <h2 className="mb-4 font-display text-lg font-bold">Top shared listings</h2>
            {top.length === 0 ? (
              <p className="text-sm text-muted-foreground">No shared listings yet.</p>
            ) : (
              <div className="space-y-3">
                {top.map((l: any) => (
                  <div key={`${l.type}-${l.id}`} className="flex items-center justify-between rounded-xl border p-3">
                    <div>
                      <p className="text-sm font-semibold capitalize">{l.type}</p>
                      <p className="text-xs text-muted-foreground">{l.id}</p>
                    </div>
                    <p className="font-bold text-gold">{l.shares}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
