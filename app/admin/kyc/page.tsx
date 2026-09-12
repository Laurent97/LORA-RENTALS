"use client";

import { useEffect, useMemo, useState } from "react";
import { BadgeCheck, Check, Clock3, ExternalLink, FileCheck2, FileText, RefreshCw, ShieldX } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/empty-state";
import { Input } from "@/components/ui/input";
import { useAllUsers } from "@/lib/lookup";
import { useApp } from "@/lib/store";
import { getSupabase } from "@/lib/supabase/client";
import { fmtDate, initials } from "@/lib/utils";
import type { KycStatus } from "@/types";

type DocumentRow = { id: string; user_id: string; type: string; url: string; status: KycStatus; review_note: string | null; reviewed_at: string | null; created_at: string };
const LABELS: Record<string, string> = { national_id: "National ID / passport", drivers_license: "Driver's license", vehicle_registration: "Vehicle registration", insurance: "Insurance", inspection: "Inspection" };
const VARIANT: Record<KycStatus, "success" | "warning" | "destructive" | "secondary"> = { verified: "success", pending: "warning", rejected: "destructive", none: "secondary" };

type Action = "document_approve" | "document_reject" | "owner_approve" | "owner_reject" | "request_resubmission";

export default function AdminKycPage() {
  const users = useAllUsers();
  const { updateUserKyc } = useApp();
  const [documents, setDocuments] = useState<DocumentRow[]>([]);
  const [filter, setFilter] = useState<"pending" | "all">("pending");
  const [note, setNote] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string | null>(null);

  const load = async () => {
    const sb = getSupabase();
    if (!sb) return;
    const full = await sb.from("kyc_documents").select("id, user_id, type, url, status, review_note, reviewed_at, created_at").order("created_at", { ascending: false });
    if (!full.error) {
      setDocuments((full.data ?? []) as DocumentRow[]);
      return;
    }
    // Older projects may not have migration 202609120003 applied yet.
    const base = await sb.from("kyc_documents").select("id, user_id, type, url, status, created_at").order("created_at", { ascending: false });
    if (base.error) toast.error(`Could not load KYC documents: ${base.error.message}`);
    else setDocuments((base.data ?? []).map((document) => ({ ...document, review_note: null, reviewed_at: null })) as DocumentRow[]);
  };
  useEffect(() => { void load(); }, []);

  const act = async (action: Action, documentId?: string, userId?: string) => {
    const key = documentId ?? userId ?? action;
    const sb = getSupabase();
    if (!sb) return toast.error("Admin actions require Supabase.");
    const token = (await sb.auth.getSession()).data.session?.access_token;
    setBusy(key);
    const response = await fetch("/api/admin/kyc", { method: "POST", headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: JSON.stringify({ action, documentId, userId, note: note[key] ?? "" }) });
    const data = await response.json().catch(() => ({}));
    setBusy(null);
    if (!response.ok) return toast.error(data.error ?? "KYC action failed");
    if (documentId) setDocuments((current) => current.map((document) => document.id === documentId ? { ...document, status: data.status, review_note: note[key] ?? null, reviewed_at: new Date().toISOString() } : document));
    if (userId && data.status && action.startsWith("owner_")) updateUserKyc(userId, data.status as KycStatus);
    toast.success("KYC review updated");
  };

  const owners = useMemo(() => users.filter((user) => user.role === "owner" && (filter === "all" || user.kycStatus === "pending" || documents.some((document) => document.user_id === user.id && document.status === "pending"))), [users, documents, filter]);
  const pendingCount = documents.filter((document) => document.status === "pending").length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div><h1 className="font-display text-2xl font-extrabold tracking-tight">KYC &amp; Documents</h1><p className="text-sm text-muted-foreground">Review owner identity, licensing, registration, insurance, and inspection documents.</p></div>
        <Button variant="outline" onClick={() => void load()}><RefreshCw className="h-4 w-4" /> Refresh</Button>
      </div>
      <div className="flex flex-wrap gap-2">{(["pending", "all"] as const).map((value) => <button key={value} type="button" onClick={() => setFilter(value)} className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${filter === value ? "border-gold bg-gold/15" : "border-border text-muted-foreground"}`}>{value === "pending" ? `Pending documents (${pendingCount})` : "All owners"}</button>)}</div>
      {owners.length === 0 ? <EmptyState icon={FileCheck2} title="No owners to review" description="New KYC submissions will appear here." /> : <div className="space-y-5">{owners.map((owner) => { const ownerDocs = documents.filter((document) => document.user_id === owner.id); const pendingDocs = ownerDocs.filter((document) => document.status === "pending"); const ownerKey = `owner:${owner.id}`; return <Card key={owner.id}><CardContent className="space-y-5 p-5"><div className="flex flex-wrap items-center gap-3"><span className="flex h-11 w-11 items-center justify-center rounded-full bg-navy-800 text-xs font-bold text-gold dark:bg-gold dark:text-navy-900">{initials(owner.name)}</span><div className="min-w-0 flex-1"><p className="font-semibold">{owner.name}</p><p className="text-xs text-muted-foreground">{owner.email} · {owner.phone || "No phone"}</p></div><Badge variant={VARIANT[owner.kycStatus]}>{owner.kycStatus}</Badge></div>{ownerDocs.length === 0 ? <p className="rounded-xl bg-secondary/60 p-4 text-sm text-muted-foreground">No documents uploaded yet.</p> : <div className="grid gap-3 lg:grid-cols-2">{ownerDocs.map((document) => { const key = document.id; return <div key={key} className="rounded-xl border border-border p-4"><div className="flex items-start gap-3"><FileText className="mt-0.5 h-5 w-5 text-gold" /><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><p className="text-sm font-semibold">{LABELS[document.type] ?? document.type}</p><Badge variant={VARIANT[document.status]}>{document.status}</Badge></div><p className="mt-1 text-xs text-muted-foreground">Submitted {fmtDate(document.created_at)}{document.reviewed_at ? ` · reviewed ${fmtDate(document.reviewed_at)}` : ""}</p>{document.review_note && <p className="mt-2 text-xs text-muted-foreground">Note: {document.review_note}</p>}</div></div><div className="mt-3 flex flex-wrap gap-2"><a href={document.url} target="_blank" rel="noreferrer" className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-border px-3 text-xs font-semibold hover:bg-secondary"><ExternalLink className="h-3.5 w-3.5" /> View document</a>{document.status === "pending" && <><Button size="sm" variant="gold" disabled={busy === key} onClick={() => void act("document_approve", document.id, owner.id)}><Check className="h-3.5 w-3.5" /> Approve</Button><Button size="sm" variant="outline" disabled={busy === key} onClick={() => void act("document_reject", document.id, owner.id)}><ShieldX className="h-3.5 w-3.5" /> Reject</Button></>}</div>{document.status === "pending" && <Input value={note[key] ?? ""} onChange={(event) => setNote((current) => ({ ...current, [key]: event.target.value }))} placeholder="Optional review note" className="mt-3" />}</div>; })}</div>}<div className="flex flex-wrap items-center gap-2 border-t border-border pt-4"><span className="mr-auto flex items-center gap-1.5 text-xs text-muted-foreground"><Clock3 className="h-3.5 w-3.5" /> {pendingDocs.length} pending document{pendingDocs.length === 1 ? "" : "s"}</span>{owner.kycStatus !== "verified" && <Button size="sm" variant="gold" disabled={busy === ownerKey || pendingDocs.length > 0} onClick={() => void act("owner_approve", undefined, owner.id)}><BadgeCheck className="h-3.5 w-3.5" /> Approve owner</Button>}{owner.kycStatus === "pending" && <Button size="sm" variant="outline" disabled={busy === ownerKey} onClick={() => void act("owner_reject", undefined, owner.id)}><ShieldX className="h-3.5 w-3.5" /> Reject owner</Button>}{owner.kycStatus !== "verified" && <Button size="sm" variant="ghost" disabled={busy === ownerKey} onClick={() => void act("request_resubmission", undefined, owner.id)}><RefreshCw className="h-3.5 w-3.5" /> Request resubmission</Button>}</div>{owner.kycStatus === "verified" && <p className="text-xs font-medium text-emerald-600">Owner approved. Fleet can be activated after vehicle review.</p>}</CardContent></Card>; })}</div>}
    </div>
  );
}
