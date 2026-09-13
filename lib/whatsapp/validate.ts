export function normalizeRwandanPhone(input: string): string | null {
  const digits = input.replace(/[^\d+]/g, "");
  let cleaned = digits;
  if (/^07\d{8}$/.test(cleaned)) cleaned = "+250" + cleaned.slice(1);
  else if (/^250\d{9}$/.test(cleaned)) cleaned = "+" + cleaned;
  else if (/^7\d{8}$/.test(cleaned)) cleaned = "+250" + cleaned;
  if (!/^\+2507\d{8}$/.test(cleaned)) return null;
  return cleaned;
}

export function isValidRwandanMobile(input: string): boolean {
  return normalizeRwandanPhone(input) !== null;
}

export function toWhatsAppDigits(input: string): string | null {
  const n = normalizeRwandanPhone(input);
  return n ? n.replace(/\D/g, "") : null;
}
