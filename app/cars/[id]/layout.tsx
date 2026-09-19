import type { Metadata } from "next";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { vehicleFromRow } from "@/lib/supabase/mappers";
import { BRAND } from "@/lib/constants";

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const sb = getSupabaseAdmin();
  const origin = BRAND.siteUrl ?? "https://lorarentals.org";
  const fallback = {
    title: `Car Listing — ${BRAND.name}`,
    description: "Book verified cars in Rwanda — zero booking fees, pay at pickup.",
  };

  if (!sb) return fallback;

  const { data: row } = await sb.from("vehicles").select("*").eq("id", params.id).maybeSingle();
  if (!row) return fallback;

  const car = vehicleFromRow(row);
  const title = `${car.make} ${car.model} ${car.year} — ${car.pricePerDay.toLocaleString("en-US")} RWF/day`;
  const description = `${car.location} · ${car.features.slice(0, 3).join(" · ")}. Book on LORA — zero booking fees, pay at pickup.`;
  const ogImage = `${origin}/api/og/car/${params.id}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `${origin}/cars/${params.id}`,
      siteName: BRAND.name,
      images: [{ url: ogImage, width: 1200, height: 630, alt: title }],
      locale: "en_RW",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage],
    },
    other: {
      "og:image:width": "1200",
      "og:image:height": "630",
      "og:image:type": "image/png",
    },
  };
}

export default function CarLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
