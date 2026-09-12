"use client";

import { getSupabase } from "@/lib/supabase/client";
import type {
  AdminDeleteInput,
  AdminModerateInput,
  CreateReviewInput,
  FlagInput,
  ReplyInput,
  UpdateReviewInput,
} from "./validators";

// ─── Client-side review API ──────────────────────────────────────────────────
// Thin fetch wrapper: attaches the Supabase session token and returns a
// discriminated result. Never throws — callers toast on !ok.

export type ApiResult<T = unknown> = { ok: true; data: T } | { ok: false; error: string };

async function call<T>(path: string, body: unknown): Promise<ApiResult<T>> {
  try {
    const sb = getSupabase();
    const token = sb ? (await sb.auth.getSession()).data.session?.access_token : undefined;
    const res = await fetch(`/api/reviews/${path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(body),
    });
    const json = (await res.json().catch(() => ({}))) as { error?: string } & T;
    if (!res.ok) return { ok: false, error: json.error ?? `Request failed (${res.status})` };
    return { ok: true, data: json };
  } catch {
    return { ok: false, error: "Network error — check your connection and try again." };
  }
}

export const reviewApi = {
  create: (input: CreateReviewInput) => call<{ review: unknown }>("create", input),
  update: (input: UpdateReviewInput) => call<{ review: unknown }>("update", input),
  reply: (input: ReplyInput) => call<{ reply: unknown }>("reply", input),
  editReply: (input: ReplyInput) => call<{ reply: unknown }>("reply", { ...input, edit: true }),
  flag: (input: FlagInput) => call<{ flagged: boolean }>("flag", input),
  helpful: (reviewId: string) => call<{ helpfulCount: number; voted: boolean }>("helpful", { reviewId }),
  adminDelete: (input: AdminDeleteInput) => call<{ deleted: boolean }>("admin-delete", input),
  adminModerate: (input: AdminModerateInput) => call<{ status: string }>("admin-hide", input),
};

// ─── Cloudinary photo upload ─────────────────────────────────────────────────
// Unsigned upload preset flow. Configure NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME and
// NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET; without them the caller should skip
// upload (PhotoUploader hides itself).

export const cloudinaryReady = () =>
  !!process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME && !!process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

export async function uploadReviewPhoto(file: File, onProgress?: (pct: number) => void): Promise<string> {
  const cloud = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const preset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;
  if (!cloud || !preset) throw new Error("Cloudinary is not configured");

  const form = new FormData();
  form.append("file", file);
  form.append("upload_preset", preset);
  form.append("folder", "lora/reviews");

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", `https://api.cloudinary.com/v1_1/${cloud}/image/upload`);
    xhr.upload.onprogress = (e) => e.lengthComputable && onProgress?.(Math.round((e.loaded / e.total) * 100));
    xhr.onload = () => {
      try {
        const json = JSON.parse(xhr.responseText);
        if (xhr.status >= 200 && xhr.status < 300 && json.secure_url) resolve(json.secure_url as string);
        else reject(new Error(json.error?.message ?? "Upload failed"));
      } catch {
        reject(new Error("Upload failed"));
      }
    };
    xhr.onerror = () => reject(new Error("Upload failed"));
    xhr.send(form);
  });
}
