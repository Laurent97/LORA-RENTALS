"use client";

import { Card, CardContent } from "@/components/ui/card";
import { BRAND } from "@/lib/constants";

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section className="space-y-4">
    <h2 className="font-display text-xl font-bold" style={{ color: "#0A1F44" }}>{title}</h2>
    {children}
  </section>
);

const List = ({ items }: { items: string[] }) => (
  <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
    {items.map((item, i) => <li key={i}>{item}</li>)}
  </ul>
);

export default function HowItWorksPage() {
  return (
    <main className="mx-auto max-w-4xl space-y-10 p-6 lg:p-12">
      <div className="text-center">
        <h1 className="font-display text-3xl font-extrabold tracking-tight" style={{ color: "#0A1F44" }}>How {BRAND.shortName} Works</h1>
        <p className="mt-2 text-muted-foreground">A complete guide to renting, listing, and managing vehicles on {BRAND.name}.</p>
      </div>

      <Card>
        <CardContent className="space-y-8 p-6">
          <Section title="For Customers">
            <p className="text-sm text-muted-foreground">Browse approved vehicles, filter by location and type, then select a rental mode. Book self-drive or with-driver vehicles, pay via MoMo, card, cash, or wallet, and track the live trip. After return, receive a branded receipt and earn LORA points.</p>
            <List items={["Browse vehicles at /browse", "Select self-drive, with-driver, or both", "Pay with MoMo, card, cash, or wallet", "Track live trip at /track/{token}", "Get branded receipts and invoices", "Earn and redeem LORA points"]} />
          </Section>

          <Section title="For Owners">
            <p className="text-sm text-muted-foreground">Complete KYC, then list vehicles and drivers from the owner dashboard. Set rental modes, dynamic pricing rules, availability, and manage bookings. Earn after each completed trip, minus platform commission.</p>
            <List items={["Complete KYC at /kyc", "List vehicles at /owner/fleet", "Add drivers at /owner/drivers", "Set dynamic pricing rules", "Manage bookings and scan QR at pickup", "Track earnings at /owner/earnings"]} />
          </Section>

          <Section title="For Corporate Accounts">
            <p className="text-sm text-muted-foreground">Register a company, invite members, set cost centers and approval policies. Employees book under the corporate account, managers approve, and the company receives monthly consolidated invoices.</p>
            <List items={["Register at /business", "Invite members and assign roles", "Set cost centers and approval chains", "Employees book with PO numbers", "Receive monthly VAT invoices", "Export reports and CSVs"]} />
          </Section>

          <Section title="For Multi-Tenant / Country Operators">
            <p className="text-sm text-muted-foreground">LORA supports Rwanda, Kenya, Uganda, Tanzania, and DR Congo from one project. Country settings control currency, VAT, booking fee, phone prefix, and payment rails per market.</p>
            <List items={["Countries: RW, KE, UG, TZ, CD", "Per-country currency and VAT", "Data scoped by country column", "Admin manages settings at /admin/tenants"]} />
          </Section>

          <Section title="For Admins">
            <p className="text-sm text-muted-foreground">Admins approve vehicles and KYC, manage users and roles, respond to SOS and geofence alerts, handle corporate accounts, generate documents, and configure country-specific settings.</p>
            <List items={["Approve/reject vehicles and drivers", "Manage users, roles, and KYC", "Monitor SOS and geofence alerts", "Approve corporate accounts", "Generate branded receipts and invoices", "Manage country settings"]} />
          </Section>
        </CardContent>
      </Card>
    </main>
  );
}
