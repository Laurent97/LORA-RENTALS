import Link from "next/link";
import { WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LogoMark } from "@/components/layout/logo";

export const metadata = { title: "Offline" };

export default function OfflinePage() {
  return (
    <main className="container flex min-h-[70vh] flex-col items-center justify-center py-16 text-center">
      <LogoMark className="h-14 w-14" />
      <span className="mt-6 flex h-14 w-14 items-center justify-center rounded-full bg-secondary">
        <WifiOff className="h-7 w-7 text-muted-foreground" />
      </span>
      <h1 className="mt-4 font-display text-2xl font-extrabold">You&apos;re offline</h1>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">
        Check your bookings next time you&apos;re connected. Your confirmed trips and QR codes are saved on this device.
      </p>
      <Link href="/" className="mt-6">
        <Button variant="gold">Try again</Button>
      </Link>
    </main>
  );
}
