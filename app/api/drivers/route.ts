import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export async function GET() {
  try {
    const sb = getSupabaseAdmin();
    if (!sb) return NextResponse.json({ error: "not configured" }, { status: 500 });

    const { data, error } = await sb
      .from("drivers")
      .select("*, owner:users!owner_id(name, email, phone)")
      .order("created_at", { ascending: false });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const drivers = (data ?? []).map((d: any) => ({
      id: String(d.id ?? ""),
      ownerId: String(d.owner_id ?? ""),
      userId: String(d.user_id ?? ""),
      fullName: String(d.full_name ?? d.owner?.name ?? "Chauffeur"),
      photoUrl: d.photo_url ? String(d.photo_url) : null,
      phone: d.phone ? String(d.phone) : null,
      email: d.email ? String(d.email) : null,
      bio: d.bio ? String(d.bio) : null,
      languages: (d.languages as string[]) ?? [],
      yearsOfExperience: Number(d.years_of_experience ?? 0),
      licenseNumber: d.license_number ? String(d.license_number) : null,
      licenseVerified: Boolean(d.license_verified ?? false),
      isAvailable: Boolean(d.is_available ?? true),
      specialties: (d.specialties as string[]) ?? [],
      rating: Number(d.rating ?? 0),
      reviewCount: Number(d.review_count ?? 0),
      ownerName: d.owner?.name ?? null,
      ownerPhone: d.owner?.phone ?? null,
      ownerEmail: d.owner?.email ?? null,
    }));

    return NextResponse.json(drivers);
  } catch (err) {
    console.error("[drivers] error:", err);
    return NextResponse.json({ error: "Could not load drivers" }, { status: 500 });
  }
}
