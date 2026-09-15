import { NextResponse } from "next/server";
import { getSupabaseAdmin, getCallerProfile } from "@/lib/supabase/admin";

export async function POST(req: Request) {
  try {
    const sb = getSupabaseAdmin();
    if (!sb) {
      return NextResponse.json({ error: "Server not configured" }, { status: 500 });
    }

    const caller = await getCallerProfile(req.headers.get("authorization"));
    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;

    const {
      booking_id,
      scam_type,
      description,
      screenshots,
      contact_phone,
      contact_email,
    } = body as {
      booking_id?: string;
      scam_type?: string;
      description?: string;
      screenshots?: string[];
      contact_phone?: string;
      contact_email?: string;
    };

    if (!scam_type || !description?.trim()) {
      return NextResponse.json(
        { error: "scam_type and description are required" },
        { status: 400 }
      );
    }

    const insert = {
      user_id: caller?.id ?? null,
      booking_id: booking_id ?? null,
      scam_type,
      description: description.trim(),
      screenshots: Array.isArray(screenshots) ? JSON.stringify(screenshots) : "[]",
      contact_phone: contact_phone?.trim() || null,
      contact_email: contact_email?.trim() || null,
      status: "pending",
    };

    const { data, error } = await sb
      .from("scam_reports")
      .insert(insert)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ report: data });
  } catch (err) {
    console.error("[scam-reports] error:", err);
    return NextResponse.json({ error: "Could not submit report" }, { status: 500 });
  }
}
