import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export const runtime = "nodejs";

// Postmark webhook receiver — configure in Postmark as
//   https://lorarentals.org/api/email/webhook?token=$POSTMARK_WEBHOOK_SECRET
// (or use HTTP Basic auth with any username and the secret as the password).
// Handles Delivery, Bounce, SpamComplaint, Open, Click, SubscriptionChange.

type PostmarkEvent = {
  RecordType: "Delivery" | "Bounce" | "SpamComplaint" | "Open" | "Click" | "SubscriptionChange";
  MessageID: string;
  Recipient?: string;
  Email?: string;
  Tag?: string;
  Metadata?: Record<string, string>;
  DeliveredAt?: string;
  BouncedAt?: string;
  ReceivedAt?: string;
  Type?: string;
  TypeCode?: number;
  Description?: string;
  Details?: string;
  OriginalLink?: string;
  UserAgent?: string;
  Geo?: { City?: string; Country?: string };
  SuppressSending?: boolean;
  SuppressionReason?: string;
};

function authorized(req: Request): boolean {
  const secret = process.env.POSTMARK_WEBHOOK_SECRET;
  if (!secret) return process.env.NODE_ENV !== "production"; // open in dev only
  const url = new URL(req.url);
  if (url.searchParams.get("token") === secret) return true;
  const basic = req.headers.get("authorization");
  if (basic?.startsWith("Basic ")) {
    try {
      const [, pass] = Buffer.from(basic.slice(6), "base64").toString("utf8").split(":");
      return pass === secret;
    } catch {
      return false;
    }
  }
  return false;
}

const statusFor: Record<PostmarkEvent["RecordType"], string | null> = {
  Delivery: "delivered",
  Bounce: "bounced",
  SpamComplaint: "spam",
  Open: "opened",
  Click: "clicked",
  SubscriptionChange: null,
};

// Never regress a "further along" status (e.g. an Open arriving after a Click).
const rank: Record<string, number> = { queued: 0, sent: 1, delivered: 2, opened: 3, clicked: 4, bounced: 5, spam: 6, failed: 6 };

export async function POST(req: Request) {
  if (!authorized(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let ev: PostmarkEvent;
  try {
    ev = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const sb = getSupabaseAdmin();
  if (!sb) return NextResponse.json({ ok: true, stored: false }); // acknowledge so Postmark doesn't retry forever

  const email = ev.Recipient ?? ev.Email ?? null;
  const at = ev.DeliveredAt ?? ev.BouncedAt ?? ev.ReceivedAt ?? new Date().toISOString();

  await sb.from("email_events").insert({
    postmark_message_id: ev.MessageID,
    record_type: ev.RecordType,
    recipient: email,
    tag: ev.Tag ?? null,
    detail: ev.Description ?? ev.Details ?? ev.OriginalLink ?? ev.SuppressionReason ?? null,
    user_agent: ev.UserAgent ?? null,
    geo: ev.Geo ?? null,
    payload: ev,
    occurred_at: at,
  });

  const next = statusFor[ev.RecordType];
  if (next && ev.MessageID) {
    const { data: log } = await sb.from("email_logs").select("id, status").eq("postmark_message_id", ev.MessageID).maybeSingle();
    if (log && (rank[next] ?? 0) >= (rank[log.status] ?? 0)) {
      const patch: Record<string, unknown> = { status: next, updated_at: new Date().toISOString() };
      if (ev.RecordType === "Open") patch.opened_at = at;
      if (ev.RecordType === "Click") patch.clicked_at = at;
      if (ev.RecordType === "Bounce" || ev.RecordType === "SpamComplaint") patch.error = ev.Description ?? ev.Type ?? ev.RecordType;
      await sb.from("email_logs").update(patch).eq("id", log.id);
    }
  }

  // Hard bounces + spam complaints → mark the user so we stop emailing them.
  if ((ev.RecordType === "Bounce" && ev.Type === "HardBounce") || ev.RecordType === "SpamComplaint") {
    if (email) await sb.from("users").update({ email_suppressed: true }).eq("email", email);
  }

  return NextResponse.json({ ok: true });
}
