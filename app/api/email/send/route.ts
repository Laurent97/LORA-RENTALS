import { NextResponse } from "next/server";
import { sendEmail } from "@/lib/postmark/send";
import { isTemplateSlug } from "@/lib/postmark/templates/registry";
import { getCallerProfile } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export const runtime = "nodejs";

// POST /api/email/send
// Auth: either `x-email-secret: $EMAIL_API_SECRET` (server-to-server, DB webhooks,
// cron) or a Supabase admin Bearer token (admin UI test sends).
export async function POST(req: Request) {
  const secret = process.env.EMAIL_API_SECRET;
  const viaSecret = !!secret && req.headers.get("x-email-secret") === secret;
  const caller = viaSecret ? null : await getCallerProfile(req.headers.get("authorization"));
  if (!viaSecret && caller?.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { to?: string; templateSlug?: string; data?: Record<string, unknown>; userId?: string; locale?: "en" | "rw" | "fr"; idempotencyKey?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const { to, templateSlug, data = {}, userId, locale, idempotencyKey } = body;
  if (!to || !templateSlug) return NextResponse.json({ error: "`to` and `templateSlug` are required" }, { status: 400 });
  if (!isTemplateSlug(templateSlug)) return NextResponse.json({ error: `Unknown template: ${templateSlug}` }, { status: 400 });

  const result = await sendEmail({ to, templateSlug, data: data as Record<string, string | number | boolean | null | undefined>, userId, locale, idempotencyKey });
  return NextResponse.json(result, { status: result.ok ? 200 : 502 });
}
