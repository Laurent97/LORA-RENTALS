import { NextResponse } from "next/server";
import { z } from "zod";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/postmark/send";

export const runtime = "nodejs";

// Auth OTPs are generated with the service role via admin.generateLink — which
// creates the user / token but NEVER sends an email itself — then delivered
// through our Postmark templates. Supabase's built-in mailer is never used, so
// every code is branded, logged in email_logs, and verification is enforced
// regardless of the project's "Confirm email" toggle.
const schema = z.object({
  email: z.string().email(),
  kind: z.enum(["signup", "login", "recovery", "resend"]),
  resendType: z.enum(["signup", "login", "recovery"]).optional(),
  password: z.string().min(6).optional(),
  name: z.string().max(120).optional(),
  phone: z.string().max(40).optional(),
  role: z.enum(["customer", "owner"]).optional(),
});

const TEMPLATE = {
  signup: "auth-otp-signup",
  login: "auth-otp-login",
  recovery: "auth-otp-password-reset",
} as const;

const browserOf = (ua: string) =>
  /edg/i.test(ua) ? "Edge" : /chrome/i.test(ua) ? "Chrome" : /safari/i.test(ua) ? "Safari" : /firefox/i.test(ua) ? "Firefox" : "Browser";

export async function POST(req: Request) {
  const sb = getSupabaseAdmin();
  if (!sb) return NextResponse.json({ ok: false, error: "Auth not configured" }, { status: 503 });

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ ok: false, error: "Invalid request" }, { status: 400 });
  const input = parsed.data;
  const email = input.email.toLowerCase().trim();

  if (input.kind === "signup" && !input.password) {
    return NextResponse.json({ ok: false, error: "Password required" }, { status: 400 });
  }

  // Throttle: one code email per 45s per address — matches the client resend timer.
  const since = new Date(Date.now() - 45_000).toISOString();
  const { count } = await sb
    .from("email_logs")
    .select("id", { count: "exact", head: true })
    .eq("to_email", email)
    .like("template_slug", "auth-otp-%")
    .gte("created_at", since);
  if ((count ?? 0) > 0) return NextResponse.json({ ok: true });

  const kind = input.kind === "resend" ? input.resendType ?? "signup" : input.kind;

  // For a signup resend we no longer have the user's password, so generate a
  // magiclink token instead — verifying it confirms the email and signs in.
  // The client switches its verify type to "email" based on verifyType below.
  const linkType = input.kind === "resend" && kind === "signup" ? "magiclink" : kind === "login" ? "magiclink" : kind;
  const verifyType = linkType === "magiclink" ? "email" : kind;

  const { data, error } = await sb.auth.admin.generateLink(
    linkType === "signup"
      ? {
          type: "signup",
          email,
          password: input.password!,
          options: { data: { name: input.name, phone: input.phone, role: input.role ?? "customer" } },
        }
      : linkType === "magiclink"
        ? { type: "magiclink", email }
        : { type: "recovery", email },
  );

  if (error || !data.properties?.email_otp) {
    const msg = error?.message ?? "Could not generate code";
    // Anti-enumeration: never reveal whether a login/recovery account exists.
    if (kind !== "signup") return NextResponse.json({ ok: true, verifyType });
    if (/already (been )?registered|already exists/i.test(msg)) {
      return NextResponse.json({ ok: false, error: "An account with this email already exists. Sign in instead." }, { status: 409 });
    }
    return NextResponse.json({ ok: false, error: msg }, { status: 400 });
  }

  const ua = req.headers.get("user-agent") ?? "";
  const device = {
    ip_location: req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "",
    browser: browserOf(ua),
    device: /mobile|android|iphone/i.test(ua) ? "Mobile" : "Desktop",
    timestamp: new Date().toLocaleString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }),
  };
  const firstName = String(input.name ?? data.user?.user_metadata?.name ?? email.split("@")[0]).split(" ")[0];
  const slug = input.kind === "resend" ? "auth-otp-resend" : TEMPLATE[kind];

  const sent = await sendEmail({
    to: email,
    templateSlug: slug,
    data: { first_name: firstName, code: data.properties.email_otp, ...device },
    userId: data.user?.id,
    idempotencyKey: `${slug}:${email}:${data.properties.email_otp}`,
  });
  if (!sent.ok) return NextResponse.json({ ok: false, error: "Could not send the code — try again." }, { status: 502 });

  return NextResponse.json({ ok: true, verifyType });
}
