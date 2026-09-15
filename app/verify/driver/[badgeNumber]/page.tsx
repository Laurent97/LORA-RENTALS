"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { CheckCircle, XCircle, Phone, Mail, Globe, Loader2 } from "lucide-react";
import { BRAND } from "@/lib/constants";
import { Card, CardContent } from "@/components/ui/card";

interface VerifyResult {
  driver?: Record<string, unknown>;
  is_verified?: boolean;
  badge_number?: string;
}

export default function VerifyDriverPage({ params }: { params: { badgeNumber: string } }) {
  const searchParams = useSearchParams();
  const token = searchParams.get("t") ?? "";
  const [result, setResult] = useState<VerifyResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const verify = async () => {
      try {
        const res = await fetch("/api/badges/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token, badgeNumber: params.badgeNumber }),
        });
        const json = (await res.json().catch(() => ({}))) as VerifyResult;
        setResult(json);
      } catch {
        setResult({ is_verified: false });
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      void verify();
    } else {
      setResult({ is_verified: false });
      setLoading(false);
    }
  }, [token, params.badgeNumber]);

  const phoneLink = `tel:${BRAND.phone.replace(/\s/g, "")}`;
  const mailLink = `mailto:${BRAND.supportEmail}`;

  return (
    <div className="min-h-screen bg-offwhite p-4">
      <div className="mx-auto max-w-sm">
        <div className="mb-6 text-center">
          <h1 className="font-display text-2xl font-extrabold text-navy-800">{BRAND.shortName}</h1>
          <p className="text-sm text-muted-foreground">Driver ID Verification</p>
        </div>

        {loading ? (
          <Card className="py-12 text-center">
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-gold" />
            <p className="mt-3 text-sm text-muted-foreground">Verifying badge…</p>
          </Card>
        ) : result?.is_verified ? (
          <Card className="overflow-hidden border-green-500/30 bg-green-50 text-green-900">
            <div className="bg-green-500 p-4 text-center text-white">
              <CheckCircle className="mx-auto h-10 w-10" />
              <p className="mt-2 text-sm font-bold uppercase tracking-wider">Verified</p>
            </div>
            <CardContent className="space-y-4 p-6 text-center">
              <p className="font-display text-xl font-bold text-navy-800">VERIFIED LORA RENTAL DRIVER</p>
              <p className="text-lg font-semibold">{(result.driver as Record<string, string> | undefined)?.full_name}</p>
              <p className="text-sm text-muted-foreground">Badge {result.badge_number}</p>
              <div className="space-y-2 pt-4 text-sm">
                <a href={phoneLink} className="flex items-center justify-center gap-2 text-green-800">
                  <Phone className="h-4 w-4" /> {BRAND.phone}
                </a>
                <a href={mailLink} className="flex items-center justify-center gap-2 text-green-800">
                  <Mail className="h-4 w-4" /> {BRAND.supportEmail}
                </a>
                <a href={BRAND.siteUrl} className="flex items-center justify-center gap-2 text-green-800">
                  <Globe className="h-4 w-4" /> {BRAND.domain}
                </a>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="overflow-hidden border-red-500/30 bg-red-50 text-red-900">
            <div className="bg-red-500 p-4 text-center text-white">
              <XCircle className="mx-auto h-10 w-10" />
              <p className="mt-2 text-sm font-bold uppercase tracking-wider">Not Verified</p>
            </div>
            <CardContent className="space-y-4 p-6 text-center">
              <p className="font-display text-xl font-bold">NOT A VERIFIED LORA DRIVER</p>
              <p className="text-sm text-muted-foreground">
                This badge is invalid, expired, or has been revoked. Contact support.
              </p>
              <div className="space-y-2 pt-4 text-sm">
                <a href={phoneLink} className="flex items-center justify-center gap-2 text-red-800">
                  <Phone className="h-4 w-4" /> {BRAND.phone}
                </a>
                <a href={mailLink} className="flex items-center justify-center gap-2 text-red-800">
                  <Mail className="h-4 w-4" /> {BRAND.supportEmail}
                </a>
                <a href={BRAND.siteUrl} className="flex items-center justify-center gap-2 text-red-800">
                  <Globe className="h-4 w-4" /> {BRAND.domain}
                </a>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
