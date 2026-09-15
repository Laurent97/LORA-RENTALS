"use client";

import { useEffect, useState } from "react";
import { CalendarDays, Trash } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { getSupabase } from "@/lib/supabase/client";

const nav = [
  { href: "/driver/dashboard", label: "Dashboard", icon: CalendarDays },
  { href: "/driver/bookings", label: "Bookings", icon: CalendarDays },
  { href: "/driver/earnings", label: "Earnings", icon: CalendarDays },
  { href: "/driver/availability", label: "Availability", icon: CalendarDays },
];

export default function DriverAvailabilityPage() {
  const [dates, setDates] = useState<string[]>([]);
  const [newDate, setNewDate] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchDates = async () => {
    const sb = getSupabase();
    const s = await sb?.auth.getSession();
    const res = await fetch("/api/driver-availability", {
      headers: { Authorization: `Bearer ${s?.data.session?.access_token ?? ""}` },
    });
    const json = (await res.json().catch(() => ({ unavailable: [] }))) as { unavailable: string[] };
    setDates(json.unavailable ?? []);
    setLoading(false);
  };

  useEffect(() => { void fetchDates(); }, []);

  const add = async () => {
    if (!newDate) return;
    const sb = getSupabase();
    const s = await sb?.auth.getSession();
    const res = await fetch("/api/driver-availability", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${s?.data.session?.access_token ?? ""}`,
      },
      body: JSON.stringify({ date: newDate, reason: "Driver marked unavailable" }),
    });
    if (res.ok) {
      setNewDate("");
      await fetchDates();
    } else {
      const json = await res.json().catch(() => ({}));
      alert(json.error || "Could not add");
    }
  };

  const remove = async (date: string) => {
    const sb = getSupabase();
    const s = await sb?.auth.getSession();
    const res = await fetch(`/api/driver-availability?date=${encodeURIComponent(date)}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${s?.data.session?.access_token ?? ""}` },
    });
    if (res.ok) {
      await fetchDates();
    }
  };

  return (
    <DashboardShell role="driver" nav={nav}>
      <div className="p-4 lg:p-8">
        <h1 className="font-display text-2xl font-extrabold">Availability</h1>
        <p className="text-sm text-muted-foreground">Mark dates you are not available for bookings.</p>

        <Card className="mt-6">
          <CardContent className="p-5">
            <div className="flex gap-2">
              <Input type="date" value={newDate} onChange={(e) => setNewDate(e.target.value)} />
              <Button onClick={add} disabled={!newDate}>Mark unavailable</Button>
            </div>
          </CardContent>
        </Card>

        <h2 className="mt-8 font-display text-lg font-bold">Unavailable dates</h2>
        {loading ? (
          <p className="py-10 text-sm text-muted-foreground">Loading…</p>
        ) : dates.length === 0 ? (
          <p className="py-10 text-sm text-muted-foreground">You are available on all dates.</p>
        ) : (
          <div className="mt-4 space-y-2">
            {dates.map((d) => (
              <div key={d} className="flex items-center justify-between rounded-2xl border p-4">
                <span>{new Date(d).toDateString()}</span>
                <Button size="sm" variant="ghost" onClick={() => remove(d)}><Trash className="h-4 w-4 text-destructive" /></Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
