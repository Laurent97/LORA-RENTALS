"use client";

import { usePathname } from "next/navigation";
import { MessageCircle } from "lucide-react";
import { BRAND } from "@/lib/constants";
import { whatsappLink } from "@/lib/utils";

// Floating WhatsApp button — sits above the mobile bottom-nav (bottom-20 on
// mobile, bottom-6 on desktop). Hidden on auth pages where it's noise.
const HIDDEN_ON = ["/login", "/register", "/scan"];

export function WhatsAppFloat() {
  const pathname = usePathname();
  if (HIDDEN_ON.some((p) => pathname.startsWith(p))) return null;

  const msg = "Hi LORA, I'd like to ask about renting a car.";
  return (
    <a
      href={whatsappLink(BRAND.whatsapp, msg)}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with LORA on WhatsApp"
      className="group fixed bottom-20 right-4 z-40 flex h-13 w-13 items-center justify-center rounded-full bg-[#25D366] text-white shadow-xl transition-transform hover:scale-110 md:bottom-6 md:right-6"
      style={{ width: 52, height: 52 }}
    >
      <span className="absolute inset-0 animate-ping rounded-full bg-[#25D366] opacity-25" />
      <MessageCircle className="relative h-6 w-6" />
      <span className="pointer-events-none absolute right-full mr-3 hidden whitespace-nowrap rounded-lg bg-navy-900 px-3 py-1.5 text-xs font-semibold text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100 md:block">
        Chat on WhatsApp
      </span>
    </a>
  );
}
