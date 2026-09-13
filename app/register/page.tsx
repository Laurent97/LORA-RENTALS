"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Car, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LogoMark } from "@/components/layout/logo";
import { WhatsAppInput } from "@/components/whatsapp/WhatsAppInput";
import { useApp } from "@/lib/store";
import { cn } from "@/lib/utils";
import type { Referral, UserRole } from "@/types";

const schema = z.object({
  name: z.string().min(2, "Enter your full name"),
  email: z.string().email("Enter a valid email"),
  phone: z.string().regex(/^\+?250|0?7/, "Enter a valid Rwandan number (+250…)"),
  password: z.string().min(6, "At least 6 characters"),
});
type Form = z.infer<typeof schema>;

function RegisterForm() {
  const router = useRouter();
  const params = useSearchParams();
  const registerUser = useApp((s) => s.register);
  const { users, addReferral } = useApp();
  const refCode = params.get("ref");
  const next = params.get("next");
  const [role, setRole] = useState<UserRole>(
    params.get("role") === "owner" ? "owner" : "customer"
  );
  const [whatsapp, setWhatsapp] = useState("");
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm<Form>({
    resolver: zodResolver(schema),
  });

  const applyReferral = (userId: string) => {
    if (!refCode) return;
    const referrer = users.find((u) => u.referralCode === refCode);
    if (!referrer || referrer.id === userId) return;
    const r: Referral = {
      id: crypto.randomUUID(),
      referrerId: referrer.id,
      refereeId: userId,
      code: refCode,
      status: "pending",
      rewardAmount: 10000,
      createdAt: new Date().toISOString(),
    };
    addReferral(r);
    toast.success("Referral applied — you both earn RWF 10,000 after your first rental");
  };

  const onSubmit = async (data: Form) => {
    setLoading(true);
    const res = await registerUser(data.name, data.email, data.phone, data.password, role, role === "owner" ? whatsapp : undefined);
    setLoading(false);

    if (res.status === "error") {
      toast.error(res.error);
      return;
    }
    if (res.status === "verify") {
      // Email confirmation required — the referral is applied on /verify once the
      // account exists. Keep the code alongside the pending profile.
      if (refCode) useApp.setState((s) => ({ pendingProfile: s.pendingProfile ? { ...s.pendingProfile, refCode } : s.pendingProfile }));
      toast.success("Check your inbox for an 8-digit code");
      const q = new URLSearchParams({ email: res.email, type: "signup" });
      if (next) q.set("next", next);
      router.push(`/verify?${q}`);
      return;
    }
    applyReferral(res.user.id);
    toast.success(`Welcome to LORA, ${res.user.name.split(" ")[0]}!`);
    router.push(next ?? (role === "owner" ? "/owner" : "/dashboard"));
  };

  return (
    <main className="container flex min-h-[80vh] items-center justify-center py-12">
      <Card className="w-full max-w-md shadow-xl">
        <CardContent className="p-8">
          <div className="mb-6 text-center">
            <LogoMark className="mx-auto h-12 w-12" />
            <h1 className="mt-4 font-display text-2xl font-extrabold">Create your account</h1>
            <p className="mt-1 text-sm text-muted-foreground">Join Rwanda's premium car rental platform</p>
          </div>

          {/* Role picker */}
          <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {(
              [
                { value: "customer", label: "I want to rent", icon: UserRound },
                { value: "owner", label: "I own cars", icon: Car },
              ] as const
            ).map((r) => (
              <button
                key={r.value}
                type="button"
                onClick={() => setRole(r.value)}
                className={cn(
                  "flex flex-col items-center gap-2 rounded-xl border-2 p-4 text-sm font-semibold transition-colors",
                  role === r.value
                    ? "border-gold bg-gold/10"
                    : "border-border hover:border-navy-300"
                )}
              >
                <r.icon className="h-6 w-6 text-navy-700 dark:text-gold" />
                {r.label}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <Label htmlFor="name" className="mb-1.5 block">Full name</Label>
              <Input id="name" placeholder="Aline Uwase" {...register("name")} />
              {errors.name && <p className="mt-1 text-xs text-destructive">{errors.name.message}</p>}
            </div>
            <div>
              <Label htmlFor="email" className="mb-1.5 block">Email</Label>
              <Input id="email" type="email" autoComplete="email" placeholder="you@example.com" {...register("email")} />
              {errors.email && <p className="mt-1 text-xs text-destructive">{errors.email.message}</p>}
            </div>
            <div>
              <Label htmlFor="phone" className="mb-1.5 block">Phone (Rwanda)</Label>
              <Input id="phone" placeholder="+250 788 000 000" {...register("phone")} />
              {errors.phone && <p className="mt-1 text-xs text-destructive">{errors.phone.message}</p>}
            </div>
            {role === "owner" && (
              <WhatsAppInput
                value={whatsapp}
                onChange={setWhatsapp}
                onVerifiedChange={(valid, normalized) => { if (valid && normalized) setWhatsapp(normalized); }}
              />
            )}
            <div>
              <Label htmlFor="password" className="mb-1.5 block">Password</Label>
              <Input id="password" type="password" autoComplete="new-password" placeholder="••••••••" {...register("password")} />
              {errors.password && <p className="mt-1 text-xs text-destructive">{errors.password.message}</p>}
            </div>
            <Button type="submit" variant="gold" className="w-full" disabled={loading}>
              {loading ? "Creating account…" : role === "owner" ? "Register as owner" : "Create account"}
            </Button>
          </form>

          <p className="mt-3 text-center text-xs text-muted-foreground">
            We&apos;ll email you an 8-digit code to verify your address.
          </p>

          {role === "owner" && (
            <p className="mt-4 rounded-xl bg-secondary/60 p-3 text-xs text-muted-foreground">
              After registering you'll complete KYC — national ID, driving license,
              vehicle registration and insurance — before your cars go live.
            </p>
          )}

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link href="/login" className="font-semibold text-navy-700 hover:underline dark:text-gold">
              Sign in
            </Link>
          </p>
        </CardContent>
      </Card>
    </main>
  );
}

export default function RegisterPage() {
  return (
    <Suspense>
      <RegisterForm />
    </Suspense>
  );
}
