"use client";

import { useEffect, useState } from "react";
import { Trophy, Target, Medal, Star, Zap, Crown } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/empty-state";
import { useApp } from "@/lib/store";

export default function GamificationPage() {
  const { user } = useApp();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void fetch("/api/gamification")
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  return (
    <main className="mx-auto max-w-6xl space-y-10 p-6 lg:p-12">
      <div className="text-center">
        <h1 className="font-display text-3xl font-extrabold tracking-tight" style={{ color: "#0A1F44" }}>Gamification & Loyalty</h1>
        <p className="mt-2 text-muted-foreground">Earn badges, complete challenges, and climb the leaderboard.</p>
      </div>

      {loading ? (
        <div className="py-20 text-center text-sm text-muted-foreground">Loading…</div>
      ) : !data ? (
        <EmptyState icon={Trophy} title="Could not load" description="Gamification data is not available right now." />
      ) : (
        <>
          <section>
            <div className="mb-4 flex items-center gap-2">
              <Crown className="h-5 w-5" style={{ color: "#D4AF37" }} />
              <h2 className="font-display text-xl font-bold">Leaderboard</h2>
            </div>
            <div className="grid gap-3">
              {data.leaderboard?.length === 0 ? (
                <EmptyState icon={Trophy} title="No entries yet" description="The leaderboard is empty." />
              ) : (
                data.leaderboard.map((u: any, i: number) => (
                  <Card key={i}>
                    <CardContent className="flex items-center justify-between p-4">
                      <div className="flex items-center gap-3">
                        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-navy-100 font-bold text-sm" style={{ color: "#0A1F44" }}>#{i + 1}</span>
                        <span className="font-semibold">{u.user?.name || "LORA Member"}</span>
                      </div>
                      <div className="text-right">
                        <p className="font-bold" style={{ color: "#0A1F44" }}>{u.points?.toLocaleString()} pts</p>
                        <p className="text-xs text-muted-foreground">{u.balance?.toLocaleString()} balance</p>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </section>

          <section>
            <div className="mb-4 flex items-center gap-2">
              <Medal className="h-5 w-5" style={{ color: "#0A1F44" }} />
              <h2 className="font-display text-xl font-bold">Badges</h2>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {data.badges?.map((b: any) => {
                const earned = user && data.myBadges?.some((m: any) => m.badges?.slug === b.slug);
                return (
                  <Card key={b.id} className={earned ? "border-gold" : ""}>
                    <CardContent className="p-5 text-center">
                      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gold/20">
                        <Star className="h-5 w-5" style={{ color: "#D4AF37" }} />
                      </div>
                      <p className="mt-3 font-display font-bold">{b.label}</p>
                      <p className="text-xs text-muted-foreground">{b.description}</p>
                      <p className="mt-2 text-xs font-bold" style={{ color: "#0A1F44" }}>+{b.points_bonus} pts</p>
                      {earned && <Badge className="mt-2 bg-gold/20 text-gold" style={{ color: "#D4AF37" }}>Earned</Badge>}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </section>

          <section>
            <div className="mb-4 flex items-center gap-2">
              <Target className="h-5 w-5" style={{ color: "#0A1F44" }} />
              <h2 className="font-display text-xl font-bold">Challenges</h2>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {data.challenges?.map((c: any) => (
                <Card key={c.id}>
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-display font-bold">{c.label}</p>
                        <p className="text-sm text-muted-foreground">{c.description}</p>
                      </div>
                      <Zap className="h-4 w-4" style={{ color: "#D4AF37" }} />
                    </div>
                    <p className="mt-3 font-bold" style={{ color: "#0A1F44" }}>{c.points?.toLocaleString()} pts</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        </>
      )}
    </main>
  );
}
