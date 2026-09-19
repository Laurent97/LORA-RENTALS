import { NextResponse } from "next/server";
import { getSupabaseAdmin, getCallerProfile } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const sb = getSupabaseAdmin();
  if (!sb) return NextResponse.json({ ok: true });

  const caller = await getCallerProfile(req.headers.get("authorization"));
  const body = (await req.json().catch(() => ({}))) as {
    listingType?: string;
    listingId?: string;
    platform?: string;
    url?: string;
  };

  try {
    await sb.from("share_events").insert({
      listing_type: body.listingType ?? null,
      listing_id: body.listingId ?? null,
      shared_by: caller?.id ?? null,
      platform: body.platform ?? "unknown",
      url: body.url ?? null,
      created_at: new Date().toISOString(),
    });
  } catch (err) {
    console.warn("[share/track] could not log:", err);
  }

  return NextResponse.json({ ok: true });
}
