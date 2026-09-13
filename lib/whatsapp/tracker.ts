import { trackPWA } from "@/lib/pwa/installTracker";

export function trackWhatsAppTap(details: { carId?: string; ownerId?: string; source: string }) {
  trackPWA("whatsapp_tap", { car_id: details.carId, owner_id: details.ownerId, source: details.source });
}
