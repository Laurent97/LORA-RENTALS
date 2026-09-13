export function maskWhatsAppNumber(number: string): string {
  const digits = number.replace(/\D/g, "");
  if (digits.length < 7) return number;
  return "+" + digits.slice(0, 3) + " ··· " + digits.slice(-4);
}
