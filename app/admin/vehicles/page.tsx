"use client";

import Image from "next/image";
import { useState } from "react";
import { toast } from "sonner";
import { BadgeCheck, Check, Flag, Star, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { useAllUsers, useVehicles } from "@/lib/lookup";
import { useApp } from "@/lib/store";
import { formatMoney } from "@/lib/utils";
import type { VehicleStatus } from "@/types";

const STATUS_VARIANT: Record<VehicleStatus, "success" | "secondary" | "warning" | "info"> = {
  available: "success",
  unavailable: "secondary",
  maintenance: "warning",
  pending_approval: "info",
};

export default function AdminVehiclesPage() {
  const currency = useApp((s) => s.currency);
  const [filter, setFilter] = useState<VehicleStatus | "">("");

  const vehicles = useVehicles();
  const users = useAllUsers();
  const list = vehicles.filter((v) => !filter || v.status === filter);
  const pending = list.filter((v) => v.status === "pending_approval");

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-extrabold tracking-tight">Vehicle Management</h1>
          <p className="text-sm text-muted-foreground">{list.length} listings · approve, feature, flag</p>
        </div>
        <Select value={filter} onChange={(e) => setFilter(e.target.value as VehicleStatus | "")} className="w-full sm:w-52">
          <option value="">All statuses</option>
          <option value="pending_approval">Pending approval</option>
          <option value="available">Available</option>
          <option value="unavailable">Unavailable</option>
          <option value="maintenance">Maintenance</option>
        </Select>
      </div>

      {pending.length > 0 && (
        <div className="space-y-3">
          <h2 className="font-display text-sm font-bold uppercase tracking-wider text-gold-600 dark:text-gold">
            Approval queue
          </h2>
          {pending.map((v) => (
            <Card key={v.id} className="border-gold/40">
              <CardContent className="flex flex-wrap items-center gap-4 p-4">
                <div className="relative h-16 w-24 shrink-0 overflow-hidden rounded-lg bg-muted">
                  <Image src={v.images[0]} alt="" fill sizes="96px" className="object-cover" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-display font-bold">{v.make} {v.model} · {v.year}</p>
                  <p className="text-xs text-muted-foreground">
                    {v.plate} · {v.location} · by {users.find((u) => u.id === v.ownerId)?.name}
                  </p>
                </div>
                <p className="shrink-0 font-display font-bold">{formatMoney(v.pricePerDay, currency)}/day</p>
                <div className="shrink-0 flex gap-2">
                  <Button variant="gold" size="sm" onClick={() => toast.success(`${v.make} ${v.model} approved & live`)}>
                    <Check className="h-3.5 w-3.5" /> Approve
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => toast.success("Listing rejected — owner notified")}>
                    <X className="h-3.5 w-3.5" /> Reject
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="p-4">Vehicle</th>
                  <th className="p-4">Owner</th>
                  <th className="p-4">Location</th>
                  <th className="p-4">Price/day</th>
                  <th className="p-4">Rating</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {list.map((v) => (
                  <tr key={v.id} className="border-b border-border/60 last:border-0 hover:bg-secondary/40">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="relative h-10 w-16 shrink-0 overflow-hidden rounded-md bg-muted">
                          <Image src={v.images[0]} alt="" fill sizes="64px" className="object-cover" />
                        </div>
                        <div>
                          <p className="font-semibold">{v.make} {v.model}</p>
                          <p className="text-xs text-muted-foreground">{v.plate} · {v.year}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-xs">{users.find((u) => u.id === v.ownerId)?.name}</td>
                    <td className="p-4 text-xs">{v.location}</td>
                    <td className="p-4 font-medium">{formatMoney(v.pricePerDay, currency)}</td>
                    <td className="p-4">
                      {v.rating > 0 ? (
                        <span className="flex items-center gap-1 text-xs font-semibold">
                          <Star className="h-3.5 w-3.5 fill-gold text-gold" /> {v.rating.toFixed(1)}
                        </span>
                      ) : "—"}
                    </td>
                    <td className="p-4">
                      <Badge variant={STATUS_VARIANT[v.status]} className="capitalize">
                        {v.status.replace("_", " ")}
                      </Badge>
                    </td>
                    <td className="p-4">
                      <div className="flex justify-end gap-1.5">
                        {!v.verified && (
                          <Button variant="ghost" size="sm" onClick={() => toast.success("Marked verified")}>
                            <BadgeCheck className="h-3.5 w-3.5" />
                          </Button>
                        )}
                        <Button variant="ghost" size="sm" onClick={() => toast.success("Featured on homepage")}>
                          <Star className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="sm" className="text-destructive" onClick={() => toast.info("Listing flagged for review")}>
                          <Flag className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
