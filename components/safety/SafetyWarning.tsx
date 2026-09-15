"use client";

import { useState } from "react";
import { Shield, AlertTriangle, CheckCircle, Phone, X } from "lucide-react";
import { BRAND } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ReportScamDialog } from "./ReportScamDialog";

export type SafetyVariant = "full" | "compact" | "banner";

interface SafetyWarningProps {
  variant?: SafetyVariant;
  dismissible?: boolean;
  onAcknowledge?: () => void;
  showAcknowledgeButton?: boolean;
  showReport?: boolean;
  bookingId?: string;
  className?: string;
}

export function SafetyWarning({
  variant = "full",
  dismissible,
  onAcknowledge,
  showAcknowledgeButton,
  showReport = true,
  bookingId,
  className,
}: SafetyWarningProps) {
  const [dismissed, setDismissed] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);

  if (dismissed) return null;

  const phoneLink = `tel:${BRAND.phone.replace(/\s/g, "")}`;

  return (
    <div
      className={cn(
        "relative rounded-2xl border border-l-4 bg-navy-50/[0.03] p-6 dark:bg-[#061530]",
        "border-gold border-t-silver/30 border-r-silver/30 border-b-silver/30",
        variant === "compact" && "p-4",
        variant === "banner" && "p-4",
        className
      )}
    >
      {dismissible && (
        <button
          onClick={() => setDismissed(true)}
          className="absolute right-4 top-4 text-muted-foreground hover:text-foreground"
          aria-label="Dismiss"
        >
          <X className="h-4 w-4" />
        </button>
      )}

      <div className="mb-4 flex items-start gap-3">
        <Shield className="h-8 w-8 shrink-0 text-gold" />
        <h3 className="font-display text-sm font-extrabold uppercase tracking-wider text-navy-800 dark:text-white">
          Important — Read Before You Pay
        </h3>
      </div>

      <div className="space-y-3 text-sm">
        {variant !== "banner" && (
          <p className="font-semibold text-foreground">
            <AlertTriangle className="mr-1 inline h-4 w-4 text-amber-500" />
            <strong>NEVER</strong> pay any booking fee, deposit, or advance payment to anyone claiming to represent {BRAND.name} before you have the car.
          </p>
        )}

        <p className="font-semibold text-emerald-600 dark:text-emerald-400">
          <CheckCircle className="mr-1 inline h-4 w-4" />
          You pay <strong>ONLY</strong> at the LORA office or at pickup.
        </p>

        <p className="text-muted-foreground">
          {BRAND.shortName} never requests advance payments via WhatsApp, Mobile Money, bank transfer, or any link outside the official LORA app.
        </p>

        <p className="font-semibold text-navy-800 dark:text-gold">
          <Phone className="mr-1 inline h-4 w-4" />
          Report scams:{" "}
          <a href={phoneLink} className="underline">
            {BRAND.phone}
          </a>
          {" · "}
          {BRAND.supportEmail}
        </p>

        {variant === "full" && (
          <p className="border-t border-silver/30 pt-3 text-xs italic text-muted-foreground">
            {BRAND.name} is not responsible for any money lost through payments made outside the official LORA app or in violation of this notice.
          </p>
        )}
      </div>

      {showReport && (
        <Button
          variant="ghost"
          size="sm"
          className="mt-4 h-auto p-0 text-navy-800 dark:text-gold"
          onClick={() => setReportOpen(true)}
        >
          Report a scam
        </Button>
      )}

      {showAcknowledgeButton && (
        <Button
          variant="gold"
          size="sm"
          className="mt-4 w-full"
          onClick={onAcknowledge}
        >
          I understand — Continue
        </Button>
      )}

      <ReportScamDialog
        open={reportOpen}
        onOpenChange={setReportOpen}
        bookingId={bookingId}
      />
    </div>
  );
}
