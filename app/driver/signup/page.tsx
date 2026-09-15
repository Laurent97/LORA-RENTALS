"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { PhotoUploader } from "@/components/reviews/photo-uploader";

const CITIES = ["Kigali", "Musanze", "Rubavu", "Huye", "Nyagatare", "Rusizi", "Muhanga"];
const LANGUAGES = ["Kinyarwanda", "English", "French", "Swahili"];
const SPECIALTIES = ["Airport pickup", "City tours", "Long-distance", "Corporate travel", "Tourist guiding", "Child-friendly", "Luggage handling"];
const VEHICLE_TYPES = ["Sedan", "SUV", "4x4", "Minivan", "Pickup"];

function CheckboxList({ options, selected, onChange }: { options: string[]; selected: string[]; onChange: (v: string[]) => void }) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {options.map((opt) => (
        <label key={opt} className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            className="h-4 w-4 accent-gold"
            checked={selected.includes(opt)}
            onChange={(e) => {
              onChange(e.target.checked ? [...selected, opt] : selected.filter((s) => s !== opt));
            }}
          />
          {opt}
        </label>
      ))}
    </div>
  );
}

export default function DriverSignupPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    email: "",
    password: "",
    confirm: "",
    fullName: "",
    phone: "",
    whatsapp: "",
    dateOfBirth: "",
    gender: "",
    nationality: "",
    city: "",
    district: "",
    languages: ["Kinyarwanda"] as string[],
    photoUrl: "",
    licenseNumber: "",
    licensePhotoUrl: "",
    licenseExpiry: "",
    nationalIdUrl: "",
    passportPhotoUrl: "",
    criminalRecordUrl: "",
    yearsOfExperience: 0,
    bio: "",
    specialties: [] as string[],
    vehicleTypes: [] as string[],
    dailyRateRwf: 30000,
    halfDayRateRwf: 18000,
    airportPickupRateRwf: 15000,
    homeCity: "",
    servesCities: ["Kigali"] as string[],
    minHours: 4,
    serviceRadiusKm: 50,
    maxPassengers: 5,
    acceptsLongDistance: true,
    acceptsAirportPickup: true,
    acceptsNightDriving: true,
    acceptsOutsideKigali: true,
    availableFrom: "06:00",
    availableUntil: "22:00",
  });

  const update = (patch: Partial<typeof form>) => setForm((s) => ({ ...s, ...patch }));

  const next = () => setStep((s) => Math.min(s + 1, 5));
  const back = () => setStep((s) => Math.max(s - 1, 1));

  const submit = async () => {
    if (form.password !== form.confirm) {
      toast.error("Passwords do not match");
      return;
    }
    const email = form.email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error("Please enter a valid email address");
      return;
    }
    const payload = { ...form, email };
    setSubmitting(true);
    try {
      const res = await fetch("/api/driver/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json().catch(() => ({ error: "Network error" }));
      if (!res.ok) throw new Error(json.error || "Signup failed");
      toast.success(json.message || "Application submitted");
      router.push("/login");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  const steps = ["Account", "Personal", "Documents", "Profile", "Rates"];

  return (
    <main className="container max-w-2xl py-10">
      <div className="mb-6 text-center">
        <h1 className="font-display text-2xl font-extrabold text-navy-800">Become a LORA Driver</h1>
        <p className="mt-1 text-sm text-muted-foreground">Step {step} of 5 — {steps[step - 1]}</p>
      </div>

      <div className="mb-6 flex justify-between gap-2">
        {steps.map((s, i) => (
          <div key={s} className={`h-2 flex-1 rounded-full ${i + 1 <= step ? "bg-gold" : "bg-muted"}`} />
        ))}
      </div>

      <Card>
        <CardContent className="p-6 space-y-4">
          {step === 1 && (
            <>
              <Field label="Full name *"><Input value={form.fullName} onChange={(e) => update({ fullName: e.target.value })} /></Field>
              <Field label="Email *"><Input type="email" value={form.email} onChange={(e) => update({ email: e.target.value })} /></Field>
              <Field label="Phone (RW) *"><Input value={form.phone} onChange={(e) => update({ phone: e.target.value })} placeholder="+250 ..." /></Field>
              <Field label="WhatsApp"><Input value={form.whatsapp} onChange={(e) => update({ whatsapp: e.target.value })} placeholder="Same as phone if blank" /></Field>
              <Field label="Password *"><Input type="password" value={form.password} onChange={(e) => update({ password: e.target.value })} /></Field>
              <Field label="Confirm password *"><Input type="password" value={form.confirm} onChange={(e) => update({ confirm: e.target.value })} /></Field>
            </>
          )}

          {step === 2 && (
            <>
              <Field label="Date of birth"><Input type="date" value={form.dateOfBirth} onChange={(e) => update({ dateOfBirth: e.target.value })} /></Field>
              <Field label="Gender">
                <select className="w-full rounded-md border px-3 py-2 text-sm" value={form.gender} onChange={(e) => update({ gender: e.target.value })}>
                  <option value="">Select…</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </Field>
              <Field label="Nationality"><Input value={form.nationality} onChange={(e) => update({ nationality: e.target.value })} /></Field>
              <Field label="City"><Input value={form.city} onChange={(e) => update({ city: e.target.value })} /></Field>
              <Field label="District"><Input value={form.district} onChange={(e) => update({ district: e.target.value })} /></Field>
              <Field label="Languages spoken *">
                <CheckboxList options={LANGUAGES} selected={form.languages} onChange={(v) => update({ languages: v })} />
              </Field>
              <Field label="Profile photo">
                <PhotoUploader photos={form.photoUrl ? [form.photoUrl] : []} onChange={(v) => update({ photoUrl: v[0] ?? "" })} max={1} />
              </Field>
            </>
          )}

          {step === 3 && (
            <>
              <Field label="License number *"><Input value={form.licenseNumber} onChange={(e) => update({ licenseNumber: e.target.value })} /></Field>
              <Field label="License expiry"><Input type="date" value={form.licenseExpiry} onChange={(e) => update({ licenseExpiry: e.target.value })} /></Field>
              <Field label="License photo"><PhotoUploader photos={form.licensePhotoUrl ? [form.licensePhotoUrl] : []} onChange={(v) => update({ licensePhotoUrl: v[0] ?? "" })} max={1} /></Field>
              <Field label="National ID photo"><PhotoUploader photos={form.nationalIdUrl ? [form.nationalIdUrl] : []} onChange={(v) => update({ nationalIdUrl: v[0] ?? "" })} max={1} /></Field>
              <Field label="Passport photo"><PhotoUploader photos={form.passportPhotoUrl ? [form.passportPhotoUrl] : []} onChange={(v) => update({ passportPhotoUrl: v[0] ?? "" })} max={1} /></Field>
              <Field label="Criminal record certificate"><PhotoUploader photos={form.criminalRecordUrl ? [form.criminalRecordUrl] : []} onChange={(v) => update({ criminalRecordUrl: v[0] ?? "" })} max={1} /></Field>
            </>
          )}

          {step === 4 && (
            <>
              <Field label="Years of experience *"><Input type="number" value={form.yearsOfExperience} onChange={(e) => update({ yearsOfExperience: Number(e.target.value) })} /></Field>
              <Field label="Bio (max 300 chars)"><Input value={form.bio} onChange={(e) => update({ bio: e.target.value.slice(0, 300) })} /></Field>
              <Field label="Specialties">
                <CheckboxList options={SPECIALTIES} selected={form.specialties} onChange={(v) => update({ specialties: v })} />
              </Field>
              <Field label="Vehicle types you can drive">
                <CheckboxList options={VEHICLE_TYPES} selected={form.vehicleTypes} onChange={(v) => update({ vehicleTypes: v })} />
              </Field>
            </>
          )}

          {step === 5 && (
            <>
              <Field label="Base city *"><Input value={form.homeCity} onChange={(e) => update({ homeCity: e.target.value })} /></Field>
              <Field label="Cities you serve"><CheckboxList options={CITIES} selected={form.servesCities} onChange={(v) => update({ servesCities: v })} /></Field>
              <Field label="Daily rate (RWF) *"><Input type="number" value={form.dailyRateRwf} onChange={(e) => update({ dailyRateRwf: Number(e.target.value) })} /></Field>
              <Field label="Half-day rate (RWF)"><Input type="number" value={form.halfDayRateRwf} onChange={(e) => update({ halfDayRateRwf: Number(e.target.value) })} /></Field>
              <Field label="Airport pickup rate (RWF)"><Input type="number" value={form.airportPickupRateRwf} onChange={(e) => update({ airportPickupRateRwf: Number(e.target.value) })} /></Field>
              <Field label="Minimum hours"><Input type="number" value={form.minHours} onChange={(e) => update({ minHours: Number(e.target.value) })} /></Field>
              <Field label="Service radius (km)"><Input type="number" value={form.serviceRadiusKm} onChange={(e) => update({ serviceRadiusKm: Number(e.target.value) })} /></Field>
              <Field label="Max passengers"><Input type="number" value={form.maxPassengers} onChange={(e) => update({ maxPassengers: Number(e.target.value) })} /></Field>
              <Field label="Available from"><Input type="time" value={form.availableFrom} onChange={(e) => update({ availableFrom: e.target.value })} /></Field>
              <Field label="Available until"><Input type="time" value={form.availableUntil} onChange={(e) => update({ availableUntil: e.target.value })} /></Field>
              <div className="grid grid-cols-2 gap-2 text-sm">
                {[
                  ["acceptsLongDistance", "Long distance"],
                  ["acceptsAirportPickup", "Airport pickup"],
                  ["acceptsNightDriving", "Night driving"],
                  ["acceptsOutsideKigali", "Outside Kigali"],
                ].map(([k, label]) => (
                  <label key={k} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      className="h-4 w-4 accent-gold"
                      checked={form[k as keyof typeof form] as boolean}
                      onChange={(e) => update({ [k]: e.target.checked } as any)}
                    />
                    {label}
                  </label>
                ))}
              </div>
            </>
          )}

          <div className="flex justify-between pt-4">
            <Button variant="outline" onClick={back} disabled={step === 1}>Back</Button>
            {step < 5 ? (
              <Button onClick={next}>Next</Button>
            ) : (
              <Button onClick={submit} disabled={submitting}>{submitting ? "Submitting…" : "Submit application"}</Button>
            )}
          </div>
        </CardContent>
      </Card>
    </main>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
    </div>
  );
}
