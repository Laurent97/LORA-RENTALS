"use client";

import Image from "next/image";
import { notFound, useParams, useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { Camera, CheckCircle2, ClipboardCheck, Fuel, Gauge, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { SignaturePad } from "@/components/signature-pad";
import { getSupabase } from "@/lib/supabase/client";
import { useApp } from "@/lib/store";
import { bookingRef, fmtDate } from "@/lib/utils";
import type { Inspection, InspectionType } from "@/types";

const PHOTO_SECTIONS = ["Front", "Back", "Left", "Right", "Interior", "Odometer", "Fuel gauge"];
const MAX_PHOTOS = 10;

export default function InspectionPage() {
  const { bookingId } = useParams<{ bookingId: string }>();
  const router = useRouter();
  const { user, bookings, vehicles, inspections, addInspection } = useApp();
  const booking = bookings.find((b) => b.id === bookingId);
  const vehicle = booking ? vehicles.find((v) => v.id === booking.vehicleId) : null;

  const [type, setType] = useState<InspectionType>("pickup");
  const [photos, setPhotos] = useState<string[]>([]);
  const [fuel, setFuel] = useState("50");
  const [odometer, setOdometer] = useState("");
  const [notes, setNotes] = useState("");
  const [custSig, setCustSig] = useState<string | null>(null);
  const [ownerSig, setOwnerSig] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  if (!user) return null;
  if (!booking) return notFound();
  const isParty = user.role === "admin" || booking.ownerId === user.id || booking.customerId === user.id;
  if (!isParty) return notFound();

  const existing = inspections.filter((i) => i.bookingId === booking.id);

  const upload = async (files: FileList | null) => {
    if (!files?.length) return;
    const sb = getSupabase();
    for (const file of Array.from(files).slice(0, MAX_PHOTOS - photos.length)) {
      if (sb) {
        const path = `inspections/${booking.id}/${crypto.randomUUID()}.jpg`;
        const { error } = await sb.storage.from("lorarentals").upload(path, file, { contentType: file.type });
        if (!error) {
          const { data } = sb.storage.from("lorarentals").getPublicUrl(path);
          setPhotos((p) => [...p, data.publicUrl]);
          continue;
        }
      }
      // fallback: data URL
      const reader = new FileReader();
      reader.onload = () => setPhotos((p) => [...p, String(reader.result)]);
      reader.readAsDataURL(file);
    }
  };

  const submit = () => {
    if (!photos.length) return toast.error("Add at least one photo");
    if (!custSig || !ownerSig) return toast.error("Both signatures are required");
    setSaving(true);
    const insp: Inspection = {
      id: crypto.randomUUID(),
      bookingId: booking.id,
      type,
      photos,
      customerSignature: custSig,
      ownerSignature: ownerSig,
      notes: notes.trim() || undefined,
      fuelLevel: Number(fuel),
      odometerKm: odometer ? Number(odometer) : undefined,
      createdBy: user.id,
      createdAt: new Date().toISOString(),
    };
    addInspection(insp);
    setSaving(false);
    toast.success(`${type === "pickup" ? "Pickup" : "Return"} inspection saved`);
    router.push(user.role === "owner" ? "/owner/bookings" : "/dashboard/bookings");
  };

  return (
    <main className="container max-w-3xl py-10">
      <div className="mb-6">
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-navy-800 text-gold">
          <ClipboardCheck className="h-6 w-6" />
        </span>
        <h1 className="mt-4 font-display text-2xl font-extrabold">Vehicle Inspection</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {vehicle ? `${vehicle.make} ${vehicle.model} · ${vehicle.plate}` : ""} · {bookingRef(booking.id)} · {fmtDate(booking.startDate)} → {fmtDate(booking.endDate)}
        </p>
      </div>

      {existing.length > 0 && (
        <Card className="mb-6">
          <CardContent className="p-4">
            <p className="text-sm font-semibold">Existing reports</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {existing.map((i) => (
                <Badge key={i.id} variant="secondary" className="capitalize">
                  {i.type} · {fmtDate(i.createdAt)} · {i.photos.length} photos
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="space-y-6">
        <Card>
          <CardContent className="space-y-4 p-5">
            <div>
              <Label className="mb-1.5 block">Inspection type</Label>
              <Select value={type} onChange={(e) => setType(e.target.value as InspectionType)}>
                <option value="pickup">Pickup — before handover</option>
                <option value="return">Return — after handover</option>
              </Select>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label className="mb-1.5 flex items-center gap-1"><Fuel className="h-3.5 w-3.5" /> Fuel level (%)</Label>
                <Input type="number" min={0} max={100} value={fuel} onChange={(e) => setFuel(e.target.value)} />
              </div>
              <div>
                <Label className="mb-1.5 flex items-center gap-1"><Gauge className="h-3.5 w-3.5" /> Odometer (km)</Label>
                <Input type="number" min={0} value={odometer} onChange={(e) => setOdometer(e.target.value)} placeholder="45230" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <p className="font-semibold">Photos ({photos.length}/{MAX_PHOTOS})</p>
              <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()} disabled={photos.length >= MAX_PHOTOS}>
                <Camera className="h-4 w-4" /> Add photos
              </Button>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                multiple
                capture="environment"
                className="hidden"
                onChange={(e) => upload(e.target.files)}
              />
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Cover each section: {PHOTO_SECTIONS.join(" · ")}
            </p>
            {photos.length > 0 && (
              <div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-4">
                {photos.map((src, i) => (
                  <div key={i} className="group relative aspect-square overflow-hidden rounded-xl border border-border">
                    <Image src={src} alt={`Inspection photo ${i + 1}`} fill className="object-cover" unoptimized={src.startsWith("data:")} />
                    <button
                      onClick={() => setPhotos((p) => p.filter((_, x) => x !== i))}
                      className="absolute right-1.5 top-1.5 rounded-full bg-destructive p-1.5 text-white opacity-0 transition-opacity group-hover:opacity-100"
                      aria-label="Remove photo"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-5 p-5">
            <div>
              <Label className="mb-1.5 block">Notes / damage description</Label>
              <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Any scratches, dents, missing items…" />
            </div>
            <SignaturePad label="Customer signature" onChange={setCustSig} />
            <SignaturePad label="Owner / agent signature" onChange={setOwnerSig} />
          </CardContent>
        </Card>

        <Button variant="gold" size="lg" className="w-full" onClick={submit} disabled={saving}>
          <CheckCircle2 className="h-4 w-4" /> {saving ? "Saving…" : `Save ${type} inspection`}
        </Button>
      </div>
    </main>
  );
}
