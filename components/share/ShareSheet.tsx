"use client";

import { Facebook, Instagram, Link, Loader2, MessageCircle, Share2, Twitter } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { ShareListing } from "@/lib/share/types";
import { buildShareLinks, copyToClipboard, shareNatively } from "@/lib/share/shareLinks";

function track(listing: ShareListing, platform: string) {
  void fetch("/api/share/track", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      listingType: listing.type,
      listingId: listing.id,
      platform,
      url: typeof window !== "undefined" ? `${window.location.origin}${listing.url}` : listing.url,
    }),
  });
}

export function ShareSheet({
  listing,
  open,
  onClose,
}: {
  listing: ShareListing;
  open: boolean;
  onClose: () => void;
}) {
  const links = buildShareLinks(listing);
  const [downloading, setDownloading] = useState(false);

  const openLink = (href: string | undefined, platform: string) => {
    if (!href) return;
    track(listing, platform);
    window.open(href, "_blank", "noopener,noreferrer");
  };

  const handleCopy = async () => {
    track(listing, "copy");
    const ok = await copyToClipboard(links.url);
    if (ok) toast.success("Link copied — paste it anywhere.");
    else toast.error("Could not copy link.");
  };

  const handleNative = async () => {
    track(listing, "native");
    try {
      await shareNatively(listing);
    } catch {
      await handleCopy();
    }
  };

  const handleInstagram = async () => {
    track(listing, "instagram");
    const ogUrl = `${window.location.origin}/api/og/${listing.type}/${listing.id}`;
    setDownloading(true);
    try {
      const res = await fetch(ogUrl);
      if (!res.ok) throw new Error("Image not available");
      const blob = await res.blob();
      const file = new File([blob], `lora-${listing.type}.jpg`, { type: blob.type });

      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: listing.title,
          text: `${listing.description}\n${links.url}`,
        });
      } else {
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = `lora-${listing.type}.jpg`;
        a.click();
        URL.revokeObjectURL(a.href);
        toast.success("Image downloaded — open Instagram to post it.");
      }
    } catch {
      await handleCopy();
      toast("OG image not ready. Link copied — you can post the URL on Instagram.");
    } finally {
      setDownloading(false);
    }
  };

  const platforms = [
    { id: "whatsapp", label: "WhatsApp", icon: MessageCircle, href: links.whatsapp, color: "bg-green-500" },
    { id: "facebook", label: "Facebook", icon: Facebook, href: links.facebook, color: "bg-blue-600" },
    { id: "twitter", label: "X / Twitter", icon: Twitter, href: links.twitter, color: "bg-slate-900" },
    { id: "telegram", label: "Telegram", icon: Share2, href: links.telegram, color: "bg-sky-500" },
    { id: "instagram", label: "Instagram", icon: Instagram, href: undefined, color: "bg-pink-500" },
  ];

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-sm gap-0 rounded-2xl border-0 p-0 pb-6">
        <DialogHeader>
          <DialogTitle>Share this listing</DialogTitle>
        </DialogHeader>

        <div className="px-6 py-4">
          <div className="flex gap-4 rounded-2xl border bg-muted/40 p-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={listing.image} alt="" className="h-16 w-16 rounded-xl object-cover" />
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold">{listing.title}</p>
              <p className="text-xs text-muted-foreground line-clamp-2">{listing.description}</p>
              {listing.price && <p className="text-sm font-bold text-gold">{listing.price}</p>}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 px-6">
          {platforms.map((p) => (
            <button
              key={p.id}
              disabled={p.id === "instagram" && downloading}
              onClick={() => {
                if (p.id === "instagram") {
                  void handleInstagram();
                  onClose();
                  return;
                }
                openLink(p.href, p.id);
                onClose();
              }}
              className="flex flex-col items-center gap-2 rounded-2xl p-3 transition hover:bg-muted disabled:opacity-50"
            >
              <div className={`flex h-12 w-12 items-center justify-center rounded-2xl text-white ${p.color}`}>
                {downloading && p.id === "instagram" ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <p.icon className="h-6 w-6" />
                )}
              </div>
              <span className="text-xs font-medium">{p.label}</span>
            </button>
          ))}

          <button
            onClick={() => { void handleCopy(); onClose(); }}
            className="flex flex-col items-center gap-2 rounded-2xl p-3 transition hover:bg-muted"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-navy-800 text-gold">
              <Link className="h-6 w-6" />
            </div>
            <span className="text-xs font-medium">Copy link</span>
          </button>

          <button
            onClick={() => { void handleNative(); onClose(); }}
            className="flex flex-col items-center gap-2 rounded-2xl p-3 transition hover:bg-muted"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-silver text-navy-900">
              <Share2 className="h-6 w-6" />
            </div>
            <span className="text-xs font-medium">More</span>
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
