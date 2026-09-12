export type Provider = "mtn" | "airtel" | "ekash";

export const PROVIDER_LABELS: Record<Provider, string> = {
  mtn: "MTN MoMo",
  airtel: "Airtel Money",
  ekash: "eKash",
};

export function normalizeRwandaPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("250") && digits.length === 12) return `0${digits.slice(3)}`;
  return digits;
}

export function detectProvider(phone: string): Provider {
  const normalized = normalizeRwandaPhone(phone);
  if (/^(078|079)/.test(normalized)) return "mtn";
  if (/^(072|073)/.test(normalized)) return "airtel";
  return "ekash";
}

export function isValidRwandaPhone(phone: string): boolean {
  return /^07\d{8}$/.test(normalizeRwandaPhone(phone));
}

export function formatRwandaPhone(phone: string): string {
  const normalized = normalizeRwandaPhone(phone);
  if (normalized.length !== 10) return phone;
  return `${normalized.slice(0, 3)} ${normalized.slice(3, 6)} ${normalized.slice(6)}`;
}

export function buildUSSD({ provider, phone, amount }: { provider: Provider; phone: string; amount: number }): string {
  const clean = normalizeRwandaPhone(phone);
  const amt = Math.round(amount);
  if (provider === "airtel") return `*500*1*1*${clean}*${amt}#`;
  if (provider === "ekash") return `*182*1*2*${clean}*${amt}#`;
  return `*182*1*1*${clean}*${amt}#`;
}

export function toDialerLink(ussd: string): string {
  return `tel:${encodeURIComponent(ussd)}`;
}