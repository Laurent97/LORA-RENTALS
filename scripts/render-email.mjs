// Renders every email template with sample data to .email-preview/<slug>.html
// (+ .txt) so they can be opened locally or uploaded to Litmus / Email on Acid.
// Run: npx tsx scripts/render-email.mjs   (or: node --import tsx scripts/render-email.mjs)
import { mkdirSync, writeFileSync } from "node:fs";
import { renderEmail } from "../lib/postmark/render.ts";
import { templates, templateSlugs } from "../lib/postmark/templates/registry.ts";

const out = ".email-preview";
mkdirSync(out, { recursive: true });
const locale = process.argv[2] ?? "en";
let ok = 0;
const index = [];
for (const slug of templateSlugs) {
  const tpl = templates[slug];
  const r = renderEmail(slug, tpl.sample, locale, { userId: "preview" });
  writeFileSync(`${out}/${slug}.html`, r.html);
  writeFileSync(`${out}/${slug}.txt`, r.text);
  index.push(`<li><a href="${slug}.html">${tpl.name}</a> <code>${slug}</code> — ${r.subject}</li>`);
  ok++;
}
writeFileSync(`${out}/index.html`, `<!doctype html><meta charset="utf-8"><title>LORA emails</title><body style="font-family:Inter,system-ui;padding:24px;max-width:900px;margin:auto"><h1>LORA email templates (${ok}) — ${locale}</h1><ul style="line-height:1.9">${index.join("")}</ul>`);
console.log(`rendered ${ok} templates → ${out}/index.html`);
