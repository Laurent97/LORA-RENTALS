import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { ShareButton } from "@/components/share/ShareButton";
import { BRAND } from "@/lib/constants";
import { formatMoney } from "@/lib/utils";

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const sb = getSupabaseAdmin();
  const origin = BRAND.siteUrl ?? "https://lorarentals.org";
  if (!sb) return { title: `Chauffeur — ${BRAND.name}` };

  const { data: d } = await sb.from("drivers").select("*").eq("id", params.id).maybeSingle();
  if (!d) return { title: `Chauffeur — ${BRAND.name}` };

  const title = `${d.full_name} — LORA Chauffeur`;
  const description = `${d.home_city ?? "Kigali"} · ${d.years_of_experience ?? 0} years experience · Book on LORA.`;
  const ogImage = `${origin}/api/og/driver/${params.id}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `${origin}/drivers/${params.id}`,
      siteName: BRAND.name,
      images: [{ url: ogImage, width: 1200, height: 630, alt: title }],
      locale: "en_RW",
      type: "website",
    },
    twitter: { card: "summary_large_image", title, description, images: [ogImage] },
    other: { "og:image:width": "1200", "og:image:height": "630", "og:image:type": "image/png" },
  };
}

export default async function DriverPage({ params }: { params: { id: string } }) {
  const sb = getSupabaseAdmin();
  if (!sb) return notFound();

  const { data: d } = await sb.from("drivers").select("*, owner:users!owner_id(name, email, phone)").eq("id", params.id).maybeSingle();
  if (!d) return notFound();

  const fullName = String(d.full_name ?? "LORA Chauffeur");
  const city = String(d.home_city ?? "Kigali");
  const dailyRate = d.daily_rate_rwf ? Number(d.daily_rate_rwf) : 0;
  const languages = ((d.languages as string[]) ?? []).join(" · ") || "Multilingual";
  const specialties = ((d.specialties as string[]) ?? []).join(" · ");
  const description = `${city} · ${d.years_of_experience ?? 0} years experience · ${languages}`;

  return (
    <main className="container py-8">
      <div className="mx-auto max-w-2xl">
        <div className="relative overflow-hidden rounded-3xl bg-navy-800 text-white shadow-2xl">
          <div className="relative h-80 w-full bg-navy-950">
            {d.photo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={d.photo_url} alt={fullName} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-6xl font-bold text-gold">
                {fullName.slice(0, 2).toUpperCase()}
              </div>
            )}
          </div>

          <div className="space-y-4 p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="font-display text-3xl font-extrabold text-gold">{fullName}</h1>
                <p className="text-silver">{description}</p>
              </div>
              <ShareButton
                listing={{
                  id: params.id,
                  type: "driver",
                  url: `/drivers/${params.id}`,
                  title: fullName,
                  description,
                  image: d.photo_url ?? "",
                  price: dailyRate > 0 ? `${formatMoney(dailyRate, "RWF")}/day` : undefined,
                }}
              />
            </div>

            <div className="grid gap-4 rounded-2xl border border-gold/20 bg-navy-900/50 p-4 sm:grid-cols-2">
              {d.daily_rate_rwf && (
                <div>
                  <p className="text-xs uppercase tracking-wider text-silver">Daily rate</p>
                  <p className="text-2xl font-bold text-gold">{formatMoney(Number(d.daily_rate_rwf), "RWF")}</p>
                </div>
              )}
              {d.hourly_rate_rwf && (
                <div>
                  <p className="text-xs uppercase tracking-wider text-silver">Hourly rate</p>
                  <p className="text-lg font-bold">{formatMoney(Number(d.hourly_rate_rwf), "RWF")}</p>
                </div>
              )}
              <div>
                <p className="text-xs uppercase tracking-wider text-silver">License</p>
                <p className="font-medium">{d.license_number ?? "—"}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wider text-silver">Experience</p>
                <p className="font-medium">{d.years_of_experience ?? 0} years</p>
              </div>
            </div>

            {d.bio && <p className="leading-relaxed text-silver">{d.bio}</p>}
            {specialties && (
              <div>
                <p className="text-xs uppercase tracking-wider text-silver">Specialties</p>
                <p className="font-medium">{specialties}</p>
              </div>
            )}

            <div className="flex flex-wrap gap-3 pt-2">
              {d.phone && (
                <a href={`tel:${d.phone}`} className="rounded-xl bg-gold px-5 py-2.5 font-semibold text-navy-900">
                  Call {d.phone}
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
