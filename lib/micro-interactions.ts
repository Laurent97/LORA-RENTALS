// LORA micro-interactions (T5P16): haptic, reduced-motion, and scroll utilities

export function haptic(type: "light" | "medium" | "heavy" = "light") {
  if (typeof window === "undefined") return;
  const nav = navigator as Navigator & { vibrate?: (pattern: number | number[]) => boolean };
  if (nav.vibrate) {
    const patterns = { light: 10, medium: 25, heavy: [0, 50, 25] };
    nav.vibrate(patterns[type]);
  }
}

export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function smoothScrollTo(selector: string) {
  if (typeof document === "undefined") return;
  const el = document.querySelector(selector);
  if (el) el.scrollIntoView({ behavior: prefersReducedMotion() ? "auto" : "smooth", block: "start" });
}

export function triggerConfetti() {
  // Placeholder for a future canvas/emoji confetti implementation
  if (typeof window === "undefined") return;
  haptic("medium");
  window.dispatchEvent(new CustomEvent("lora:confetti"));
}
