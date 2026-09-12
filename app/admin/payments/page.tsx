"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { getSupabase } from "@/lib/supabase/client";

type PaymentRow = { id: string; booking_id: string; amount_rwf: number | null; amount: number; provider: string | null; phone: string | null; status: string; transaction_id: string | null; created_at: string };

export default function AdminPaymentsPage() {
  const [payments, setPayments] = useState<PaymentRow[]>([]);
  const [filter, setFilter] = useState("awaiting_confirmation");
  const [transaction, setTransaction] = useState<Record<string, string>>({});

  const load = async () => {
    const sb = getSupabase();
    if (!sb) return;
    const { data } = await sb.from("payments").select("id, booking_id, amount_rwf, amount, provider, phone, status, transaction_id, created_at").order("created_at", { ascending: false }).limit(100);
    setPayments((data ?? []) as PaymentRow[]);
  };
  useEffect(() => { void load(); }, []);

  const confirm = async (paymentId: string) => {
    const sb = getSupabase();
    const session = sb ? await sb.auth.getSession() : null;
    const response = await fetch("/api/payments/confirm-manual", { method: "POST", headers: { "Content-Type": "application/json", ...(session?.data.session?.access_token ? { Authorization: `Bearer ${session.data.session.access_token}` } : {}) }, body: JSON.stringify({ paymentId, transactionId: transaction[paymentId] }) });
    if (!response.ok) { toast.error("Payment could not be confirmed"); return; }
    toast.success("Payment confirmed and booking updated");
    void load();
  };

  const visible = payments.filter((payment) => filter === "all" || payment.status === filter);
  return <div className="space-y-6"><div className="flex flex-wrap items-end justify-between gap-4"><div><h1 className="font-display text-2xl font-extrabold tracking-tight">Payments</h1><p className="text-sm text-muted-foreground">Review USSD transfers and reconcile provider references.</p></div><Button variant="outline" onClick={() => void load()}><RefreshCw className="h-4 w-4" /> Refresh</Button></div><div className="flex flex-wrap gap-2">{["awaiting_confirmation", "pending", "completed", "failed", "all"].map((value) => <button key={value} type="button" onClick={() => setFilter(value)} className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${filter === value ? "border-gold bg-gold/15 text-foreground" : "border-border text-muted-foreground"}`}>{value.replace("_", " ")}</button>)}</div><Card><CardHeader><CardTitle>{visible.length} payment{visible.length === 1 ? "" : "s"}</CardTitle></CardHeader><CardContent className="space-y-3">{visible.length === 0 ? <p className="py-8 text-center text-sm text-muted-foreground">No payments in this view.</p> : visible.map((payment) => <div key={payment.id} className="grid gap-3 rounded-xl border border-border p-4 lg:grid-cols-[1fr_auto_auto]"><div><div className="flex flex-wrap items-center gap-2"><span className="font-mono text-xs text-muted-foreground">{payment.booking_id}</span><Badge variant={payment.status === "completed" ? "success" : payment.status === "failed" ? "destructive" : "warning"}>{payment.status.replace("_", " ")}</Badge></div><p className="mt-2 font-semibold">{(payment.amount_rwf ?? payment.amount).toLocaleString()} RWF · {payment.provider ?? "manual"}</p><p className="text-xs text-muted-foreground">{payment.phone ?? "No phone"} · {new Date(payment.created_at).toLocaleString()}</p></div>{payment.status !== "completed" && <Input value={transaction[payment.id] ?? ""} onChange={(event) => setTransaction((current) => ({ ...current, [payment.id]: event.target.value }))} placeholder="Provider reference" className="lg:w-52" />}{payment.status !== "completed" && <Button variant="gold" onClick={() => void confirm(payment.id)}><CheckCircle2 className="h-4 w-4" /> Confirm</Button>}</div>)}</CardContent></Card></div>;
}