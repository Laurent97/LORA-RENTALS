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
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(
    data
  )}&bgcolor=ffffff&color=0A1F44`;
}

export function whatsappLink(phone: string, message: string): string {
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}

export function bookingRef(id: string): string {
  return `LRA-${id.slice(0, 6).toUpperCase()}`;
}
