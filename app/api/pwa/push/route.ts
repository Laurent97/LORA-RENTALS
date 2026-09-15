import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null) as { subscription?: { endpoint?: unknown; keys?: { p256dh?: unknown; auth?: unknown } } } | null;
  const subscription = body?.subscription;
  if (!subscription || typeof subscription.endpoint !== "string" || !subscription.endpoint.startsWith("https://") || typeof subscription.keys?.p256dh !== "string" || typeof subscription.keys.auth !== "string") return NextResponse.json({ error: "Invalid push subscription" }, { status: 400 });
  const db = getSupabaseAdmin();
  if (!db) return NextResponse.json({ stored: false }, { status: 202 });
  const { error } = await db.from("push_subscriptions").upsert({ endpoint: subscription.endpoint, subscription }, { onConflict: "endpoint" });
  if (error) return NextResponse.json({ error: "Could not save subscription" }, { status: 503 });
  return NextResponse.json({ stored: true }, { status: 201 });
}
