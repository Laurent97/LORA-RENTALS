import { NextResponse } from "next/server";
import { getSupabaseAdmin, getCallerProfile } from "@/lib/supabase/admin";
import type { Referral, ReferralReward } from "@/types";

export const dynamic = "force-dynamic";

const REWARD_TYPES = ["team", "corporate", "owner", "social", "influencer"];
const REWARD_STATUSES = ["pending", "credited", "cancelled"];

function referralFromRow(row: Record<string, unknown>): Referral {
  return {
    id: String(row.id ?? ""),
    referrerId: String(row.referrer_id ?? ""),
    refereeId: row.referee_id ? String(row.referee_id) : undefined,
    code: String(row.code ?? ""),
    status: String(row.status ?? "pending") as Referral["status"],
    rewardAmount: Number(row.reward_amount ?? 0),
    createdAt: String(row.created_at ?? new Date().toISOString()),
  };
}

function rewardFromRow(row: Record<string, unknown>): ReferralReward {
  return {
    id: String(row.id ?? ""),
    userId: String(row.user_id ?? ""),
    referralId: String(row.referral_id ?? ""),
    rewardType: String(row.reward_type ?? "team") as ReferralReward["rewardType"],
    amount: Number(row.amount ?? 0),
    status: String(row.status ?? "pending") as ReferralReward["status"],
    notes: row.notes ? String(row.notes) : undefined,
    createdAt: String(row.created_at ?? new Date().toISOString()),
  };
}

export async function GET(req: Request) {
  const sb = getSupabaseAdmin();
  if (!sb) return NextResponse.json({ error: "not configured" }, { status: 500 });

  const caller = await getCallerProfile(req.headers.get("authorization"));
  if (!caller) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const userId = new URL(req.url).searchParams.get("userId") ?? caller.id;

  const [{ data: rRows }, { data: rwRows }] = await Promise.all([
    sb.from("referrals").select("*").or(`referrer_id.eq.${userId},referee_id.eq.${userId}`).order("created_at", { ascending: false }),
    sb.from("referral_rewards").select("*").eq("user_id", userId).order("created_at", { ascending: false }),
  ]);

  return NextResponse.json({
    referrals: (rRows ?? []).map(referralFromRow),
    rewards: (rwRows ?? []).map(rewardFromRow),
  });
}

export async function POST(req: Request) {
  const sb = getSupabaseAdmin();
  if (!sb) return NextResponse.json({ error: "not configured" }, { status: 500 });

  const caller = await getCallerProfile(req.headers.get("authorization"));
  if (!caller) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (caller.role !== "admin") return NextResponse.json({ error: "admin only" }, { status: 403 });

  const body = (await req.json().catch(() => ({}))) as Partial<ReferralReward> & { referralId: string };
  const { referralId, userId, rewardType, amount, notes } = body;
  if (!referralId || !userId || !rewardType || !REWARD_TYPES.includes(rewardType)) {
    return NextResponse.json({ error: "referralId, userId, rewardType required" }, { status: 400 });
  }

  const insert: Record<string, unknown> = {
    referral_id: referralId,
    user_id: userId,
    reward_type: rewardType,
    amount: amount ?? 0,
    status: "pending",
    notes: notes ?? null,
  };

  const { data, error } = await sb.from("referral_rewards").insert(insert).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(rewardFromRow(data ?? {}), { status: 201 });
}
