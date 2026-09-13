import { NextResponse } from "next/server";
import { addDays, format, nextFriday, nextSaturday } from "date-fns";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { vehicleFromRow } from "@/lib/supabase/mappers";
import { callLlm } from "@/lib/ai/complete";
import { VEHICLES } from "@/lib/data";
import { CAR_TYPES, RWANDA_DESTINATIONS } from "@/lib/constants";
import type { CarType, ConciergeMessage, ConciergeRecommendation, ConciergeResponse, Vehicle } from "@/types";

const DESTINATION_LOCATION: Record<string, string> = {
  "Volcanoes National Park": "Musanze",
  "Lake Kivu": "Rubavu",
  "Akagera National Park": "Nyagatare",
  "Nyungwe Forest": "Huye",
  "Kigali City": "Kigali — Gasabo",
};

function normalize(s: string) {
  return s.toLowerCase().trim();
}

function parseQuery(q: string) {
  const s = normalize(q);
  const out: {
    type?: CarType;
    destinationName?: string;
    days?: number;
    startDate?: string;
    endDate?: string;
    passengers?: number;
  } = {};

  // car type
  for (const t of CAR_TYPES) {
    if (s.includes(t.value) || t.label.toLowerCase().split(" ").some((w) => s.includes(w))) {
      out.type = t.value;
      break;
    }
  }
  if (!out.type && /\b(suv|4x4|4wd|off.?road)\b/.test(s)) out.type = "4x4";
  if (!out.type && /\b(van|minibus|family)\b/.test(s)) out.type = "minivan";
  if (!out.type && /\b(luxury|premium|executive|business)\b/.test(s)) out.type = "luxury";

  // destination from keywords
  for (const d of RWANDA_DESTINATIONS) {
    if (d.keywords.some((k) => s.includes(k))) {
      out.destinationName = d.name;
      break;
    }
  }

  // dates
  const today = new Date();
  if (/next friday|friday/.test(s)) {
    out.startDate = format(nextFriday(today), "yyyy-MM-dd");
  } else if (/next saturday|saturday/.test(s)) {
    out.startDate = format(nextSaturday(today), "yyyy-MM-dd");
  } else if (/tomorrow/.test(s)) {
    out.startDate = format(addDays(today, 1), "yyyy-MM-dd");
  } else if (/today/.test(s)) {
    out.startDate = format(today, "yyyy-MM-dd");
  } else if (/next weekend/.test(s)) {
    out.startDate = format(nextSaturday(today), "yyyy-MM-dd");
  }

  // days
  const daysMatch = s.match(/(\d+)\s*(day|days|night|nights)/);
  if (daysMatch) out.days = parseInt(daysMatch[1], 10);

  // passengers
  const paxMatch = s.match(/family of\s*(\d+)/) || s.match(/(\d+)\s*(?:person|people|passenger|pax|traveler|traveller)/);
  if (paxMatch) out.passengers = parseInt(paxMatch[1] ?? paxMatch[2], 10);

  // end date
  if (out.startDate && out.days) {
    out.endDate = format(addDays(out.startDate, out.days), "yyyy-MM-dd");
  }

  return out;
}

function buildRules(q: string): ConciergeRecommendation {
  const parsed = parseQuery(q);
  const destination = RWANDA_DESTINATIONS.find((d) => d.name === parsed.destinationName) ??
    RWANDA_DESTINATIONS.find((d) => d.name === "Kigali City")!;

  const days = parsed.days ?? 3;
  const startDate = parsed.startDate ?? format(new Date(), "yyyy-MM-dd");
  const endDate = parsed.endDate ?? format(addDays(startDate, days), "yyyy-MM-dd");
  const passengers = parsed.passengers ?? 2;
  const carType = parsed.type ?? destination.recommendedCarType;

  const itinerary = destination.itinerary.slice(0, days);
  while (itinerary.length < days) {
    itinerary.push(`Free day to explore ${destination.name}`);
  }

  return {
    carType,
    location: DESTINATION_LOCATION[destination.name],
    startDate,
    endDate,
    days,
    passengers,
    itinerary,
    fuelEstimate: destination.fuelEstimate,
    roadConditions: destination.roadConditions,
    lodging: destination.lodging,
    routes: destination.routes,
  };
}

async function planWithLlm(query: string): Promise<{ message: string; recommendation: ConciergeRecommendation } | null> {
  const today = format(new Date(), "yyyy-MM-dd");
  const prompt = `You are LORA's AI trip concierge for Rwanda. Given the customer request, plan a trip and return ONLY strict JSON with no markdown.
Schema:
{
  "message": "short friendly summary in the same language as the customer",
  "recommendation": {
    "carType": "sedan|suv|pickup|luxury|minivan|4x4",
    "location": "one of: Kigali — Gasabo, Kigali — Kicukiro, Kigali — Nyarugenge, Kigali International Airport, Musanze, Rubavu, Huye, Nyagatare, Rusizi, Muhanga, Rwamagana, Karongi",
    "startDate": "YYYY-MM-DD",
    "endDate": "YYYY-MM-DD",
    "days": number,
    "passengers": number,
    "itinerary": ["day 1 activity", "day 2 activity", ...],
    "fuelEstimate": "RWF range round trip from Kigali",
    "roadConditions": "short note",
    "lodging": ["3 lodging suggestions"],
    "routes": ["route 1", "route 2"]
  }
}
Today is ${today}.
Customer request: "${query}"`;

  try {
    const text = await callLlm(prompt);
    if (!text) return null;
    const json = JSON.parse(text.replace(/```json|```/g, "").trim());
    const rec = json.recommendation as Partial<ConciergeRecommendation>;
    if (!rec?.carType || !rec?.location) return null;
    const recommendation = {
      carType: rec.carType,
      location: rec.location,
      startDate: rec.startDate,
      endDate: rec.endDate,
      days: rec.days,
      passengers: rec.passengers,
      itinerary: rec.itinerary ?? [],
      fuelEstimate: rec.fuelEstimate ?? "Contact LORA for a fuel estimate.",
      roadConditions: rec.roadConditions ?? "Roads are generally good; a 4x4 is recommended for parks.",
      lodging: rec.lodging ?? [],
      routes: rec.routes ?? [],
    } as ConciergeRecommendation;
    return { message: json.message ?? "Here's your trip plan.", recommendation };
  } catch {
    return null;
  }
}

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => ({}))) as { messages?: ConciergeMessage[]; userId?: string };
    const messages = body.messages ?? [];
    const lastUser = messages.filter((m) => m.role === "user").pop();
    if (!lastUser?.content?.trim()) {
      return NextResponse.json({ error: "A message is required" }, { status: 400 });
    }

    const llm = await planWithLlm(lastUser.content);
    const source = llm ? "llm" : "rules";
    const rec = llm?.recommendation ?? buildRules(lastUser.content);
    const message =
      llm?.message ?? `Here's a ${rec.days}-day ${rec.location} plan for ${rec.passengers} people in a ${rec.carType}.`;

    const sb = getSupabaseAdmin();
    let vehicles: Vehicle[] = [];
    if (sb) {
      let q = sb.from("vehicles").select("*").eq("status", "available");
      if (rec.carType) q = q.eq("type", rec.carType);
      if (rec.location) q = q.eq("location", rec.location);
      if (rec.passengers) q = q.gte("seats", rec.passengers);
      const { data } = await q.order("rating", { ascending: false }).limit(3);
      vehicles = (data ?? []).map(vehicleFromRow);
    } else {
      vehicles = VEHICLES.filter((v) => v.status === "available")
        .filter((v) => !rec.carType || v.type === rec.carType)
        .filter((v) => !rec.location || v.location === rec.location)
        .filter((v) => !rec.passengers || v.seats >= rec.passengers)
        .sort((a, b) => b.rating - a.rating)
        .slice(0, 3);
    }

    return NextResponse.json({
      message,
      recommendation: rec,
      vehicles,
      source,
    } satisfies ConciergeResponse);
  } catch (err) {
    console.error("[concierge] error:", err);
    return NextResponse.json({ error: "Could not plan the trip" }, { status: 500 });
  }
}
