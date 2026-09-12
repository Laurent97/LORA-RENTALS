"use client";

import Image from "next/image";
import { useState } from "react";
import { toast } from "sonner";
import { Car, ImagePlus, Pencil, Plus, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { EmptyState } from "@/components/empty-state";
import Link from "next/link";
import { CAR_TYPES, FUEL_TYPES, RWANDA_LOCATIONS, TRANSMISSIONS } from "@/lib/constants";
import { useVehicles } from "@/lib/lookup";
import { useApp } from "@/lib/store";
import { formatMoney } from "@/lib/utils";
import type { CarType, FuelType, Transmission, Vehicle, VehicleStatus } from "@/types";

const STATUS_VARIANT: Record<VehicleStatus, "success" | "secondary" | "warning" | "info"> = {
  available: "success",
  unavailable: "secondary",
  maintenance: "warning",
  pending_approval: "info",
};

export default function FleetPage() {
  const { user, currency, addVehicle } = useApp();
  const [addOpen, setAddOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  if (!user) return null;

  const fleet = useVehicles().filter((v) => v.ownerId === user.id);

  const submit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (user.kycStatus !== "verified") {
      toast.error("Complete KYC verification before listing a vehicle.");
      return;
    }
    setSaving(true);
    const fd = new FormData(e.currentTarget);
    const vehicle: Vehicle = {
      id: crypto.randomUUID(),
      ownerId: user.id,
      make: String(fd.get("make") ?? "").trim(),
      model: String(fd.get("model") ?? "").trim(),
      year: Number(fd.get("year")),
      plate: String(fd.get("plate") ?? "").trim().toUpperCase(),
      type: fd.get("type") as CarType,
      transmission: fd.get("transmission") as Transmission,
      fuel: fd.get("fuel") as FuelType,
      seats: Number(fd.get("seats")),
      pricePerDay: Number(fd.get("pricePerDay")),
      location: String(fd.get("location") ?? ""),
      images: ["https://images.unsplash.com/photo-1494976388531-d1058494cdd8?f_auto&q_auto&w_1200"],
      features: [],
      description: String(fd.get("description") ?? "").trim(),
      status: "pending_approval",
      verified: false,
      rating: 0,
      reviewCount: 0,
      tripsCompleted: 0,
      paymentMethods: ["cash", "momo", "card"],
      airportApproved: false,
      createdAt: new Date().toISOString(),
    };
    addVehicle(vehicle);
    setSaving(false);
    setAddOpen(false);
    e.currentTarget.reset();
    toast.success("Vehicle submitted — an admin will review & approve it.");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-extrabold tracking-tight">My Fleet</h1>
          <p className="text-sm text-muted-foreground">{fleet.length} vehicle{fleet.length !== 1 ? "s" : ""} listed</p>
        </div>
        <Button variant="gold" onClick={() => { if (user.kycStatus !== "verified") toast.error("Complete KYC verification before listing a vehicle."); else setAddOpen(true); }}>
          <Plus className="h-4 w-4" /> Add vehicle
        </Button>
      </div>

      {user.kycStatus !== "verified" && (
        <Card className="border-amber-500/40 bg-amber-500/10">
          <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
            <p className="text-sm"><strong>KYC verification required.</strong> Your documents must be approved before you can list a vehicle.</p>
            <Link href="/owner/profile"><Button variant="outline" size="sm">Open Profile &amp; KYC</Button></Link>
          </CardContent>
        </Card>
      )}

      {fleet.length === 0 ? (
        <EmptyState
          icon={Car}
          title="No vehicles yet"
          description="Add your first car and start earning — listings go live after admin approval."
          actionLabel="Add vehicle"
          actionHref="#"
        />
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {fleet.map((v) => (
            <Card key={v.id} className="overflow-hidden">
              <div className="relative aspect-[16/9] bg-muted">
                <Image src={v.images[0]} alt="" fill className="object-cover" />
                <div className="absolute left-3 top-3">
                  <Badge variant={STATUS_VARIANT[v.status]} className="bg-card/90 backdrop-blur capitalize">
                    {v.status.replace("_", " ")}
                  </Badge>
                </div>
              </div>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="min-w-0">
                    <p className="font-display font-bold">{v.make} {v.model}</p>
                    <p className="text-xs text-muted-foreground">{v.plate} · {v.location}</p>
                  </div>
                  <p className="shrink-0 font-display font-bold text-navy-800 dark:text-gold">
                    {formatMoney(v.pricePerDay, currency)}<span className="text-xs font-normal text-muted-foreground">/day</span>
                  </p>
                </div>
                <div className="mt-4 flex gap-2 border-t border-border pt-3">
                  <Button variant="outline" size="sm" className="flex-1" onClick={() => toast.info("Edit form — same as Add vehicle")}>
                    <Pencil className="h-3.5 w-3.5" /> Edit
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive"
                    onClick={() => toast.success("Vehicle removed (demo)")}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add vehicle dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-2xl" onClose={() => setAddOpen(false)}>
          <DialogHeader>
            <DialogTitle>Add a vehicle</DialogTitle>
            <DialogDescription>
              Photos will upload to Cloudinary when connected. Admin approval required before going live.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={submit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-3">
              <div><Label className="mb-1.5 block">Make</Label><Input name="make" required placeholder="Toyota" /></div>
              <div><Label className="mb-1.5 block">Model</Label><Input name="model" required placeholder="RAV4" /></div>
              <div><Label className="mb-1.5 block">Year</Label><Input name="year" required type="number" min={2000} max={2027} placeholder="2022" /></div>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <div><Label className="mb-1.5 block">Plate</Label><Input name="plate" required placeholder="RAE 000 A" /></div>
              <div>
                <Label className="mb-1.5 block">Type</Label>
                <Select name="type" required>{CAR_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}</Select>
              </div>
              <div><Label className="mb-1.5 block">Seats</Label><Input name="seats" required type="number" min={2} max={30} placeholder="5" /></div>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <Label className="mb-1.5 block">Transmission</Label>
                <Select name="transmission" required>{TRANSMISSIONS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}</Select>
              </div>
              <div>
                <Label className="mb-1.5 block">Fuel</Label>
                <Select name="fuel" required>{FUEL_TYPES.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}</Select>
              </div>
              <div><Label className="mb-1.5 block">Price/day (RWF)</Label><Input name="pricePerDay" required type="number" min={10000} step={1000} placeholder="75000" /></div>
            </div>
            <div>
              <Label className="mb-1.5 block">Location</Label>
              <Select name="location" required>{RWANDA_LOCATIONS.map((l) => <option key={l} value={l}>{l}</option>)}</Select>
            </div>
            {/* LocationAutocomplete is used for customer-facing search; the fleet form keeps a plain select for speed. */}
            <div>
              <Label className="mb-1.5 block">Description</Label>
              <Textarea name="description" placeholder="Tell renters what makes this car great…" />
            </div>
            <div className="flex items-center justify-between rounded-xl border border-dashed border-border p-4">
              <div className="flex items-center gap-3">
                <ImagePlus className="h-5 w-5 text-muted-foreground" />
                <p className="text-sm"><span className="font-semibold">Photos</span> · up to 8, Cloudinary-optimized</p>
              </div>
              <Button type="button" variant="outline" size="sm" onClick={() => toast.info("Cloudinary widget plugs in here")}>
                Upload
              </Button>
            </div>
            <Button type="submit" variant="gold" className="w-full" disabled={saving}>
              {saving ? "Submitting…" : "Submit for approval"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
