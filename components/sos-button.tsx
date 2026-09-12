"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { AlertTriangle, Phone, Siren } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useApp } from "@/lib/store";
import { useT } from "@/lib/i18n";
import { cn, whatsappLink } from "@/lib/utils";
import { BRAND } from "@/lib/constants";
import type { Booking, SosType } from "@/types";

const HOLD_MS = 3000;
const SOS_TYPES: { value: SosType; icon: typeof AlertTriangle; labelKey: string }[] = [
  { value: "accident", icon: AlertTriangle, labelKey: "sos.accident" },
  { value: "breakdown", icon: AlertTriangle, labelKey: "sos.breakdown" },
  { value: "safety", icon: Siren, labelKey: "sos.safety" },
  { value: "other", icon: Phone, labelKey: "sos.other" },
];

export function SosButton({ booking }: { booking: Booking }) {
  const t = useT();
  const { user, addSos } = useApp();
  const [open, setOpen] = useState(false);
  const [holding, setHolding] = useState(false);
  const [progress, setProgress] = useState(0);
  const [sent, setSent] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startRef = useRef(0);

  // only show during an active trip
  if (!user || booking.status !== "picked_up") return null;

  const startHold = () => {
    setHolding(true);
    startRef.current = Date.now();
    setProgress(0);
    timerRef.current = setInterval(() => {
      const pct = Math.min(100, ((Date.now() - startRef.current) / HOLD_MS) * 100);
      setProgress(pct);
      if (pct >= 100) {
        clearInterval(timerRef.current!);
        setHolding(false);
        setOpen(true);
      }
    }, 50);
  };

  const endHold = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setHolding(false);
    setProgress(0);
  };

  useEffect(() => () => { if (timerRef.current) clearInterval(timerRef.current); }, []);

  const trigger = (type: SosType) => {
    const finish = (lat?: number, lng?: number) => {
      addSos({
        id: crypto.randomUUID(),
        userId: user.id,
        bookingId: booking.id,
        type,
        lat,
        lng,
        status: "open",
        createdAt: new Date().toISOString(),
      });
      setSent(true);
      toast.success(t("sos.sent"));
      // WhatsApp alert to LORA support
      window.open(
        whatsappLink(
          BRAND.whatsapp,
          `SOS ${type.toUpperCase()} — booking ${booking.id.slice(0, 8)}${lat ? ` — location: https://maps.google.com/?q=${lat},${lng}` : ""}`
        ),
        "_blank"
      );
    };
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => finish(pos.coords.latitude, pos.coords.longitude),
        () => finish(),
        { timeout: 5000 }
      );
    } else {
      finish();
    }
  };

  return (
    <>
      <button
        onMouseDown={startHold}
        onMouseUp={endHold}
        onMouseLeave={endHold}
        onTouchStart={startHold}
        onTouchEnd={endHold}
        aria-label={t("sos.hold")}
        className={cn(
          "fixed bottom-20 left-4 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-destructive text-white shadow-xl transition-transform md:bottom-6 md:left-6",
          holding && "scale-110"
        )}
      >
        <svg className="absolute inset-0 -rotate-90" viewBox="0 0 56 56">
          <circle cx="28" cy="28" r="25" fill="none" stroke="rgba(255,255,255,.25)" strokeWidth="3" />
          <circle
            cx="28" cy="28" r="25" fill="none" stroke="#fff" strokeWidth="3"
            strokeDasharray={2 * Math.PI * 25}
            strokeDashoffset={2 * Math.PI * 25 * (1 - progress / 100)}
          />
        </svg>
        <span className="font-display text-xs font-extrabold">{t("sos.button")}</span>
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent onClose={() => { setOpen(false); setSent(false); }}>
          <DialogHeader>
            <DialogTitle>
              <span className="flex items-center gap-2 text-destructive">
                <Siren className="h-5 w-5" /> {t("sos.title")}
              </span>
            </DialogTitle>
            <DialogDescription>
              {sent
                ? "LORA support has your alert and location. Stay safe — help is on the way."
                : "Select the emergency type. Your GPS location is shared with LORA support."}
            </DialogDescription>
          </DialogHeader>
          {sent ? (
            <div className="space-y-3">
              <div className="rounded-xl bg-emerald-500/10 p-4 text-center text-sm font-semibold text-emerald-600">
                {t("sos.sent")}
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <a href="tel:112" className="rounded-xl border border-border p-3 text-center font-semibold">🚔 Police 112</a>
                <a href="tel:912" className="rounded-xl border border-border p-3 text-center font-semibold">🚑 Ambulance 912</a>
              </div>
              <a href={`tel:${BRAND.phone.replace(/\s/g, "")}`} className="block">
                <Button variant="gold" className="w-full">Call LORA support</Button>
              </a>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {SOS_TYPES.map((s) => (
                <button
                  key={s.value}
                  onClick={() => trigger(s.value)}
                  className="flex flex-col items-center gap-2 rounded-xl border border-border p-4 text-sm font-semibold transition-colors hover:border-destructive hover:bg-destructive/5"
                >
                  <s.icon className="h-6 w-6 text-destructive" />
                  {t(s.labelKey as never)}
                </button>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
