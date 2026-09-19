import { NextResponse } from "next/server";
import { getSupabaseAdmin, getCallerProfile } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const sb = getSupabaseAdmin();
  if (!sb) return NextResponse.json({ error: "not configured" }, { status: 500 });
  const caller = await getCallerProfile(req.headers.get("authorization"));
  if (!caller || caller.role !== "admin") return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const limit = Math.min(50, Number(searchParams.get("limit") ?? 10));

  try {
    const { count: total } = await sb.from("share_events").select("id", { count: "exact", head: true });

    const { data: allEvents } = await sb
      .from("share_events")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(10000);

    const byPlatform: Record<string, number> = {};
    const byListing: Record<string, { type: string; id: string; shares: number }> = {};
    const events = allEvents ?? [];

    for (const e of events) {
      byPlatform[e.platform ?? "unknown"] = (byPlatform[e.platform ?? "unknown"] ?? 0) + 1;
      const key = `${e.listing_type ?? "unknown"}-${e.listing_id ?? "unknown"}`;
      if (!byListing[key]) byListing[key] = { type: e.listing_type ?? "unknown", id: e.listing_id ?? "unknown", shares: 0 };
      byListing[key].shares++;
    }

    const platformList = Object.entries(byPlatform)
      .map(([platform, count]) => ({ platform, count }))
      .sort((a, b) => b.count - a.count);

    const topListings = Object.values(byListing)
      .sort((a, b) => b.shares - a.shares)
      .slice(0, limit);

    return NextResponse.json({
      total: total ?? 0,
      byPlatform: platformList,
      topListings,
      recent: events.slice(0, 20),
    });
  } catch (err) {
    console.warn("[shares/analytics]", err);
    return NextResponse.json({
      total: 0,
      byPlatform: [],
      topListings: [],
      recent: [],
      warning: "Run the 20260919_broadcasts migration to enable share analytics.",
    });
  }
}
