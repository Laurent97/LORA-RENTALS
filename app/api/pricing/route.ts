import { NextResponse } from "next/server";
import { differenceInDays, eachDayOfInterval, format, getDay, parseISO } from "date-fns";
import { getSupabaseAdmin, getCallerProfile } from "@/lib/supabase/admin";
import type { PricingEstimate, PricingRules } from "@/types";

function isWeekend(d: Date) {
  const day = getDay(d);
  return day === 0 || day === 6;
}

const defaultRules: PricingRules = {
  vehicleId: "",
  weekendSurchargePct: 15,
  longRental7DiscountPct: 10,
  longRental30DiscountPct: 20,
  lastMinuteDiscountPct: 5,
  earlyBirdDiscountPct: 5,
  earlyBirdDays: 30,
  highDemandBumpPct: 15,
  highDemandDates: [],
  enabled: false,
  updatedAt: new Date().toISOString(),
};

function fromRow(row: Record<string, unknown> | null): PricingRules {
  if (!row) return defaultRules;
  return {
    vehicleId: String(row.vehicle_id ?? ""),
    weekendSurchargePct: Number(row.weekend_surcharge_pct ?? 15),
    longRental7DiscountPct: Number(row.long_rental_7_discount_pct ?? 10),
    longRental30DiscountPct: Number(row.long_rental_30_discount_pct ?? 20),
    lastMinuteDiscountPct: Number(row.last_minute_discount_pct ?? 5),
    earlyBirdDiscountPct: Number(row.early_bird_discount_pct ?? 5),
    earlyBirdDays: Number(row.early_bird_days ?? 30),
    highDemandBumpPct: Number(row.high_demand_bump_pct ?? 15),
    highDemandDates: (row.high_demand_dates as string[]) ?? [],
    enabled: Boolean(row.enabled ?? false),
    updatedAt: String(row.updated_at ?? new Date().toISOString()),
  };
}

function toRow(rules: Partial<PricingRules>, vehicleId: string): Record<string, unknown> {
  return {
    vehicle_id: vehicleId,
    weekend_surcharge_pct: rules.weekendSurchargePct ?? 15,
    long_rental_7_discount_pct: rules.longRental7DiscountPct ?? 10,
    long_rental_30_discount_pct: rules.longRental30DiscountPct ?? 20,
    last_minute_discount_pct: rules.lastMinuteDiscountPct ?? 5,
    early_bird_discount_pct: rules.earlyBirdDiscountPct ?? 5,
    early_bird_days: rules.earlyBirdDays ?? 30,
    high_demand_bump_pct: rules.highDemandBumpPct ?? 15,
    high_demand_dates: rules.highDemandDates ?? [],
    enabled: rules.enabled ?? false,
    updated_at: new Date().toISOString(),
  };
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const vehicleId = url.searchParams.get("vehicleId");
  if (!vehicleId) return NextResponse.json({ error: "vehicleId required" }, { status: 400 });
  const sb = getSupabaseAdmin();
  if (!sb) return NextResponse.json({ error: "not configured" }, { status: 500 });

  const { data } = await sb.from("vehicle_pricing_rules").select("*").eq("vehicle_id", vehicleId).single();
  return NextResponse.json(fromRow(data ?? null));
}

export async function POST(req: Request) {
  try {
    const { vehicleId, startDate, endDate } = (await req.json().catch(() => ({}))) as {
      vehicleId?: string;
      startDate?: string;
      endDate?: string;
    };
    if (!vehicleId || !startDate || !endDate) {
      return NextResponse.json({ error: "vehicleId, startDate, endDate required" }, { status: 400 });
    }

    const sb = getSupabaseAdmin();
    if (!sb) return NextResponse.json({ error: "not configured" }, { status: 500 });

    const { data: vehicle } = await sb.from("vehicles").select("id, price_per_day, type, location, owner_id").eq("id", vehicleId).single();
    if (!vehicle) return NextResponse.json({ error: "vehicle not found" }, { status: 404 });

    const { data: rulesRow } = await sb.from("vehicle_pricing_rules").select("*").eq("vehicle_id", vehicleId).single();
    const rules = fromRow(rulesRow ?? null);

    const start = parseISO(startDate);
    const end = parseISO(endDate);
    if (start > end) return NextResponse.json({ error: "start must be before end" }, { status: 400 });

    const days = differenceInDays(end, start) + 1;
    const dayRate = Number(vehicle.price_per_day ?? 0);
    const allDays = eachDayOfInterval({ start, end });

    const adjustments: PricingEstimate["adjustments"] = [];
    let dayTotal = dayRate * days;

    if (rules.enabled) {
      let weekendExtra = 0;
      let highDemandExtra = 0;
      for (const d of allDays) {
        const dateKey = format(d, "yyyy-MM-dd");
        const isHigh = rules.highDemandDates.includes(dateKey);
        if (isWeekend(d)) weekendExtra += dayRate * (rules.weekendSurchargePct / 100);
        if (isHigh) highDemandExtra += dayRate * (rules.highDemandBumpPct / 100);
      }
      if (weekendExtra > 0) adjustments.push({ label: "Weekend surcharge", amount: Math.round(weekendExtra) });
      if (highDemandExtra > 0) adjustments.push({ label: "High demand", amount: Math.round(highDemandExtra) });
      dayTotal += weekendExtra + highDemandExtra;

      let discountPct = 0;
      if (days >= 30) discountPct = rules.longRental30DiscountPct;
      else if (days >= 7) discountPct = rules.longRental7DiscountPct;
      if (discountPct > 0) {
        const discount = Math.round(dayTotal * (discountPct / 100));
        adjustments.push({ label: "Long rental discount", amount: -discount });
        dayTotal -= discount;
      }

      const daysUntilStart = differenceInDays(start, new Date());
      if (daysUntilStart >= rules.earlyBirdDays && rules.earlyBirdDiscountPct > 0) {
        const discount = Math.round(dayRate * days * (rules.earlyBirdDiscountPct / 100));
        adjustments.push({ label: "Early bird discount", amount: -discount });
        dayTotal -= discount;
      } else if (daysUntilStart <= 1 && rules.lastMinuteDiscountPct > 0) {
        const discount = Math.round(dayRate * days * (rules.lastMinuteDiscountPct / 100));
        adjustments.push({ label: "Last minute discount", amount: -discount });
        dayTotal -= discount;
      }
    }

    let marketSuggestion: string | undefined;
    const { data: similar } = await sb
      .from("vehicles")
      .select("price_per_day")
      .eq("type", vehicle.type)
      .eq("location", vehicle.location)
      .eq("status", "available")
      .neq("id", vehicleId);
    if (similar && similar.length > 0) {
      const avg = similar.reduce((s, v) => s + Number(v.price_per_day ?? 0), 0) / similar.length;
      const diff = ((dayRate - avg) / avg) * 100;
      const above = diff > 0;
      marketSuggestion = `Similar ${vehicle.type}s in ${vehicle.location} average ${Math.round(avg).toLocaleString()} RWF/day. Yours is ${Math.abs(diff).toFixed(0)}% ${above ? "above" : "below"} market.`;
    }

    const out: PricingEstimate = {
      basePrice: Math.round(dayRate * days),
      days,
      dayRate,
      adjustments,
      total: Math.round(dayTotal),
      marketSuggestion,
    };
    return NextResponse.json(out);
  } catch (err) {
    console.error("[pricing] error:", err);
    return NextResponse.json({ error: "pricing failed" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const sb = getSupabaseAdmin();
    if (!sb) return NextResponse.json({ error: "not configured" }, { status: 500 });

    const caller = await getCallerProfile(req.headers.get("authorization"));
    if (!caller) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

    const body = (await req.json().catch(() => ({}))) as Partial<PricingRules> & { vehicleId: string };
    const { vehicleId, ...rest } = body;
    if (!vehicleId) return NextResponse.json({ error: "vehicleId required" }, { status: 400 });

    const { data: vehicle } = await sb.from("vehicles").select("owner_id").eq("id", vehicleId).single();
    if (!vehicle) return NextResponse.json({ error: "vehicle not found" }, { status: 404 });
    if (vehicle.owner_id !== caller.id && caller.role !== "admin") {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }

    const row = toRow(rest, vehicleId);
    const { data, error } = await sb.from("vehicle_pricing_rules").upsert(row, { onConflict: "vehicle_id" }).select().single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(fromRow(data ?? null));
  } catch (err) {
    console.error("[pricing] put error:", err);
    return NextResponse.json({ error: "update failed" }, { status: 500 });
  }
}
