"use client";

import { Download } from "lucide-react";
import { useDeviceType } from "@/lib/pwa/useDeviceType";
import { usePWAInstall } from "@/lib/pwa/usePWAInstall";
import { cn } from "@/lib/utils";

export function PWAInstallButton({ className }: { className?: string }) {
  const { state } = usePWAInstall();
  const { isStandalone } = useDeviceType();

  const canInstall =
    !isStandalone &&
    (state === "available" || state === "ios-manual" || state === "ios-browser");

  if (!canInstall) return null;

  const request = () => {
    window.dispatchEvent(new CustomEvent("lora:request-install"));
  };

  return (
    <button
      onClick={request}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-xl bg-[#0A1F44] px-3 py-2 text-sm font-semibold text-white shadow hover:bg-[#132a55]",
        className
      )}
    >
      <Download size={16} />
      <span className="hidden sm:inline">Install app</span>
      <span className="sm:hidden">Install</span>
    </button>
  );
}
