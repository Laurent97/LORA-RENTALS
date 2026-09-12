import { NextResponse } from "next/server";
import { z } from "zod";
import { getCallerProfile, getSupabaseAdmin } from "@/lib/supabase/admin";

const schema = z.object({
  action: z.enum(["set_role", "verify_kyc", "reject_kyc", "suspend", "restore", "delete"]),
  userId: z.string().uuid(),
  role: z.enum(["customer", "owner", "admin"]).optional(),
  reason: z.string().max(500).optional(),
});

export async function POST(request: Request) {
  const sb = getSupabaseAdmin();
  const caller = await getCallerProfile(request.headers.get("authorization"));
  if (!sb || !caller) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (caller.role !== "admin") return NextResponse.json({ error: "Only admins can manage users." }, { status: 403 });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid user action." }, { status: 400 });
  const input = parsed.data;
  if (input.userId === caller.id && ["set_role", "suspend", "delete"].includes(input.action)) return NextResponse.json({ error: "You cannot remove or disable your own admin access." }, { status: 400 });
  const now = new Date().toISOString();

  if (input.action === "delete") {
    const { error: authError } = await sb.auth.admin.deleteUser(input.userId, true);
    if (authError) return NextResponse.json({ error: authError.message }, { status: 500 });
    const { error } = await sb.from("users").update({ deleted_at: now, suspended_at: now, email_suppressed: true }).eq("id", input.userId);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, action: input.action, userId: input.userId });
  }

  if (input.action === "set_role") {
    if (!input.role) return NextResponse.json({ error: "Role is required." }, { status: 400 });
    const { error } = await sb.from("users").update({ role: input.role }).eq("id", input.userId).is("deleted_at", null);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, action: input.action, role: input.role, userId: input.userId });
  }

  if (input.action === "verify_kyc" || input.action === "reject_kyc") {
    const status = input.action === "verify_kyc" ? "verified" : "rejected";
    const { error } = await sb.from("users").update({ kyc_status: status }).eq("id", input.userId).is("deleted_at", null);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, action: input.action, kycStatus: status, userId: input.userId });
  }

  const suspended = input.action === "suspend";
  const { error } = await sb.auth.admin.updateUserById(input.userId, { ban_duration: suspended ? "876000h" : "none" });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  const { error: profileError } = await sb.from("users").update({ suspended_at: suspended ? now : null, suspension_reason: suspended ? input.reason ?? "Admin action" : null }).eq("id", input.userId).is("deleted_at", null);
  if (profileError) return NextResponse.json({ error: profileError.message }, { status: 500 });
  return NextResponse.json({ ok: true, action: input.action, userId: input.userId });
}