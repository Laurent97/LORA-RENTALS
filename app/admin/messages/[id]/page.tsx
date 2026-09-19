"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Megaphone } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useApp } from "@/lib/store";
import { getSupabase } from "@/lib/supabase/client";

export default function BroadcastDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useApp();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || user.role !== "admin") return;
    const sb = getSupabase();
    const load = async () => {
      const token = (await sb?.auth.getSession())?.data.session?.access_token;
      const res = await fetch(`/api/broadcast/${id}`, {
        headers: { Authorization: `Bearer ${token ?? ""}` },
      });
      const json = await res.json().catch(() => ({}));
      setData(json);
      setLoading(false);
    };
    void load();
  }, [id, user]);

  if (!user || user.role !== "admin") {
    return <p className="p-8 text-center text-muted-foreground">Admin access only.</p>;
  }
  if (loading) return <p className="p-8 text-center text-muted-foreground">Loading…</p>;
  if (!data?.broadcast) return <p className="p-8 text-center text-muted-foreground">Broadcast not found.</p>;

  const b = data.broadcast;
  const counts = data.counts ?? { inApp: 0, email: 0, push: 0 };
  const total = b.recipient_count ?? 0;

  return (
    <main className="container py-8">
      <div className="mb-6 flex items-center gap-3">
        <Megaphone className="h-7 w-7 text-gold" />
        <h1 className="font-display text-2xl font-extrabold">Broadcast analytics</h1>
      </div>

      <Card className="mb-6">
        <CardContent className="space-y-2 p-6">
          <p className="font-display text-xl font-bold">{b.title}</p>
          <p className="text-sm text-muted-foreground">{b.body}</p>
          <p className="text-sm text-muted-foreground">Sent {new Date(b.sent_at ?? b.created_at).toLocaleString()}</p>
          <p className="text-sm text-muted-foreground">Audience: {b.audience_type} · Channels: {b.channels?.join(", ")}</p>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Recipients", value: total },
          { label: "In-app delivered", value: counts.inApp },
          { label: "Emails sent", value: counts.email },
          { label: "Pushes delivered", value: counts.push },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="p-5 text-center">
              <p className="text-3xl font-extrabold text-gold">{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </main>
  );
}
