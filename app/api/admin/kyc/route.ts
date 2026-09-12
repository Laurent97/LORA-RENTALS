import { NextResponse } from "next/server";
import { z } from "zod";
import { getCallerProfile, getSupabaseAdmin } from "@/lib/supabase/admin";
import { dispatchEmailEvent } from "@/lib/postmark/triggers";

const schema = z.object({
  action: z.enum(["document_approve", "document_reject", "owner_approve", "owner_reject", "request_resubmission"]),
  documentId: z.string().uuid().optional(),
  userId: z.string().uuid().optional(),
  note: z.string().max(500).optional(),
});

export async function POST(request: Request) {
  const sb = getSupabaseAdmin();
  const caller = await getCallerProfile(request.headers.get("authorization"));
  if (!sb || !caller) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (caller.role !== "admin") return NextResponse.json({ error: "Only admins can review KYC." }, { status: 403 });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid KYC action." }, { status: 400 });
  const input = parsed.data;
  const now = new Date().toISOString();

  if (input.action.startsWith("document_")) {
    if (!input.documentId) return NextResponse.json({ error: "Document id is required." }, { status: 400 });
    const status = input.action === "document_approve" ? "verified" : "rejected";
    const { data: document } = await sb.from("kyc_documents").select("id, user_id").eq("id", input.documentId).single();
    if (!document) return NextResponse.json({ error: "Document not found." }, { status: 404 });
    const { error } = await sb.from("kyc_documents").update({ status, reviewed_by: caller.id, reviewed_at: now, review_note: input.note ?? null }).eq("id", input.documentId);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, status, documentId: input.documentId, userId: document.user_id });
  }

  if (!input.userId) return NextResponse.json({ error: "User id is required." }, { status: 400 });
  if (input.action === "owner_approve") {
    const { count } = await sb.from("kyc_documents").select("id", { count: "exact", head: true }).eq("user_id", input.userId).eq("status", "pending");
    if ((count ?? 0) > 0) return NextResponse.json({ error: "Review all pending documents before approving the owner." }, { status: 409 });
  }
  const status = input.action === "owner_approve" ? "verified" : input.action === "owner_reject" ? "rejected" : "pending";
  const { error } = await sb.from("users").update({ kyc_status: status }).eq("id", input.userId).eq("role", "owner");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (status === "verified" || status === "rejected") {
    await dispatchEmailEvent({ event: status === "verified" ? "user.kyc_approved" : "user.kyc_rejected", id: input.userId, actor: caller, meta: { reason: input.note ?? "KYC review" } });
  }
  return NextResponse.json({ ok: true, status, userId: input.userId });
}