"use client";

import { useEffect, useState } from "react";
import { Users, MapPin, Shield, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/empty-state";
import { toast } from "sonner";

export default function CommunityPage() {
  const [circles, setCircles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void fetch("/api/community")
      .then((r) => r.json())
      .then((d) => { setCircles(d?.circles ?? []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  return (
    <main className="mx-auto max-w-6xl space-y-8 p-6 lg:p-12">
      <div className="text-center">
        <h1 className="font-display text-3xl font-extrabold tracking-tight" style={{ color: "#0A1F44" }}>Community Car Sharing</h1>
        <p className="mt-2 text-muted-foreground">Join trusted neighborhood circles, share vehicles, and earn LORA points.</p>
      </div>

      {loading ? (
        <div className="py-20 text-center text-sm text-muted-foreground">Loading communities…</div>
      ) : circles.length === 0 ? (
        <EmptyState icon={Users} title="No circles yet" description="Community car-sharing circles will appear here once verified owners create them." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {circles.map((c) => (
            <Card key={c.id}>
              <CardContent className="p-5">
                <div className="mb-3 flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-navy-100" style={{ background: "#0A1F4410" }}>
                    <Users className="h-5 w-5" style={{ color: "#0A1F44" }} />
                  </div>
                  <div>
                    <p className="font-display font-bold">{c.name}</p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1"><MapPin className="h-3 w-3" />{c.location}</p>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">{c.rules || "Shared vehicles available for neighbors and local travelers."}</p>
                <p className="mt-3 flex items-center gap-1 text-xs text-muted-foreground"><User className="h-3 w-3" />Host: {c.owner?.name}</p>
                <div className="mt-4 flex gap-2">
                  <Button variant="gold" className="flex-1" onClick={() => toast.info("Join request feature coming — log in to request membership")}>
                    Request to join
                  </Button>
                  <Button variant="outline" size="icon" onClick={() => toast.info("Trust & safety details open after membership.")}>
                    <Shield className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </main>
  );
}
