import type { BookingExtra, CarType } from "@/types";

// ─── Brand ───────────────────────────────────────────────────────────────────
export const BRAND = {
  name: "LORA RENTALS LTD",
  shortName: "LORA",
  tagline: "Premium Private Car Rentals in Rwanda",
  phone: "+250 787 988 039",
  whatsapp: "250787988039",
  email: "hello@lorarentals.org",
  supportEmail: "support@lorarentals.org",
  financeEmail: "finances@lorarentals.org",
  adminEmail: "admin@lorarentals.org",
  domain: "lorarentals.org",
  siteUrl: "https://lorarentals.org",
  address: "KG 7 Ave, Kigali Heights, Kigali, Rwanda",
} as const;

// ─── Currency ────────────────────────────────────────────────────────────────
export const USD_RATE = 1300; // 1 USD ≈ 1300 RWF (display-only toggle)

// ─── Rwanda locations ────────────────────────────────────────────────────────
export const RWANDA_LOCATIONS = [
  "Kigali — Gasabo",
  "Kigali — Kicukiro",
  "Kigali — Nyarugenge",
  "Kigali International Airport",
  "Musanze",
  "Rubavu",
  "Huye",
  "Nyagatare",
  "Rusizi",
  "Muhanga",
  "Rwamagana",
  "Karongi",
] as const;

export const KIGALI_DISTRICTS = ["Gasabo", "Kicukiro", "Nyarugenge"] as const;

// ─── Vehicle taxonomy ────────────────────────────────────────────────────────
export const CAR_TYPES: { value: CarType; label: string }[] = [
  { value: "sedan", label: "Sedan" },
  { value: "suv", label: "SUV" },
  { value: "pickup", label: "Pickup" },
  { value: "luxury", label: "Luxury" },
  { value: "minivan", label: "Minivan" },
  { value: "4x4", label: "4x4" },
];

export const TRANSMISSIONS = [
  { value: "automatic", label: "Automatic" },
  { value: "manual", label: "Manual" },
] as const;

export const FUEL_TYPES = [
  { value: "petrol", label: "Petrol" },
  { value: "diesel", label: "Diesel" },
  { value: "hybrid", label: "Hybrid" },
  { value: "electric", label: "Electric" },
] as const;

export const VEHICLE_FEATURES = [
  "Air Conditioning",
  "Bluetooth",
  "USB Charging",
  "GPS Navigation",
  "Reverse Camera",
  "Cruise Control",
  "Leather Seats",
  "Sunroof",
  "4WD",
  "Roof Rack",
  "Child Seat Ready",
  "Dash Cam",
  "Apple CarPlay",
  "Android Auto",
] as const;

// ─── Booking extras (add-ons — NOT booking fees) ─────────────────────────────
export const BOOKING_EXTRAS: BookingExtra[] = [
  { id: "child-seat", label: "Child Seat", pricePerDay: 5000 },
  { id: "driver", label: "Professional Driver", pricePerDay: 25000 },
  { id: "gps", label: "GPS Device", pricePerDay: 3000 },
  { id: "insurance-plus", label: "Premium Insurance Upgrade", pricePerDay: 10000 },
  { id: "airport-delivery", label: "Airport Delivery (KGL)", pricePerDay: 0 },
];

// ─── Platform config (admin-editable later) ──────────────────────────────────
export const PLATFORM = {
  commissionPct: 12, // platform commission on owner earnings
  ownerResponseSlaHours: 4,
  supportSlaHours: 24,
} as const;

// ─── Booking status flow ─────────────────────────────────────────────────────
export const BOOKING_TIMELINE = [
  "requested",
  "confirmed",
  "picked_up",
  "returned",
  "completed",
] as const;

export const BOOKING_STATUS_LABELS: Record<string, string> = {
  requested: "Requested",
  confirmed: "Confirmed",
  picked_up: "Picked Up",
  returned: "Returned",
  completed: "Completed",
  cancelled: "Cancelled",
  declined: "Declined",
};

export const PAYMENT_METHOD_LABELS: Record<string, string> = {
  cash: "Cash",
  momo: "MTN MoMo",
  card: "Card (on-site)",
};
