"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { Download, Loader2, Plus, Printer, RefreshCw } from "lucide-react";
import { toPng } from "html-to-image";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useApp } from "@/lib/store";
import { getSupabase } from "@/lib/supabase/client";
import { BRAND } from "@/lib/constants";
import { fmtDate } from "@/lib/utils";

interface DriverRow {
  id: string;
  owner_id: string;
  user_id?: string;
  full_name: string;
  photo_url: string | null;
  license_number: string | null;
  languages: string[];
  phone: string | null;
  email: string | null;
  years_of_experience: number;
  is_independent: boolean;
}

interface BadgeRow {
  id: string;
  badge_number: string;
  verification_token: string;
  qr_url: string | null;
  status: string;
  issued_at: string;
  expires_at: string;
}

export default function OwnerDriverBadgePage() {
  const { id } = useParams() as { id: string };
  const { user } = useApp();
  const [driver, setDriver] = useState<DriverRow | null>(null);
  const [badge, setBadge] = useState<BadgeRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const badgeRef = useRef<HTMLDivElement>(null);

  const token = async () => {
    const sb = getSupabase();
    const s = sb ? await sb.auth.getSession() : null;
    return s?.data.session?.access_token;
  };

  const load = async () => {
    const sb = getSupabase();
    if (!sb || !user) return;
    const { data: d } = await sb
      .from("drivers")
      .select("*")
      .eq("id", id)
      .eq("owner_id", user.id)
      .single();
    setDriver(d as unknown as DriverRow | null);
    if (d) {
      const { data: b } = await sb
        .from("driver_badges")
        .select("*")
        .eq("driver_id", id)
        .eq("status", "active")
        .maybeSingle();
      setBadge(b as unknown as BadgeRow | null);
    }
    setLoading(false);
  };

  useEffect(() => {
    void load();
  }, [id, user]);

  const generate = async () => {
    const t = await token();
    setWorking(true);
    const res = await fetch("/api/badges/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${t}` },
      body: JSON.stringify({ driverId: id }),
    });
    const json = (await res.json().catch(() => ({}))) as { badge?: BadgeRow; error?: string };
    if (!res.ok) {
      toast.error(json.error ?? "Could not generate badge");
      setWorking(false);
      return;
    }
    setBadge(json.badge as BadgeRow);
    toast.success("Badge generated");
    setWorking(false);
  };

  const reissue = async () => {
    if (!window.confirm("This will revoke the current badge and create a new one. Continue?")) return;
    const t = await token();
    setWorking(true);
    const res = await fetch("/api/badges/reissue", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${t}` },
      body: JSON.stringify({ driverId: id }),
    });
    const json = (await res.json().catch(() => ({}))) as { badge?: BadgeRow; error?: string };
    if (!res.ok) {
      toast.error(json.error ?? "Could not reissue badge");
      setWorking(false);
      return;
    }
    setBadge(json.badge as BadgeRow);
    toast.success("Badge reissued");
    setWorking(false);
  };

  const handlePrint = () => {
    if (!driver) return;
    const w = window.open("", "_blank");
    if (!w) return;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>LORA Driver Badge - ${driver.full_name}</title>
        <style>
          @media print {
            body { margin: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          }
          body { margin: 0; background: #0A1F44; font-family: system-ui, sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; }
          .badge { width: 480px; border-radius: 16px; overflow: hidden; border: 4px solid #D4AF37; background: #0A1F44; color: #fff; box-shadow: 0 20px 40px rgba(0,0,0,0.4); }
          .header { background: #0A1F44; padding: 24px; text-align: center; border-bottom: 1px solid #D4AF37; }
          .brand { font-size: 28px; font-weight: 800; color: #D4AF37; letter-spacing: 2px; margin: 0; }
          .subtitle { font-size: 10px; text-transform: uppercase; letter-spacing: 4px; color: #C0C6CC; margin: 4px 0 0; }
          .body { padding: 32px; display: flex; flex-direction: column; gap: 20px; }
          .row { display: flex; align-items: center; gap: 16px; }
          .photo { width: 96px; height: 96px; border-radius: 50%; border: 2px solid #D4AF37; background: #C0C6CC; object-fit: cover; }
          .name { font-size: 22px; font-weight: 700; color: #D4AF37; margin: 0; }
          .meta { color: #C0C6CC; font-size: 13px; margin: 4px 0 0; }
          .field { font-size: 13px; color: #fff; margin: 4px 0; }
          .label { color: #D4AF37; font-weight: 600; }
          .qr-wrap { background: #fff; border-radius: 8px; padding: 12px; text-align: center; }
          .qr { width: 160px; height: 160px; }
          .footer { text-align: center; font-size: 11px; color: #C0C6CC; text-transform: uppercase; letter-spacing: 1px; padding: 12px 0; border-top: 1px solid rgba(212,175,55,0.4); margin-top: 8px; }
          .footer a { color: #C0C6CC; text-decoration: none; }
        </style>
      </head>
      <body>
        <div class="badge">
          <div class="header">
            <p class="brand">LORA RENTALS</p>
            <p class="subtitle">Verified Chauffeur</p>
          </div>
          <div class="body">
            <div class="row">
              <img class="photo" src="${driver.photo_url ?? ""}" alt="" onerror="this.style.display='none'" />
              <div>
                <p class="name">${driver.full_name}</p>
                <p class="meta">Badge ${badge?.badge_number ?? "—"}</p>
              </div>
            </div>
            <div>
              <p class="field"><span class="label">License:</span> ${driver.license_number ?? "—"}</p>
              <p class="field"><span class="label">Languages:</span> ${driver.languages?.join(", ") ?? "—"}</p>
              <p class="field"><span class="label">Experience:</span> ${driver.years_of_experience} years</p>
              ${driver.phone ? `<p class="field"><span class="label">Phone:</span> ${driver.phone}</p>` : ""}
              ${driver.email ? `<p class="field"><span class="label">Email:</span> ${driver.email}</p>` : ""}
              <p class="field"><span class="label">Issued:</span> ${badge ? fmtDate(badge.issued_at) : "—"} · <span class="label">Expires:</span> ${badge ? fmtDate(badge.expires_at) : "—"}</p>
            </div>
            ${badge?.qr_url ? `<div class="qr-wrap"><img class="qr" src="${badge.qr_url}" alt="QR" /></div>` : ""}
            <div class="footer">
              <p>${BRAND.siteUrl}</p>
              <p>${BRAND.supportEmail} · ${BRAND.phone}</p>
            </div>
          </div>
        </div>
        <script>window.addEventListener("load", () => setTimeout(() => window.print(), 300));</script>
      </body>
      </html>
    `;
    w.document.open();
    w.document.write(html);
    w.document.close();
  };

  const downloadPng = useCallback(async () => {
    if (!badgeRef.current || !driver) return;
    setWorking(true);
    try {
      const dataUrl = await toPng(badgeRef.current, { pixelRatio: 3, cacheBust: true });
      const link = document.createElement("a");
      const name = driver.full_name.replace(/\s+/g, "-").toLowerCase() || "driver";
      link.download = `lora-badge-${name}.png`;
      link.href = dataUrl;
      link.click();
      toast.success("Badge PNG downloaded");
    } catch (err) {
      console.error(err);
      toast.error("Could not create PNG. Try again.");
    } finally {
      setWorking(false);
    }
  }, [driver]);

  if (!user || loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gold" />
      </div>
    );
  }

  if (!driver) {
    return <p className="p-8 text-center text-muted-foreground">Driver not found.</p>;
  }

  const canManage = !driver.is_independent;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <div>
          <h1 className="font-display text-2xl font-extrabold tracking-tight">Driver Badge</h1>
          <p className="text-sm text-muted-foreground">{driver.full_name}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {canManage && (
            badge ? (
              <>
                <Button variant="outline" onClick={handlePrint} disabled={working}>
                  <Printer className="mr-2 h-4 w-4" /> Print
                </Button>
                <Button variant="outline" onClick={downloadPng} disabled={working}>
                  <Download className="mr-2 h-4 w-4" /> Download PNG
                </Button>
                <Button variant="outline" onClick={reissue} disabled={working}>
                  <RefreshCw className="mr-2 h-4 w-4" /> Reissue
                </Button>
              </>
            ) : (
              <Button variant="gold" onClick={generate} disabled={working}>
                <Plus className="mr-2 h-4 w-4" /> {badge ? "Download badge" : "Generate badge"}
              </Button>
            )
          )}
        </div>
      </div>

      <div className="mx-auto w-[480px]">
        <Card id="badge-print" ref={badgeRef} className="overflow-hidden border-4 border-gold bg-navy-800 text-white shadow-2xl">
          <div className="bg-navy p-4 text-center">
            <h2 className="font-display text-2xl font-extrabold text-gold tracking-wider">LORA RENTALS</h2>
            <p className="text-[10px] uppercase tracking-[0.3em] text-silver">Verified Chauffeur</p>
          </div>
          <CardContent className="space-y-4 p-6">
            <div className="flex items-center gap-4">
              <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-full border-2 border-gold bg-silver">
                {driver.photo_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={driver.photo_url} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-navy-800">
                    <span className="text-2xl font-bold">{driver.full_name.slice(0, 2).toUpperCase()}</span>
                  </div>
                )}
              </div>
              <div>
                <p className="font-display text-xl font-bold text-gold">{driver.full_name}</p>
                <p className="text-sm text-silver">Badge {badge?.badge_number ?? "—"}</p>
              </div>
            </div>
            <div className="space-y-1.5 text-sm">
              <p className="text-silver"><span className="text-gold">Languages:</span> {driver.languages?.join(", ") || "—"}</p>
              <p className="text-silver"><span className="text-gold">License:</span> {driver.license_number || "—"}</p>
              <p className="text-silver"><span className="text-gold">Experience:</span> {driver.years_of_experience} years</p>
              {driver.phone && <p className="text-silver"><span className="text-gold">Phone:</span> {driver.phone}</p>}
              {driver.email && <p className="text-silver"><span className="text-gold">Email:</span> {driver.email}</p>}
              <p className="pt-1 text-xs text-silver">
                Issued {badge ? fmtDate(badge.issued_at) : "—"} · Expires {badge ? fmtDate(badge.expires_at) : "—"}
              </p>
            </div>
            {badge?.qr_url ? (
              <div className="flex justify-center rounded-lg bg-white p-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={badge.qr_url} alt="Badge QR" className="h-44 w-44" />
              </div>
            ) : (
              <div className="rounded-lg border border-dashed border-silver p-6 text-center text-sm text-silver">
                {canManage ? "No QR code yet. Generate a badge to preview it here." : "No active badge yet. It will be issued by an admin or vehicle owner."}
              </div>
            )}
            <div className="border-t border-gold/30 pt-3 text-center text-[10px] uppercase tracking-wider text-silver">
              <p>{BRAND.siteUrl}</p>
              <p>{BRAND.supportEmail} · {BRAND.phone}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
