import Link from "next/link";
import { Mail, MapPin, Phone } from "lucide-react";
import { Logo } from "./logo";
import { BRAND } from "@/lib/constants";

export function Footer() {
  return (
    <footer className="border-t border-border bg-navy-950 text-silver">
      <div className="container grid gap-10 py-14 md:grid-cols-4">
        <div className="space-y-4">
          <Logo />
          <p className="text-sm text-silver/70">
            Premium private car rentals across Rwanda. Book in 60 seconds, pay at
            pickup — cash, MoMo, or card.
          </p>
          <div className="flex items-center gap-2 text-xs font-semibold text-gold">
            <span className="rounded-full border border-gold/40 px-2 py-0.5">RWF 0 booking fee</span>
            <span className="rounded-full border border-gold/40 px-2 py-0.5">Pay on arrival</span>
          </div>
        </div>

        <div>
          <h3 className="mb-3 font-display text-sm font-bold uppercase tracking-wider text-gold">Platform</h3>
          <ul className="space-y-2 text-sm">
            <li><Link href="/browse" className="hover:text-gold">Browse cars</Link></li>
            <li><Link href="/register" className="hover:text-gold">Become an owner</Link></li>
            <li><Link href="/dashboard" className="hover:text-gold">My bookings</Link></li>
            <li><Link href="/about" className="hover:text-gold">About us</Link></li>
          </ul>
        </div>

        <div>
          <h3 className="mb-3 font-display text-sm font-bold uppercase tracking-wider text-gold">Locations</h3>
          <ul className="space-y-2 text-sm text-silver/80">
            <li>Kigali — Gasabo · Kicukiro · Nyarugenge</li>
            <li>Musanze · Rubavu · Huye</li>
            <li>Nyagatare · Rusizi · Muhanga</li>
            <li>Kigali International Airport</li>
          </ul>
        </div>

        <div>
          <h3 className="mb-3 font-display text-sm font-bold uppercase tracking-wider text-gold">Contact</h3>
          <ul className="space-y-3 text-sm">
            <li className="flex items-center gap-2"><Phone className="h-4 w-4 text-gold" /> {BRAND.phone}</li>
            <li className="flex items-center gap-2"><Mail className="h-4 w-4 text-gold" /> <a href={`mailto:${BRAND.supportEmail}`} className="hover:text-gold">{BRAND.supportEmail}</a></li>
            <li className="flex items-center gap-2"><Mail className="h-4 w-4 text-gold" /> <a href={`mailto:${BRAND.financeEmail}`} className="hover:text-gold">{BRAND.financeEmail}</a></li>
            <li className="flex items-center gap-2"><Mail className="h-4 w-4 text-gold" /> <a href={`mailto:${BRAND.adminEmail}`} className="hover:text-gold">{BRAND.adminEmail}</a></li>
            <li className="flex items-center gap-2"><Phone className="h-4 w-4 text-gold" /> <a href={`https://wa.me/${BRAND.whatsapp}`} target="_blank" rel="noreferrer" className="hover:text-gold">WhatsApp {BRAND.phone}</a></li>
            <li className="flex items-start gap-2"><MapPin className="mt-0.5 h-4 w-4 shrink-0 text-gold" /> {BRAND.address}</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10 py-5 text-center text-xs text-silver/50">
        © {new Date().getFullYear()} {BRAND.name}. All rights reserved. Made in Rwanda 🇷🇼
      </div>
    </footer>
  );
}
