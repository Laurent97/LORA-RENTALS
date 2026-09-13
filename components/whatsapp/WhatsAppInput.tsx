"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Loader2, AlertCircle, Phone } from "lucide-react";

interface WhatsAppInputProps {
  value: string;
  onChange: (value: string) => void;
  onVerifiedChange?: (isValid: boolean, normalized: string | null) => void;
  name?: string;
}

export function WhatsAppInput({ value, onChange, onVerifiedChange, name = "whatsapp" }: WhatsAppInputProps) {
  const [status, setStatus] = useState<"idle" | "checking" | "valid" | "invalid">("idle");
  const [normalized, setNormalized] = useState("");
  const [timer, setTimer] = useState<number | null>(null);

  useEffect(() => {
    if (timer) clearTimeout(timer);
    if (!value || value.length < 9) {
      setStatus("idle");
      onVerifiedChange?.(false, null);
      return;
    }
    const t = window.setTimeout(async () => {
      setStatus("checking");
      try {
        const res = await fetch("/api/whatsapp/verify-number", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ phone: value }),
        });
        const data = await res.json();
        if (data.ok) {
          setStatus("valid");
          setNormalized(data.normalized);
          onVerifiedChange?.(true, data.normalized);
        } else {
          setStatus("invalid");
          setNormalized("");
          onVerifiedChange?.(false, null);
        }
      } catch {
        setStatus("invalid");
        onVerifiedChange?.(false, null);
      }
    }, 600);
    setTimer(t);
    return () => clearTimeout(t);
  }, [value, onVerifiedChange]);

  return (
    <div className="space-y-2">
      <label className="flex items-center gap-2 text-sm font-semibold" htmlFor={name}>
        <Phone size={16} className="text-[#25D366]" />
        WhatsApp Number *
      </label>

      <div className="relative">
        <div className="pointer-events-none absolute left-3 top-1/2 flex -translate-y-1/2 items-center gap-2">
          <span className="text-lg">🇷🇼</span>
          <span className="text-sm font-semibold">+250</span>
          <div className="h-5 w-px bg-border" />
        </div>

        <input
          id={name}
          name={name}
          type="tel"
          inputMode="numeric"
          autoComplete="tel"
          placeholder="788 123 456"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`h-12 w-full rounded-xl border-2 bg-card pl-24 pr-12 text-sm outline-none transition placeholder:text-muted-foreground focus:ring-2 focus:ring-gold ${
            status === "valid"
              ? "border-[#25D366] bg-[#25D366]/5"
              : status === "invalid"
              ? "border-red-400 bg-red-50"
              : "border-border focus:border-gold"
          }`}
        />

        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          {status === "checking" && <Loader2 className="h-5 w-5 animate-spin text-gold" />}
          {status === "valid" && <CheckCircle2 className="h-5 w-5 text-[#25D366]" />}
          {status === "invalid" && <AlertCircle className="h-5 w-5 text-red-500" />}
        </div>
      </div>

      {status === "valid" && (
        <p className="flex items-center gap-1 text-xs text-[#25D366]">
          <CheckCircle2 size={12} /> Valid WhatsApp format {normalized ? `(${normalized})` : ""}
        </p>
      )}
      {status === "invalid" && (
        <p className="flex items-center gap-1 text-xs text-red-500">
          <AlertCircle size={12} /> Enter a valid Rwandan WhatsApp number (e.g. 788 123 456)
        </p>
      )}
      {status === "idle" && (
        <p className="text-xs text-muted-foreground">
          Customers will use this to reach you about your cars.
        </p>
      )}

      {status === "valid" && (
        <label className="mt-2 flex items-start gap-2 text-xs text-muted-foreground">
          <input type="checkbox" className="mt-0.5 accent-gold" required />
          I confirm this WhatsApp number is active and belongs to me.
        </label>
      )}
    </div>
  );
}
