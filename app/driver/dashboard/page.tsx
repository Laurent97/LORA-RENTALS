"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Clock, Shield, Star, CalendarDays, Banknote, Award, XCircle } from "lucide-react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { useApp } from "@/lib/store";
import { getSupabase } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

interface DriverRow {
  id: string;
  is_verified: boolean;
  kyc_status: string;
}

const nav = [
  { href: "/driver/dashboard", label: "Dashboard", icon: Award },
  { href: "/driver/availability", label: "Availability", icon: CalendarDays },
  { href: "/driver/bookings", label: "Bookings", icon: CalendarDays },
  { href: "/driver/earnings", label: "Earnings", icon: Banknote },
  { href: "/driver/badge", label: "Badge", icon: Award },
];

export default function DriverDashboardPage() {
  const { user } = useApp();
  const [driver, setDriver] = useState<DriverRow | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const sb = getSupabase();
      if (!sb || !user) {
        setLoading(false);
        return;
      }
      const { data } = await sb
        .from("drivers")
        .select("id, is_verified, kyc_status")
        .eq("id", user.id)
        .maybeSingle();
      setDriver(data as unknown as DriverRow | null);
      setLoading(false);
    };
    void load();
  }, [user]);

  const isVerified = Boolean(driver?.is_verified);
  const isRejected = driver?.kyc_status === "rejected";

  return (
    <DashboardShell role="driver" nav={nav}>
      <div className="space-y-6 p-4 lg:p-8">
        <div>
          <h1 className="font-display text-2xl font-extrabold">Welcome, {user?.name}</h1>
          <p className="text-sm text-muted-foreground">Your driver dashboard.</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <Card>
            <CardContent className="p-5 text-center">
              <Banknote className="mx-auto h-6 w-6 text-gold" />
              <p className="mt-2 text-2xl font-extrabold">0</p>
              <p className="text-xs text-muted-foreground">RWF earned</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5 text-center">
              <CalendarDays className="mx-auto h-6 w-6 text-gold" />
              <p className="mt-2 text-2xl font-extrabold">0</p>
              <p className="text-xs text-muted-foreground">Upcoming trips</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5 text-center">
              <Star className="mx-auto h-6 w-6 text-gold" />
              <p className="mt-2 text-2xl font-extrabold">—</p>
              <p className="text-xs text-muted-foreground">Rating</p>
            </CardContent>
          </Card>
        </div>

        {loading ? null : (
          <div
            className={cn(
              "rounded-2xl border p-6",
              isVerified
                ? "border-emerald-500/30 bg-emerald-50 dark:bg-emerald-900/20"
                : isRejected
                  ? "border-destructive/30 bg-red-50 dark:bg-red-900/20"
                  : "border-gold/30 bg-navy-50 dark:bg-navy-900/20"
            )}
          >
            <div className="flex items-start gap-3">
              {isVerified ? (
                <CheckCircle2 className="h-6 w-6 text-emerald-600" />
              ) : isRejected ? (
                <XCircle className="h-6 w-6 text-destructive" />
              ) : (
                <Clock className="h-6 w-6 text-gold" />
              )}
              <div>
                <h3 className="font-bold text-navy-800 dark:text-gold">Verification status</h3>
                <p className="text-sm text-muted-foreground">
                  {isVerified
                    ? "Verified — your profile is live on the Chauffeurs page and customers can book you."
                    : isRejected
                      ? "Verification was not approved. Please contact support for more information."
                      : "Your application is under review. Once approved, customers can book you."}
                </p>
                {isVerified && (
                  <div className="mt-3 flex gap-2">
                    <Link href="/driver/badge">
                      <Button size="sm" variant="gold"><Award className="mr-2 h-4 w-4" /> View my badge</Button>
                    </Link>
                    <Link href="/tours">
                      <Button size="sm" variant="outline">See my public profile</Button>
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
