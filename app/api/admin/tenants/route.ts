import { NextResponse } from "next/server";
import { getSupabaseAdmin, getCallerProfile } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const sb = getSupabaseAdmin();
  if (!sb) return NextResponse.json({ error: "not configured" }, { status: 500 });
  const caller = await getCallerProfile(req.headers.get("authorization"));
  if (!caller || caller.role !== "admin") return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { data, error } = await sb.from("country_settings").select("*").order("country", { ascending: true });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ tenants: data ?? [] });
}

export async function POST(req: Request) {
  const sb = getSupabaseAdmin();
  if (!sb) return NextResponse.json({ error: "not configured" }, { status: 500 });
  const caller = await getCallerProfile(req.headers.get("authorization"));
  if (!caller || caller.role !== "admin") return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const { country, vat_rate, booking_fee, payment_rails } = body as any;
  if (!country) return NextResponse.json({ error: "country required" }, { status: 400 });

  const { error } = await sb.from("country_settings").update({
    vat_rate: Number(vat_rate ?? 0),
    booking_fee: Number(booking_fee ?? 0),
    payment_rails: Array.isArray(payment_rails) ? payment_rails : [],
    updated_at: new Date().toISOString(),
  }).eq("country", country);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
