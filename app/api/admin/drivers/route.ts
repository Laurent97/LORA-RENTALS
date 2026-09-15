import { NextResponse } from "next/server";
import { getSupabaseAdmin, getCallerProfile } from "@/lib/supabase/admin";
import { signBadgeToken } from "@/lib/badges/security";
import { generateQrDataUrl } from "@/lib/badges/qr";
import { BRAND } from "@/lib/constants";
import { dispatchEmailEvent } from "@/lib/postmark/triggers";

export async function GET(req: Request) {
  const sb = getSupabaseAdmin();
  if (!sb) return NextResponse.json({ error: "not configured" }, { status: 500 });
  const caller = await getCallerProfile(req.headers.get("authorization"));
  if (!caller || caller.role !== "admin") return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { data, error } = await sb
    .from("drivers")
    .select("*, owner:owner_id(name, email, phone)")
    .order("created_at", { ascending: false })
    .limit(200);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ drivers: data ?? [] });
}

export async function PATCH(req: Request) {
  const sb = getSupabaseAdmin();
  if (!sb) return NextResponse.json({ error: "not configured" }, { status: 500 });
  const caller = await getCallerProfile(req.headers.get("authorization"));
  if (!caller || caller.role !== "admin") return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const { id, action } = body as { id?: string; action?: string };
  if (!id || !action) return NextResponse.json({ error: "id and action required" }, { status: 400 });

  let update: Record<string, any> = {};
  if (action === "approve") {
    const { data: driver } = await sb.from("drivers").select("id, owner_id").eq("id", id).single();
    const ownerId = driver?.owner_id ?? "";

    // Auto-generate driver badge on KYC approval if one does not exist
    const { data: existing } = await sb
      .from("driver_badges")
      .select("id")
      .eq("driver_id", id)
      .in("status", ["active", "suspended"])
      .maybeSingle();

    if (!existing && ownerId) {
      const badgeNumber = `LORA-${id.slice(0, 8).toUpperCase()}-${Date.now().toString(36).slice(-4).toUpperCase()}`;
      const issuedAt = new Date().toISOString();
      const expiresAt = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();

      const { data: badge, error: iErr } = await sb
        .from("driver_badges")
        .insert({
          driver_id: id,
          owner_id: ownerId,
          badge_number: badgeNumber,
          verification_token: "",
          qr_url: "",
          status: "active",
          issued_at: issuedAt,
          expires_at: expiresAt,
          verify_count: 0,
        })
        .select()
        .single();

      if (badge) {
        const token = signBadgeToken({ badge_number: badgeNumber, driver_id: id, owner_id: ownerId });
        const verifyUrl = `${BRAND.siteUrl}/verify/driver/${badgeNumber}?t=${encodeURIComponent(token)}`;
        const qrDataUrl = await generateQrDataUrl(verifyUrl);
        await sb.from("driver_badges").update({ verification_token: token, qr_url: qrDataUrl }).eq("id", badge.id);
      } else if (iErr) {
        console.warn("[admin/drivers] badge insert failed:", iErr.message);
      }
    }

    update = { is_verified: true, is_available: true, kyc_status: "approved", background_check_status: "approved", approved_at: new Date().toISOString(), approved_by: caller.id, verified_at: new Date().toISOString(), verified_by: caller.id };
  } else if (action === "suspend") {
    update = { is_available: false };
  } else if (action === "reinstate") {
    update = { is_available: true };
  } else if (action === "redflag") {
    const { data } = await sb.from("drivers").select("is_verified").eq("id", id).single();
    update = { is_verified: false, is_available: false, kyc_status: data && (data as any).is_verified ? "rejected" : "pending", background_check_status: data && (data as any).is_verified ? "rejected" : "pending" };
  } else {
    return NextResponse.json({ error: "unknown action" }, { status: 400 });
  }

  const { error } = await sb.from("drivers").update(update).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  if (action === "approve") {
    await dispatchEmailEvent({ event: "driver.kyc_approved", id, actor: { id: caller.id, role: caller.role }, meta: { driverId: id } });
  }

  return NextResponse.json({ success: true });
}

export async function DELETE(req: Request) {
  const sb = getSupabaseAdmin();
  if (!sb) return NextResponse.json({ error: "not configured" }, { status: 500 });
  const caller = await getCallerProfile(req.headers.get("authorization"));
  if (!caller || caller.role !== "admin") return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const { error } = await sb.from("drivers").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
