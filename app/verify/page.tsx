"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { toast } from "sonner";
import { MailCheck, RefreshCw, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LogoMark } from "@/components/layout/logo";
import { OtpInput } from "@/components/otp-input";
import { useApp, type OtpType } from "@/lib/store";
import { getSupabase } from "@/lib/supabase/client";

const DEST: Record<string, string> = { customer: "/dashboard", owner: "/owner", admin: "/admin" };
const RESEND_SECONDS = 60;

const COPY: Record<OtpType, { title: string; body: string }> = {
  signup: { title: "Verify your email", body: "We sent a 6-digit code to" },
  email: { title: "Enter your login code", body: "We emailed a one-time sign-in code to" },
  recovery: { title: "Reset your password", body: "Enter the 6-digit code we sent to" },
};

function VerifyForm() {
  const router = useRouter();
  const params = useSearchParams();
  const { verifyOtp, resendOtp, updatePassword, pendingProfile, users, addReferral } = useApp();

  const email = params.get("email") ?? "";
  const type = (["signup", "email", "recovery"].includes(params.get("type") ?? "") ? params.get("type") : "signup") as OtpType;
  const next = params.get("next");

  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [cooldown, setCooldown] = useState(RESEND_SECONDS);
  const [verified, setVerified] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  // A resent signup code is a magiclink token — verify it as "email".
  const [verifyType, setVerifyType] = useState<OtpType>(type);

  useEffect(() => {
    if (cooldown <= 0) return;
    const id = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(id);
  }, [cooldown]);

  useEffect(() => {
    if (!getSupabase()) toast.info("Email verification is only active when Supabase is configured.");
  }, []);

  const submit = async (value = code) => {
    if (value.length !== 6 || busy) return;
    setBusy(true);
    setErr("");
    const res = await verifyOtp(email, value, verifyType);
    setBusy(false);
    if (!res.ok) {
      setErr(res.error);
      setCode("");
      return;
    }
    // Referral captured on the register page — attach now that we have a real user id
    const refCode = pendingProfile?.refCode ?? params.get("ref");
    if (refCode) {
      const referrer = users.find((u) => u.referralCode === refCode);
      if (referrer && referrer.id !== res.user.id) {
        addReferral({ id: crypto.randomUUID(), referrerId: referrer.id, refereeId: res.user.id, code: refCode, status: "pending", rewardAmount: 10000, createdAt: new Date().toISOString() });
      }
    }
    if (type === "recovery") {
      setVerified(true);
      return;
    }
    toast.success(type === "signup" ? `Email verified — welcome, ${res.user.name.split(" ")[0]}!` : `Welcome back, ${res.user.name.split(" ")[0]}!`);
    router.replace(next ?? DEST[res.user.role] ?? "/");
  };

  const resend = async () => {
    if (cooldown > 0) return;
    const r = await resendOtp(email, type);
    if (r.ok) {
      if (r.verifyType) setVerifyType(r.verifyType);
      toast.success("New code sent — check your inbox");
      setCooldown(RESEND_SECONDS);
      setCode("");
      setErr("");
    } else toast.error(r.error ?? "Could not resend");
  };

  const savePassword = async () => {
    if (newPassword.length < 6) return setErr("At least 6 characters");
    setBusy(true);
    const r = await updatePassword(newPassword);
    setBusy(false);
    if (!r.ok) return setErr(r.error ?? "Could not update password");
    toast.success("Password updated");
    router.replace("/login");
  };

  if (!email) {
    return (
      <main className="container flex min-h-[80vh] items-center justify-center py-12">
        <Card className="w-full max-w-md"><CardContent className="p-8 text-center">
          <p className="text-sm text-muted-foreground">Missing email address.</p>
          <Link href="/login" className="mt-4 inline-block font-semibold text-navy-700 hover:underline dark:text-gold">Back to sign in</Link>
        </CardContent></Card>
      </main>
    );
  }

  return (
    <main className="container flex min-h-[80vh] items-center justify-center py-12">
      <Card className="w-full max-w-md shadow-xl">
        <CardContent className="p-8">
          <div className="mb-6 text-center">
            <LogoMark className="mx-auto h-12 w-12" />
            <h1 className="mt-4 font-display text-2xl font-extrabold">{verified ? "Choose a new password" : COPY[type].title}</h1>
            {!verified && (
              <p className="mt-1 text-sm text-muted-foreground">
                {COPY[type].body} <strong className="text-foreground">{email}</strong>
              </p>
            )}
          </div>

          {verified ? (
            <div className="space-y-4">
              <div>
                <Label htmlFor="pw" className="mb-1.5 block">New password</Label>
                <Input id="pw" type="password" autoComplete="new-password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="••••••••" />
                {err && <p className="mt-1 text-xs text-destructive">{err}</p>}
              </div>
              <Button variant="gold" className="w-full" onClick={savePassword} disabled={busy}>
                <ShieldCheck className="h-4 w-4" /> {busy ? "Saving…" : "Save password"}
              </Button>
            </div>
          ) : (
            <>
              <OtpInput value={code} onChange={(v) => { setCode(v); setErr(""); }} onComplete={submit} disabled={busy} error={!!err} />
              {err && <p className="mt-3 text-center text-sm text-destructive" role="alert">{err}</p>}
              <p className="mt-3 text-center text-xs text-muted-foreground">Codes expire after 10 minutes. Check your spam folder if it hasn&apos;t arrived.</p>

              <Button variant="gold" className="mt-6 w-full" onClick={() => submit()} disabled={busy || code.length !== 6}>
                <MailCheck className="h-4 w-4" /> {busy ? "Verifying…" : "Verify"}
              </Button>

              <div className="mt-4 flex items-center justify-between text-sm">
                <button type="button" onClick={resend} disabled={cooldown > 0} className="inline-flex items-center gap-1.5 font-semibold text-navy-700 disabled:opacity-50 hover:underline dark:text-gold">
                  <RefreshCw className="h-3.5 w-3.5" /> {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend code"}
                </button>
                <Link href="/login" className="text-muted-foreground hover:underline">Use a different email</Link>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </main>
  );
}

export default function VerifyPage() {
  return (
    <Suspense>
      <VerifyForm />
    </Suspense>
  );
}
