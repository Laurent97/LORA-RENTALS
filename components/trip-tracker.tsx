"use client";

import { useEffect, useRef } from "react";
import { getSupabase } from "@/lib/supabase/client";
import { tripLocationToRow } from "@/lib/supabase/mappers";
import type { Booking } from "@/types";

const THROTTLE_MS = 30_000;

export function TripTracker({ booking }: { booking: Booking }) {
  const lastSent = useRef(0);

  useEffect(() => {
    const sb = getSupabase();
    if (!sb) return;
    if (!navigator.geolocation) return;

    const record = (lat: number, lng: number) => {
      const now = Date.now();
      if (now - lastSent.current < THROTTLE_MS) return;
      lastSent.current = now;
      sb.from("trip_locations")
        .insert(
          tripLocationToRow({
            id: crypto.randomUUID(),
            bookingId: booking.id,
            lat,
            lng,
            createdAt: new Date().toISOString(),
          })
        )
        .then(({ error }) => {
          if (error) console.warn("[TripTracker] insert failed:", error.message);
        });
    };

    const onSuccess = (pos: GeolocationPosition) => {
      record(pos.coords.latitude, pos.coords.longitude);
    };

    navigator.geolocation.getCurrentPosition(onSuccess, () => undefined, {
      enableHighAccuracy: true,
      timeout: 10000,
    });

    const watchId = navigator.geolocation.watchPosition(onSuccess, () => undefined, {
      enableHighAccuracy: false,
      maximumAge: 30000,
      timeout: 20000,
    });

    return () => navigator.geolocation.clearWatch(watchId);
  }, [booking.id]);

  return null;
}
