"use client";

import { useEffect, useState } from "react";
import { Award, Ban, Download, Eye, RefreshCw, User } from "lucide-react";
import { toast } from "sonner";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { getSupabase } from "@/lib/supabase/client";
import { fmtDate } from "@/lib/utils";

interface AdminBadge {
  id: string;
  badge_number: string;
  status: string;
  issued_at: string;
  expires_at: string;
  verify_count: number;
  driver: {
    id: string;
    full_name: string;
    photo_url: string | null;
    license_number: string | null;
    languages: string[];
  } | null;
  owner: {
    id: string;
    name: string;
    email: string;
  } | null;
}

export default function AdminBadgesPage() {
  const [badges, setBadges] = useState<AdminBadge[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<AdminBadge | null>(null);
  const [revokeReason, setRevokeReason] = useState("");
  const [working, setWorking] = useState(false);

  const token = async () => {
    const sb = getSupabase();
    const s = sb ? await sb.auth.getSession() : null;
    return s?.data.session?.access_token;
  };

  const fetchBadges = async () => {
    const t = await token();
    const res = await fetch("/api/admin/badges", { headers: t ? { Authorization: `Bearer ${t}` } : {} });
    const json = (await res.json().catch(() => ({}))) as { badges?: AdminBadge[]; error?: string };
    setBadges(json.badges ?? []);
    setLoading(false);
  };

  useEffect(() => {
    void fetchBadges();
  }, []);

  const statusVariant = (status: string) => {
    switch (status) {
      case "active":
        return "success";
      case "suspended":
        return "warning";
      case "revoked":
        return "destructive";
      case "expired":
        return "secondary";
      default:
        return "secondary";
    }
  };

  const revoke = async (badgeId: string) => {
    const t = await token();
    setWorking(true);
    const res = await fetch("/api/badges/revoke", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${t}` },
      body: JSON.stringify({ badgeId, reason: revokeReason }),
    });
    const json = (await res.json().catch(() => ({}))) as { error?: string };
    setWorking(false);
    if (!res.ok) {
      toast.error(json.error ?? "Revoke failed");
      return;
    }
    toast.success("Badge revoked");
    setSelected(null);
    setRevokeReason("");
    await fetchBadges();
  };

  const reissue = async (driverId: string) => {
    if (!window.confirm("Revoke the current badge and generate a new one?")) return;
    const t = await token();
    setWorking(true);
    const res = await fetch("/api/badges/reissue", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${t}` },
      body: JSON.stringify({ driverId }),
    });
    const json = (await res.json().catch(() => ({}))) as { error?: string };
    setWorking(false);
    if (!res.ok) {
      toast.error(json.error ?? "Reissue failed");
      return;
    }
    toast.success("Badge reissued");
    setSelected(null);
    await fetchBadges();
  };

  const openBadge = (driverId: string) => {
    window.open(`/owner/drivers/${driverId}/badge`, "_blank");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-extrabold tracking-tight">Driver Badges</h1>
        <p className="text-sm text-muted-foreground">Manage LORA driver ID badges.</p>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading badges…</p>
      ) : badges.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-sm text-muted-foreground">No badges yet.</CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {badges.map((b) => (
            <Card key={b.id}>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-full bg-muted">
                    {b.driver?.photo_url ? (
                      <Image src={b.driver.photo_url} alt="" fill className="object-cover" />
                    ) : (
                      <User className="h-7 w-7 m-3.5 text-muted-foreground" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-display font-bold truncate">{b.driver?.full_name ?? "Unknown"}</p>
                    <p className="text-xs text-muted-foreground">{b.owner?.name ?? "—"}</p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      <Badge variant={statusVariant(b.status)} className="capitalize">{b.status}</Badge>
                      <Badge variant="secondary">{b.verify_count} scans</Badge>
                    </div>
                  </div>
                </div>
                <div className="mt-3 space-y-1 text-xs text-muted-foreground">
                  <p>{b.badge_number}</p>
                  <p>Issued {fmtDate(b.issued_at)} · Expires {fmtDate(b.expires_at)}</p>
                </div>
                <div className="mt-4 flex flex-wrap gap-1.5">
                  <Button variant="outline" size="sm" onClick={() => setSelected(b)}>
                    <Eye className="h-3.5 w-3.5" /> View
                  </Button>
                  {b.driver && (
                    <Button variant="outline" size="sm" onClick={() => openBadge(b.driver!.id)}>
                      <Download className="h-3.5 w-3.5" /> Badge page
                    </Button>
                  )}
                  {b.status !== "revoked" && (
                    <Button variant="outline" size="sm" onClick={() => setSelected(b)}>
                      <Ban className="h-3.5 w-3.5" /> Revoke
                    </Button>
                  )}
                  <Button variant="outline" size="sm" onClick={() => b.driver && reissue(b.driver.id)}>
                    <RefreshCw className="h-3.5 w-3.5" /> Reissue
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={!!selected} onOpenChange={(o) => { if (!o) { setSelected(null); setRevokeReason(""); } }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              <span className="flex items-center gap-2">
                <Award className="h-5 w-5 text-gold" /> Badge details
              </span>
            </DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-4 text-sm">
              <div className="flex items-start gap-4">
                <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-full bg-muted">
                  {selected.driver?.photo_url ? (
                    <Image src={selected.driver.photo_url} alt="" fill className="object-cover" />
                  ) : (
                    <User className="h-10 w-10 m-5 text-muted-foreground" />
                  )}
                </div>
                <div>
                  <p className="font-display text-lg font-bold">{selected.driver?.full_name ?? "Unknown"}</p>
                  <p className="text-muted-foreground">{selected.badge_number}</p>
                  <p className="mt-1 text-muted-foreground">
                    {fmtDate(selected.issued_at)} → {fmtDate(selected.expires_at)}
                  </p>
                </div>
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                <div>
                  <p className="font-semibold">Owner</p>
                  <p className="text-muted-foreground">{selected.owner?.name ?? "—"} · {selected.owner?.email ?? "—"}</p>
                </div>
                <div>
                  <p className="font-semibold">License</p>
                  <p className="text-muted-foreground">{selected.driver?.license_number ?? "—"}</p>
                </div>
                <div>
                  <p className="font-semibold">Languages</p>
                  <p className="text-muted-foreground">{(selected.driver?.languages ?? []).join(", ") || "—"}</p>
                </div>
                <div>
                  <p className="font-semibold">Verifications</p>
                  <p className="text-muted-foreground">{selected.verify_count}</p>
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <Badge variant={statusVariant(selected.status)} className="capitalize">{selected.status}</Badge>
              </div>

              {selected.status !== "revoked" && (
                <div className="space-y-2 border-t pt-4">
                  <p className="font-semibold">Revoke badge</p>
                  <Input
                    placeholder="Reason (optional)"
                    value={revokeReason}
                    onChange={(e) => setRevokeReason(e.target.value)}
                  />
                  <div className="flex gap-2">
                    <Button variant="destructive" size="sm" disabled={working} onClick={() => revoke(selected.id)}>
                      <Ban className="mr-2 h-3.5 w-3.5" /> Revoke
                    </Button>
                    <Button variant="outline" size="sm" disabled={working} onClick={() => selected.driver && reissue(selected.driver.id)}>
                      <RefreshCw className="mr-2 h-3.5 w-3.5" /> Reissue
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
