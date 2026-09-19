import { NextResponse } from "next/server";
import { getSupabaseAdmin, getCallerProfile } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/postmark/send";

export const dynamic = "force-dynamic";

const audiences: Record<string, string[] | null> = {
  all: null,
  customers: ["customer"],
  owners: ["owner"],
  drivers: ["driver"],
  admins: ["admin"],
  corporates: ["corporate_admin", "corporate_manager", "corporate_member"],
};

export async function POST(req: Request) {
  const sb = getSupabaseAdmin();
  if (!sb) return NextResponse.json({ error: "not configured" }, { status: 500 });
  const caller = await getCallerProfile(req.headers.get("authorization"));
  if (!caller || caller.role !== "admin") return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = (await req.json().catch(() => ({}))) as {
    title?: string;
    body?: string;
    audience?: string;
    channels?: string[];
    ctaUrl?: string;
    ctaLabel?: string;
  };

  const { title, body: message, audience = "all", channels = ["in_app"], ctaUrl, ctaLabel } = body;
  if (!title || !message) {
    return NextResponse.json({ error: "title and body required" }, { status: 400 });
  }
  const roles = audiences[audience];

  let q = sb.from("users").select("id, name, email").is("deleted_at", null);
  if (roles) q = q.in("role", roles);

  const { data: users, error } = await q;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const recipients = users ?? [];
  const results = { inApp: 0, email: 0, emailFailed: 0 };

  // In-app notifications
  if (channels.includes("in_app")) {
    const notifications = recipients.map((u: any) => ({
      user_id: u.id,
      type: "promo",
      title,
      message,
      data: { cta_url: ctaUrl ?? null, cta_label: ctaLabel ?? null },
      read: false,
      created_at: new Date().toISOString(),
    }));

    for (let i = 0; i < notifications.length; i += 500) {
      const batch = notifications.slice(i, i + 500);
      const { error: nErr } = await sb.from("notifications").insert(batch);
      if (!nErr) results.inApp += batch.length;
      else console.error("[broadcast] in-app insert failed:", nErr.message);
    }
  }

  // Postmark broadcast emails
  if (channels.includes("email")) {
    for (const u of recipients) {
      const res = await sendEmail({
        to: u.email,
        templateSlug: "broadcast-admin",
        data: {
          first_name: u.name?.split(" ")[0] ?? "there",
          title,
          body: message,
          cta_url: ctaUrl ?? "",
          cta_label: ctaLabel ?? "",
        },
        userId: u.id,
        tag: `broadcast:${audience}`,
      });
      if (res.ok) results.email++;
      else results.emailFailed++;
    }
  }

  return NextResponse.json({
    ok: true,
    audience,
    channels,
    recipients: recipients.length,
    results,
  });
}
