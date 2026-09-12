"use client";

import { useState } from "react";
import { toast } from "sonner";
import { BadgeCheck, Eye, Search, ShieldOff } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { useAllUsers } from "@/lib/lookup";
import { useApp } from "@/lib/store";
import { fmtDate, initials } from "@/lib/utils";
import type { KycStatus, UserRole } from "@/types";

const KYC_VARIANT: Record<KycStatus, "success" | "warning" | "destructive" | "secondary"> = {
  verified: "success",
  pending: "warning",
  rejected: "destructive",
  none: "secondary",
};

export default function AdminUsersPage() {
  const impersonate = useApp((s) => s.impersonate);
  const [q, setQ] = useState("");
  const [role, setRole] = useState<UserRole | "">("");

  const users = useAllUsers().filter(
    (u) =>
      (!role || u.role === role) &&
      (!q || u.name.toLowerCase().includes(q.toLowerCase()) || u.email.toLowerCase().includes(q.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-extrabold tracking-tight">User Management</h1>
        <p className="text-sm text-muted-foreground">{users.length} users · verify, suspend, impersonate</p>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input className="pl-10" placeholder="Search name or email…" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <Select value={role} onChange={(e) => setRole(e.target.value as UserRole | "")} className="w-44">
          <option value="">All roles</option>
          <option value="customer">Customers</option>
          <option value="owner">Owners</option>
          <option value="admin">Admins</option>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="p-4">User</th>
                  <th className="p-4">Role</th>
                  <th className="p-4">Phone</th>
                  <th className="p-4">KYC</th>
                  <th className="p-4">Joined</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-b border-border/60 last:border-0 hover:bg-secondary/40">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-navy-800 text-xs font-bold text-gold dark:bg-gold dark:text-navy-900">
                          {initials(u.name)}
                        </span>
                        <div>
                          <p className="font-semibold">{u.name}</p>
                          <p className="text-xs text-muted-foreground">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4"><Badge variant="secondary" className="capitalize">{u.role}</Badge></td>
                    <td className="p-4 text-xs">{u.phone}</td>
                    <td className="p-4"><Badge variant={KYC_VARIANT[u.kycStatus]} className="capitalize">{u.kycStatus}</Badge></td>
                    <td className="p-4 text-xs text-muted-foreground">{fmtDate(u.createdAt)}</td>
                    <td className="p-4">
                      <div className="flex justify-end gap-1.5">
                        {u.kycStatus === "pending" && (
                          <Button variant="outline" size="sm" onClick={() => toast.success(`${u.name} verified`)}>
                            <BadgeCheck className="h-3.5 w-3.5" /> Verify
                          </Button>
                        )}
                        {u.role !== "admin" && (
                          <>
                            <Button variant="ghost" size="sm" onClick={() => { impersonate(u.id); toast.info(`Now viewing as ${u.name}`); }}>
                              <Eye className="h-3.5 w-3.5" /> View as
                            </Button>
                            <Button variant="ghost" size="sm" className="text-destructive" onClick={() => toast.success(`${u.name} suspended`)}>
                              <ShieldOff className="h-3.5 w-3.5" />
                            </Button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
