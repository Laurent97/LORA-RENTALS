"use client";

import { useState } from "react";
import { Share2 } from "lucide-react";
import type { ShareListing } from "@/lib/share/types";
import { ShareSheet } from "./ShareSheet";

export function ShareButton({ listing }: { listing: ShareListing }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label="Share this listing"
        className="flex h-11 w-11 items-center justify-center rounded-full bg-navy-800 text-gold shadow-lg transition hover:scale-105 active:scale-95"
      >
        <Share2 className="h-5 w-5" />
      </button>
      <ShareSheet listing={listing} open={open} onClose={() => setOpen(false)} />
    </>
  );
}
