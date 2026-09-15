"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Camera, CheckCircle2, Keyboard, ScanLine, XCircle } from "lucide-react";
import { Html5Qrcode } from "html5-qrcode";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { StatusBadge } from "@/components/status-badge";
import { useApp } from "@/lib/store";
import { getSupabase } from "@/lib/supabase/client";
import { bookingRef, fmtDate, parseBookingQrPayload } from "@/lib/utils";
import type { Booking, User, Vehicle } from "@/types";

type Phase = "idle" | "scanning" | "found" | "done";

export default function ScanPage() {
  const router = useRouter();
  const { user, confirmPickup } = useApp();
  const [phase, setPhase] = useState<Phase>("idle");
  const [manual, setManual] = useState(false);
  const [code, setCode] = useState("");
  const [found, setFound] = useState<Booking | null>(null);
  const [foundVehicle, setFoundVehicle] = useState<Vehicle | null>(null);
  const [foundCustomer, setFoundCustomer] = useState<User | null>(null);
  const [error, setError] = useState("");
  const html5Ref = useRef<Html5Qrcode | null>(null);

  const isStaff = user && (user.role === "owner" || user.role === "admin");

  const stopCamera = async () => {
    if (html5Ref.current) {
      try {
        await html5Ref.current.stop();
        await html5Ref.current.clear();
      } catch {
        /* already stopped */
      }
      html5Ref.current = null;
    }
  };

  useEffect(() => () => { void stopCamera(); }, []);

  useEffect(() => {
    if (phase !== "scanning") return;
    const scanner = new Html5Qrcode("qr-reader");
    html5Ref.current = scanner;
    scanner
      .start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (decodedText) => {
          void lookup(decodedText);
        },
        () => {
          /* no QR in this frame — fine */
        }
      )
      .then(() => {
        toast.dismiss();
      })
      .catch((err) => {
        console.error("[scan] camera start failed:", err);
        setPhase("idle");
        setManual(true);
        toast.error("Camera access denied or not available — enter the code manually.");
      });
    return () => {
      void stopCamera();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  useEffect(() => {
    if (!user) router.replace("/login?next=/scan");
  }, [user, router]);

  const lookup = async (raw: string) => {
    const token = raw.trim();
    // QR encodes "LORA|1|<token>|<details...>" or legacy "LORA:<token>"
    let key = token;
    if (token.startsWith("LORA|")) {
      const parsed = parseBookingQrPayload(token);
      if (parsed?.token) key = parsed.token;
    } else if (token.startsWith("LORA:")) {
      key = token.slice(5);
    }

    setError("");
    try {
      const sb = getSupabase();
      const session = await sb?.auth.getSession();
      const res = await fetch("/api/scan/lookup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.data.session?.access_token ?? ""}`,
        },
        body: JSON.stringify({ code: token }),
      });
      const json = (await res.json().catch(() => ({}))) as {
        booking?: Booking;
        vehicle?: Vehicle;
        customer?: User;
        error?: string;
      };
      if (!res.ok || !json.booking) {
        setError(json.error ?? "No booking matches that code. Check and try again.");
        setFound(null);
        setFoundVehicle(null);
        setFoundCustomer(null);
        return;
      }
      setFound(json.booking);
      setFoundVehicle(json.vehicle ?? null);
      setFoundCustomer(json.customer ?? null);
      setPhase("found");
    } catch {
      setError("Network error. Try again.");
      setFound(null);
      setFoundVehicle(null);
      setFoundCustomer(null);
    }
  };

  const startCamera = () => {
    setError("");
    if (!navigator.mediaDevices?.getUserMedia) {
      setManual(true);
      toast.info("Camera not available in this browser — enter the code manually.");
      return;
    }
    setPhase("scanning");
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

  const vehicle = foundVehicle;
  const customer = foundCustomer;

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
                <div id="qr-reader" className="aspect-square w-full" />
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
                  <Button onClick={() => void lookup(code)}>Find</Button>
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
