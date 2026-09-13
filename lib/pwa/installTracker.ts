"use client";

const KEY = "lora-pwa-install";
type InstallRecord = { dismissals: number; until?: number; installedAt?: number };
const read = (): InstallRecord => { try { return { dismissals: 0, ...JSON.parse(localStorage.getItem(KEY) || "{}") }; } catch { return { dismissals: 0 }; } };
const write = (value: InstallRecord) => localStorage.setItem(KEY, JSON.stringify(value));
export const shouldShowPrompt = () => { const data = read(); return !data.installedAt && (!data.until || data.until <= Date.now()); };
export const markDismissed = (desktop = false) => { const data = read(); const dismissals = data.dismissals + 1; const days = desktop ? 30 : dismissals >= 3 ? 3650 : dismissals === 2 ? 30 : 7; write({ ...data, dismissals, until: Date.now() + days * 86400000 }); };
export const markInstalled = () => write({ ...read(), installedAt: Date.now() });
export const trackPWA = (event: string, properties: Record<string, unknown> = {}) => {
  const payload = { event, properties: { ...properties, path: location.pathname, session_id: sessionStorage.getItem("lora-pwa-session") || crypto.randomUUID() } };
  sessionStorage.setItem("lora-pwa-session", payload.properties.session_id as string);
  window.dispatchEvent(new CustomEvent("lora:pwa", { detail: payload }));
  (window as Window & { gtag?: (...args: unknown[]) => void }).gtag?.("event", event, properties);
  void fetch("/api/pwa/events", { method: "POST", headers: { "Content-Type": "application/json" }, keepalive: true, body: JSON.stringify(payload) }).catch(() => undefined);
};
