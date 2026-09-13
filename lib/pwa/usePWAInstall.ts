"use client";

import { useCallback, useEffect, useState } from "react";
export type InstallState = "idle" | "available" | "ios-manual" | "ios-browser" | "installed" | "unsupported";
interface BeforeInstallPromptEvent extends Event { prompt(): Promise<void>; userChoice: Promise<{ outcome: "accepted" | "dismissed" }> }

export function usePWAInstall() {
  const [state, setState] = useState<InstallState>("idle"); const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  useEffect(() => {
    const standalone = window.matchMedia("(display-mode: standalone)").matches || (navigator as Navigator & { standalone?: boolean }).standalone === true;
    if (standalone) { setState("installed"); return; }
    const ua = navigator.userAgent; const ios = /iPhone|iPad|iPod/i.test(ua);
    if (ios) { setState(/Safari/i.test(ua) && !/CriOS|FxiOS|EdgiOS/i.test(ua) ? "ios-manual" : "ios-browser"); return; }
    const onPrompt = (event: Event) => { event.preventDefault(); setDeferred(event as BeforeInstallPromptEvent); setState("available"); };
    const onInstalled = () => setState("installed");
    window.addEventListener("beforeinstallprompt", onPrompt); window.addEventListener("appinstalled", onInstalled);
    const timeout = window.setTimeout(() => setState(value => value === "idle" ? "unsupported" : value), 4000);
    return () => { window.removeEventListener("beforeinstallprompt", onPrompt); window.removeEventListener("appinstalled", onInstalled); clearTimeout(timeout); };
  }, []);
  const promptInstall = useCallback(async () => { if (!deferred) return "unavailable" as const; await deferred.prompt(); const { outcome } = await deferred.userChoice; if (outcome === "accepted") setState("installed"); setDeferred(null); return outcome; }, [deferred]);
  return { state, promptInstall, canPrompt: state === "available" };
}
