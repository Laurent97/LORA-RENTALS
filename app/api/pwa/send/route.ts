import { NextRequest, NextResponse } from "next/server";
import webpush from "web-push";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

type SendBody = { title?: unknown; body?: unknown; url?: unknown; endpoint?: unknown };

export async function POST(request: NextRequest) {
  if (!process.env.PUSH_API_SECRET || request.headers.get("x-push-secret") !== process.env.PUSH_API_SECRET) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY, privateKey = process.env.VAPID_PRIVATE_KEY, subject = process.env.VAPID_SUBJECT;
  if (!publicKey || !privateKey || !subject) return NextResponse.json({ error: "VAPID is not configured" }, { status: 503 });
  const input = await request.json().catch(() => null) as SendBody | null;
  if (!input || typeof input.title !== "string" || typeof input.body !== "string" || typeof input.url !== "string") return NextResponse.json({ error: "title, body, and url are required" }, { status: 400 });
  const db = getSupabaseAdmin();
  if (!db) return NextResponse.json({ error: "Database is not configured" }, { status: 503 });
  const query = db.from("push_subscriptions").select("endpoint, subscription");
  const { data, error } = typeof input.endpoint === "string" ? await query.eq("endpoint", input.endpoint) : await query;
  if (error) return NextResponse.json({ error: "Could not load subscriptions" }, { status: 503 });
  webpush.setVapidDetails(subject, publicKey, privateKey);
  const payload = JSON.stringify({ title: input.title.slice(0, 100), body: input.body.slice(0, 280), url: input.url });
  const results = await Promise.allSettled((data ?? []).map(({ subscription }) => webpush.sendNotification(subscription as webpush.PushSubscription, payload)));
  const delivered = results.filter(({ status }) => status === "fulfilled").length;
  return NextResponse.json({ delivered, attempted: results.length });
}
