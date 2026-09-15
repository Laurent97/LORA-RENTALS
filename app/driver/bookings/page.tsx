"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Clock, MapPin, Phone, User, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { getSupabase } from "@/lib/supabase/client";
import { fmtDate } from "@/lib/utils";

const nav = [
  { href: "/driver/dashboard", label: "Dashboard", icon: Clock },
  { href: "/driver/bookings", label: "Bookings", icon: Clock },
];

type DriverBookingRow = {
  id: string;
  status: string;
  startAt: string;
  endAt?: string;
  pickupLocation?: string;
  dropoffLocation?: string;
  subtotalRwf: number;
  driverNetRwf: number;
  customer: { name: string; phone: string; email: string } | null;
  vehicle: string | null;
  plate: string | null;
};

export default function DriverBookingsPage() {
  const [rows, setRows] = useState<DriverBookingRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const sb = getSupabase();
    sb?.auth.getSession().then((s) => {
      fetch("/api/driver-bookings", {
        headers: { Authorization: `Bearer ${s.data.session?.access_token ?? ""}` },
      })
        .then((r) => r.json())
        .then((data) => {
          setRows(Array.isArray(data) ? data : []);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    });
  }, []);

  const updateStatus = async (id: string, status: string) => {
    const sb = getSupabase();
    const s = await sb?.auth.getSession();
    const res = await fetch("/api/driver-bookings", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${s?.data.session?.access_token ?? ""}`,
      },
      body: JSON.stringify({ id, status }),
    });
    if (res.ok) {
      setRows((rs) => rs.map((r) => (r.id === id ? { ...r, status } : r)));
    } else {
      const json = await res.json().catch(() => ({}));
      alert(json.error || "Update failed");
    }
  };

  const showActions = (status: string) => ["pending", "accepted", "in_progress"].includes(status);

  return (
    <DashboardShell role="driver" nav={nav}>
      <div className="p-4 lg:p-8">
        <h1 className="font-display text-2xl font-extrabold">My bookings</h1>
        {loading ? (
          <p className="py-10 text-sm text-muted-foreground">Loading…</p>
        ) : rows.length === 0 ? (
          <p className="py-10 text-sm text-muted-foreground">No driver bookings yet.</p>
        ) : (
          <div className="mt-6 space-y-4">
            {rows.map((r) => (
              <Card key={r.id}>
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <div>
                      <Badge className="capitalize" variant={r.status === "confirmed" ? "success" : r.status === "pending" ? "warning" : "secondary"}>{r.status.replace("_", " ")}</Badge>
                      <p className="mt-2 font-semibold">{r.vehicle ?? "Vehicle"} · {r.plate}</p>
                      <p className="text-sm text-muted-foreground">{fmtDate(r.startAt)} → {fmtDate(r.endAt ?? r.startAt)}</p>
                      <p className="flex items-center gap-1 text-sm text-muted-foreground"><MapPin className="h-3 w-3" /> {r.pickupLocation}</p>
                      <p className="mt-2 flex items-center gap-1 text-sm"><User className="h-3 w-3" /> {r.customer?.name}</p>
                      {(r.status === "confirmed" || r.status === "in_progress") && (
                        <p className="mt-1 text-sm font-medium"><Phone className="inline h-3 w-3" /> {r.customer?.phone}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="font-extrabold">{r.driverNetRwf.toLocaleString()} RWF</p>
                      <p className="text-xs text-muted-foreground">your net</p>
                    </div>
                  </div>
                  {showActions(r.status) && (
                    <div className="mt-4 flex gap-2">
                      {r.status === "pending" && (
                        <>
                          <Button size="sm" variant="gold" onClick={() => updateStatus(r.id, "confirmed")}><CheckCircle2 className="h-4 w-4" /> Accept & confirm</Button>
                          <Button size="sm" variant="outline" onClick={() => updateStatus(r.id, "declined")}><XCircle className="h-4 w-4" /> Decline</Button>
                        </>
                      )}
                      {r.status === "accepted" && (
                        <Button size="sm" variant="gold" onClick={() => updateStatus(r.id, "in_progress")}><CheckCircle2 className="h-4 w-4" /> Start trip</Button>
                      )}
                      {r.status === "in_progress" && (
                        <Button size="sm" variant="gold" onClick={() => updateStatus(r.id, "completed")}><CheckCircle2 className="h-4 w-4" /> Complete</Button>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
