import { NextResponse } from "next/server";
import { normalizeRwandanPhone } from "@/lib/whatsapp/validate";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const { phone } = await req.json();
    if (!phone || typeof phone !== "string") {
      return NextResponse.json({ ok: false, error: "Phone number required" }, { status: 400 });
    }

    const normalized = normalizeRwandanPhone(phone);
    if (!normalized) {
      return NextResponse.json({ ok: false, error: "Invalid Rwandan number" }, { status: 400 });
    }

    // Real WhatsApp verification via Twilio could be added here:
    // if (process.env.TWILIO_SID && process.env.TWILIO_AUTH_TOKEN) { ... }
    // For now we accept valid Rwandan mobile numbers and flag that the final
    // live check can be wired in when Twilio credentials are available.

    return NextResponse.json({ ok: true, normalized, verified: false });
  } catch {
    return NextResponse.json({ ok: false, error: "Could not verify number" }, { status: 500 });
  }
}
