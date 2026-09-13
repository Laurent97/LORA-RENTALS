import type { Metadata, Viewport } from "next";
import { Inter, Sora } from "next/font/google";
import { ThemeProvider } from "next-themes";
import { Toaster } from "sonner";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { MobileNav } from "@/components/layout/mobile-nav";
import { StoreHydrator } from "@/components/store-hydrator";
import { WhatsAppFloat } from "@/components/whatsapp-float";
import { PWAProvider } from "@/components/pwa/PWAProvider";
import { SwRegister } from "@/components/sw-register";
import { I18nProvider } from "@/lib/i18n";
import { BRAND } from "@/lib/constants";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });
const sora = Sora({ subsets: ["latin"], variable: "--font-display" });

export const metadata: Metadata = {
  title: {
    default: `${BRAND.name} — ${BRAND.tagline}`,
    template: `%s · ${BRAND.name}`,
  },
  description:
    "Book premium private cars across Rwanda — Kigali, Musanze, Rubavu, Huye. No booking fees. Pay at office or pickup with cash, MoMo, or card.",
  manifest: "/manifest.json",
  appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: "LORA Rentals" },
  icons: { icon: "/icons/icon-192x192.png", apple: "/icons/apple-touch-icon.png", shortcut: "/icons/icon-96x96.png" },
};

export const viewport: Viewport = {
  themeColor: "#0A1F44",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="apple-touch-startup-image" href="/icons/splash/apple-splash-1170x2532.png" media="(device-width: 390px) and (device-height: 844px)" />
        <link rel="apple-touch-startup-image" href="/icons/splash/apple-splash-1284x2778.png" media="(device-width: 428px) and (device-height: 926px)" />
        <link rel="apple-touch-startup-image" href="/icons/splash/apple-splash-1125x2436.png" media="(device-width: 375px) and (device-height: 812px)" />
      </head>
      <body className={`${inter.variable} ${sora.variable} font-sans`}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
          <I18nProvider>
            <PWAProvider>
            <div className="flex min-h-screen flex-col">
              <Header />
              <div className="flex-1 pb-16 md:pb-0">{children}</div>
              <Footer />
            </div>
            <MobileNav />
            <WhatsAppFloat />
            <StoreHydrator />
            <SwRegister />
            <Toaster richColors position="top-center" />
            </PWAProvider>
          </I18nProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
