"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { CheckCircle2, Phone, User, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getSupabase } from "@/lib/supabase/client";

export default function AdminDriversPage() {
  const [drivers, setDrivers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("pending");

  const fetchDrivers = async () => {
    const sb = getSupabase();
    const s = await sb?.auth.getSession();
    const res = await fetch("/api/admin/drivers", {
      headers: { Authorization: `Bearer ${s?.data.session?.access_token ?? ""}` },
    });
    const json = (await res.json().catch(() => ({ drivers: [] }))) as { drivers: any[] };
    setDrivers(json.drivers ?? []);
    setLoading(false);
  };

  useEffect(() => { void fetchDrivers(); }, []);

  const act = async (id: string, action: string) => {
    const sb = getSupabase();
    const s = await sb?.auth.getSession();
    const res = await fetch("/api/admin/drivers", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${s?.data.session?.access_token ?? ""}`,
      },
      body: JSON.stringify({ id, action }),
    });
    if (res.ok) {
      await fetchDrivers();
    } else {
      const json = await res.json().catch(() => ({}));
      alert(json.error || "Action failed");
    }
  };

  const filtered = drivers.filter((d) => {
    if (filter === "pending") return d.kyc_status === "submitted" && !d.is_verified;
    if (filter === "verified") return d.is_verified;
    return true;
  });

  if (loading) return <p className="p-10 text-sm text-muted-foreground">Loading drivers…</p>;

  return (
    <div className="space-y-6 p-4 lg:p-8">
      <h1 className="font-display text-2xl font-extrabold">Driver KYC & Management</h1>

      <Tabs value={filter} onValueChange={setFilter}>
        <TabsList>
          <TabsTrigger value="pending">Pending ({drivers.filter((d) => d.kyc_status === "submitted" && !d.is_verified).length})</TabsTrigger>
          <TabsTrigger value="verified">Verified ({drivers.filter((d) => d.is_verified).length})</TabsTrigger>
          <TabsTrigger value="all">All ({drivers.length})</TabsTrigger>
        </TabsList>
        <TabsContent value={filter}>
          <div className="space-y-4">
            {filtered.length === 0 ? (
              <p className="text-sm text-muted-foreground">No drivers in this queue.</p>
            ) : (
              filtered.map((d) => (
                <Card key={d.id}>
                  <CardContent className="p-5">
                    <div className="flex flex-wrap items-start gap-4">
                      <div className="relative h-16 w-16 overflow-hidden rounded-full bg-muted">
                        {d.photo_url ? <Image src={d.photo_url} alt="" fill className="object-cover" /> : <div className="flex h-full w-full items-center justify-center"><User className="h-6 w-6 text-muted-foreground" /></div>}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-semibold">{d.full_name}</p>
                          <Badge variant={d.is_verified ? "success" : "warning"}>{d.is_verified ? "Verified" : d.kyc_status}</Badge>
                          {d.is_independent && <Badge variant="outline">Independent</Badge>}
                        </div>
                        <p className="text-sm text-muted-foreground">{d.years_of_experience} yrs · {d.languages?.join(" · ")} · {d.home_city}</p>
                        <p className="text-sm text-muted-foreground"><Phone className="inline h-3 w-3" /> {d.phone}</p>
                        <p className="text-sm text-muted-foreground">License: {d.license_number} · Rate: {d.daily_rate_rwf} RWF/day</p>

                        {d.license_photo_url && (
                          <a href={d.license_photo_url} target="_blank" rel="noopener noreferrer" className="text-xs text-navy-800 underline dark:text-gold">License photo</a>
                        )}
                        {d.national_id_url && (
                          <a href={d.national_id_url} target="_blank" rel="noopener noreferrer" className="ml-2 text-xs text-navy-800 underline dark:text-gold">National ID</a>
                        )}
                        {d.passport_photo_url && (
                          <a href={d.passport_photo_url} target="_blank" rel="noopener noreferrer" className="ml-2 text-xs text-navy-800 underline dark:text-gold">Passport</a>
                        )}
                        {d.criminal_record_url && (
                          <a href={d.criminal_record_url} target="_blank" rel="noopener noreferrer" className="ml-2 text-xs text-navy-800 underline dark:text-gold">Criminal record</a>
                        )}
                      </div>
                      <div className="flex gap-2">
                        {!d.is_verified ? (
                          <Button size="sm" variant="gold" onClick={() => act(d.id, "approve")}><CheckCircle2 className="h-4 w-4" /> Approve</Button>
                        ) : (
                          <Button size="sm" variant="outline" onClick={() => act(d.id, d.is_available ? "suspend" : "reinstate")}>{d.is_available ? "Suspend" : "Reinstate"}</Button>
                        )}
                        <Button size="sm" variant="ghost" className="text-destructive" onClick={() => act(d.id, "redflag")}><XCircle className="h-4 w-4" /> Red flag</Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
