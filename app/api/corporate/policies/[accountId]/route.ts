import { NextResponse } from "next/server";
import { getSupabaseAdmin, getCallerProfile } from "@/lib/supabase/admin";
import type { CorporatePolicies } from "@/types";

function fromRow(row: Record<string, unknown>): CorporatePolicies {
  return {
    accountId: String(row.account_id ?? ""),
    maxDailyRate: row.max_daily_rate ? Number(row.max_daily_rate) : undefined,
    requireApproval: Boolean(row.require_approval ?? false),
    approverEmails: (row.approver_emails as string[]) ?? [],
    costCenters: (row.cost_centers as string[]) ?? [],
    bulkBookingEnabled: Boolean(row.bulk_booking_enabled ?? false),
    updatedAt: String(row.updated_at ?? new Date().toISOString()),
  };
}

export async function GET(req: Request, { params }: { params: { accountId: string } }) {
  const sb = getSupabaseAdmin();
  if (!sb) return NextResponse.json({ error: "not configured" }, { status: 500 });

  const caller = await getCallerProfile(req.headers.get("authorization"));
  if (!caller) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { data } = await sb.from("corporate_policies").select("*").eq("account_id", params.accountId).single();
  if (!data) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json(fromRow(data));
}

export async function PUT(req: Request, { params }: { params: { accountId: string } }) {
  const sb = getSupabaseAdmin();
  if (!sb) return NextResponse.json({ error: "not configured" }, { status: 500 });

  const caller = await getCallerProfile(req.headers.get("authorization"));
  if (!caller) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (caller.role !== "admin") return NextResponse.json({ error: "admin only" }, { status: 403 });

  const body = (await req.json().catch(() => ({}))) as Partial<CorporatePolicies>;
  const upsert = {
    account_id: params.accountId,
    max_daily_rate: body.maxDailyRate ?? null,
    require_approval: body.requireApproval ?? false,
    approver_emails: body.approverEmails ?? [],
    cost_centers: body.costCenters ?? [],
    bulk_booking_enabled: body.bulkBookingEnabled ?? false,
    updated_at: new Date().toISOString(),
  };
  const { data, error } = await sb.from("corporate_policies").upsert(upsert, { onConflict: "account_id" }).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(fromRow(data ?? {}));
}
