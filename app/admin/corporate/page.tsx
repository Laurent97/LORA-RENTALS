"use client";

import { toast } from "sonner";
import { Building2, CheckCircle2, PauseCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/empty-state";
import { useApp } from "@/lib/store";
import { fmtDate } from "@/lib/utils";
import type { CorporateStatus } from "@/types";

const STATUS_VARIANT: Record<CorporateStatus, "warning" | "success" | "destructive"> = {
  pending: "warning",
  approved: "success",
  suspended: "destructive",
};

export default function AdminCorporatePage() {
  const { corporateAccounts, corporateMembers, updateCorporateStatus } = useApp();
  const pending = corporateAccounts.filter((a) => a.status === "pending");
  const active = corporateAccounts.filter((a) => a.status !== "pending");

  const act = (id: string, status: CorporateStatus, name: string) => {
    updateCorporateStatus(id, status);
    toast.success(`${name} → ${status}`);
  };

  const memberCount = (id: string) => corporateMembers.filter((m) => m.accountId === id).length;

  const renderAccount = (a: (typeof corporateAccounts)[number]) => (
    <Card key={a.id}>
      <CardContent className="p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <p className="font-display font-bold">{a.companyName}</p>
              <Badge variant={STATUS_VARIANT[a.status]} className="capitalize">{a.status}</Badge>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              {a.contactName} · {a.contactEmail} {a.contactPhone ? `· ${a.contactPhone}` : ""}
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {a.tin ? `TIN ${a.tin} · ` : ""}{a.creditTerms} terms · {memberCount(a.id)} member{memberCount(a.id) === 1 ? "" : "s"} · applied {fmtDate(a.createdAt)}
            </p>
          </div>
          <div className="flex gap-2">
            {a.status === "pending" && (
              <Button variant="gold" size="sm" onClick={() => act(a.id, "approved", a.companyName)}>
                <CheckCircle2 className="h-4 w-4" /> Approve
              </Button>
            )}
            {a.status === "approved" && (
              <Button variant="outline" size="sm" onClick={() => act(a.id, "suspended", a.companyName)}>
                <PauseCircle className="h-4 w-4" /> Suspend
              </Button>
            )}
            {a.status === "suspended" && (
              <Button variant="outline" size="sm" onClick={() => act(a.id, "approved", a.companyName)}>
                <CheckCircle2 className="h-4 w-4" /> Reinstate
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl font-extrabold tracking-tight">Corporate Accounts</h1>
        <p className="text-sm text-muted-foreground">Approve business applications and manage credit terms.</p>
      </div>

      <section>
        <h2 className="mb-3 font-display text-lg font-bold">Pending ({pending.length})</h2>
        {pending.length === 0 ? (
          <EmptyState icon={Building2} title="No applications" description="Corporate applications will appear here." />
        ) : (
          <div className="space-y-3">{pending.map(renderAccount)}</div>
        )}
      </section>

      {active.length > 0 && (
        <section>
          <h2 className="mb-3 font-display text-lg font-bold">Active accounts ({active.length})</h2>
          <div className="space-y-3">{active.map(renderAccount)}</div>
        </section>
      )}
    </div>
  );
}
