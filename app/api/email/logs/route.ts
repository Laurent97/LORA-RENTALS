import { NextResponse } from "next/server";
import { getSupabaseAdmin, getCallerProfile } from "@/lib/supabase/admin";
import { resendFromLog } from "@/lib/postmark/send";

export const dynamic = "force-dynamic";

export const runtime = "nodejs";

async function requireAdmin(req: Request) {
  const caller = await getCallerProfile(req.headers.get("authorization"));
  return caller?.role === "admin" ? caller : null;
}

// GET /api/email/logs?status=failed&template=booking-confirmed&q=aline&limit=100
export async function GET(req: Request) {
  if (!(await requireAdmin(req))) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const sb = getSupabaseAdmin();
  if (!sb) return NextResponse.json({ logs: [], configured: false });

  const url = new URL(req.url);
  const status = url.searchParams.get("status");
  const template = url.searchParams.get("template");
  const q = url.searchParams.get("q");
  const limit = Math.min(Number(url.searchParams.get("limit") ?? 100), 500);

  let query = sb.from("email_logs").select("*").order("created_at", { ascending: false }).limit(limit);
  if (status) query = query.eq("status", status);
  if (template) query = query.eq("template_slug", template);
  if (q) query = query.or(`to_email.ilike.%${q}%,subject.ilike.%${q}%`);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ logs: data ?? [], configured: true });
}

// POST /api/email/logs  { logId }  → resend
export async function POST(req: Request) {
  if (!(await requireAdmin(req))) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { logId } = (await req.json().catch(() => ({}))) as { logId?: string };
  if (!logId) return NextResponse.json({ error: "`logId` required" }, { status: 400 });
  const result = await resendFromLog(logId);
  return NextResponse.json(result, { status: result.ok ? 200 : 502 });
}
