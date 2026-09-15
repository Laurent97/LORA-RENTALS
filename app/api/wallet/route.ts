import { NextResponse } from "next/server";
import { getSupabaseAdmin, getCallerProfile } from "@/lib/supabase/admin";
import type { Wallet, WalletTransaction } from "@/types";

export const dynamic = "force-dynamic";

const TX_TYPES = ["topup", "refund", "referral", "promo", "payment", "payout"];

function walletFromRow(row: Record<string, unknown>): Wallet {
  return {
    userId: String(row.user_id ?? ""),
    balance: Number(row.balance ?? 0),
    updatedAt: String(row.updated_at ?? new Date().toISOString()),
  };
}

function txFromRow(row: Record<string, unknown>): WalletTransaction {
  return {
    id: String(row.id ?? ""),
    userId: String(row.user_id ?? ""),
    amount: Number(row.amount ?? 0),
    type: String(row.type ?? "topup") as WalletTransaction["type"],
    bookingId: row.booking_id ? String(row.booking_id) : undefined,
    status: String(row.status ?? "pending") as WalletTransaction["status"],
    method: row.method ? String(row.method) : undefined,
    notes: row.notes ? String(row.notes) : undefined,
    createdAt: String(row.created_at ?? new Date().toISOString()),
  };
}

export async function GET(req: Request) {
  const sb = getSupabaseAdmin();
  if (!sb) return NextResponse.json({ error: "not configured" }, { status: 500 });

  const caller = await getCallerProfile(req.headers.get("authorization"));
  if (!caller) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { data: existing } = await sb.from("wallets").select("*").eq("user_id", caller.id).single();
  if (!existing) {
    await sb.from("wallets").insert({ user_id: caller.id, balance: 0 });
  }

  const userId = caller.role === "admin" && new URL(req.url).searchParams.get("userId")
    ? new URL(req.url).searchParams.get("userId")!
    : caller.id;

  const [{ data: walletRow }, { data: txRows }] = await Promise.all([
    sb.from("wallets").select("*").eq("user_id", userId).single(),
    sb.from("wallet_transactions").select("*").eq("user_id", userId).order("created_at", { ascending: false }).limit(50),
  ]);

  return NextResponse.json({
    wallet: walletRow ? walletFromRow(walletRow) : ({ userId, balance: 0, updatedAt: new Date().toISOString() } satisfies Wallet),
    transactions: (txRows ?? []).map(txFromRow),
  });
}

export async function POST(req: Request) {
  const sb = getSupabaseAdmin();
  if (!sb) return NextResponse.json({ error: "not configured" }, { status: 500 });

  const caller = await getCallerProfile(req.headers.get("authorization"));
  if (!caller) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = (await req.json().catch(() => ({}))) as Partial<WalletTransaction>;
  const { type, amount, method, notes } = body;
  if (!type || !TX_TYPES.includes(type) || typeof amount !== "number" || amount === 0) {
    return NextResponse.json({ error: "invalid transaction" }, { status: 400 });
  }

  const insert: Record<string, unknown> = {
    user_id: caller.id,
    amount,
    type,
    status: "pending",
    method: method ?? null,
    notes: notes ?? null,
  };
  if (body.bookingId) insert.booking_id = body.bookingId;

  const { data, error } = await sb.from("wallet_transactions").insert(insert).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(txFromRow(data ?? {}), { status: 201 });
}

export async function PUT(req: Request) {
  const sb = getSupabaseAdmin();
  if (!sb) return NextResponse.json({ error: "not configured" }, { status: 500 });

  const caller = await getCallerProfile(req.headers.get("authorization"));
  if (!caller) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (caller.role !== "admin") return NextResponse.json({ error: "admin only" }, { status: 403 });

  const body = (await req.json().catch(() => ({}))) as { transactionId?: string; status?: WalletTransaction["status"] };
  if (!body.transactionId || !body.status) {
    return NextResponse.json({ error: "transactionId and status required" }, { status: 400 });
  }

  const { data, error } = await sb
    .from("wallet_transactions")
    .update({ status: body.status, updated_at: new Date().toISOString() })
    .eq("id", body.transactionId)
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(txFromRow(data ?? {}));
}
