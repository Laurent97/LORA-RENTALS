// Mirrors all LORA email templates into the Postmark dashboard via the Templates API.
//   npx tsx scripts/postmark-sync-templates.mjs            # upsert layout + 75 templates
//   npx tsx scripts/postmark-sync-templates.mjs --dry-run  # show what would change
//   npx tsx scripts/postmark-sync-templates.mjs --locale rw
//
// Live sends still use the in-app renderer (lib/postmark/send.ts) so dynamic data
// and per-user locale work. What lands in Postmark is the exact same layout +
// each template rendered with its sample data — for review, previews, spam
// scoring and sharing with the team. Re-run after changing any template.
//
// Reads POSTMARK_SERVER_TOKEN from the environment or .env.local.
import { readFileSync, existsSync } from "node:fs";
import { baseLayout } from "../lib/postmark/layout/base-layout.ts";
import { htmlToText, textFrame } from "../lib/postmark/layout/text.ts";
import { tx } from "../lib/postmark/i18n.ts";
import { templates, templateSlugs } from "../lib/postmark/templates/registry.ts";

// ── env ──────────────────────────────────────────────────────────────────────
if (!process.env.POSTMARK_SERVER_TOKEN && existsSync(".env.local")) {
  for (const line of readFileSync(".env.local", "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}
const TOKEN = process.env.POSTMARK_SERVER_TOKEN;
if (!TOKEN) {
  console.error("POSTMARK_SERVER_TOKEN is not set (env or .env.local)");
  process.exit(1);
}
const args = process.argv.slice(2);
const DRY = args.includes("--dry-run");
const locale = args[args.indexOf("--locale") + 1] && args.includes("--locale") ? args[args.indexOf("--locale") + 1] : "en";
const t = tx(locale);

const API = "https://api.postmarkapp.com";
const headers = { Accept: "application/json", "Content-Type": "application/json", "X-Postmark-Server-Token": TOKEN };

async function pm(method, path, body) {
  const res = await fetch(`${API}${path}`, { method, headers, body: body ? JSON.stringify(body) : undefined });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`${method} ${path} → ${res.status} ${json.Message ?? ""}`);
  return json;
}

// ── existing templates (by alias) ─────────────────────────────────────────────
const existing = new Map();
for (let offset = 0; ; offset += 100) {
  const page = await pm("GET", `/templates?Count=100&Offset=${offset}`);
  for (const tp of page.Templates ?? []) if (tp.Alias) existing.set(tp.Alias, tp);
  if ((page.Templates?.length ?? 0) < 100) break;
}

async function upsert(alias, payload) {
  const found = existing.get(alias);
  if (DRY) {
    console.log(`${found ? "update" : "create"}  ${alias}`);
    return;
  }
  if (found) await pm("PUT", `/templates/${found.TemplateId}`, payload);
  else await pm("POST", "/templates", { ...payload, Alias: alias });
  console.log(`${found ? "updated" : "created"}  ${alias}`);
}

// ── 1. Layout: the master frame with Postmark's content placeholder ───────────
const LAYOUT_ALIAS = "lora-base-layout";
const layoutHtml = baseLayout({
  subject: "{{subject}}",
  preheader: "",
  body: "{{{ @content }}}",
  locale,
}).replace("<title>{{subject}}</title>", "<title>LORA RENTALS</title>");

await upsert(LAYOUT_ALIAS, {
  Name: "LORA — Base Layout",
  TemplateType: "Layout",
  HtmlBody: layoutHtml,
  TextBody: textFrame("{{{ @content }}}", t),
});

// ── 2. Standard templates, each attached to the layout ────────────────────────
let n = 0;
for (const slug of templateSlugs) {
  const tpl = templates[slug];
  const body = tpl.html(tpl.sample, t);
  await upsert(slug, {
    Name: `${tpl.category} · ${tpl.name}`,
    TemplateType: "Standard",
    LayoutTemplate: LAYOUT_ALIAS,
    Subject: tpl.subject(tpl.sample),
    HtmlBody: body,
    TextBody: tpl.text ? tpl.text(tpl.sample, t) : htmlToText(body),
  });
  n++;
}
console.log(`\n${DRY ? "would sync" : "synced"} 1 layout + ${n} templates (${locale}) → Postmark`);
