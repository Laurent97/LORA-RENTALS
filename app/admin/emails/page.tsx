"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { ExternalLink, Eye, Mail, RefreshCw, Search, Send } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/empty-state";
import { getSupabase } from "@/lib/supabase/client";
import { templates, templateSlugs, type TemplateSlug } from "@/lib/postmark/templates/registry";
import type { EmailLogRow, EmailStatus, TemplateCategory } from "@/lib/postmark/types";
import { useApp } from "@/lib/store";
import { cn, fmtDateTime } from "@/lib/utils";

const STATUS_VARIANT: Record<EmailStatus, "default" | "success" | "warning" | "destructive" | "secondary"> = {
  queued: "secondary",
  sent: "default",
  delivered: "success",
  opened: "success",
  clicked: "success",
  bounced: "destructive",
  spam: "destructive",
  failed: "destructive",
  skipped: "warning",
};

const CATEGORIES: { key: TemplateCategory | "all"; label: string }[] = [
  { key: "all", label: "All" },
  { key: "auth", label: "Auth & OTP" },
  { key: "bookings", label: "Bookings" },
  { key: "payments", label: "Payments" },
  { key: "owner", label: "Owner" },
  { key: "loyalty", label: "Loyalty" },
  { key: "admin", label: "Admin" },
  { key: "disputes", label: "Disputes" },
  { key: "inspections", label: "Inspections" },
  { key: "corporate", label: "Corporate" },
  { key: "marketing", label: "Marketing" },
];

type Locale = "en" | "rw" | "fr";

async function authHeaders(): Promise<HeadersInit> {
  const sb = getSupabase();
  const token = sb ? (await sb.auth.getSession()).data.session?.access_token : null;
  return token ? { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } : { "Content-Type": "application/json" };
}

export default function AdminEmailsPage() {
  const { user } = useApp();
  const [tab, setTab] = useState<"logs" | "templates">("templates");

  // ── Logs ────────────────────────────────────────────────────────────────────
  const [logs, setLogs] = useState<EmailLogRow[] | null>(null);
  const [configured, setConfigured] = useState(true);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<EmailStatus | "">("");
  const [resending, setResending] = useState<string | null>(null);

  const loadLogs = useCallback(async () => {
    setLogs(null);
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (status) params.set("status", status);
    try {
      const res = await fetch(`/api/email/logs?${params}`, { headers: await authHeaders() });
      if (res.status === 401) {
        setLogs([]);
        setConfigured(false);
        return;
      }
      const json = await res.json();
      setLogs(json.logs ?? []);
      setConfigured(json.configured ?? true);
    } catch {
      setLogs([]);
    }
  }, [q, status]);

  useEffect(() => {
    if (tab === "logs") void loadLogs();
  }, [tab, loadLogs]);

  const resend = async (id: string) => {
    setResending(id);
    try {
      const res = await fetch("/api/email/logs", { method: "POST", headers: await authHeaders(), body: JSON.stringify({ logId: id }) });
      const json = await res.json();
      if (json.ok) toast.success(json.status === "skipped" ? `Skipped — ${json.reason}` : "Email resent");
      else toast.error(json.reason ?? "Resend failed");
      void loadLogs();
    } finally {
      setResending(null);
    }
  };

  // ── Templates ───────────────────────────────────────────────────────────────
  const [cat, setCat] = useState<TemplateCategory | "all">("all");
  const [tq, setTq] = useState("");
  const [locale, setLocale] = useState<Locale>("en");
  const [selected, setSelected] = useState<TemplateSlug>("booking-confirmed");
  const [testTo, setTestTo] = useState("");
  const [sendingTest, setSendingTest] = useState(false);

  const filtered = useMemo(
    () =>
      templateSlugs.filter((s) => {
        const t = templates[s];
        return (cat === "all" || t.category === cat) && (!tq || s.includes(tq.toLowerCase()) || t.name.toLowerCase().includes(tq.toLowerCase()));
      }),
    [cat, tq]
  );

  const previewUrl = `/api/email/preview/${selected}?locale=${locale}`;
  const sel = templates[selected];

  const sendTest = async () => {
    const to = testTo || user?.email;
    if (!to) return toast.error("Enter a recipient");
    setSendingTest(true);
    try {
      const res = await fetch("/api/email/send", {
        method: "POST",
        headers: await authHeaders(),
        body: JSON.stringify({ to, templateSlug: selected, data: sel.sample, locale, userId: user?.id }),
      });
      const json = await res.json();
      if (res.status === 401) toast.error("Sign in with a Supabase admin account to send test emails");
      else if (json.ok) toast.success(json.status === "skipped" ? `Rendered but not sent — ${json.reason}` : `Sent to ${to}`);
      else toast.error(json.reason ?? json.error ?? "Send failed");
    } finally {
      setSendingTest(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold">Emails</h1>
          <p className="text-sm text-muted-foreground">{templateSlugs.length} Postmark templates · delivery log · resend</p>
        </div>
        <div className="flex rounded-lg border border-border p-0.5 text-sm font-semibold">
          {(["templates", "logs"] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)} className={cn("rounded-md px-4 py-1.5 capitalize transition-colors", tab === t ? "bg-navy-800 text-gold dark:bg-gold dark:text-navy-900" : "text-muted-foreground hover:text-foreground")}>
              {t}
            </button>
          ))}
        </div>
      </div>

      {tab === "templates" && (
        <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
          <Card className="h-fit">
            <CardContent className="space-y-3 p-4">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input value={tq} onChange={(e) => setTq(e.target.value)} placeholder="Search templates…" className="pl-8" />
              </div>
              <div className="flex flex-wrap gap-1">
                {CATEGORIES.map((c) => (
                  <button key={c.key} onClick={() => setCat(c.key)} className={cn("rounded-full px-2.5 py-1 text-xs font-semibold transition-colors", cat === c.key ? "bg-gold text-navy-900" : "bg-secondary text-muted-foreground hover:text-foreground")}>
                    {c.label}
                  </button>
                ))}
              </div>
              <ul className="max-h-[60vh] space-y-0.5 overflow-y-auto pr-1">
                {filtered.map((s) => (
                  <li key={s}>
                    <button onClick={() => setSelected(s)} className={cn("w-full rounded-md px-2.5 py-2 text-left transition-colors", selected === s ? "bg-navy-800 text-white dark:bg-gold dark:text-navy-900" : "hover:bg-secondary")}>
                      <div className="text-sm font-semibold">{templates[s].name}</div>
                      <div className={cn("truncate font-mono text-[11px]", selected === s ? "opacity-80" : "text-muted-foreground")}>{s}</div>
                    </button>
                  </li>
                ))}
                {filtered.length === 0 && <li className="p-3 text-center text-sm text-muted-foreground">No templates match.</li>}
              </ul>
            </CardContent>
          </Card>

          <div className="space-y-3">
            <Card>
              <CardContent className="flex flex-wrap items-center gap-2 p-3">
                <Badge variant="secondary" className="capitalize">{sel.category}</Badge>
                <span className="font-mono text-xs text-muted-foreground">{selected}</span>
                <span className="ml-auto flex items-center gap-1 rounded-full border border-border p-0.5 text-xs font-bold">
                  {(["en", "rw", "fr"] as Locale[]).map((l) => (
                    <button key={l} onClick={() => setLocale(l)} className={cn("rounded-full px-2 py-0.5 uppercase", locale === l ? "bg-navy-800 text-gold dark:bg-gold dark:text-navy-900" : "text-muted-foreground")}>{l}</button>
                  ))}
                </span>
                <a href={previewUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs font-semibold text-navy-800 hover:underline dark:text-gold">
                  <ExternalLink className="h-3.5 w-3.5" /> Open
                </a>
                <a href={`${previewUrl}&format=text`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs font-semibold text-navy-800 hover:underline dark:text-gold">
                  <Eye className="h-3.5 w-3.5" /> Plain text
                </a>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3">
                <div className="mb-2 text-xs text-muted-foreground">
                  <span className="font-semibold text-foreground">Subject:</span> {sel.subject(sel.sample as never)}
                </div>
                <iframe key={previewUrl} src={previewUrl} title={`Preview ${selected}`} className="h-[70vh] w-full rounded-lg border border-border bg-[#F8F9FB]" sandbox="allow-same-origin allow-popups" />
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex flex-wrap items-center gap-2 p-3">
                <Input value={testTo} onChange={(e) => setTestTo(e.target.value)} placeholder={user?.email ?? "you@example.com"} type="email" className="max-w-xs" />
                <Button onClick={sendTest} disabled={sendingTest} size="sm">
                  <Send className="mr-1.5 h-4 w-4" /> {sendingTest ? "Sending…" : "Send test with sample data"}
                </Button>
                <span className="text-xs text-muted-foreground">Requires POSTMARK_SERVER_TOKEN and a Supabase admin session.</span>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {tab === "logs" && (
        <div className="space-y-3">
          <Card>
            <CardContent className="flex flex-wrap items-center gap-2 p-3">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => e.key === "Enter" && loadLogs()} placeholder="Search recipient or subject…" className="pl-8" />
              </div>
              <select value={status} onChange={(e) => setStatus(e.target.value as EmailStatus | "")} className="h-10 rounded-md border border-input bg-background px-3 text-sm">
                <option value="">All statuses</option>
                {Object.keys(STATUS_VARIANT).map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
              <Button variant="outline" size="sm" onClick={() => loadLogs()}>
                <RefreshCw className="mr-1.5 h-4 w-4" /> Refresh
              </Button>
            </CardContent>
          </Card>

          {logs === null ? (
            <div className="space-y-2">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}</div>
          ) : !configured ? (
            <EmptyState icon={Mail} title="Email log unavailable" description="Sign in with a Supabase admin account and set SUPABASE_SERVICE_ROLE_KEY to view delivery logs." />
          ) : logs.length === 0 ? (
            <EmptyState icon={Mail} title="No emails yet" description="Sent emails, opens, clicks and bounces will appear here." />
          ) : (
            <Card>
              <CardContent className="p-0">
                <table className="w-full text-sm">
                  <thead className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                    <tr>
                      <th className="px-4 py-3">When</th>
                      <th className="px-4 py-3">To</th>
                      <th className="px-4 py-3">Template / Subject</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map((l) => (
                      <tr key={l.id} className="border-b border-border/60 last:border-0">
                        <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">{fmtDateTime(l.created_at)}</td>
                        <td className="px-4 py-3">{l.to_email}</td>
                        <td className="max-w-[360px] px-4 py-3">
                          <div className="font-mono text-[11px] text-muted-foreground">{l.template_slug}</div>
                          <div className="truncate font-medium">{l.subject}</div>
                          {l.error && <div className="truncate text-xs text-destructive">{l.error}</div>}
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant={STATUS_VARIANT[l.status]} className="capitalize">{l.status}</Badge>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Button variant="ghost" size="sm" disabled={resending === l.id} onClick={() => resend(l.id)}>
                            <RefreshCw className={cn("mr-1.5 h-3.5 w-3.5", resending === l.id && "animate-spin")} /> Resend
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
