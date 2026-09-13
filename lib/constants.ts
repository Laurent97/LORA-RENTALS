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

export const OTP_LENGTH = 8;

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

export type RwandaDestination = {
  name: string;
  keywords: string[];
  recommendedCarType: CarType;
  roadConditions: string;
  fuelEstimate: string;
  lodging: string[];
  routes: string[];
  itinerary: string[];
};

export const RWANDA_DESTINATIONS: RwandaDestination[] = [
  {
    name: "Volcanoes National Park",
    keywords: ["gorilla", "volcanoes", "musanze", "ruhengeri", "kinigi"],
    recommendedCarType: "4x4",
    roadConditions: "Tarmac to Musanze, murram for the final 15 km to Kinigi. A 4x4 is recommended in rainy seasons.",
    fuelEstimate: "RWF 45,000–60,000 round trip from Kigali (≈210 km).",
    lodging: ["Virunga Lodge", "Sabyinyo Silverback Lodge", "Le Bambou Gorilla Lodge"],
    routes: ["Kigali → Musanze → Kinigi", "Scenic drive along the Volcanoes foothills"],
    itinerary: [
      "Drive Kigali to Musanze, check in and relax",
      "Early gorilla trek in Volcanoes National Park",
      "Visit Iby'Iwacu cultural village or golden monkeys",
      "Scenic drive back to Kigali",
    ],
  },
  {
    name: "Lake Kivu",
    keywords: ["lake kivu", "gisenyi", "rubavu", "kibuye", "karongi", "beach"],
    recommendedCarType: "suv",
    roadConditions: "Good tarmac from Kigali to Gisenyi/Rubavu (≈160 km).",
    fuelEstimate: "RWF 35,000–50,000 for a Kigali–Gisenyi round trip.",
    lodging: ["Lake Kivu Serena Hotel", "Paradise Malahide", "Cormoran Lodge"],
    routes: ["Kigali → Gisenyi (Rubavu) lakeside road", "Gisenyi → Kibuye (Karongi) panoramic ridge"],
    itinerary: [
      "Drive to Lake Kivu, lakeside check-in",
      "Relax on the beach or take a boat ride",
      "Visit nearby coffee plantations or hot springs",
      "Return to Kigali via Kigali–Rubavu road",
    ],
  },
  {
    name: "Akagera National Park",
    keywords: ["akagera", "safari", "nyagatare", "wildlife"],
    recommendedCarType: "4x4",
    roadConditions: "Tarmac to Kayonza, then murram into the park. 4x4 is required for game drives.",
    fuelEstimate: "RWF 55,000–75,000 round trip from Kigali (≈260 km).",
    lodging: ["Magashi Camp", "Ruzizi Tented Lodge", "Akagera Game Lodge"],
    routes: ["Kigali → Kayonza → Akagera south gate", "Game-drive circuits inside the park"],
    itinerary: [
      "Drive to Akagera, afternoon game drive",
      "Full-day safari: elephant, buffalo, giraffe",
      "Boat safari on Lake Ihema",
      "Morning drive and return to Kigali",
    ],
  },
  {
    name: "Nyungwe Forest",
    keywords: ["nyungwe", "canopy", "chimpanzee", "huye", "butare"],
    recommendedCarType: "4x4",
    roadConditions: "Winding tarmac and murram through the hills; 4x4 advised in wet weather.",
    fuelEstimate: "RWF 60,000–80,000 round trip from Kigali (≈320 km).",
    lodging: ["One&Only Nyungwe House", "Nyungwe Top View Hill Hotel"],
    routes: ["Kigali → Huye → Nyungwe (scenic highlands)", "Canopy walkway loop"],
    itinerary: [
      "Drive to Nyungwe, stop in Huye for lunch",
      "Chimpanzee trek or Colobus monkey tracking",
      "Canopy walkway and tea-plantation visit",
      "Return to Kigali via Nyanza King's Palace",
    ],
  },
  {
    name: "Kigali City",
    keywords: ["kigali", "city", "genocide memorial", "conference"],
    recommendedCarType: "sedan",
    roadConditions: "Well-paved city roads.",
    fuelEstimate: "RWF 10,000–20,000 for a day around town.",
    lodging: ["The Retreat", "Kigali Marriott", "Onomo Hotel Kigali"],
    routes: ["Kigali city loop", "Kigali Genocide Memorial → Kimironko Market → Inema Arts"],
    itinerary: [
      "Kigali Genocide Memorial and city highlights",
      "Kimironko Market and local lunch",
      "Art galleries or business meetings",
      "Sunset at Mt Kigali viewpoint",
    ],
  },
];

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
