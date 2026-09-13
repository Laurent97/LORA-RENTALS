"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { AlertTriangle, MapPin, Navigation, Shield } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { MapPlaceholder } from "@/components/map-placeholder";

type TrackPayload = {
  booking: {
    id: string;
    startDate: string;
    endDate: string;
    pickupLocation: string;
    returnLocation: string;
    driverName?: string;
    qrCode: string;
  };
  vehicle: { make: string; model: string; plate: string } | null;
  customerName: string | null;
  location: { lat: number; lng: number; recordedAt: string } | null;
  alert: { type: string; message: string; lat?: number; lng?: number; createdAt: string } | null;
};

export default function TrackPage() {
  const { token } = useParams<{ token: string }>();
  const [data, setData] = useState<TrackPayload | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshedAt, setRefreshedAt] = useState<Date | null>(null);

  const fetchData = async () => {
    try {
      const res = await fetch(`/api/track/${encodeURIComponent(token)}`);
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body.error ?? "Trip not found");
        setData(null);
      } else {
        const body = (await res.json()) as TrackPayload;
        setData(body);
        setError("");
        setRefreshedAt(new Date());
      }
    } catch {
      setError("Could not load tracking data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 15000);
    return () => clearInterval(interval);
  }, [token]);

  if (loading) {
    return (
      <main className="container py-16 text-center">
        <p className="text-muted-foreground">Loading trip…</p>
      </main>
    );
  }

  if (error || !data) {
    return (
      <main className="container max-w-md py-16 text-center">
        <AlertTriangle className="mx-auto h-10 w-10 text-destructive" />
        <h1 className="mt-4 font-display text-xl font-bold">Trip not found</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {error || "This tracking link is invalid or has expired."}
        </p>
      </main>
    );
  }

  const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
  const mapUrl =
    data.location && mapboxToken
      ? `https://api.mapbox.com/styles/v1/mapbox/streets-v12/static/${data.location.lng},${data.location.lat},14,0/600x400?access_token=${mapboxToken}`
      : null;

  return (
    <main className="container max-w-2xl py-10">
      <div className="mb-6 text-center">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-navy-800 text-gold">
          <Navigation className="h-7 w-7" />
        </span>
        <h1 className="mt-4 font-display text-2xl font-extrabold">Live trip</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {data.vehicle ? `${data.vehicle.make} ${data.vehicle.model} · ${data.vehicle.plate}` : "Shared trip"}
        </p>
      </div>

      {data.alert && (
        <div className="mb-4 rounded-xl border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
          <div className="flex items-center gap-2 font-semibold">
            <AlertTriangle className="h-4 w-4" /> {data.alert.type.replace("_", " ")}
          </div>
          <p className="mt-1">{data.alert.message}</p>
          <p className="mt-1 text-xs opacity-80">{new Date(data.alert.createdAt).toLocaleString()}</p>
        </div>
      )}

      <Card>
        <CardContent className="space-y-4 p-5">
          {data.location ? (
            <>
              <div className="overflow-hidden rounded-xl border border-border">
                {mapUrl ? (
                  <img
                    src={mapUrl}
                    alt="Trip location"
                    width={600}
                    height={400}
                    className="h-64 w-full object-cover"
                  />
                ) : (
                  <MapPlaceholder location={data.booking.pickupLocation} coordinates={{ lat: data.location.lat, lng: data.location.lng }} />
                )}
              </div>
              <a
                href={`https://maps.google.com/?q=${data.location.lat},${data.location.lng}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-sky-600 hover:underline"
              >
                <MapPin className="h-4 w-4" /> {data.location.lat.toFixed(5)}, {data.location.lng.toFixed(5)} — open in Google Maps
              </a>
              <p className="text-xs text-muted-foreground">
                Last update: {new Date(data.location.recordedAt).toLocaleString()}
                {refreshedAt ? ` · refreshed ${refreshedAt.toLocaleTimeString()}` : ""}
              </p>
            </>
          ) : (
            <div className="rounded-xl bg-secondary p-6 text-center">
              <p className="font-medium">Waiting for the first location update</p>
              <p className="mt-1 text-sm text-muted-foreground">
                The driver&apos;s device will share the location once the trip starts.
              </p>
            </div>
          )}

          <div className="grid gap-3 text-sm">
            <div className="flex justify-between border-b border-border pb-2">
              <span className="text-muted-foreground">Trip</span>
              <span className="font-medium">
                {new Date(data.booking.startDate).toLocaleDateString()} →{" "}
                {new Date(data.booking.endDate).toLocaleDateString()}
              </span>
            </div>
            <div className="flex justify-between border-b border-border pb-2">
              <span className="text-muted-foreground">Pickup</span>
              <span className="font-medium">{data.booking.pickupLocation}</span>
            </div>
            <div className="flex justify-between border-b border-border pb-2">
              <span className="text-muted-foreground">Drop-off</span>
              <span className="font-medium">{data.booking.returnLocation}</span>
            </div>
            {data.booking.driverName && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Driver</span>
                <span className="font-medium">{data.booking.driverName}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <p className="mt-6 text-center text-xs text-muted-foreground">
        <Shield className="inline h-3 w-3" /> Location is only shared while the trip is active.
      </p>
    </main>
  );
}
