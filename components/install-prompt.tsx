"use client";

import { useEffect, useState } from "react";
import { Download, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useT } from "@/lib/i18n";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const DISMISS_KEY = "lora-install-dismissed";
const VISIT_KEY = "lora-visit-count";

export function InstallPrompt() {
  const t = useT();
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (localStorage.getItem(DISMISS_KEY)) return;
    // show after 2nd visit
    const visits = Number(localStorage.getItem(VISIT_KEY) ?? 0) + 1;
    localStorage.setItem(VISIT_KEY, String(visits));

    const onPrompt = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
      if (visits >= 2) setShow(true);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    return () => window.removeEventListener("beforeinstallprompt", onPrompt);
  }, []);

  if (!show || !deferred) return null;

  const install = async () => {
    await deferred.prompt();
    const { outcome } = await deferred.userChoice;
    if (outcome === "accepted") setShow(false);
    setDeferred(null);
  };

  const dismiss = () => {
    localStorage.setItem(DISMISS_KEY, "1");
    setShow(false);
  };

  return (
    <div className="fixed bottom-20 left-4 right-4 z-40 mx-auto max-w-sm rounded-2xl border border-gold/40 bg-card p-4 shadow-2xl md:bottom-6 md:left-6 md:right-auto">
      <button
        onClick={dismiss}
        aria-label={t("install.dismiss")}
        className="absolute right-2 top-2 rounded-full p-1 text-muted-foreground hover:bg-secondary"
      >
        <X className="h-4 w-4" />
      </button>
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-navy-800 text-gold">
          <Download className="h-5 w-5" />
        </span>
        <div className="flex-1">
          <p className="font-display font-bold">{t("install.title")}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">{t("install.desc")}</p>
          <div className="mt-3 flex gap-2">
            <Button variant="gold" size="sm" onClick={install}>
              {t("install.cta")}
            </Button>
            <Button variant="ghost" size="sm" onClick={dismiss}>
              {t("install.dismiss")}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
