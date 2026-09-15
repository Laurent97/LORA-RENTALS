import { NextResponse } from "next/server";
import { getSupabaseAdmin, getCallerProfile } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

const BUCKET = "lorarentals";

async function uploadFile(sb: any, userId: string, file: File): Promise<string | null> {
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "bin";
  const path = `${userId}/${crypto.randomUUID()}.${ext}`;
  const { error } = await sb.storage.from(BUCKET).upload(path, Buffer.from(await file.arrayBuffer()), { contentType: file.type, upsert: false });
  if (error) return null;
  const { data } = sb.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

export async function POST(req: Request) {
  const sb = getSupabaseAdmin();
  if (!sb) return NextResponse.json({ error: "not configured" }, { status: 500 });
  const caller = await getCallerProfile(req.headers.get("authorization"));
  if (!caller) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const form = await req.formData().catch(() => null);
  if (!form) return NextResponse.json({ error: "invalid form" }, { status: 400 });

  const selfie = form.get("selfie") as File | null;
  const video = form.get("video") as File | null;
  const front = form.get("documentFront") as File | null;
  const back = form.get("documentBack") as File | null;

  const [selfieUrl, recordingUrl, frontUrl, backUrl] = await Promise.all([
    selfie ? uploadFile(sb, caller.id, selfie) : Promise.resolve(null),
    video ? uploadFile(sb, caller.id, video) : Promise.resolve(null),
    front ? uploadFile(sb, caller.id, front) : Promise.resolve(null),
    back ? uploadFile(sb, caller.id, back) : Promise.resolve(null),
  ]);

  if (video && !recordingUrl) return NextResponse.json({ error: "could not upload video" }, { status: 500 });
  if (selfie && !selfieUrl) return NextResponse.json({ error: "could not upload selfie" }, { status: 500 });

  const { data: existing } = await sb.from("video_kyc_sessions").select("id").eq("user_id", caller.id).neq("status", "approved").single();

  const insert = {
    user_id: caller.id,
    status: "submitted",
    recording_url: recordingUrl,
    selfie_url: selfieUrl,
    document_front_url: frontUrl,
    document_back_url: backUrl,
    submitted_at: new Date().toISOString(),
  };

  if (existing?.id) {
    const { error } = await sb.from("video_kyc_sessions").update(insert).eq("id", existing.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  } else {
    const { error } = await sb.from("video_kyc_sessions").insert(insert);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
