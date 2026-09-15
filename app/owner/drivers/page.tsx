"use client";

import { useEffect, useRef, useState } from "react";
import { Plus, Upload, User } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { EmptyState } from "@/components/empty-state";
import { useApp } from "@/lib/store";
import { getSupabase } from "@/lib/supabase/client";
import { fmtDate } from "@/lib/utils";
import Image from "next/image";

const SPECIALTIES = ["Airport pickup", "City tours", "Long-distance trips", "Corporate travel", "Tourist guiding", "Elderly assistance", "Child-friendly", "Luggage handling"];
const LANGUAGES = ["Kinyarwanda", "English", "French", "Swahili"];

export default function OwnerDriversPage() {
  const { user } = useApp();
  const [drivers, setDrivers] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [photo, setPhoto] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = async () => {
    const sb = getSupabase();
    if (!sb || !user) return;
    const { data } = await sb.from("drivers").select("*").eq("owner_id", user.id).order("full_name", { ascending: true });
    setDrivers(data ?? []);
  };

  useEffect(() => { void load(); }, [user]);

  const upload = async (file: File) => {
    const sb = getSupabase();
    if (!sb || !user) return;
    setUploading(true);
    const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
    const path = `drivers/${user.id}/${crypto.randomUUID()}.${ext}`;
    const { error } = await sb.storage.from("lorarentals").upload(path, file, { contentType: file.type, upsert: false });
    if (error) { toast.error(`Upload failed: ${error.message}`); setUploading(false); return; }
    const { data } = sb.storage.from("lorarentals").getPublicUrl(path);
    setPhoto(data.publicUrl);
    setUploading(false);
  };

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    const fd = new FormData(e.currentTarget);
    const sb = getSupabase();
    if (!sb) { toast.error("Supabase not configured"); setSaving(false); return; }

    const insert: Record<string, any> = {
      owner_id: user.id,
      full_name: String(fd.get("fullName") ?? "").trim(),
      phone: String(fd.get("phone") ?? "").trim() || null,
      email: String(fd.get("email") ?? "").trim() || null,
      languages: Array.from(fd.getAll("languages") as Iterable<string>),
      years_of_experience: Number(fd.get("years") || 0),
      bio: String(fd.get("bio") ?? "").trim() || null,
      specialties: Array.from(fd.getAll("specialties") as Iterable<string>),
      photo_url: photo,
      license_number: String(fd.get("licenseNumber") ?? "").trim() || null,
      license_expiry: String(fd.get("licenseExpiry") ?? "").trim() || null,
      is_available: true,
      is_verified: false,
    };

    const { error } = await sb.from("drivers").insert(insert);
    if (error) { toast.error(`Could not save driver: ${error.message}`); setSaving(false); return; }
    toast.success("Driver added — pending admin verification");
    setPhoto(null);
    setOpen(false);
    e.currentTarget.reset();
    await load();
    setSaving(false);
  };

  if (!user) return null;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-extrabold tracking-tight">My Drivers</h1>
          <p className="text-sm text-muted-foreground">{drivers.length} driver{drivers.length !== 1 ? "s" : ""}</p>
        </div>
        <Button variant="gold" onClick={() => setOpen(true)}><Plus className="h-4 w-4" /> Add driver</Button>
      </div>

      {drivers.length === 0 ? (
        <EmptyState icon={User} title="No drivers" description="Add your first driver so you can assign them to vehicles." actionLabel="Add driver" actionHref="#" />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {drivers.map((d) => (
            <Card key={d.id}>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-full bg-muted">
                    {d.photo_url ? <Image src={d.photo_url} alt="" fill className="object-cover" /> : <User className="h-7 w-7 m-3.5 text-muted-foreground" />}
                  </div>
                  <div>
                    <p className="font-display font-bold">{d.full_name}</p>
                    <p className="text-xs text-muted-foreground">{d.years_of_experience} years · {d.languages?.join(", ")}</p>
                    <p className="text-xs text-muted-foreground">{d.specialties?.join(", ")}</p>
                    {d.is_verified ? <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-bold text-green-700">Verified</span> : <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-700">Pending</span>}
                  </div>
                </div>
                {d.license_expiry && <p className="mt-3 text-xs text-muted-foreground">License expires {fmtDate(d.license_expiry)}</p>}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>Add driver</DialogTitle></DialogHeader>
          <form onSubmit={submit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div><Label className="mb-1.5 block">Full name *</Label><Input name="fullName" required placeholder="Jean-Baptiste M." /></div>
              <div><Label className="mb-1.5 block">Phone</Label><Input name="phone" placeholder="+250 78X XXX XXX" /></div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div><Label className="mb-1.5 block">Email</Label><Input name="email" type="email" placeholder="driver@example.com" /></div>
              <div><Label className="mb-1.5 block">Years of experience</Label><Input name="years" type="number" min={0} placeholder="5" /></div>
            </div>
            <div>
              <Label className="mb-1.5 block">Languages</Label>
              <div className="flex flex-wrap gap-2">
                {LANGUAGES.map((l) => (
                  <label key={l} className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-sm">
                    <input type="checkbox" name="languages" value={l.toLowerCase()} /> {l}
                  </label>
                ))}
              </div>
            </div>
            <div>
              <Label className="mb-1.5 block">Specialties</Label>
              <div className="flex flex-wrap gap-2">
                {SPECIALTIES.map((s) => (
                  <label key={s} className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-sm">
                    <input type="checkbox" name="specialties" value={s} /> {s}
                  </label>
                ))}
              </div>
            </div>
            <div>
              <Label className="mb-1.5 block">Bio</Label>
              <Input name="bio" placeholder="Short professional bio…" />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div><Label className="mb-1.5 block">License number</Label><Input name="licenseNumber" placeholder="D-123456" /></div>
              <div><Label className="mb-1.5 block">License expiry</Label><Input name="licenseExpiry" type="date" /></div>
            </div>
            <div>
              <Label className="mb-1.5 block">Photo</Label>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} />
              <div className="flex items-center gap-3">
                {photo ? <div className="relative h-12 w-12 overflow-hidden rounded-lg"><Image src={photo} alt="" fill className="object-cover" /></div> : <div className="h-12 w-12 rounded-lg bg-muted" />}
                <Button type="button" variant="outline" size="sm" onClick={() => fileRef.current?.click()} disabled={uploading}>
                  <Upload className="h-3.5 w-3.5" /> {uploading ? "Uploading…" : photo ? "Change" : "Upload"}
                </Button>
              </div>
            </div>
            <Button type="submit" variant="gold" className="w-full" disabled={saving}>{saving ? "Saving…" : "Submit for verification"}</Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
