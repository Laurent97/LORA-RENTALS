import { NextResponse } from "next/server";
import { getSupabaseAdmin, getCallerProfile } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const sb = getSupabaseAdmin();
    if (!sb) return NextResponse.json({ error: "not configured" }, { status: 500 });

    const caller = await getCallerProfile(req.headers.get("authorization"));
    if (!caller) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

    let driverId: string | null = null;
    if (caller.role === "admin") {
      const { searchParams } = new URL(req.url);
      driverId = searchParams.get("driver_id");
    } else {
      const { data: driver } = await sb.from("drivers").select("id").eq("user_id", caller.id).single();
      if (!driver) return NextResponse.json({ earnings: [], totals: { pending: 0, available: 0, paid: 0, total: 0 } });
      driverId = driver.id;
    }
    if (!driverId) return NextResponse.json({ error: "driver_id required for admin" }, { status: 400 });

    const { data, error } = await sb
      .from("driver_earnings")
      .select("*")
      .eq("driver_id", driverId)
      .order("created_at", { ascending: false });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const rows = (data ?? []).map((e: any) => ({
      id: String(e.id),
      driverId: String(e.driver_id),
      driverBookingId: e.driver_booking_id ? String(e.driver_booking_id) : null,
      amountRwf: Number(e.amount_rwf ?? 0),
      type: e.type ?? "trip",
      status: e.status ?? "pending",
      paidAt: e.paid_at,
      paidMethod: e.paid_method,
      paidReference: e.paid_reference,
      createdAt: e.created_at,
    }));

    const totals = rows.reduce(
      (acc, e) => {
        if (e.status === "pending") acc.pending += e.amountRwf;
        if (e.status === "available") acc.available += e.amountRwf;
        if (e.status === "paid" || e.status === "withdrawn") acc.paid += e.amountRwf;
        acc.total += e.amountRwf;
        return acc;
      },
      { pending: 0, available: 0, paid: 0, total: 0 }
    );

    return NextResponse.json({ earnings: rows, totals });
  } catch (err) {
    console.error("[driver-earnings] error:", err);
    return NextResponse.json({ error: "Could not load earnings" }, { status: 500 });
  }
}
