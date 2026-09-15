"use client";

import { useEffect, useState } from "react";
import { Camera, Upload, FileCheck, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { EmptyState } from "@/components/empty-state";
import { useApp } from "@/lib/store";
import { getSupabase } from "@/lib/supabase/client";
import { toast } from "sonner";

export default function KycPage() {
  const { user } = useApp();
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    const sb = getSupabase();
    if (!sb) { setLoading(false); return; }
    (async () => {
      const { data, error } = await sb.from("video_kyc_sessions").select("status").eq("user_id", user.id).order("created_at", { ascending: false }).limit(1).single();
      setStatus(data?.status ?? null);
      setLoading(false);
    })();
  }, [user]);

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const sb = getSupabase();
    const session = sb ? await sb.auth.getSession() : null;
    const token = session?.data.session?.access_token;
    if (!token) { toast.error("Sign in to submit KYC"); return; }
    setSubmitting(true);
    const fd = new FormData(e.currentTarget);
    const res = await fetch("/api/kyc", { method: "POST", headers: { Authorization: `Bearer ${token}` }, body: fd });
    if (res.ok) { toast.success("KYC submitted for review"); setStatus("submitted"); } else { toast.error("Submission failed"); }
    setSubmitting(false);
  };

  if (!user) return <EmptyState icon={Shield} title="Sign in required" description="Please sign in to complete video KYC." actionLabel="Sign in" actionHref="/login" />;

  return (
    <main className="mx-auto max-w-3xl space-y-8 p-6 lg:p-12">
      <div className="text-center">
        <h1 className="font-display text-3xl font-extrabold tracking-tight" style={{ color: "#0A1F44" }}>Video KYC Onboarding</h1>
        <p className="mt-2 text-muted-foreground">Verify your identity with a short selfie and ID documents to unlock full access.</p>
      </div>

      {loading ? (
        <div className="py-20 text-center text-sm text-muted-foreground">Checking status…</div>
      ) : status === "submitted" || status === "pending" ? (
        <Card className="border-amber-500/40 bg-amber-500/10">
          <CardContent className="p-6 text-center">
            <FileCheck className="mx-auto h-10 w-10 text-amber-600" />
            <p className="mt-3 font-display font-bold">KYC under review</p>
            <p className="text-sm text-muted-foreground">We have received your documents. Approval usually takes a few minutes.</p>
          </CardContent>
        </Card>
      ) : status === "approved" ? (
        <Card className="border-green-500/40 bg-green-500/10">
          <CardContent className="p-6 text-center">
            <FileCheck className="mx-auto h-10 w-10 text-green-600" />
            <p className="mt-3 font-display font-bold">KYC approved</p>
            <p className="text-sm text-muted-foreground">Your identity is verified.</p>
          </CardContent>
        </Card>
      ) : (
        <form onSubmit={submit} className="space-y-6">
          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <Label className="mb-1.5 block">Selfie photo *</Label>
              <input type="file" name="selfie" accept="image/*" required className="block w-full rounded-xl border border-border p-2 text-sm" />
            </div>
            <div>
              <Label className="mb-1.5 block">ID document front *</Label>
              <input type="file" name="documentFront" accept="image/*" required className="block w-full rounded-xl border border-border p-2 text-sm" />
            </div>
          </div>
          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <Label className="mb-1.5 block">ID document back</Label>
              <input type="file" name="documentBack" accept="image/*" className="block w-full rounded-xl border border-border p-2 text-sm" />
            </div>
            <div>
              <Label className="mb-1.5 block">Video selfie (optional)</Label>
              <input type="file" name="video" accept="video/*" className="block w-full rounded-xl border border-border p-2 text-sm" />
            </div>
          </div>
          <Card className="border-amber-500/40 bg-amber-500/10">
            <CardContent className="p-4 text-sm">
              <strong>Why we need this:</strong> to keep the LORA community safe, prevent fraud, and meet Rwanda financial regulations. Files are encrypted and only reviewed by authorized staff.
            </CardContent>
          </Card>
          <Button type="submit" variant="gold" className="w-full" disabled={submitting}>
            <Camera className="mr-2 h-4 w-4" /> {submitting ? "Uploading…" : "Submit KYC"}
          </Button>
        </form>
      )}
    </main>
  );
}
