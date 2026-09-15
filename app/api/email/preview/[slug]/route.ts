import { NextResponse } from "next/server";
import { renderEmail } from "@/lib/postmark/render";
import { getTemplate, templateSlugs } from "@/lib/postmark/templates/registry";
import { getCallerProfile } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export const runtime = "nodejs";

// GET /api/email/preview/:slug?locale=rw&format=html|text|json
// Renders a template with its sample data. Open in dev; admin-only in production.
export async function GET(req: Request, { params }: { params: { slug: string } }) {
  if (process.env.NODE_ENV === "production") {
    const secret = process.env.EMAIL_API_SECRET;
    const url = new URL(req.url);
    const viaSecret = !!secret && url.searchParams.get("secret") === secret;
    if (!viaSecret) {
      const caller = await getCallerProfile(req.headers.get("authorization"));
      if (caller?.role !== "admin") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const { slug } = params;
  if (slug === "_list") return NextResponse.json({ templates: templateSlugs });

  const tpl = getTemplate(slug);
  if (!tpl) return NextResponse.json({ error: `Unknown template: ${slug}` }, { status: 404 });

  const url = new URL(req.url);
  const locale = (url.searchParams.get("locale") ?? "en") as "en" | "rw" | "fr";
  const format = url.searchParams.get("format") ?? "html";
  const rendered = renderEmail(slug, tpl.sample, locale, { userId: "preview" });

  if (format === "text") return new NextResponse(rendered.text, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
  if (format === "json") return NextResponse.json({ slug, name: tpl.name, category: tpl.category, ...rendered, sample: tpl.sample });
  return new NextResponse(rendered.html, { headers: { "Content-Type": "text/html; charset=utf-8", "X-Email-Subject": encodeURIComponent(rendered.subject) } });
}
