import { NextResponse } from "next/server";
import { getSupabaseAdmin, getCallerProfile } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const sb = getSupabaseAdmin();
  if (!sb) return NextResponse.json({ error: "not configured" }, { status: 500 });
  const caller = await getCallerProfile(req.headers.get("authorization"));

  const [{ data: badges }, { data: challenges }, { data: leaderboard }] = await Promise.all([
    sb.from("badges").select("*").order("points_bonus", { ascending: false }),
    sb.from("challenges").select("*").order("points", { ascending: false }),
    sb.from("loyalty_accounts").select("points, balance, user:user_id(name)").order("points", { ascending: false }).limit(20),
  ]);

  let myBadges: any[] = [];
  let myChallenges: any[] = [];
  if (caller?.id) {
    const [b, c] = await Promise.all([
      sb.from("user_badges").select("*, badges:badge_id(*)").eq("user_id", caller.id),
      sb.from("user_challenges").select("*, challenges:challenge_id(*)").eq("user_id", caller.id),
    ]);
    myBadges = b.data ?? [];
    myChallenges = c.data ?? [];
  }

  return NextResponse.json({
    badges: badges ?? [],
    challenges: challenges ?? [],
    leaderboard: leaderboard ?? [],
    myBadges,
    myChallenges,
  });
}
