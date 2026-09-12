"use client";

import { useEffect } from "react";
import { USD_RATE } from "./constants";

// Module-level live rate — formatMoney reads this so no call sites change.
let liveRate = USD_RATE;
export const getUsdRate = () => liveRate;

const CACHE_KEY = "lora-fx";
const TTL_MS = 60 * 60 * 1000; // 1 hour

interface Cached { rate: number; at: number }

function readCache(): number | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const c: Cached = JSON.parse(raw);
    if (Date.now() - c.at > TTL_MS) return null;
    return c.rate;
  } catch {
    return null;
  }
}

async function fetchRate(): Promise<number | null> {
  try {
    const res = await fetch("https://open.er-api.com/v6/latest/USD", { next: { revalidate: 3600 } });
    if (!res.ok) return null;
    const data = await res.json();
    const rate = data?.rates?.RWF;
    return typeof rate === "number" && rate > 0 ? rate : null;
  } catch {
    return null;
  }
}

// Call once near the root — hydrates the module-level rate from cache or API.
export function useExchangeRate() {
  useEffect(() => {
    const cached = readCache();
    if (cached) {
      liveRate = cached;
      return;
    }
    fetchRate().then((rate) => {
      if (rate) {
        liveRate = rate;
        try {
          localStorage.setItem(CACHE_KEY, JSON.stringify({ rate, at: Date.now() } satisfies Cached));
        } catch { /* storage full — ignore */ }
      }
    });
  }, []);
}
