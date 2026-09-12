"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { KeyRound, LogIn, MailCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LogoMark } from "@/components/layout/logo";
import { useApp } from "@/lib/store";
import { getSupabase } from "@/lib/supabase/client";

const schema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(4, "Password required"),
});
type Form = z.infer<typeof schema>;

const DEMO = [
  { label: "Customer demo", email: "customer@lora.rw" },
  { label: "Owner demo", email: "owner@lora.rw" },
  { label: "Admin demo", email: "admin@lora.rw" },
];

const DEST: Record<string, string> = { customer: "/dashboard", owner: "/owner", admin: "/admin" };

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const { login, sendLoginCode, sendPasswordReset } = useApp();
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<"password" | "code">("password");
  const hasSupabase = !!getSupabase();
  const next = params.get("next");
  const { register, handleSubmit, setValue, getValues, trigger, formState: { errors } } = useForm<Form>({
    resolver: zodResolver(schema),
  });

  const toVerify = (email: string, type: "signup" | "email" | "recovery") => {
    const q = new URLSearchParams({ email, type });
    if (next) q.set("next", next);
    router.push(`/verify?${q}`);
  };

  const onSubmit = async (data: Form) => {
    setLoading(true);
    const res = await login(data.email, data.password);
    setLoading(false);
    if (res.status === "unconfirmed") {
      toast.info("Please verify your email first — we've sent you a new code");
      void useApp.getState().resendOtp(data.email, "signup");
      toVerify(data.email, "signup");
      return;
    }
    if (res.status === "error") {
      toast.error(res.error);
      return;
    }
    toast.success(`Welcome back, ${res.user.name.split(" ")[0]}!`);
    router.push(next ?? DEST[res.user.role] ?? "/");
  };

  // Passwordless: email a 6-digit sign-in code
  const onSendCode = async () => {
    if (!(await trigger("email"))) return;
    const email = getValues("email");
    setLoading(true);
    const r = await sendLoginCode(email);
    setLoading(false);
    if (!r.ok) return toast.error(r.error ?? "Could not send code");
    toast.success("Login code sent — check your inbox");
    toVerify(email, "email");
  };

  const onForgot = async () => {
    if (!(await trigger("email"))) return toast.error("Enter your email first");
    const email = getValues("email");
    const r = await sendPasswordReset(email);
    if (!r.ok) return toast.error(r.error ?? "Could not send reset code");
    toast.success("Reset code sent");
    toVerify(email, "recovery");
  };

  return (
    <main className="container flex min-h-[80vh] items-center justify-center py-12">
      <Card className="w-full max-w-md shadow-xl">
        <CardContent className="p-8">
          <div className="mb-6 text-center">
            <LogoMark className="mx-auto h-12 w-12" />
            <h1 className="mt-4 font-display text-2xl font-extrabold">Welcome back</h1>
            <p className="mt-1 text-sm text-muted-foreground">Sign in to LORA RENTALS LTD</p>
          </div>

          {hasSupabase && (
            <div className="mb-5 flex rounded-lg border border-border p-0.5 text-xs font-semibold">
              {(["password", "code"] as const).map((m) => (
                <button key={m} type="button" onClick={() => setMode(m)} className={`flex-1 rounded-md px-3 py-1.5 transition-colors ${mode === m ? "bg-navy-800 text-gold dark:bg-gold dark:text-navy-900" : "text-muted-foreground hover:text-foreground"}`}>
                  {m === "password" ? "Password" : "Email me a code"}
                </button>
              ))}
            </div>
          )}

          <form onSubmit={mode === "password" ? handleSubmit(onSubmit) : (e) => { e.preventDefault(); void onSendCode(); }} className="space-y-4">
            <div>
              <Label htmlFor="email" className="mb-1.5 block">Email</Label>
              <Input id="email" type="email" autoComplete="email" placeholder="you@example.com" {...register("email")} />
              {errors.email && <p className="mt-1 text-xs text-destructive">{errors.email.message}</p>}
            </div>
            {mode === "password" && (
              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  {hasSupabase && (
                    <button type="button" onClick={onForgot} className="text-xs font-semibold text-navy-700 hover:underline dark:text-gold">Forgot password?</button>
                  )}
                </div>
                <Input id="password" type="password" autoComplete="current-password" placeholder="••••••••" {...register("password")} />
                {errors.password && <p className="mt-1 text-xs text-destructive">{errors.password.message}</p>}
              </div>
            )}
            <Button type="submit" variant="gold" className="w-full" disabled={loading}>
              {mode === "password" ? (
                <><LogIn className="h-4 w-4" /> {loading ? "Signing in…" : "Sign in"}</>
              ) : (
                <><MailCheck className="h-4 w-4" /> {loading ? "Sending…" : "Send login code"}</>
              )}
            </Button>
          </form>

          {mode === "code" && (
            <p className="mt-3 flex items-start gap-2 text-xs text-muted-foreground">
              <KeyRound className="mt-0.5 h-3.5 w-3.5 shrink-0" /> No password needed — we&apos;ll email a 6-digit code that signs you in.
            </p>
          )}

          {!hasSupabase && (
          <div className="mt-6">
            <p className="mb-2 text-center text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Demo accounts — password: demo1234
            </p>
            <div className="grid grid-cols-3 gap-2">
              {DEMO.map((d) => (
                <button
                  key={d.email}
                  type="button"
                  onClick={() => { setValue("email", d.email); setValue("password", "demo1234"); }}
                  className="rounded-lg border border-border px-2 py-2 text-xs font-medium hover:bg-secondary"
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>
          )}

          <p className="mt-6 text-center text-sm text-muted-foreground">
            New here?{" "}
            <Link href="/register" className="font-semibold text-navy-700 hover:underline dark:text-gold">
              Create an account
            </Link>
          </p>
        </CardContent>
      </Card>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
