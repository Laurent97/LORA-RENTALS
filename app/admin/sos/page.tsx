"use client";

import { toast } from "sonner";
import { CheckCheck, MapPin, Phone, Siren } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/empty-state";
import { useAllUsers } from "@/lib/lookup";
import { useApp } from "@/lib/store";
import { fmtDateTime } from "@/lib/utils";
import type { SosStatus } from "@/types";

const STATUS_VARIANT: Record<SosStatus, "destructive" | "warning" | "success"> = {
  open: "destructive",
  acknowledged: "warning",
  resolved: "success",
};

const TYPE_LABEL: Record<string, string> = {
  accident: "🚨 Accident",
  breakdown: "🔧 Breakdown",
  safety: "🛡️ Safety concern",
  other: "📞 Other",
};

export default function AdminSosPage() {
  const { sosAlerts, updateSosStatus, bookings, vehicles } = useApp();
  const users = useAllUsers();
  const open = sosAlerts.filter((a) => a.status === "open");
  const rest = sosAlerts.filter((a) => a.status !== "open");

  const act = (id: string, status: SosStatus) => {
    updateSosStatus(id, status);
    toast.success(`Alert ${status}`);
  };

  const renderAlert = (a: (typeof sosAlerts)[number]) => {
    const u = users.find((x) => x.id === a.userId);
    const b = bookings.find((x) => x.id === a.bookingId);
    const v = b ? vehicles.find((x) => x.id === b.vehicleId) : null;
    return (
      <Card key={a.id} className={a.status === "open" ? "border-destructive/50" : ""}>
        <CardContent className="p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <p className="font-display font-bold">{TYPE_LABEL[a.type] ?? a.type}</p>
                <Badge variant={STATUS_VARIANT[a.status]}>{a.status}</Badge>
              </div>
              <p className="mt-1 text-sm">{u?.name ?? "Customer"} · {u?.phone}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {v ? `${v.make} ${v.model} · ` : ""}{b ? `booking ${b.id.slice(0, 8)} · ` : ""}{fmtDateTime(a.createdAt)}
              </p>
              {a.lat != null && a.lng != null && (
                <a
                  href={`https://maps.google.com/?q=${a.lat},${a.lng}`}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-sky-600 hover:underline"
                >
                  <MapPin className="h-3 w-3" /> {a.lat.toFixed(4)}, {a.lng.toFixed(4)} — open map
                </a>
              )}
            </div>
            <div className="flex flex-col gap-2">
              {u?.phone && (
                <a href={`tel:${u.phone.replace(/\s/g, "")}`}>
                  <Button variant="outline" size="sm"><Phone className="h-3.5 w-3.5" /> Call</Button>
                </a>
              )}
              {a.status === "open" && (
                <Button variant="gold" size="sm" onClick={() => act(a.id, "acknowledged")}>
                  Acknowledge
                </Button>
              )}
              {a.status === "acknowledged" && (
                <Button variant="outline" size="sm" onClick={() => act(a.id, "resolved")}>
                  <CheckCheck className="h-3.5 w-3.5" /> Resolve
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl font-extrabold tracking-tight">SOS Alerts</h1>
        <p className="text-sm text-muted-foreground">
          Live emergency alerts from active trips. Rwanda emergency: Police 112 · Ambulance 912.
        </p>
      </div>

      <section>
        <h2 className="mb-3 flex items-center gap-2 font-display text-lg font-bold">
          <Siren className="h-5 w-5 text-destructive" /> Open ({open.length})
        </h2>
        {open.length === 0 ? (
          <EmptyState icon={Siren} title="All clear" description="No open SOS alerts right now." />
        ) : (
          <div className="space-y-3">{open.map(renderAlert)}</div>
        )}
      </section>

      {rest.length > 0 && (
        <section>
          <h2 className="mb-3 font-display text-lg font-bold">History ({rest.length})</h2>
          <div className="space-y-3">{rest.map(renderAlert)}</div>
        </section>
      )}
    </div>
  );
}
