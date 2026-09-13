import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

const EVENT_PATTERN = /^pwa_(install_prompt_shown|install_accepted|install_dismissed|installed|first_launch|standalone_session|push_subscribed)$/;

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null) as { event?: unknown; properties?: unknown } | null;
  if (!body || typeof body.event !== "string" || !EVENT_PATTERN.test(body.event) || typeof body.properties !== "object" || body.properties === null) return NextResponse.json({ error: "Invalid PWA event" }, { status: 400 });
  const db = getSupabaseAdmin();
  if (!db) return NextResponse.json({ stored: false }, { status: 202 });
  const { error } = await db.from("pwa_events").insert({ event: body.event, properties: body.properties, user_agent: request.headers.get("user-agent")?.slice(0, 512) });
  if (error) return NextResponse.json({ error: "Could not store PWA event" }, { status: 503 });
  return NextResponse.json({ stored: true }, { status: 201 });
}
