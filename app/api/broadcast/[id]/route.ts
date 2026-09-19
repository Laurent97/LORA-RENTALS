import { NextResponse } from "next/server";
import { getSupabaseAdmin, getCallerProfile } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const sb = getSupabaseAdmin();
  if (!sb) return NextResponse.json({ error: "not configured" }, { status: 500 });
  const caller = await getCallerProfile(req.headers.get("authorization"));
  if (!caller || caller.role !== "admin") return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { data: broadcast, error } = await sb.from("broadcasts").select("*").eq("id", params.id).maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!broadcast) return NextResponse.json({ error: "not found" }, { status: 404 });

  const { data: recipients } = await sb
    .from("broadcast_recipients")
    .select("id, in_app_status, email_status, push_status")
    .eq("broadcast_id", params.id);

  const counts = (recipients ?? []).reduce(
    (acc, r: any) => {
      if (r.in_app_status === "delivered") acc.inApp++;
      if (r.email_status === "sent" || r.email_status === "delivered" || r.email_status === "opened") acc.email++;
      if (r.push_status === "delivered" || r.push_status === "sent") acc.push++;
      return acc;
    },
    { inApp: 0, email: 0, push: 0 }
  );

  return NextResponse.json({ broadcast, recipients: recipients ?? [], counts });
}
