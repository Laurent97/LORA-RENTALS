import { NextResponse } from "next/server";
import webpush from "web-push";
import { getSupabaseAdmin, getCallerProfile } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/postmark/send";
import { BRAND } from "@/lib/constants";

export const dynamic = "force-dynamic";

const audiences: Record<string, string[] | null> = {
  all: null,
  customers: ["customer"],
  owners: ["owner"],
  drivers: ["driver"],
  admins: ["admin"],
  corporates: ["corporate_admin", "corporate_manager", "corporate_member"],
};

const vapidPublic = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const vapidPrivate = process.env.VAPID_PRIVATE_KEY;
if (vapidPublic && vapidPrivate) {
  webpush.setVapidDetails(
    `mailto:${BRAND.supportEmail}`,
    vapidPublic,
    vapidPrivate
  );
}

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
    category?: string;
  };

  const {
    title,
    body: message,
    audience = "all",
    channels = ["in_app"],
    ctaUrl,
    ctaLabel,
    category = "announcement",
  } = body;
  if (!title || !message) {
    return NextResponse.json({ error: "title and body required" }, { status: 400 });
  }
  const roles = audiences[audience];

  let q = sb.from("users").select("id, name, email").is("deleted_at", null);
  if (roles) q = q.in("role", roles);

  const { data: users, error } = await q;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const recipients = users ?? [];
  const results = { inApp: 0, email: 0, emailFailed: 0, push: 0, pushFailed: 0 };

  // Broadcast record (best-effort; works before migration)
  let broadcastId: string | undefined;
  try {
    const { data: b } = await sb
      .from("broadcasts")
      .insert({
        admin_id: caller.id,
        title,
        body: message,
        cta_label: ctaLabel ?? null,
        cta_url: ctaUrl ?? null,
        category,
        audience_type: audience,
        channels,
        status: "sending",
        recipient_count: recipients.length,
      })
      .select()
      .single();
    broadcastId = b?.id;
  } catch (err) {
    console.warn("[broadcast] could not create broadcast row:", err);
  }

  // Recipient records (best-effort)
  const recipientMap = new Map<string, string>();
  if (broadcastId) {
    try {
      const rows = recipients.map((u: any) => ({
        broadcast_id: broadcastId,
        user_id: u.id,
        in_app_status: channels.includes("in_app") ? "pending" : "n/a",
        email_status: channels.includes("email") ? "pending" : "n/a",
        push_status: channels.includes("push") ? "pending" : "n/a",
      }));
      const { data: inserted } = await sb.from("broadcast_recipients").insert(rows).select("id, user_id");
      for (const r of inserted ?? []) {
        recipientMap.set(r.user_id, r.id);
      }
    } catch (err) {
      console.warn("[broadcast] could not create broadcast_recipients:", err);
    }
  }

  // In-app notifications
  if (channels.includes("in_app")) {
    const notifications = recipients.map((u: any) => ({
      user_id: u.id,
      type: "promo",
      title,
      message,
      data: { cta_url: ctaUrl ?? null, cta_label: ctaLabel ?? null, broadcast_id: broadcastId ?? null },
      read: false,
      created_at: new Date().toISOString(),
    }));

    for (let i = 0; i < notifications.length; i += 500) {
      const batch = notifications.slice(i, i + 500);
      const { error: nErr } = await sb.from("notifications").insert(batch);
      if (!nErr) {
        results.inApp += batch.length;
        for (const n of batch) {
          const rid = recipientMap.get(n.user_id);
          if (rid) await sb.from("broadcast_recipients").update({ in_app_status: "delivered" }).eq("id", rid);
        }
      } else {
        console.error("[broadcast] in-app insert failed:", nErr.message);
      }
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
      const rid = recipientMap.get(u.id);
      if (rid) {
        await sb
          .from("broadcast_recipients")
          .update({
            email_status: res.ok ? "sent" : "failed",
            postmark_message_id: res.messageId ?? null,
            delivered_at: res.ok ? new Date().toISOString() : null,
          })
          .eq("id", rid);
      }
      if (res.ok) results.email++;
      else results.emailFailed++;
    }
  }

  // Web push
  if (channels.includes("push") && vapidPublic && vapidPrivate) {
    const userIds = recipients.map((u: any) => u.id);
    const { data: subs } = await sb
      .from("push_subscriptions")
      .select("id, subscription")
      .in("user_id", userIds);

    const payload = JSON.stringify({
      title,
      body: message,
      icon: "/icons/icon-192x192.png",
      badge: "/icons/icon-72x72.png",
      data: { url: ctaUrl ?? "/", broadcast_id: broadcastId ?? null },
    });

    for (const s of subs ?? []) {
      try {
        await webpush.sendNotification(s.subscription as webpush.PushSubscription, payload);
        results.push++;
      } catch (err) {
        console.warn("[broadcast] push failed:", err);
        results.pushFailed++;
      }
    }
  }

  // Mark broadcast sent
  if (broadcastId) {
    try {
      await sb
        .from("broadcasts")
        .update({
          status: "sent",
          sent_at: new Date().toISOString(),
          delivered_count: results.inApp + results.email + results.push,
        })
        .eq("id", broadcastId);
    } catch (err) {
      console.warn("[broadcast] could not update broadcast row:", err);
    }
  }

  return NextResponse.json({
    ok: true,
    broadcastId,
    audience,
    channels,
    recipients: recipients.length,
    results,
  });
}
