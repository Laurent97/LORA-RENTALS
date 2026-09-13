import { NextResponse } from "next/server";
import { getSupabaseAdmin, getCallerProfile } from "@/lib/supabase/admin";
import type { Badge, UserBadge, Challenge, UserChallenge } from "@/types";

function badgeFromRow(row: Record<string, unknown>): Badge {
  return {
    id: String(row.id ?? ""),
    slug: String(row.slug ?? ""),
    label: String(row.label ?? ""),
    description: row.description ? String(row.description) : undefined,
    icon: row.icon ? String(row.icon) : undefined,
    pointsBonus: Number(row.points_bonus ?? 0),
    createdAt: String(row.created_at ?? new Date().toISOString()),
  };
}

function userBadgeFromRow(row: Record<string, unknown>): UserBadge {
  return {
    userId: String(row.user_id ?? ""),
    badgeId: String(row.badge_id ?? ""),
    awardedAt: String(row.awarded_at ?? new Date().toISOString()),
  };
}

function challengeFromRow(row: Record<string, unknown>): Challenge {
  return {
    id: String(row.id ?? ""),
    slug: String(row.slug ?? ""),
    label: String(row.label ?? ""),
    description: row.description ? String(row.description) : undefined,
    points: Number(row.points ?? 0),
    condition: (row.condition as Record<string, unknown>) ?? {},
    startAt: row.start_at ? String(row.start_at) : undefined,
    endAt: row.end_at ? String(row.end_at) : undefined,
    createdAt: String(row.created_at ?? new Date().toISOString()),
  };
}

function userChallengeFromRow(row: Record<string, unknown>): UserChallenge {
  return {
    userId: String(row.user_id ?? ""),
    challengeId: String(row.challenge_id ?? ""),
    status: String(row.status ?? "in_progress") as UserChallenge["status"],
    progress: Number(row.progress ?? 0),
    completedAt: row.completed_at ? String(row.completed_at) : undefined,
    createdAt: String(row.created_at ?? new Date().toISOString()),
  };
}

export async function GET(req: Request) {
  const sb = getSupabaseAdmin();
  if (!sb) return NextResponse.json({ error: "not configured" }, { status: 500 });

  const caller = await getCallerProfile(req.headers.get("authorization"));
  if (!caller) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const userId = new URL(req.url).searchParams.get("userId") ?? caller.id;

  const [
    { data: bRows },
    { data: ubRows },
    { data: cRows },
    { data: ucRows },
  ] = await Promise.all([
    sb.from("badges").select("*").order("label"),
    sb.from("user_badges").select("*").eq("user_id", userId),
    sb.from("challenges").select("*").order("points", { ascending: false }),
    sb.from("user_challenges").select("*").eq("user_id", userId),
  ]);

  return NextResponse.json({
    badges: (bRows ?? []).map(badgeFromRow),
    userBadges: (ubRows ?? []).map(userBadgeFromRow),
    challenges: (cRows ?? []).map(challengeFromRow),
    userChallenges: (ucRows ?? []).map(userChallengeFromRow),
  });
}
