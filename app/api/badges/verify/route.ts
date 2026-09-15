import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { verifyBadgeToken } from "@/lib/badges/security";
import type { Driver } from "@/types";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const sb = getSupabaseAdmin();
  if (!sb) return NextResponse.json({ error: "not configured" }, { status: 500 });

  const body = (await req.json().catch(() => ({}))) as { token?: string; badgeNumber?: string };
  const { token, badgeNumber } = body;
  if (!token || !badgeNumber) {
    return NextResponse.json({ error: "token and badgeNumber required" }, { status: 400 });
  }

  let payload;
  try {
    payload = verifyBadgeToken(token);
  } catch {
    return NextResponse.json({ error: "invalid or expired token" }, { status: 401 });
  }

  const { data: badge, error: bErr } = await sb
    .from("driver_badges")
    .select("*, driver:drivers!driver_id(*)")
    .eq("badge_number", badgeNumber)
    .maybeSingle();
  if (bErr) return NextResponse.json({ error: bErr.message }, { status: 500 });
  if (!badge) return NextResponse.json({ error: "badge not found" }, { status: 404 });

  if (badge.badge_number !== payload.badgeNumber || badge.verification_token !== token) {
    return NextResponse.json({ error: "token mismatch" }, { status: 401 });
  }

  const driver = (badge as unknown as Record<string, unknown>).driver as Driver | undefined;
  const now = new Date().toISOString();
  const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || null;
  const userAgent = req.headers.get("user-agent") || null;

  let status: "success" | "expired" | "revoked" = "success";
  if (badge.status === "revoked") {
    status = "revoked";
  } else if (new Date(badge.expires_at) < new Date()) {
    status = "expired";
  }

  if (status === "success" || status === "expired") {
    await sb
      .from("driver_badges")
      .update({
        verify_count: (badge.verify_count ?? 0) + 1,
        last_verified_at: now,
        last_verified_ip: ip,
      })
      .eq("id", badge.id);
  }

  await sb.from("badge_verifications").insert({
    badge_id: badge.id,
    driver_id: badge.driver_id,
    badge_number: badge.badge_number,
    token,
    status,
    ip_address: ip,
    user_agent: userAgent,
  });

  return NextResponse.json({
    driver,
    status: badge.status,
    is_verified: status === "success" && badge.status === "active",
    badge_number: badge.badge_number,
  });
}
