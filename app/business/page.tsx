"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Building2, CheckCircle2, FileText, Percent, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useApp } from "@/lib/store";
import type { CorporateAccount } from "@/types";

const PERKS = [
  { icon: Percent, title: "10% corporate discount", desc: "Applied automatically on every booking made by your team." },
  { icon: FileText, title: "Monthly invoicing", desc: "One consolidated invoice instead of per-trip payments." },
  { icon: Users, title: "Team management", desc: "Add employees, track their trips, set booking policies." },
  { icon: Building2, title: "Priority fleet", desc: "First access to executive vehicles and airport meet & greet." },
];

export default function BusinessPage() {
  const router = useRouter();
  const { user, addCorporateAccount } = useApp();
  const [form, setForm] = useState({ companyName: "", tin: "", contactName: "", email: "", phone: "" });
  const [saving, setSaving] = useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      router.push("/register?next=/business");
      return;
    }
    setSaving(true);
    const account: CorporateAccount = {
      id: crypto.randomUUID(),
      companyName: form.companyName.trim(),
      tin: form.tin.trim() || undefined,
      contactName: form.contactName.trim() || user.name,
      contactEmail: form.email.trim() || user.email,
      contactPhone: form.phone.trim() || user.phone,
      creditTerms: "net30",
      status: "pending",
      createdAt: new Date().toISOString(),
    };
    addCorporateAccount(account, user.id);
    setSaving(false);
    toast.success("Application received — we'll verify and activate within 24h");
    router.push("/corporate");
  };

  return (
    <main>
      {/* Hero */}
      <section className="bg-navy-950 py-20 text-white">
        <div className="container max-w-3xl text-center">
          <Badge variant="gold" className="mb-4">LORA for Business</Badge>
          <h1 className="font-display text-4xl font-extrabold tracking-tight md:text-5xl">
            Corporate car rental, simplified
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-silver/90">
            One account for your whole team. Monthly invoices, 10% off every trip, and priority access to Rwanda's best fleet.
          </p>
        </div>
      </section>

      {/* Perks */}
      <section className="container -mt-8 relative z-10">
        <div className="grid gap-4 rounded-2xl border border-border bg-card p-6 shadow-xl sm:grid-cols-2 lg:grid-cols-4">
          {PERKS.map((p) => (
            <div key={p.title} className="flex gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-navy-800 dark:bg-gold">
                <p.icon className="h-5 w-5 text-gold dark:text-navy-900" />
              </div>
              <div>
                <p className="text-sm font-bold">{p.title}</p>
                <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{p.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Signup form */}
      <section className="container max-w-2xl py-14">
        <Card>
          <CardContent className="p-6 md:p-8">
            <h2 className="font-display text-2xl font-bold">Apply for a corporate account</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {user ? "Fill in your company details — approval takes under 24h." : "You'll need a LORA account first — we'll take you there."}
            </p>
            <form onSubmit={submit} className="mt-6 space-y-4">
              <div>
                <Label className="mb-1.5 block">Company name</Label>
                <Input required value={form.companyName} onChange={(e) => setForm({ ...form, companyName: e.target.value })} placeholder="Acme Rwanda Ltd" />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label className="mb-1.5 block">TIN (optional)</Label>
                  <Input value={form.tin} onChange={(e) => setForm({ ...form, tin: e.target.value })} placeholder="1XXXXXXXXX" />
                </div>
                <div>
                  <Label className="mb-1.5 block">Contact person</Label>
                  <Input value={form.contactName} onChange={(e) => setForm({ ...form, contactName: e.target.value })} placeholder={user?.name ?? "Full name"} />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label className="mb-1.5 block">Work email</Label>
                  <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder={user?.email ?? "you@company.rw"} />
                </div>
                <div>
                  <Label className="mb-1.5 block">Phone</Label>
                  <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+250 7XX XXX XXX" />
                </div>
              </div>
              <Button variant="gold" size="lg" className="w-full" disabled={saving}>
                <CheckCircle2 className="h-4 w-4" /> {saving ? "Submitting…" : "Apply — free, no commitment"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Already have an account? <Link href="/corporate" className="font-semibold text-gold-600 hover:underline dark:text-gold">Open your corporate dashboard</Link>
        </p>
      </section>
    </main>
  );
}
