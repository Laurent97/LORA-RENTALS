import { NextResponse } from "next/server";
import { getSupabaseAdmin, getCallerProfile } from "@/lib/supabase/admin";
import { signBadgeToken } from "@/lib/badges/security";
import { generateQrDataUrl } from "@/lib/badges/qr";
import { BRAND } from "@/lib/constants";

export const dynamic = "force-dynamic";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const sb = getSupabaseAdmin();
  if (!sb) return NextResponse.json({ error: "not configured" }, { status: 500 });

  const caller = await getCallerProfile(req.headers.get("authorization"));
  if (!caller) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = (await req.json().catch(() => ({}))) as { driverId?: string };
  const { driverId } = body;
  if (!driverId) return NextResponse.json({ error: "driverId required" }, { status: 400 });

  const { data: driver, error: dErr } = await sb
    .from("drivers")
    .select("id, owner_id")
    .eq("id", driverId)
    .single();
  if (dErr || !driver) return NextResponse.json({ error: "driver not found" }, { status: 404 });

  if (caller.role !== "admin" && caller.id !== driver.owner_id) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const now = new Date().toISOString();
  const expiry = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();

  await sb
    .from("driver_badges")
    .update({
      status: "revoked",
      revoked_at: now,
      revoked_by: caller.id,
      revoke_reason: "reissued",
    })
    .eq("driver_id", driverId)
    .neq("status", "revoked");

  const badgeNumber = `LORA-${driverId.slice(0, 8).toUpperCase()}-${Date.now().toString(36).slice(-4).toUpperCase()}`;

  const { data: badge, error: iErr } = await sb
    .from("driver_badges")
    .insert({
      driver_id: driverId,
      owner_id: driver.owner_id,
      badge_number: badgeNumber,
      verification_token: "",
      qr_url: "",
      status: "active",
      issued_at: now,
      expires_at: expiry,
      verify_count: 0,
    })
    .select()
    .single();
  if (iErr || !badge) {
    return NextResponse.json({ error: iErr?.message ?? "insert failed" }, { status: 500 });
  }

  const token = signBadgeToken({
    badge_number: badgeNumber,
    driver_id: driverId,
    owner_id: driver.owner_id,
  });
  const verifyUrl = `${BRAND.siteUrl}/verify/driver/${badgeNumber}?t=${encodeURIComponent(token)}`;
  const qrDataUrl = await generateQrDataUrl(verifyUrl);

  const { error: uErr } = await sb
    .from("driver_badges")
    .update({ verification_token: token, qr_url: qrDataUrl })
    .eq("id", badge.id);
  if (uErr) return NextResponse.json({ error: uErr.message }, { status: 500 });

  return NextResponse.json({
    badge: { ...badge, verification_token: token, qr_url: qrDataUrl },
    qrDataUrl,
  });
}
