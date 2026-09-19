import { ImageResponse } from "next/og";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export const runtime = "edge";

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const sb = getSupabaseAdmin();
  if (!sb) return new Response("Not configured", { status: 500 });

  const { data: row } = await sb.from("drivers").select("*").eq("id", params.id).maybeSingle();
  if (!row) return new Response("Not found", { status: 404 });

  const image = row.photo_url ?? "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=1200&q=80";
  const fullName = String(row.full_name ?? "LORA Chauffeur");
  const city = String(row.home_city ?? "Kigali");
  const dailyRate = row.daily_rate_rwf ? Number(row.daily_rate_rwf).toLocaleString("en-US") : null;
  const languages = (row.languages as string[])?.slice(0, 3).join(" · ") || "Multilingual";
  const years = Number(row.years_of_experience ?? 0);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background: "#0A1F44",
          padding: 60,
          color: "#fff",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: "50%",
              background: "#D4AF37",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 24,
              fontWeight: 900,
              color: "#0A1F44",
            }}
          >
            L
          </div>
          <div style={{ fontSize: 32, fontWeight: 800, color: "#D4AF37" }}>LORA RENTALS</div>
        </div>

        <img
          src={image}
          alt=""
          style={{
            width: 1080,
            height: 520,
            objectFit: "cover",
            borderRadius: 24,
            marginTop: 30,
          }}
        />

        <div style={{ display: "flex", flexDirection: "column", marginTop: 32 }}>
          <div style={{ fontSize: 56, fontWeight: 900 }}>{fullName}</div>
          <div style={{ fontSize: 30, color: "#C0C6CC", marginTop: 8 }}>
            {city} · {years} years experience · {languages}
          </div>

          {dailyRate && (
            <div
              style={{
                display: "flex",
                alignSelf: "flex-start",
                background: "#D4AF37",
                color: "#0A1F44",
                padding: "20px 40px",
                borderRadius: 16,
                marginTop: 24,
              }}
            >
              <div style={{ fontSize: 42, fontWeight: 900 }}>{dailyRate} RWF / day</div>
            </div>
          )}
        </div>

        <div style={{ marginTop: "auto", fontSize: 22, color: "#C0C6CC" }}>
          lorarentals.org/drivers/{params.id}
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
