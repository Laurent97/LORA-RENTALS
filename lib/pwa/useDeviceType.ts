"use client";

import { useEffect, useState } from "react";

export type DeviceType = "mobile" | "tablet" | "desktop";
export type OS = "ios" | "android" | "windows" | "macos" | "linux" | "unknown";
export type Browser = "chrome" | "safari" | "firefox" | "edge" | "samsung" | "opera" | "unknown";

export interface DeviceInfo { type: DeviceType; os: OS; browser: Browser; isStandalone: boolean; isTouch: boolean; isWebView: boolean }
const initial: DeviceInfo = { type: "desktop", os: "unknown", browser: "unknown", isStandalone: false, isTouch: false, isWebView: false };

export function useDeviceType() {
  const [device, setDevice] = useState<DeviceInfo>(initial);
  useEffect(() => {
    const detect = () => {
      const ua = navigator.userAgent;
      const os: OS = /iPhone|iPad|iPod/i.test(ua) ? "ios" : /Android/i.test(ua) ? "android" : /Win/i.test(ua) ? "windows" : /Mac/i.test(ua) ? "macos" : /Linux/i.test(ua) ? "linux" : "unknown";
      const browser: Browser = /Edg|EdgiOS/i.test(ua) ? "edge" : /SamsungBrowser/i.test(ua) ? "samsung" : /OPR|Opera/i.test(ua) ? "opera" : /FxiOS|Firefox/i.test(ua) ? "firefox" : /CriOS|Chrome/i.test(ua) ? "chrome" : /Safari/i.test(ua) ? "safari" : "unknown";
      const type: DeviceType = window.innerWidth < 768 || (os === "ios" && /iPhone/i.test(ua)) ? "mobile" : window.innerWidth < 1024 || (os === "ios" && /iPad/i.test(ua)) ? "tablet" : "desktop";
      const isStandalone = window.matchMedia("(display-mode: standalone)").matches || (navigator as Navigator & { standalone?: boolean }).standalone === true || document.referrer.startsWith("android-app://");
      setDevice({ type, os, browser, isStandalone, isTouch: navigator.maxTouchPoints > 0 || "ontouchstart" in window, isWebView: /; wv\)|\bwv\b|Instagram|FBAN|FBAV/i.test(ua) });
    };
    detect(); window.addEventListener("resize", detect); return () => window.removeEventListener("resize", detect);
  }, []);
  return device;
}
