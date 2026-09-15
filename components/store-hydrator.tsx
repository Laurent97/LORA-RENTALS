"use client";

import { useEffect } from "react";
import { useApp } from "@/lib/store";
import { getSupabase } from "@/lib/supabase/client";
import { useExchangeRate } from "@/lib/rates";

// Fetches users/vehicles/bookings/reviews from Supabase once on mount and
// hydrates the zustand store. Falls back to bundled mock data when offline
// or when env vars are missing.
export function StoreHydrator() {
  const hydrate = useApp((s) => s.hydrate);
  const syncAuthSession = useApp((s) => s.syncAuthSession);
  useExchangeRate(); // warm the FX rate cache on app start
  useEffect(() => {
    void hydrate();
    void syncAuthSession();
    const sb = getSupabase();
    if (!sb || !sb.auth) return;
    const { data } = sb.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT") {
        useApp.setState({ user: null, authReady: true });
        return;
      }
      if (session?.user && ["INITIAL_SESSION", "SIGNED_IN", "TOKEN_REFRESHED", "USER_UPDATED"].includes(event)) {
        void useApp.getState()._loadOrCreateProfile(session.user.id, session.user.email ?? "");
        useApp.setState({ authReady: true });
      }
    });
    return () => data.subscription.unsubscribe();
  }, [hydrate, syncAuthSession]);
  return null;
}
