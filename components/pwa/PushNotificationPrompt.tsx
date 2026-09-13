"use client";

import { Bell, X } from "lucide-react";
import { useEffect, useState } from "react";
import { trackPWA } from "@/lib/pwa/installTracker";

const KEY = "lora-push-prompt-dismissed";
const urlBase64ToUint8Array = (value: string) => Uint8Array.from(atob(value.replace(/-/g, "+").replace(/_/g, "/")), char => char.charCodeAt(0));

export function PushNotificationPrompt() {
  const [show, setShow] = useState(false); const [busy, setBusy] = useState(false);
  const key = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  useEffect(() => { if (key && "Notification" in window && Notification.permission === "default" && !localStorage.getItem(KEY)) setShow(true); }, [key]);
  if (!show || !key) return null;
  const dismiss = () => { localStorage.setItem(KEY, "1"); setShow(false); };
  const enable = async () => {
    setBusy(true);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") return dismiss();
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlBase64ToUint8Array(key) });
      await fetch("/api/pwa/push", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ subscription }) });
      trackPWA("pwa_push_subscribed"); setShow(false);
    } catch { dismiss(); } finally { setBusy(false); }
  };
  return <aside className="fixed bottom-5 left-5 right-5 z-[65] mx-auto max-w-sm rounded-2xl bg-[#0A1F44] p-4 text-white shadow-2xl"><button onClick={dismiss} className="absolute right-3 top-3 text-slate-300" aria-label="Dismiss notification prompt"><X size={16}/></button><Bell className="text-[#D4AF37]"/><p className="mt-2 font-bold">Enable pickup reminders</p><p className="mt-1 text-xs text-slate-300">Get updates for confirmed bookings and pickup times.</p><button disabled={busy} onClick={enable} className="mt-3 w-full rounded-lg bg-[#D4AF37] py-2 text-sm font-bold text-[#0A1F44] disabled:opacity-60">{busy ? "Enabling…" : "Enable notifications"}</button></aside>;
}
