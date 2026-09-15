"use client";

import { useEffect, useState } from "react";
import { MapPin, AlertTriangle, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getSupabase } from "@/lib/supabase/client";
import { toast } from "sonner";

export default function AdminGeofencePage() {
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    const sb = getSupabase();
    const session = sb ? await sb.auth.getSession() : null;
    const token = session?.data.session?.access_token;
    const res = await fetch("/api/admin/geofence", { headers: token ? { Authorization: `Bearer ${token}` } : {} });
    const json = await res.json().catch(() => ({}));
    setAlerts(json.alerts ?? []);
    setLoading(false);
  };

  useEffect(() => { void fetchData(); }, []);

  const acknowledge = async (id: string) => {
    const sb = getSupabase();
    const session = sb ? await sb.auth.getSession() : null;
    const token = session?.data.session?.access_token;
    const res = await fetch("/api/admin/geofence", {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ id }),
    });
    if (res.ok) { toast.success("Alert acknowledged"); await fetchData(); } else { toast.error("Could not acknowledge"); }
  };

  return (
    <main className="container space-y-6 py-10">
      <div>
        <h1 className="font-display text-2xl font-extrabold tracking-tight">Geofence Alerts</h1>
        <p className="text-sm text-muted-foreground">Real-time trip boundary, speed, and fuel alerts.</p>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading alerts…</p>
      ) : alerts.length === 0 ? (
        <Card><CardContent className="p-8 text-center text-sm text-muted-foreground">No geofence alerts.</CardContent></Card>
      ) : (
        <div className="space-y-3">
          {alerts.map((a) => (
            <Card key={a.id} className={a.acknowledged ? "opacity-60" : ""}>
              <CardContent className="p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-destructive" />
                      <p className="font-semibold capitalize">{a.type.replace("_", " ")}</p>
                      <Badge variant={a.acknowledged ? "secondary" : "destructive"}>{a.acknowledged ? "Acknowledged" : "New"}</Badge>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">{a.message}</p>
                    <p className="mt-2 text-xs text-muted-foreground">
                      {a.vehicles ? `${a.vehicles.make} ${a.vehicles.model} · ${a.vehicles.plate}` : "Vehicle unknown"}
                      {a.bookings?.customer ? ` · Customer ${a.bookings.customer.name}` : ""}
                    </p>
                    {a.lat && a.lng && (
                      <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                        <MapPin className="h-3 w-3" /> {a.lat.toFixed(5)}, {a.lng.toFixed(5)}
                      </p>
                    )}
                    <p className="mt-1 text-xs text-muted-foreground">{new Date(a.created_at).toLocaleString()}</p>
                  </div>
                  {!a.acknowledged && (
                    <Button variant="outline" size="sm" onClick={() => acknowledge(a.id)}>
                      <Check className="h-3.5 w-3.5" /> Ack
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </main>
  );
}
