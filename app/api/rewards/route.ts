import { NextResponse } from "next/server";
import { getSupabaseAdmin, getCallerProfile } from "@/lib/supabase/admin";

export async function GET() {
  const sb = getSupabaseAdmin();
  if (!sb) return NextResponse.json({ error: "not configured" }, { status: 500 });
  const { data } = await sb.from("rewards_catalog").select("*").eq("status", "available").order("points_cost", { ascending: true });
  return NextResponse.json({ rewards: data ?? [] });
}

export async function POST(req: Request) {
  const sb = getSupabaseAdmin();
  if (!sb) return NextResponse.json({ error: "not configured" }, { status: 500 });
  const caller = await getCallerProfile(req.headers.get("authorization"));
  if (!caller) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const rewardId = String(body.rewardId ?? "");
  if (!rewardId) return NextResponse.json({ error: "rewardId required" }, { status: 400 });

  const { data: reward, error } = await sb.from("rewards_catalog").select("*").eq("id", rewardId).eq("status", "available").single();
  if (error || !reward) return NextResponse.json({ error: "reward not available" }, { status: 404 });

  const { data: account } = await sb.from("loyalty_accounts").select("balance").eq("user_id", caller.id).single();
  if (!account || (account.balance ?? 0) < reward.points_cost) {
    return NextResponse.json({ error: "not enough points" }, { status: 400 });
  }

  const code = `LORA-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
  const { error: insertErr } = await sb.from("user_rewards").insert({
    user_id: caller.id,
    reward_id: rewardId,
    status: "redeemed",
    code,
  });
  if (insertErr) return NextResponse.json({ error: insertErr.message }, { status: 500 });

  const { error: debitErr } = await sb.from("loyalty_accounts").update({ balance: (account.balance ?? 0) - reward.points_cost }).eq("user_id", caller.id);
  if (debitErr) return NextResponse.json({ error: debitErr.message }, { status: 500 });

  return NextResponse.json({ code, points_cost: reward.points_cost, label: reward.label });
}
