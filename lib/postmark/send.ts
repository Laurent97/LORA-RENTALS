import { postmarkSend, PostmarkError, getPostmarkToken } from "./client";
import { renderEmail } from "./render";
import { EMAIL } from "./config";
import { getTemplate } from "./templates/registry";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import type { SendOptions, TemplateData } from "./types";

const MAX_ATTEMPTS = 3;
const RATE_LIMIT_PER_MINUTE = 10; // per recipient
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export interface SendResult {
  ok: boolean;
  status: "sent" | "skipped" | "failed";
  messageId?: string;
  logId?: string;
  reason?: string;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Render + send a templated email through Postmark with:
 *  - idempotency (same key never sends twice)
 *  - per-recipient rate limiting
 *  - retry with exponential backoff on 5xx / 429
 *  - full audit trail in `email_logs`
 * Never throws for delivery failures — inspect `result.ok`.
 */
export async function sendEmail<D extends TemplateData>(opts: SendOptions<D>): Promise<SendResult> {
  const { to, templateSlug, data, userId, locale = "en", idempotencyKey, cc, bcc, tag, attachments } = opts;
  const sb = getSupabaseAdmin();

  if (!EMAIL_RE.test(to)) return { ok: false, status: "failed", reason: `Invalid recipient: ${to}` };
  if (!getTemplate(templateSlug)) return { ok: false, status: "failed", reason: `Unknown template: ${templateSlug}` };

  // Idempotency + rate limit (only enforceable when the log table is reachable)
  if (sb) {
    if (idempotencyKey) {
      const { data: dup } = await sb.from("email_logs").select("id, status").eq("idempotency_key", idempotencyKey).in("status", ["sent", "delivered", "opened", "clicked"]).maybeSingle();
      if (dup) return { ok: true, status: "skipped", logId: dup.id, reason: "duplicate idempotency key" };
    }
    const since = new Date(Date.now() - 60_000).toISOString();
    const { count } = await sb.from("email_logs").select("id", { count: "exact", head: true }).eq("to_email", to).gte("created_at", since);
    if ((count ?? 0) >= RATE_LIMIT_PER_MINUTE) return { ok: false, status: "skipped", reason: "rate limited" };
  }

  const rendered = renderEmail(templateSlug, data, locale, { userId });

  let logId: string | undefined;
  if (sb) {
    const { data: log } = await sb
      .from("email_logs")
      .insert({ user_id: userId ?? null, template_slug: templateSlug, to_email: to, subject: rendered.subject, status: "queued", locale, idempotency_key: idempotencyKey ?? null, data })
      .select("id")
      .single();
    logId = log?.id;
  }

  const finish = async (patch: Record<string, unknown>) => {
    if (sb && logId) await sb.from("email_logs").update({ ...patch, updated_at: new Date().toISOString() }).eq("id", logId);
  };

  if (!getPostmarkToken()) {
    // Dev / preview mode — log and skip, never throw.
    console.info(`[email] (no POSTMARK_SERVER_TOKEN) would send "${templateSlug}" → ${to}: ${rendered.subject}`);
    await finish({ status: "skipped", error: "POSTMARK_SERVER_TOKEN not set" });
    return { ok: true, status: "skipped", logId, reason: "no token" };
  }

  let lastErr: unknown;
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      const res = await postmarkSend({
        From: `${EMAIL.fromName} <${EMAIL.fromEmail}>`,
        To: to,
        Cc: cc,
        Bcc: bcc,
        ReplyTo: EMAIL.replyTo,
        Subject: rendered.subject,
        HtmlBody: rendered.html,
        TextBody: rendered.text,
        MessageStream: rendered.stream === "broadcast" ? EMAIL.broadcastStream : EMAIL.stream,
        Tag: tag ?? templateSlug,
        TrackOpens: true,
        TrackLinks: "HtmlAndText",
        Metadata: { template: templateSlug, user_id: userId ?? "", log_id: logId ?? "", locale },
        Headers: idempotencyKey ? [{ Name: "X-LORA-Idempotency-Key", Value: idempotencyKey }] : undefined,
        Attachments: attachments,
      });
      await finish({ status: "sent", postmark_message_id: res.MessageID, error: null });
      return { ok: true, status: "sent", messageId: res.MessageID, logId };
    } catch (err) {
      lastErr = err;
      const retryable = err instanceof PostmarkError ? err.retryable : true;
      if (!retryable || attempt === MAX_ATTEMPTS) break;
      await sleep(300 * 2 ** (attempt - 1));
    }
  }

  const message = lastErr instanceof Error ? lastErr.message : String(lastErr);
  console.error(`[email] failed "${templateSlug}" → ${to}: ${message}`);
  await finish({ status: "failed", error: message });
  return { ok: false, status: "failed", logId, reason: message };
}

/** Resend a previously logged email with its stored data. Admin only (enforced by the route). */
export async function resendFromLog(logId: string): Promise<SendResult> {
  const sb = getSupabaseAdmin();
  if (!sb) return { ok: false, status: "failed", reason: "Supabase admin not configured" };
  const { data: log } = await sb.from("email_logs").select("*").eq("id", logId).single();
  if (!log) return { ok: false, status: "failed", reason: "Log not found" };
  return sendEmail({
    to: log.to_email,
    templateSlug: log.template_slug,
    data: (log.data ?? {}) as TemplateData,
    userId: log.user_id ?? undefined,
    locale: log.locale ?? "en",
    tag: `resend:${log.template_slug}`,
  });
}
