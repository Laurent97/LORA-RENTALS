"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { BRAND } from "@/lib/constants";
import { whatsappLink } from "@/lib/utils";

export default function ContactPage() {
  const [sending, setSending] = useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    setTimeout(() => {
      setSending(false);
      toast.success("Message sent! We'll reply within 24 hours.");
      (e.target as HTMLFormElement).reset();
    }, 800);
  };

  return (
    <main className="container py-16">
      <div className="mx-auto max-w-4xl">
        <div className="text-center">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-gold-600 dark:text-gold">Contact</p>
          <h1 className="mt-2 font-display text-3xl font-extrabold tracking-tight md:text-4xl">Talk to us</h1>
          <p className="mt-3 text-muted-foreground">
            Questions about a booking, listing your car, or partnerships — we're here.
          </p>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-[1fr_1.2fr]">
          <div className="space-y-4">
            {[
              { icon: Phone, label: "Phone / WhatsApp", value: BRAND.phone, href: `tel:${BRAND.phone.replace(/\s/g, "")}` },
              { icon: Mail, label: "Support", value: BRAND.supportEmail, href: `mailto:${BRAND.supportEmail}` },
              { icon: Mail, label: "General", value: BRAND.email, href: `mailto:${BRAND.email}` },
              { icon: MapPin, label: "Office", value: BRAND.address, href: undefined },
            ].map((c) => (
              <Card key={c.label}>
                <CardContent className="flex items-center gap-4 p-5">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-navy-800 dark:bg-gold">
                    <c.icon className="h-5 w-5 text-gold dark:text-navy-900" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{c.label}</p>
                    {c.href ? <a href={c.href} className="text-sm font-semibold hover:text-gold-600 dark:hover:text-gold">{c.value}</a> : <p className="text-sm font-semibold">{c.value}</p>}
                  </div>
                </CardContent>
              </Card>
            ))}
            <a
              href={whatsappLink(BRAND.whatsapp, "Hi LORA RENTALS! I have a question.")}
              target="_blank"
              rel="noreferrer"
              className="block"
            >
              <Button variant="gold" className="w-full">
                <MessageCircle className="h-4 w-4" /> Chat on WhatsApp
              </Button>
            </a>
          </div>

          <Card>
            <CardContent className="p-6">
              <form onSubmit={submit} className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <Label htmlFor="c-name" className="mb-1.5 block">Name</Label>
                    <Input id="c-name" required placeholder="Your name" />
                  </div>
                  <div>
                    <Label htmlFor="c-phone" className="mb-1.5 block">Phone</Label>
                    <Input id="c-phone" required placeholder="+250 ..." />
                  </div>
                </div>
                <div>
                  <Label htmlFor="c-email" className="mb-1.5 block">Email</Label>
                  <Input id="c-email" type="email" required placeholder="you@example.com" />
                </div>
                <div>
                  <Label htmlFor="c-msg" className="mb-1.5 block">Message</Label>
                  <Textarea id="c-msg" required placeholder="How can we help?" />
                </div>
                <Button type="submit" variant="gold" className="w-full" disabled={sending}>
                  {sending ? "Sending…" : "Send message"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
