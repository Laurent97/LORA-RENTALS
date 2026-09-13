import { NextResponse } from "next/server";
import { z } from "zod";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

const schema = z.object({
  name: z.string().trim().min(1).max(120),
  phone: z.string().max(40).default(""),
  whatsappNumber: z.string().max(40).optional(),
  role: z.enum(["customer", "owner"]).default("customer"),
});

export async function POST(request: Request) {
  const sb = getSupabaseAdmin();
  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!sb || !token) return NextResponse.json({ error: "Authentication required." }, { status: 401 });

  const { data: authData, error: authError } = await sb.auth.getUser(token);
  if (authError || !authData.user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid profile." }, { status: 400 });

  const metadata = authData.user.user_metadata ?? {};
  const profile = {
    id: authData.user.id,
    role: parsed.data.role,
    name: parsed.data.name || String(metadata.name ?? authData.user.email?.split("@")[0] ?? "Customer"),
    email: authData.user.email ?? "",
    phone: parsed.data.phone || String(metadata.phone ?? ""),
    whatsapp_number: parsed.data.whatsappNumber,
    kyc_status: "none",
  };
  const { error } = await sb.from("users").upsert(profile, { onConflict: "id" });
  if (error) {
    console.error("[auth/profile] upsert error:", error);
    const msg = error.message ?? String(error);
    if (msg.includes("whatsapp_number")) {
      return NextResponse.json(
        { error: "Database migration required: run supabase/migrations/202609140001_whatsapp.sql in your Supabase SQL Editor.", code: "migration_missing" },
        { status: 400 }
      );
    }
    return NextResponse.json({ error: "Could not create your profile." }, { status: 500 });
  }
  return NextResponse.json({ ok: true, profile });
}