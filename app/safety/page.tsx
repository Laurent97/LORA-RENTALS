import {
  Shield,
  AlertTriangle,
  CheckCircle,
  Phone,
  Lock,
  MessageCircleWarning,
  Siren,
  Ban,
} from "lucide-react";
import { BRAND } from "@/lib/constants";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: `Safety & Anti-Scam Policy — ${BRAND.name}`,
  description:
    "LORA Rentals LTD never charges a booking fee. Learn how to spot scams, report fraud, and stay safe.",
};

export default function SafetyPage() {
  const phone = `tel:${BRAND.phone.replace(/\s/g, "")}`;

  return (
    <main className="container max-w-3xl py-12">
      <div className="mb-8 text-center">
        <Shield className="mx-auto h-12 w-12 text-gold" />
        <h1 className="mt-4 font-display text-3xl font-extrabold tracking-tight">
          Your Safety, Our Priority
        </h1>
        <p className="mt-2 text-muted-foreground">
          LORA is the safest way to rent a car in Rwanda. Read our payment
          policy and learn how to avoid scams.
        </p>
      </div>

      <section className="rounded-2xl border border-l-4 border-gold border-t-silver/30 border-r-silver/30 border-b-silver/30 bg-navy-50/[0.03] p-6 dark:bg-[#061530]">
        <h2 className="mb-4 flex items-center gap-2 font-display text-lg font-bold">
          <AlertTriangle className="h-5 w-5 text-amber-500" /> Payment Rules
        </h2>
        <ul className="space-y-3 text-sm">
          <li className="flex items-start gap-2">
            <CheckCircle className="mt-0.5 h-4 w-4 text-emerald-500" />
            You pay ONLY at a LORA office or at pickup, when the car is in front
            of you.
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle className="mt-0.5 h-4 w-4 text-emerald-500" />
            Accepted at pickup: Cash · MTN MoMo · Card at the office.
          </li>
          <li className="flex items-start gap-2">
            <Ban className="mt-0.5 h-4 w-4 text-destructive" />
            LORA never asks for booking fees, deposits, or advance payments via
            WhatsApp, MoMo, bank transfer, or any link outside this app.
          </li>
        </ul>
        <p className="mt-4 text-xs italic text-muted-foreground">
          {BRAND.name} is not responsible for any money lost through payments
          made outside official LORA channels or in violation of this notice.
        </p>
      </section>

      <section className="mt-8 grid gap-6 sm:grid-cols-2">
        <div className="rounded-2xl border border-border p-5">
          <h3 className="mb-3 flex items-center gap-2 font-display font-bold">
            <MessageCircleWarning className="h-5 w-5 text-amber-500" /> How to
            Spot a Scam
          </h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>They ask you to pay before seeing the car.</li>
            <li>They ask for money via WhatsApp/MoMo only.</li>
            <li>They pressure you to pay quickly.</li>
            <li>They send links to non-LORA websites.</li>
            <li>They claim to be a &quot;LORA agent&quot; on social media.</li>
          </ul>
        </div>

        <div className="rounded-2xl border border-border p-5">
          <h3 className="mb-3 flex items-center gap-2 font-display font-bold">
            <Siren className="h-5 w-5 text-destructive" /> If You Are Contacted
          </h3>
          <ol className="list-decimal space-y-2 pl-5 text-sm text-muted-foreground">
            <li>Do not pay anything.</li>
            <li>Screenshot the conversation.</li>
            <li>
              Report to LORA: <a href={phone} className="font-semibold underline">{BRAND.phone}</a>
            </li>
            <li>Report to Rwanda Police: 112</li>
            <li>Block the person.</li>
          </ol>
        </div>

        <div className="rounded-2xl border border-border p-5">
          <h3 className="mb-3 flex items-center gap-2 font-display font-bold">
            <Lock className="h-5 w-5 text-gold" /> How We Protect You
          </h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>Every owner is KYC-verified.</li>
            <li>Every driver badge has a scannable QR code.</li>
            <li>Reviews are from real completed bookings.</li>
            <li>SOS button available during active trips.</li>
            <li>24/7 support team.</li>
          </ul>
        </div>

        <div className="rounded-2xl border border-border p-5">
          <h3 className="mb-3 flex items-center gap-2 font-display font-bold">
            <Phone className="h-5 w-5 text-navy-800 dark:text-gold" /> Contact
          </h3>
          <p className="text-sm text-muted-foreground">
            Emergency / scams: <a href={phone} className="font-semibold underline">{BRAND.phone}</a>
            <br />
            Email: {BRAND.supportEmail}
            <br />
            Website: {BRAND.siteUrl}
          </p>
        </div>
      </section>
    </main>
  );
}
