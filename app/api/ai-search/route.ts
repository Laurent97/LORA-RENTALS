import { NextResponse } from "next/server";
import { addDays, nextSaturday, format } from "date-fns";
import { callLlm } from "@/lib/ai/complete";
import { CAR_TYPES, RWANDA_LOCATIONS } from "@/lib/constants";
import type { ParsedSearch } from "@/types";

// ─── Rule-based parser (always works, no API key needed) ────────────────────
function parseRules(q: string): ParsedSearch {
  const s = q.toLowerCase();
  const out: ParsedSearch = {};

  // car type
  for (const t of CAR_TYPES) {
    if (s.includes(t.value) || s.includes(t.label.toLowerCase())) {
      out.type = t.value;
      break;
    }
  }
  if (!out.type && /\b(suv|4x4|4wd|off.?road)\b/.test(s)) out.type = "4x4";
  if (!out.type && /\b(van|minibus|family)\b/.test(s)) out.type = "minivan";
  if (!out.type && /\b(luxury|premium|executive|business)\b/.test(s)) out.type = "luxury";

  // location
  for (const loc of RWANDA_LOCATIONS) {
    const key = loc.toLowerCase().replace("kigali — ", "").replace(" international airport", "");
    if (s.includes(key) || s.includes(loc.toLowerCase())) {
      out.location = loc;
      break;
    }
  }
  if (!out.location && /\b(airport|kia|kanombe)\b/.test(s)) out.location = "Kigali International Airport";
  if (!out.location && /\bkigali\b/.test(s)) out.location = "Kigali — Gasabo";

  // duration
  const days = s.match(/(\d+)\s*(day|days|night|nights)/);
  if (days) out.days = parseInt(days[1], 10);
  const weeks = s.match(/(\d+)\s*week/);
  if (weeks) out.days = parseInt(weeks[1], 10) * 7;
  if (/weekend/.test(s) && !out.days) out.days = 2;

  // dates
  const today = new Date();
  if (/next weekend/.test(s)) {
    const sat = nextSaturday(today);
    out.startDate = format(sat, "yyyy-MM-dd");
    out.endDate = format(addDays(sat, Math.max((out.days ?? 2) - 1, 1)), "yyyy-MM-dd");
  } else if (/this weekend/.test(s)) {
    const sat = nextSaturday(addDays(today, -7));
    out.startDate = format(sat, "yyyy-MM-dd");
    out.endDate = format(addDays(sat, Math.max((out.days ?? 2) - 1, 1)), "yyyy-MM-dd");
  } else if (/tomorrow/.test(s)) {
    const d = addDays(today, 1);
    out.startDate = format(d, "yyyy-MM-dd");
    out.endDate = format(addDays(d, out.days ?? 1), "yyyy-MM-dd");
  } else if (/today/.test(s)) {
    out.startDate = format(today, "yyyy-MM-dd");
    out.endDate = format(addDays(today, out.days ?? 1), "yyyy-MM-dd");
  } else if (out.days) {
    out.startDate = format(today, "yyyy-MM-dd");
    out.endDate = format(addDays(today, out.days), "yyyy-MM-dd");
  }

  // seats
  const seats = s.match(/(\d+)\s*(seat|seater|passenger)/);
  if (seats) out.seats = parseInt(seats[1], 10);

  // budget
  const price = s.match(/(?:under|below|max|less than)\s*(?:rwf|frw|rf)?\s*([\d,]+)k?/i);
  if (price) {
    let n = parseInt(price[1].replace(/,/g, ""), 10);
    if (/k$/i.test(price[0].trim()) || n < 1000) n *= 1000;
    out.maxPrice = n;
  }

  return out;
}

// ─── Optional LLM pass — falls back silently to rules ─────────────────────────
async function parseLlm(q: string): Promise<ParsedSearch | null> {
  const prompt = `Extract car-rental search filters from this query as strict JSON with keys: type (sedan|suv|pickup|luxury|minivan|4x4), location (Rwandan place name), days (int), startDate (YYYY-MM-DD), endDate (YYYY-MM-DD), seats (int), maxPrice (int RWF). Today is ${format(new Date(), "yyyy-MM-dd")}. Omit unknown keys. Query: "${q}"`;
  try {
    const text = await callLlm(prompt);
    if (!text) return null;
    const json = JSON.parse(text.replace(/```json|```/g, "").trim());
    return json as ParsedSearch;
  } catch {
    return null;
  }
}

export async function POST(req: Request) {
  try {
    const { query } = await req.json();
    if (!query || typeof query !== "string") {
      return NextResponse.json({ error: "query required" }, { status: 400 });
    }
    const llm = await parseLlm(query);
    const parsed = llm ?? parseRules(query);
    return NextResponse.json({ parsed, source: llm ? "llm" : "rules" });
  } catch {
    return NextResponse.json({ error: "parse failed" }, { status: 500 });
  }
}
