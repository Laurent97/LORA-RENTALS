"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, Check, Eye, Flag, Trash2, User, X } from "lucide-react";
import Image from "next/image";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { getSupabase } from "@/lib/supabase/client";

export default function AdminDriversPage() {
  const [drivers, setDrivers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<any | null>(null);

  const token = async () => {
    const sb = getSupabase();
    const s = sb ? await sb.auth.getSession() : null;
    return s?.data.session?.access_token;
  };

  const fetchDrivers = async () => {
    const t = await token();
    const res = await fetch("/api/admin/drivers", { headers: t ? { Authorization: `Bearer ${t}` } : {} });
    const json = await res.json().catch(() => ({}));
    setDrivers(json.drivers ?? []);
    setLoading(false);
  };

  useEffect(() => { void fetchDrivers(); }, []);

  const action = async (id: string, a: string) => {
    const t = await token();
    const res = await fetch("/api/admin/drivers", {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${t}` },
      body: JSON.stringify({ id, action: a }),
    });
    if (!res.ok) { toast.error("Action failed"); return; }
    toast.success(a + " done");
    await fetchDrivers();
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this driver permanently?")) return;
    const t = await token();
    const res = await fetch(`/api/admin/drivers?id=${encodeURIComponent(id)}`, { method: "DELETE", headers: { Authorization: `Bearer ${t}` } });
    if (!res.ok) { toast.error("Delete failed"); return; }
    toast.success("Driver deleted");
    await fetchDrivers();
  };

  return (
    <main className="container space-y-6 py-10">
      <div>
        <h1 className="font-display text-2xl font-extrabold tracking-tight">Driver Management</h1>
        <p className="text-sm text-muted-foreground">Review, verify, suspend, flag, and delete drivers.</p>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading drivers…</p>
      ) : drivers.length === 0 ? (
        <Card><CardContent className="p-8 text-center text-sm text-muted-foreground">No drivers yet.</CardContent></Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {drivers.map((d) => (
            <Card key={d.id}>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-full bg-muted">
                    {d.photo_url ? <Image src={d.photo_url} alt="" fill className="object-cover" /> : <User className="h-7 w-7 m-3.5 text-muted-foreground" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-display font-bold truncate">{d.full_name}</p>
                    <p className="text-xs text-muted-foreground">{d.years_of_experience} years · {d.owner?.name}</p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      <Badge variant={d.is_verified ? "success" : "secondary"}>{d.is_verified ? "Verified" : "Pending"}</Badge>
                      <Badge variant={d.is_available ? "success" : "warning"}>{d.is_available ? "Available" : "Suspended"}</Badge>
                      <Badge variant={d.background_check_status === "approved" ? "success" : d.background_check_status === "rejected" ? "destructive" : "secondary"} className="capitalize">{d.background_check_status}</Badge>
                    </div>
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap gap-1.5">
                  <Button variant="outline" size="sm" onClick={() => setSelected(d)}><Eye className="h-3.5 w-3.5" /> View</Button>
                  {!d.is_verified && <Button variant="gold" size="sm" onClick={() => action(d.id, "approve")}><Check className="h-3.5 w-3.5" /> Approve</Button>}
                  {d.is_available ? (
                    <Button variant="outline" size="sm" onClick={() => action(d.id, "suspend")}><X className="h-3.5 w-3.5" /> Suspend</Button>
                  ) : (
                    <Button variant="outline" size="sm" onClick={() => action(d.id, "reinstate")}><Check className="h-3.5 w-3.5" /> Reinstate</Button>
                  )}
                  <Button variant="outline" size="sm" onClick={() => action(d.id, "redflag")}><Flag className="h-3.5 w-3.5" /> Redflag</Button>
                  <Button variant="outline" size="sm" className="text-destructive" onClick={() => remove(d.id)}><Trash2 className="h-3.5 w-3.5" /> Delete</Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>Driver details</DialogTitle></DialogHeader>
          {selected && (
            <div className="space-y-4 text-sm">
              <div className="flex items-start gap-4">
                <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-full bg-muted">
                  {selected.photo_url ? <Image src={selected.photo_url} alt="" fill className="object-cover" /> : <User className="h-10 w-10 m-5 text-muted-foreground" />}
                </div>
                <div>
                  <p className="font-display text-lg font-bold">{selected.full_name}</p>
                  <p className="text-muted-foreground">{selected.phone} · {selected.email}</p>
                  <p className="mt-1 text-muted-foreground">Experience: {selected.years_of_experience} years</p>
                </div>
              </div>
              <div>
                <p className="font-semibold">License</p>
                <p className="text-muted-foreground">{selected.license_number || "—"} · Expires {selected.license_expiry || "—"}</p>
              </div>
              <div>
                <p className="font-semibold">Languages</p>
                <p className="text-muted-foreground">{(selected.languages ?? []).join(", ") || "—"}</p>
              </div>
              <div>
                <p className="font-semibold">Specialties</p>
                <p className="text-muted-foreground">{(selected.specialties ?? []).join(", ") || "—"}</p>
              </div>
              {selected.bio && (
                <div>
                  <p className="font-semibold">Bio</p>
                  <p className="text-muted-foreground">{selected.bio}</p>
                </div>
              )}
              <div>
                <p className="font-semibold">Owner</p>
                <p className="text-muted-foreground">{selected.owner?.name} · {selected.owner?.email}</p>
              </div>
              <div className="flex gap-2 pt-2">
                <Badge variant={selected.is_verified ? "success" : "secondary"}>{selected.is_verified ? "Verified" : "Pending"}</Badge>
                <Badge variant={selected.is_available ? "success" : "warning"}>{selected.is_available ? "Available" : "Suspended"}</Badge>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </main>
  );
}
