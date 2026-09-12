"use client";

import { useMemo, useState } from "react";
import { BadgeCheck, Eye, KeyRound, Search, ShieldAlert, ShieldCheck, ShieldOff, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { useAllUsers } from "@/lib/lookup";
import { getSupabase } from "@/lib/supabase/client";
import { useApp } from "@/lib/store";
import { fmtDate, initials } from "@/lib/utils";
import type { KycStatus, UserRole } from "@/types";

const KYC_VARIANT: Record<KycStatus, "success" | "warning" | "destructive" | "secondary"> = { verified: "success", pending: "warning", rejected: "destructive", none: "secondary" };
type Action = "set_role" | "verify_kyc" | "reject_kyc" | "suspend" | "restore" | "delete";

export default function AdminUsersPage() {
  const currentUser = useApp((s) => s.user);
  const impersonate = useApp((s) => s.impersonate);
  const users = useAllUsers();
  const [q, setQ] = useState("");
  const [role, setRole] = useState<UserRole | "">("");
  const [busy, setBusy] = useState<string | null>(null);
  const [reason, setReason] = useState<Record<string, string>>({});

  const filtered = useMemo(() => users.filter((user) => (!role || user.role === role) && (!q || user.name.toLowerCase().includes(q.toLowerCase()) || user.email.toLowerCase().includes(q.toLowerCase()))), [users, q, role]);

  const act = async (action: Action, userId: string, payload: Record<string, string> = {}) => {
    const target = users.find((user) => user.id === userId);
    if (!target) return;
    if (action === "delete" && !window.confirm(`Soft-delete ${target.name}? Their account will be disabled and retained for audit.`)) return;
    if (action === "suspend" && !window.confirm(`Suspend ${target.name}'s account?`)) return;
    const sb = getSupabase();
    if (!sb) return toast.error("Admin actions require Supabase.");
    const token = (await sb.auth.getSession()).data.session?.access_token;
    const key = `${action}:${userId}`;
    setBusy(key);
    const response = await fetch("/api/admin/users", { method: "POST", headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: JSON.stringify({ action, userId, ...payload, reason: reason[userId] ?? "" }) });
    const data = await response.json().catch(() => ({}));
    setBusy(null);
    if (!response.ok) return toast.error(data.error ?? "User action failed");
    if (action === "delete") useApp.setState((state) => ({ users: state.users.filter((user) => user.id !== userId) }));
    if (action === "verify_kyc" || action === "reject_kyc") useApp.getState().updateUserKyc(userId, data.kycStatus as KycStatus);
    if (action === "set_role") useApp.setState((state) => ({ users: state.users.map((user) => user.id === userId ? { ...user, role: data.role } : user) }));
    toast.success(`${target.name} updated`);
  };

  return <div className="space-y-6"><div><h1 className="font-display text-2xl font-extrabold tracking-tight">User Management</h1><p className="text-sm text-muted-foreground">{filtered.length} users · roles, KYC, access, and account lifecycle</p></div><div className="flex flex-wrap gap-3"><div className="relative min-w-[220px] flex-1"><Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input className="pl-10" placeholder="Search name or email…" value={q} onChange={(event) => setQ(event.target.value)} /></div><Select value={role} onChange={(event) => setRole(event.target.value as UserRole | "")} className="w-44"><option value="">All roles</option><option value="customer">Customers</option><option value="owner">Owners</option><option value="admin">Admins</option></Select></div><Card><CardContent className="p-0"><div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground"><th className="p-4">User</th><th className="p-4">Role</th><th className="p-4">KYC</th><th className="p-4">Joined</th><th className="p-4 text-right">Admin actions</th></tr></thead><tbody>{filtered.map((user) => { const isSelf = user.id === currentUser?.id; const suspended = Boolean(user.suspendedAt); const deleted = Boolean(user.deletedAt); return <tr key={user.id} className="border-b border-border/60 align-top last:border-0 hover:bg-secondary/40"><td className="p-4"><div className="flex items-center gap-3"><span className="flex h-9 w-9 items-center justify-center rounded-full bg-navy-800 text-xs font-bold text-gold dark:bg-gold dark:text-navy-900">{initials(user.name)}</span><div><p className="font-semibold">{user.name}</p><p className="text-xs text-muted-foreground">{user.email}</p><p className="text-xs text-muted-foreground">{user.phone || "No phone"}</p></div></div></td><td className="p-4"><div className="flex flex-col gap-2"><Badge variant="secondary" className="w-fit capitalize">{user.role}</Badge><Select value={user.role} disabled={isSelf || deleted || busy === `set_role:${user.id}`} onChange={(event) => void act("set_role", user.id, { role: event.target.value })} className="h-8 w-32 text-xs"><option value="customer">Customer</option><option value="owner">Owner</option><option value="admin">Admin</option></Select></div></td><td className="p-4"><div className="flex flex-col gap-2"><Badge variant={KYC_VARIANT[user.kycStatus]} className="w-fit capitalize">{user.kycStatus}</Badge>{user.kycStatus === "pending" && <div className="flex gap-1"><Button size="sm" variant="gold" disabled={busy === `verify_kyc:${user.id}`} onClick={() => void act("verify_kyc", user.id)}><BadgeCheck className="h-3.5 w-3.5" /> Verify</Button><Button size="sm" variant="outline" disabled={busy === `reject_kyc:${user.id}`} onClick={() => void act("reject_kyc", user.id)}><ShieldAlert className="h-3.5 w-3.5" /></Button></div>}</div></td><td className="p-4 text-xs text-muted-foreground">{fmtDate(user.createdAt)}</td><td className="p-4"><div className="flex min-w-[260px] flex-wrap justify-end gap-1.5">{!deleted && <Button variant="ghost" size="sm" onClick={() => { impersonate(user.id); toast.info(`Now viewing as ${user.name}`); }}><Eye className="h-3.5 w-3.5" /> View as</Button>}{!deleted && !isSelf && (suspended ? <Button variant="outline" size="sm" disabled={busy === `restore:${user.id}`} onClick={() => void act("restore", user.id)}><ShieldCheck className="h-3.5 w-3.5" /> Restore</Button> : <Button variant="ghost" size="sm" className="text-amber-600" disabled={busy === `suspend:${user.id}`} onClick={() => void act("suspend", user.id)}><ShieldOff className="h-3.5 w-3.5" /> Suspend</Button>)}{!deleted && !isSelf && <Button variant="ghost" size="sm" className="text-destructive" disabled={busy === `delete:${user.id}`} onClick={() => void act("delete", user.id)}><Trash2 className="h-3.5 w-3.5" /> Delete</Button>}{deleted && <Badge variant="destructive">Deleted</Badge>}</div>{!deleted && !isSelf && <Input value={reason[user.id] ?? ""} onChange={(event) => setReason((current) => ({ ...current, [user.id]: event.target.value }))} placeholder="Suspension/review note" className="mt-2 min-w-[240px]" />}</td></tr>; })}</tbody></table></div></CardContent></Card></div>;
}
