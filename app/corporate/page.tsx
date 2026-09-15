"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Building2, Download, FileText, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/empty-state";
import { useApp } from "@/lib/store";
import { fmtDate, formatMoney, initials } from "@/lib/utils";

const STATUS_VARIANT = { pending: "warning", approved: "success", suspended: "destructive" } as const;
const INV_VARIANT = { draft: "secondary", sent: "info", paid: "success", overdue: "destructive" } as const;

export default function CorporateDashboard() {
  const router = useRouter();
  const { user, corporateAccounts, corporateMembers, invoices, bookings, currency } = useApp();

  useEffect(() => {
    if (!user) router.replace("/login?next=/corporate");
  }, [user, router]);
  if (!user) return null;

  const membership = corporateMembers.find((m) => m.userId === user.id);
  const account = membership ? corporateAccounts.find((a) => a.id === membership.accountId) : null;
  const members = account ? corporateMembers.filter((m) => m.accountId === account.id) : [];
  const accountInvoices = account ? invoices.filter((i) => i.accountId === account.id) : [];
  const memberIds = new Set(members.map((m) => m.userId));
  const trips = bookings.filter((b) => memberIds.has(b.customerId));
  const spend = trips.reduce((s, b) => s + b.totalPrice, 0);

  if (!account) {
    return (
      <main className="container max-w-lg py-16 text-center">
        <Building2 className="mx-auto h-12 w-12 text-muted-foreground" />
        <h1 className="mt-4 font-display text-2xl font-extrabold">No corporate account</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Apply for LORA for Business to get team bookings, monthly invoicing and 10% off.
        </p>
        <Link href="/business" className="mt-6 inline-block">
          <Button variant="gold">Apply now</Button>
        </Link>
      </main>
    );
  }

  return (
    <main className="container max-w-5xl py-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-extrabold tracking-tight">{account.companyName}</h1>
          <p className="text-sm text-muted-foreground">
            {account.contactName} · {account.contactEmail} · {account.creditTerms} terms
          </p>
        </div>
        <Badge variant={STATUS_VARIANT[account.status]} className="px-3 py-1.5 capitalize">{account.status}</Badge>
      </div>

      {account.status === "pending" && (
        <Card className="mt-6 border-gold/40 bg-gold/5">
          <CardContent className="p-4 text-sm">
            Your application is under review — approval usually takes under 24 hours.
          </CardContent>
        </Card>
      )}

      {/* Stats */}
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        {[
          { label: "Team members", value: String(members.length) },
          { label: "Trips booked", value: String(trips.length) },
          { label: "Total spend", value: formatMoney(spend, currency) },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="p-5 text-center">
              <p className="font-display text-2xl font-extrabold">{s.value}</p>
              <p className="mt-1 text-xs text-muted-foreground">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        {/* Members */}
        <section>
          <h2 className="mb-3 flex items-center gap-2 font-display text-lg font-bold">
            <Users className="h-5 w-5" /> Team
          </h2>
          <Card>
            <CardContent className="divide-y divide-border p-0">
              {members.map((m) => (
                <div key={m.id} className="flex items-center gap-3 px-5 py-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-navy-800 text-xs font-bold text-gold dark:bg-gold dark:text-navy-900">
                    {initials(m.userId === user.id ? user.name : "Team member")}
                  </span>
                  <div className="flex-1">
                    <p className="text-sm font-semibold">{m.userId === user.id ? `${user.name} (you)` : m.userId.slice(0, 8)}</p>
                    {m.costCenter && <p className="text-xs text-muted-foreground">{m.costCenter}</p>}
                  </div>
                  <Badge variant="secondary" className="capitalize">{m.role}</Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </section>

        {/* Invoices */}
        <section>
          <h2 className="mb-3 flex items-center gap-2 font-display text-lg font-bold">
            <FileText className="h-5 w-5" /> Invoices
          </h2>
          {accountInvoices.length === 0 ? (
            <EmptyState icon={FileText} title="No invoices yet" description="Monthly invoices appear here once your account is active." />
          ) : (
            <Card>
              <CardContent className="divide-y divide-border p-0">
                {accountInvoices.map((inv) => (
                  <div key={inv.id} className="flex items-center justify-between px-5 py-3">
                    <div>
                      <p className="text-sm font-semibold">{fmtDate(inv.periodStart)} → {fmtDate(inv.periodEnd)}</p>
                      <p className="text-xs text-muted-foreground">{formatMoney(inv.amount, currency)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={INV_VARIANT[inv.status]} className="capitalize">{inv.status}</Badge>
                      <Button variant="ghost" size="icon" aria-label="Download invoice" onClick={() => window.open(`/api/invoices/${inv.id}`, "_blank")}>
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </section>
      </div>
    </main>
  );
}
