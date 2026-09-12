"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, CheckCircle2, Clipboard, Clock3, Copy, Phone, ShieldCheck, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { buildUSSD, detectProvider, formatRwandaPhone, isValidRwandaPhone, PROVIDER_LABELS, toDialerLink, type Provider } from "@/lib/ussd/build";
import { getSupabase } from "@/lib/supabase/client";

type PaymentState = "form" | "awaiting" | "success";
const PROVIDERS: { id: Provider; mark: string; detail: string; color: string }[] = [
  { id: "mtn", mark: "MTN", detail: "078 / 079", color: "bg-[#ffd100] text-[#171717]" },
  { id: "airtel", mark: "Airtel", detail: "072 / 073", color: "bg-[#e31b23] text-white" },
  { id: "ekash", mark: "eKash", detail: "Any network", color: "bg-[#552583] text-white" },
];

export function PayWithUSSD({ bookingId, amount }: { bookingId: string; amount: number }) {
  const [provider, setProvider] = useState<Provider>("mtn");
  const [phone, setPhone] = useState("");
  const [paymentAmount, setPaymentAmount] = useState(String(Math.round(amount)));
  const [state, setState] = useState<PaymentState>("form");
  const [paymentId, setPaymentId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(300);

  useEffect(() => { if (phone.length >= 3) setProvider(detectProvider(phone)); }, [phone]);
  useEffect(() => {
    if (state !== "awaiting") return;
    const timer = window.setInterval(() => setSecondsLeft((value) => Math.max(0, value - 1)), 1000);
    return () => window.clearInterval(timer);
  }, [state]);

  useEffect(() => {
    if (!paymentId) return;
    const sb = getSupabase();
    if (!sb) return;
    const channel = sb.channel(`payment:${paymentId}`).on("postgres_changes", { event: "UPDATE", schema: "public", table: "payments", filter: `id=eq.${paymentId}` }, (payload) => {
      const status = (payload.new as { status?: string }).status;
      if (status === "completed") setState("success");
      if (status === "failed" || status === "cancelled") setState("form");
    }).subscribe();
    return () => { void sb.removeChannel(channel); };
  }, [paymentId]);

  const numericAmount = Number(paymentAmount);
  const valid = isValidRwandaPhone(phone) && Number.isFinite(numericAmount) && numericAmount > 0 && numericAmount <= amount;
  const ussd = useMemo(() => buildUSSD({ provider, phone, amount: numericAmount || 0 }), [provider, phone, numericAmount]);
  const dialLink = toDialerLink(ussd);
  const time = `${Math.floor(secondsLeft / 60)}:${String(secondsLeft % 60).padStart(2, "0")}`;

  const initiate = async () => {
    if (!valid) return;
    try {
      const sb = getSupabase();
      const session = sb ? await sb.auth.getSession() : null;
      const headers: HeadersInit = { "Content-Type": "application/json" };
      if (session?.data.session?.access_token) headers.Authorization = `Bearer ${session.data.session.access_token}`;
      const response = await fetch("/api/payments/initiate", { method: "POST", headers, body: JSON.stringify({ bookingId, phone, amount: numericAmount, provider }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Payment could not be started");
      setPaymentId(data.paymentId ?? null);
    } catch {
      // Local preview keeps the dialer flow usable without Supabase.
    }
    setSecondsLeft(300);
    setState("awaiting");
  };

  const confirmManual = async () => {
    if (paymentId) {
      const sb = getSupabase();
      const session = sb ? await sb.auth.getSession() : null;
      await fetch("/api/payments/confirm-manual", { method: "POST", headers: { "Content-Type": "application/json", ...(session?.data.session?.access_token ? { Authorization: `Bearer ${session.data.session.access_token}` } : {}) }, body: JSON.stringify({ paymentId }) });
    }
    setState("success");
  };

  if (state === "success") return <Card className="overflow-hidden border-emerald-200 bg-emerald-50/70 dark:border-emerald-900 dark:bg-emerald-950/20"><CardContent className="space-y-5 p-7 text-center"><div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500 text-white shadow-lg shadow-emerald-500/20"><Check className="h-8 w-8" /></div><div><h2 className="font-display text-2xl font-extrabold">Payment noted</h2><p className="mt-1 text-sm text-muted-foreground">LORA will verify your {PROVIDER_LABELS[provider]} transfer and update the booking.</p></div><div className="rounded-xl bg-background p-4 text-left text-sm"><div className="flex justify-between"><span className="text-muted-foreground">Amount</span><strong>{numericAmount.toLocaleString()} RWF</strong></div><div className="mt-2 flex justify-between"><span className="text-muted-foreground">Phone</span><strong>{formatRwandaPhone(phone)}</strong></div></div></CardContent></Card>;

  if (state === "awaiting") return <Card className="overflow-hidden border-gold/40"><CardContent className="space-y-5 p-7 text-center"><div className="relative mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-gold/15 text-gold"><span className="absolute inset-0 animate-ping rounded-full bg-gold/20" /><Smartphone className="relative h-8 w-8" /></div><div><h2 className="font-display text-2xl font-extrabold">Awaiting payment</h2><p className="mt-1 text-sm text-muted-foreground">Tap Call in your dialer, then enter your {PROVIDER_LABELS[provider]} PIN.</p></div><div className="flex items-center justify-center gap-2 text-sm font-semibold text-gold"><Clock3 className="h-4 w-4" /> {time} remaining</div><div className="rounded-xl bg-secondary/70 p-4 font-mono text-sm break-all">{ussd}</div><div className="grid gap-2 sm:grid-cols-2"><a href={dialLink} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-gold px-5 text-sm font-bold text-navy-900 hover:bg-gold-300"><Phone className="h-4 w-4" /> Open dialer again</a><Button variant="outline" onClick={confirmManual}><CheckCircle2 className="h-4 w-4" /> I&apos;ve completed payment</Button></div><button type="button" className="text-sm text-muted-foreground underline underline-offset-4" onClick={() => setState("form")}>Use a different number</button></CardContent></Card>;

  return <Card className="overflow-hidden border-navy-200/70 shadow-xl shadow-navy-900/5 dark:border-gold/20"><CardContent className="space-y-6 p-6 sm:p-7"><div><div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-gold"><ShieldCheck className="h-4 w-4" /> Rwanda-first checkout</div><h2 className="font-display text-2xl font-extrabold">Pay with Mobile Money</h2><p className="mt-1 text-sm text-muted-foreground">No card, no booking fee. Your PIN stays with the telco.</p></div><div className="grid gap-2 sm:grid-cols-3">{PROVIDERS.map((item) => <button key={item.id} type="button" onClick={() => setProvider(item.id)} className={cn("relative rounded-xl border-2 p-3 text-left transition-all hover:-translate-y-0.5", provider === item.id ? "border-gold bg-gold/10 shadow-md shadow-gold/10" : "border-border")}><span className={cn("mb-2 flex h-7 w-12 items-center justify-center rounded-md text-[10px] font-black", item.color)}>{item.mark}</span><span className="block text-sm font-bold">{PROVIDER_LABELS[item.id]}</span><span className="text-xs text-muted-foreground">{item.detail}</span>{provider === item.id && <span className="absolute right-2 top-2 text-gold"><Check className="h-4 w-4" /></span>}</button>)}</div><div><Label className="mb-1.5 block">Mobile Money number</Label><Input inputMode="tel" value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="078 123 4567" aria-invalid={phone.length > 0 && !isValidRwandaPhone(phone)} /><p className="mt-1.5 text-xs text-muted-foreground">Detected: {PROVIDER_LABELS[provider]}</p></div><div><Label className="mb-1.5 block">Amount to pay (RWF)</Label><Input inputMode="numeric" type="number" min={1} max={amount} value={paymentAmount} onChange={(event) => setPaymentAmount(event.target.value)} /><p className="mt-1.5 text-xs text-muted-foreground">Booking total: {amount.toLocaleString()} RWF · zero booking fees</p></div><div className="rounded-xl border border-dashed border-border bg-secondary/40 p-4"><div className="mb-2 flex items-center justify-between text-xs font-semibold text-muted-foreground"><span>USSD code preview</span><span>{PROVIDER_LABELS[provider]}</span></div><code className="block break-all text-sm font-bold">{ussd}</code></div><a href={valid ? dialLink : undefined} aria-disabled={!valid} onClick={(event) => { if (!valid) { event.preventDefault(); return; } void initiate(); }} className={cn("flex h-12 items-center justify-center gap-2 rounded-xl px-5 text-sm font-bold transition-colors", valid ? "bg-gold text-navy-900 hover:bg-gold-300" : "cursor-not-allowed bg-muted text-muted-foreground")}><Phone className="h-4 w-4" /> Open Dialer &amp; Pay {numericAmount > 0 ? `${numericAmount.toLocaleString()} RWF` : ""}</a><Button variant="outline" className="w-full" disabled={!ussd} onClick={async () => { await navigator.clipboard?.writeText(ussd); setCopied(true); window.setTimeout(() => setCopied(false), 1800); }}><Copy className="h-4 w-4" /> {copied ? "USSD code copied" : "Copy USSD code"}</Button><p className="flex items-start gap-2 text-xs leading-5 text-muted-foreground"><Clipboard className="mt-0.5 h-4 w-4 shrink-0" /> On desktop, copy the code and dial it from your Rwanda SIM. LORA never sees your PIN.</p></CardContent></Card>;
}