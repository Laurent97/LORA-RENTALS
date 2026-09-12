"use client";

import { toast } from "sonner";
import { BadgeCheck, FileCheck2, ShieldX } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/empty-state";
import { useAllUsers } from "@/lib/lookup";
import { useApp } from "@/lib/store";
import { fmtDate, initials } from "@/lib/utils";
import type { KycStatus } from "@/types";

const KYC_VARIANT: Record<KycStatus, "success" | "warning" | "destructive" | "secondary"> = {
  verified: "success",
  pending: "warning",
  rejected: "destructive",
  none: "secondary",
};

export default function AdminKycPage() {
  const { updateUserKyc } = useApp();
  const users = useAllUsers();
  const queue = users.filter((u) => u.kycStatus === "pending");
  const reviewed = users.filter((u) => u.kycStatus === "verified" || u.kycStatus === "rejected");

  const act = (userId: string, status: KycStatus, name: string) => {
    updateUserKyc(userId, status);
    toast.success(`${name} marked ${status}`);
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl font-extrabold tracking-tight">KYC Approvals</h1>
        <p className="text-sm text-muted-foreground">
          Verify owner identity & vehicle documents. Verified owners get the blue badge.
        </p>
      </div>

      <section>
        <h2 className="mb-3 font-display text-lg font-bold">
          Pending review <span className="text-muted-foreground">({queue.length})</span>
        </h2>
        {queue.length === 0 ? (
          <EmptyState icon={FileCheck2} title="Queue is clear" description="No KYC submissions waiting for review." />
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {queue.map((u) => (
              <Card key={u.id}>
                <CardContent className="p-5">
                  <div className="flex items-center gap-3">
                    <span className="flex h-11 w-11 items-center justify-center rounded-full bg-navy-800 text-xs font-bold text-gold dark:bg-gold dark:text-navy-900">
                      {initials(u.name)}
                    </span>
                    <div className="flex-1">
                      <p className="font-semibold">{u.name}</p>
                      <p className="text-xs text-muted-foreground">{u.email} · {u.role}</p>
                    </div>
                    <Badge variant={KYC_VARIANT[u.kycStatus]}>{u.kycStatus}</Badge>
                  </div>
                  <p className="mt-3 text-xs text-muted-foreground">
                    Submitted {fmtDate(u.createdAt)} · Documents: national ID, driver&apos;s license, vehicle registration
                  </p>
                  <div className="mt-4 flex gap-2">
                    <Button variant="gold" size="sm" className="flex-1" onClick={() => act(u.id, "verified", u.name)}>
                      <BadgeCheck className="h-4 w-4" /> Approve
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1" onClick={() => act(u.id, "rejected", u.name)}>
                      <ShieldX className="h-4 w-4" /> Reject
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-3 font-display text-lg font-bold">Reviewed ({reviewed.length})</h2>
        <Card>
          <CardContent className="divide-y divide-border p-0">
            {reviewed.map((u) => (
              <div key={u.id} className="flex items-center gap-3 px-5 py-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary text-xs font-bold">
                  {initials(u.name)}
                </span>
                <div className="flex-1">
                  <p className="text-sm font-semibold">{u.name}</p>
                  <p className="text-xs text-muted-foreground">{u.email}</p>
                </div>
                <Badge variant={KYC_VARIANT[u.kycStatus]}>{u.kycStatus}</Badge>
                {u.kycStatus === "rejected" && (
                  <Button variant="ghost" size="sm" onClick={() => act(u.id, "verified", u.name)}>
                    Approve
                  </Button>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
