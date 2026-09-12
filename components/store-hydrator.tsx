"use client";

import { useEffect } from "react";
import { useApp } from "@/lib/store";
import { useExchangeRate } from "@/lib/rates";

// Fetches users/vehicles/bookings/reviews from Supabase once on mount and
// hydrates the zustand store. Falls back to bundled mock data when offline
// or when env vars are missing.
export function StoreHydrator() {
  const hydrate = useApp((s) => s.hydrate);
  useExchangeRate(); // warm the FX rate cache on app start
  useEffect(() => {
    void hydrate();
  }, [hydrate]);
  return null;
}
