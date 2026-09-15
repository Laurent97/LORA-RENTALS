import { NextResponse } from "next/server";
import { getSupabaseAdmin, getCallerProfile } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const sb = getSupabaseAdmin();
    if (!sb) {
      return NextResponse.json({ error: "Server not configured" }, { status: 500 });
    }

    const caller = await getCallerProfile(req.headers.get("authorization"));
    if (!caller) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
    const { booking_id, version } = body as { booking_id?: string; version?: string };

    const insert = {
      user_id: caller.id,
      booking_id: booking_id ?? null,
      ip_address: req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null,
      user_agent: req.headers.get("user-agent") ?? null,
      version: version?.trim() || "1.0",
    };

    const { data, error } = await sb
      .from("safety_acknowledgments")
      .insert(insert)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ acknowledgment: data });
  } catch (err) {
    console.error("[safety/acknowledge] error:", err);
    return NextResponse.json({ error: "Could not record acknowledgment" }, { status: 500 });
  }
}
