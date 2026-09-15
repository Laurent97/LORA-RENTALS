import { NextResponse } from "next/server";
import { getSupabaseAdmin, getCallerProfile } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const sb = getSupabaseAdmin();
    if (!sb) return NextResponse.json({ error: "not configured" }, { status: 500 });

    const caller = await getCallerProfile(req.headers.get("authorization"));
    if (!caller) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

    if (caller.role === "admin") {
      const { searchParams } = new URL(req.url);
      const driverId = searchParams.get("driver_id");
      if (!driverId) return NextResponse.json({ error: "driver_id required" }, { status: 400 });
      const { data } = await sb.from("drivers").select("unavailable_dates").eq("id", driverId).single();
      return NextResponse.json({ unavailable: (data?.unavailable_dates as string[]) ?? [] });
    }

    const { data: driver } = await sb.from("drivers").select("id, unavailable_dates").eq("user_id", caller.id).single();
    if (!driver) return NextResponse.json({ unavailable: [] });
    return NextResponse.json({ unavailable: (driver.unavailable_dates as string[]) ?? [] });
  } catch (err) {
    console.error("[driver-availability] error:", err);
    return NextResponse.json({ error: "Could not load availability" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const sb = getSupabaseAdmin();
    if (!sb) return NextResponse.json({ error: "not configured" }, { status: 500 });

    const caller = await getCallerProfile(req.headers.get("authorization"));
    if (!caller) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

    const { date, reason } = (await req.json().catch(() => ({}))) as { date?: string; reason?: string };
    if (!date) return NextResponse.json({ error: "date required" }, { status: 400 });

    const { data: driver } = await sb.from("drivers").select("id, user_id, unavailable_dates").eq("user_id", caller.id).single();
    if (!driver) return NextResponse.json({ error: "driver not found" }, { status: 404 });

    const current = new Set((driver.unavailable_dates as string[]) ?? []);
    current.add(date);

    const { error } = await sb
      .from("drivers")
      .update({ unavailable_dates: Array.from(current) })
      .eq("id", driver.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // Also insert a row in driver_availability for richer calendar support
    await sb.from("driver_availability").upsert({
      driver_id: driver.id,
      date,
      is_available: false,
      reason: reason ?? null,
      available_from: null,
      available_until: null,
    }, { onConflict: "driver_id,date" });

    return NextResponse.json({ ok: true, unavailable: Array.from(current) });
  } catch (err) {
    console.error("[driver-availability POST] error:", err);
    return NextResponse.json({ error: "Could not update availability" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const sb = getSupabaseAdmin();
    if (!sb) return NextResponse.json({ error: "not configured" }, { status: 500 });

    const caller = await getCallerProfile(req.headers.get("authorization"));
    if (!caller) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const date = searchParams.get("date");
    if (!date) return NextResponse.json({ error: "date required" }, { status: 400 });

    const { data: driver } = await sb.from("drivers").select("id, user_id, unavailable_dates").eq("user_id", caller.id).single();
    if (!driver) return NextResponse.json({ error: "driver not found" }, { status: 404 });

    const current = new Set((driver.unavailable_dates as string[]) ?? []);
    current.delete(date);

    const { error } = await sb
      .from("drivers")
      .update({ unavailable_dates: Array.from(current) })
      .eq("id", driver.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    await sb.from("driver_availability").update({ is_available: true, reason: null }).eq("driver_id", driver.id).eq("date", date);

    return NextResponse.json({ ok: true, unavailable: Array.from(current) });
  } catch (err) {
    console.error("[driver-availability DELETE] error:", err);
    return NextResponse.json({ error: "Could not remove availability" }, { status: 500 });
  }
}
