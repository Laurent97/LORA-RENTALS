"use client";

import { useApp } from "@/lib/store";

// ─── Store-backed lookup hooks ────────────────────────────────────────────────
// Components should select the raw array (stable reference) and .find/.filter
// locally — never return a fresh array from a zustand selector.

export const useVehicles = () => useApp((s) => s.vehicles);
export const useAllUsers = () => useApp((s) => s.users);
export const useReviews = () => useApp((s) => s.reviews);
export const useHydrated = () => useApp((s) => s.hydrated);
