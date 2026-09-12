"use client";

import { useState } from "react";
import { CalendarCheck } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { AvailabilityCalendar } from "@/components/availability-calendar";
import { EmptyState } from "@/components/empty-state";
import { useVehicles } from "@/lib/lookup";
import { useApp } from "@/lib/store";

export default function OwnerAvailabilityPage() {
  const { user } = useApp();
  const fleet = useVehicles().filter((v) => v.ownerId === user?.id);
  const [vehicleId, setVehicleId] = useState<string>("");

  if (!user) return null;
  const selected = fleet.find((v) => v.id === vehicleId) ?? fleet[0];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-extrabold tracking-tight">Availability</h1>
        <p className="text-sm text-muted-foreground">
          Block dates when a vehicle isn't rentable. Booked dates are blocked automatically.
        </p>
      </div>

      {fleet.length === 0 ? (
        <EmptyState
          icon={CalendarCheck}
          title="No vehicles yet"
          description="Add a vehicle to your fleet first, then manage its calendar here."
        />
      ) : (
        <>
          <Card>
            <CardContent className="flex flex-wrap items-center gap-3 p-4">
              <span className="text-sm font-semibold">Vehicle</span>
              <Select
                value={selected?.id ?? ""}
                onChange={(e) => setVehicleId(e.target.value)}
                className="w-auto min-w-56"
              >
                {fleet.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.make} {v.model} · {v.plate}
                  </option>
                ))}
              </Select>
            </CardContent>
          </Card>
          {selected && (
            <div className="max-w-md">
              <AvailabilityCalendar vehicleId={selected.id} mode="manage" />
            </div>
          )}
        </>
      )}
    </div>
  );
}
