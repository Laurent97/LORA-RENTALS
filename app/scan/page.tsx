"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Camera, CheckCircle2, Keyboard, ScanLine, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { StatusBadge } from "@/components/status-badge";
import { useApp } from "@/lib/store";
import { bookingRef, fmtDate, parseBookingQrPayload } from "@/lib/utils";
import type { Booking } from "@/types";

// BarcodeDetector is built into Chromium; we degrade to manual entry elsewhere.
declare class BarcodeDetector {
  constructor(opts?: { formats: string[] });
  detect(source: CanvasImageSource): Promise<{ rawValue: string }[]>;
  static getSupportedFormats(): Promise<string[]>;
}

type Phase = "idle" | "scanning" | "found" | "done";

export default function ScanPage() {
  const router = useRouter();
  const { user, bookings, vehicles, users, confirmPickup } = useApp();
  const [phase, setPhase] = useState<Phase>("idle");
  const [manual, setManual] = useState(false);
  const [code, setCode] = useState("");
  const [found, setFound] = useState<Booking | null>(null);
  const [error, setError] = useState("");
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number>(0);

  const isStaff = user && (user.role === "owner" || user.role === "admin");

  const stopCamera = () => {
    cancelAnimationFrame(rafRef.current);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  };

  useEffect(() => () => stopCamera(), []);

  useEffect(() => {
    if (!user) router.replace("/login?next=/scan");
  }, [user, router]);

  const lookup = (raw: string) => {
    const token = raw.trim();
    // QR encodes "LORA|1|<token>|<details...>" or legacy "LORA:<token>"
    let key = token;
    if (token.startsWith("LORA|")) {
      const parsed = parseBookingQrPayload(token);
      if (parsed?.token) key = parsed.token;
    } else if (token.startsWith("LORA:")) {
      key = token.slice(5);
    }
    const b = bookings.find(
      (x) => x.qrToken === key || x.qrCode === key || x.id === key || bookingRef(x.id) === key.toUpperCase()
    );
    if (!b) {
      setError("No booking matches that code. Check and try again.");
      setFound(null);
      return;
    }
    if (user?.role === "owner" && b.ownerId !== user.id) {
      setError("This booking isn't for one of your vehicles.");
      setFound(null);
      return;
    }
    setError("");
    setFound(b);
    setPhase("found");
    stopCamera();
  };

  const startCamera = async () => {
    setError("");
    if (!("BarcodeDetector" in window)) {
      setManual(true);
      toast.info("Camera scanning isn't supported in this browser — enter the code manually.");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      streamRef.current = stream;
      setPhase("scanning");
      // wait for video element
      requestAnimationFrame(async () => {
        if (!videoRef.current) return;
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        const detector = new BarcodeDetector({ formats: ["qr_code"] });
        const tick = async () => {
          if (!videoRef.current || !streamRef.current) return;
          try {
            const codes = await detector.detect(videoRef.current);
            if (codes.length) {
              lookup(codes[0].rawValue);
              return;
            }
          } catch {
            /* frame not ready */
          }
          rafRef.current = requestAnimationFrame(tick);
        };
        tick();
      });
    } catch {
      setManual(true);
      toast.error("Camera access denied — enter the code manually.");
    }
  };

  const confirm = () => {
    if (!found) return;
    confirmPickup(found.id);
    setPhase("done");
    toast.success(`Pickup confirmed — ${bookingRef(found.id)}`);
  };

  if (!user) return null;
  if (!isStaff) {
    return (
      <main className="container max-w-md py-16 text-center">
        <XCircle className="mx-auto h-10 w-10 text-destructive" />
        <h1 className="mt-4 font-display text-xl font-bold">Staff only</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          The pickup scanner is for vehicle owners and LORA staff.
        </p>
      </main>
    );
  }

  const vehicle = found ? vehicles.find((v) => v.id === found.vehicleId) : null;
  const customer = found ? users.find((u) => u.id === found.customerId) : null;

  return (
    <main className="container max-w-md py-10">
      <div className="mb-6 text-center">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-navy-800 text-gold">
          <ScanLine className="h-7 w-7" />
        </span>
        <h1 className="mt-4 font-display text-2xl font-extrabold">Pickup Scanner</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Scan the customer&apos;s QR code to confirm handover
        </p>
      </div>

      {phase === "done" && found ? (
        <Card className="border-emerald-500/50">
          <CardContent className="p-8 text-center">
            <CheckCircle2 className="mx-auto h-16 w-16 text-emerald-500" />
            <h2 className="mt-4 font-display text-xl font-bold">Pickup confirmed</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {vehicle ? `${vehicle.make} ${vehicle.model}` : "Vehicle"} · {bookingRef(found.id)}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {customer?.name} · {new Date().toLocaleTimeString()}
            </p>
            <Button className="mt-6 w-full" variant="outline" onClick={() => { setFound(null); setPhase("idle"); setCode(""); }}>
              Scan another
            </Button>
          </CardContent>
        </Card>
      ) : phase === "found" && found ? (
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <p className="font-mono text-sm font-bold">{bookingRef(found.id)}</p>
              <StatusBadge status={found.status} />
            </div>
            <dl className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between"><dt className="text-muted-foreground">Customer</dt><dd className="font-medium">{customer?.name ?? "—"}</dd></div>
              <div className="flex justify-between"><dt className="text-muted-foreground">Vehicle</dt><dd className="font-medium">{vehicle ? `${vehicle.make} ${vehicle.model}` : "—"}</dd></div>
              <div className="flex justify-between"><dt className="text-muted-foreground">Dates</dt><dd>{fmtDate(found.startDate)} → {fmtDate(found.endDate)}</dd></div>
              <div className="flex justify-between"><dt className="text-muted-foreground">Pickup</dt><dd>{found.pickupLocation}</dd></div>
            </dl>
            {found.status === "confirmed" ? (
              <Button variant="gold" className="mt-6 w-full" onClick={confirm}>
                <CheckCircle2 className="h-4 w-4" /> Confirm pickup & hand over keys
              </Button>
            ) : (
              <p className="mt-6 rounded-xl bg-secondary p-3 text-center text-sm">
                {found.status === "picked_up"
                  ? "Already picked up."
                  : `Booking is "${found.status.replace("_", " ")}" — only confirmed bookings can be scanned for pickup.`}
              </p>
            )}
            <Button variant="ghost" className="mt-2 w-full" onClick={() => { setFound(null); setPhase("idle"); setCode(""); }}>
              Scan a different code
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-6">
            {phase === "scanning" ? (
              <div className="relative overflow-hidden rounded-xl bg-navy-950">
                <video ref={videoRef} className="aspect-square w-full object-cover" muted playsInline />
                <div className="pointer-events-none absolute inset-8 rounded-xl border-2 border-gold/70" />
                <p className="absolute bottom-3 left-0 right-0 text-center text-xs font-medium text-white/80">
                  Point at the customer&apos;s QR code
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <Button variant="gold" className="w-full" onClick={startCamera}>
                  <Camera className="h-4 w-4" /> Open camera scanner
                </Button>
                <Button variant="outline" className="w-full" onClick={() => setManual((m) => !m)}>
                  <Keyboard className="h-4 w-4" /> Enter code manually
                </Button>
              </div>
            )}

            {(manual || phase === "idle") && manual && (
              <div className="mt-4">
                <Label className="mb-1.5 block">Booking code or reference</Label>
                <div className="flex gap-2">
                  <Input
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="LRA-XXXXXX or QR token"
                    onKeyDown={(e) => e.key === "Enter" && lookup(code)}
                  />
                  <Button onClick={() => lookup(code)}>Find</Button>
                </div>
              </div>
            )}
            {error && <p className="mt-3 text-center text-sm font-medium text-destructive">{error}</p>}
          </CardContent>
        </Card>
      )}
    </main>
  );
}
