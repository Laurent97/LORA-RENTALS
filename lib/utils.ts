import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { differenceInCalendarDays, format, parseISO } from "date-fns";
import { getUsdRate } from "./rates";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ─── Currency ────────────────────────────────────────────────────────────────
export function formatRWF(amount: number): string {
  return `RWF ${new Intl.NumberFormat("en-RW", { maximumFractionDigits: 0 }).format(amount)}`;
}

export function formatUSD(amountRWF: number): string {
  return `$${new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(
    Math.round(amountRWF / getUsdRate())
  )}`;
}

export function formatMoney(amountRWF: number, currency: "RWF" | "USD"): string {
  return currency === "USD" ? formatUSD(amountRWF) : formatRWF(amountRWF);
}

// ─── Dates ───────────────────────────────────────────────────────────────────
export function rentalDays(start: string, end: string): number {
  const d = differenceInCalendarDays(parseISO(end), parseISO(start));
  return Math.max(d, 1);
}

export function fmtDate(iso: string): string {
  return format(parseISO(iso), "dd MMM yyyy");
}

export function fmtDateTime(iso: string): string {
  return format(parseISO(iso), "dd MMM yyyy, HH:mm");
}

// ─── Misc ────────────────────────────────────────────────────────────────────
export function initials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function qrUrl(data: string, size = 200): string {
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&margin=4&data=${encodeURIComponent(
    data
  )}&bgcolor=ffffff&color=0A1F44`;
}

export function whatsappLink(phone: string, message: string): string {
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}

export function bookingRef(id: string): string {
  return `LRA-${id.slice(0, 6).toUpperCase()}`;
}

export interface BookingQrPayload {
  token: string;
  ref: string;
  make: string;
  model: string;
  year: number | string;
  plate: string;
  start: string;
  end: string;
  pickup: string;
  total: number;
}

export function buildBookingQrPayload(p: BookingQrPayload): string {
  const clean = (v: string) => v.replace(/\|/g, " ").replace(/\s+/g, " ").trim();
  return [
    "LORA",
    "1",
    p.token,
    p.ref,
    clean(p.make),
    clean(p.model),
    String(p.year),
    clean(p.plate),
    p.start,
    p.end,
    clean(p.pickup),
    String(p.total),
  ].join("|");
}

export function parseBookingQrPayload(raw: string): Partial<BookingQrPayload> | null {
  if (!raw.startsWith("LORA|")) return null;
  const [, , token, ref, make, model, year, plate, start, end, pickup, total] = raw.split("|");
  if (!token) return null;
  return {
    token,
    ref,
    make,
    model,
    year,
    plate,
    start,
    end,
    pickup,
    total: total ? Number(total) : 0,
  };
}

const QR_BASE = "https://lorarentals.org/pickup";

function b64Encode(s: string) {
  if (typeof Buffer !== "undefined") return Buffer.from(s).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function b64Decode(s: string) {
  try {
    const normal = s.replace(/-/g, "+").replace(/_/g, "/");
    if (typeof Buffer !== "undefined") return Buffer.from(normal, "base64").toString("utf8");
    return atob(normal);
  } catch {
    return null;
  }
}

export function buildBookingPickupUrl(payload: string) {
  return `${QR_BASE}/${b64Encode(payload)}`;
}

export function decodeBookingQrFromUrl(raw: string): string | null {
  try {
    const url = new URL(raw);
    if (!url.pathname.startsWith("/pickup/")) return null;
    const encoded = decodeURIComponent(url.pathname.slice("/pickup/".length));
    return b64Decode(encoded);
  } catch {
    return null;
  }
}

export function decodeBookingQrPayload(encoded: string): string | null {
  return b64Decode(encoded);
}

export function normalizeBookingQrInput(raw: string): string | null {
  const v = raw.trim();
  if (v.startsWith("https://lorarentals.org/pickup/")) {
    return decodeBookingQrFromUrl(v);
  }
  if (v.startsWith("LORA|") || v.startsWith("LORA:")) return v;
  return v;
}
