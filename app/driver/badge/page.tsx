"use client";

import { useEffect, useState } from "react";
import { Award, Banknote, CalendarDays, Loader2, Shield } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { useApp } from "@/lib/store";
import { getSupabase } from "@/lib/supabase/client";
import { BRAND } from "@/lib/constants";
import { fmtDate } from "@/lib/utils";

interface DriverRow {
  id: string;
  full_name: string;
  photo_url: string | null;
  license_number: string | null;
  languages: string[];
  phone: string | null;
  email: string | null;
  years_of_experience: number;
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

const nav = [
  { href: "/driver/dashboard", label: "Dashboard", icon: Award },
  { href: "/driver/availability", label: "Availability", icon: CalendarDays },
  { href: "/driver/bookings", label: "Bookings", icon: CalendarDays },
  { href: "/driver/earnings", label: "Earnings", icon: Banknote },
  { href: "/driver/badge", label: "Badge", icon: Shield },
];

export default function DriverBadgePage() {
  const { user } = useApp();
  const [driver, setDriver] = useState<DriverRow | null>(null);
  const [badge, setBadge] = useState<BadgeRow | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const sb = getSupabase();
      if (!sb || !user) {
        setLoading(false);
        return;
      }
      const { data: d } = await sb
        .from("drivers")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();
      setDriver(d as unknown as DriverRow | null);
      if (d) {
        const { data: b } = await sb
          .from("driver_badges")
          .select("*")
          .eq("driver_id", d.id)
          .eq("status", "active")
          .maybeSingle();
        setBadge(b as unknown as BadgeRow | null);
      }
      setLoading(false);
    };
    void load();
  }, [user]);

  if (!user || loading) {
    return (
      <DashboardShell role="driver" nav={nav}>
        <div className="flex min-h-[40vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-gold" />
        </div>
      </DashboardShell>
    );
  }

  if (!driver) {
    return (
      <DashboardShell role="driver" nav={nav}>
        <p className="p-8 text-center text-muted-foreground">
          Your driver profile was not found. Contact support if you believe this is an error.
        </p>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell role="driver" nav={nav}>
      <div className="space-y-6 p-4 lg:p-8">
        <div className="print:hidden">
          <h1 className="font-display text-2xl font-extrabold tracking-tight">My Driver Badge</h1>
          <p className="text-sm text-muted-foreground">{driver.full_name}</p>
        </div>

        <div className="mx-auto w-[480px]">
          <Card className="overflow-hidden border-4 border-gold bg-navy-800 text-white shadow-2xl">
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
                  No active badge yet. Your vehicle owner will issue one once your application is approved.
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
    </DashboardShell>
  );
}
