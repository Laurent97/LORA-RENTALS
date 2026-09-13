import { NextResponse } from "next/server";
import { dispatchEmailEvent, EMAIL_EVENTS, type EmailEvent } from "@/lib/postmark/triggers";
import { getCallerProfile } from "@/lib/supabase/admin";

export const runtime = "nodejs";

// POST /api/email/notify  { event, id, meta? }
// Called by the app after a state change. The caller is verified from their
// Supabase session; all entity data is loaded server-side and authorisation is
// enforced per event in dispatchEmailEvent. Also accepts x-email-secret for
// DB webhooks / cron (actor becomes a system admin).
export async function POST(req: Request) {
  const secret = process.env.EMAIL_API_SECRET;
  const viaSecret = !!secret && req.headers.get("x-email-secret") === secret;
  const caller = viaSecret ? { id: "system", role: "admin" } : await getCallerProfile(req.headers.get("authorization"));
  if (!caller) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: { event?: string; id?: string; meta?: Record<string, string | number | boolean | undefined> };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const { event, id, meta } = body;
  if (!event || !id) return NextResponse.json({ error: "`event` and `id` are required" }, { status: 400 });
  if (!(EMAIL_EVENTS as readonly string[]).includes(event)) return NextResponse.json({ error: `Unknown event: ${event}` }, { status: 400 });

  const result = await dispatchEmailEvent({ event: event as EmailEvent, id, actor: { id: caller.id, role: caller.role }, meta });
  // Client fire-and-forget calls (no x-email-secret) should not surface 4xx in the browser.
  // The result body still shows whether the email was actually sent.
  const status = result.ok
    ? 200
    : result.reason === "Forbidden"
    ? 403
    : viaSecret
    ? 422
    : 200;
  return NextResponse.json(result, { status });
}
