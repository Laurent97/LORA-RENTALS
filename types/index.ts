// ─── LORA RENTALS LTD — Core Domain Types (Supabase-ready) ───────────────────

export type UserRole = "customer" | "owner" | "admin";
export type KycStatus = "pending" | "verified" | "rejected" | "none";
export type VehicleStatus = "available" | "unavailable" | "maintenance" | "pending_approval";
export type BookingStatus =
  | "requested"
  | "confirmed"
  | "picked_up"
  | "returned"
  | "completed"
  | "cancelled"
  | "declined";
export type PaymentMethod = "cash" | "momo" | "card";
export type PaymentPoint = "office" | "pickup";
export type Transmission = "automatic" | "manual";
export type FuelType = "petrol" | "diesel" | "hybrid" | "electric";
export type CarType = "sedan" | "suv" | "pickup" | "luxury" | "minivan" | "4x4";

export interface User {
  id: string;
  role: UserRole;
  name: string;
  email: string;
  phone: string; // +250 ...
  avatar?: string;
  kycStatus: KycStatus;
  createdAt: string;
  // owner-specific
  businessName?: string;
  payoutMethod?: "momo" | "bank";
  payoutDetails?: string;
  // features
  avgResponseMinutes?: number;
  referralCode?: string;
  referredBy?: string;
  preferredCurrency?: "RWF" | "USD";
  preferredLocale?: Locale;
  suspendedAt?: string;
  deletedAt?: string;
}

export interface Vehicle {
  id: string;
  ownerId: string;
  make: string;
  model: string;
  year: number;
  plate: string;
  type: CarType;
  transmission: Transmission;
  fuel: FuelType;
  seats: number;
  pricePerDay: number; // RWF
  location: string; // city
  district?: string;
  coordinates?: { lat: number; lng: number };
  images: string[];
  features: string[];
  description: string;
  status: VehicleStatus;
  verified: boolean;
  rating: number;
  reviewCount: number;
  tripsCompleted: number;
  paymentMethods: PaymentMethod[];
  airportApproved: boolean;
  createdAt: string;
}

export interface BookingExtra {
  id: string;
  label: string;
  pricePerDay: number; // RWF, 0 = free
}

export interface Booking {
  id: string;
  customerId: string;
  vehicleId: string;
  ownerId: string;
  startDate: string; // ISO
  endDate: string; // ISO
  pickupLocation: string;
  returnLocation: string;
  extras: string[]; // extra ids
  totalPrice: number; // RWF — rental only, booking fee is always 0
  bookingFee: 0;
  status: BookingStatus;
  paymentMethod: PaymentMethod;
  paymentPoint: PaymentPoint;
  paymentConfirmed: boolean;
  qrCode: string;
  driverName?: string;
  driverLicense?: string;
  driverIdNumber?: string;
  qrToken?: string;
  pickedUpAt?: string;
  returnedAt?: string;
  ownerResponseDeadline?: string;
  ownerRespondedAt?: string;
  pointsRedeemed?: number;
  pointsEarned?: number;
  corporateAccountId?: string;
  costCenter?: string;
  poNumber?: string;
  createdAt: string;
}

export type ReviewStatus = "published" | "hidden" | "flagged" | "removed";
export type ReviewReportStatus = "pending" | "reviewed" | "dismissed" | "actioned";

export interface ReviewReply {
  id: string;
  reviewId: string;
  ownerId: string;
  ownerName?: string;
  comment: string;
  editedAt?: string;
  createdAt: string;
}

export interface Review {
  id: string;
  bookingId: string;
  vehicleId: string;
  customerId: string;
  ownerId: string;
  customerName: string;
  rating: number; // 1-5
  title?: string;
  comment: string;
  photos: string[]; // Cloudinary URLs
  tags: string[];
  status: ReviewStatus;
  flagCount: number;
  flagReason?: string;
  adminNote?: string;
  editedAt?: string;
  editCount: number;
  isVerifiedBooking: boolean;
  helpfulCount: number;
  reply?: ReviewReply;
  createdAt: string;
  updatedAt: string;
}

export interface ReviewReport {
  id: string;
  reviewId: string;
  reportedBy: string;
  reason: string;
  details?: string;
  status: ReviewReportStatus;
  createdAt: string;
}

export type ReviewAuditAction =
  | "created"
  | "edited"
  | "replied"
  | "reply_edited"
  | "flagged"
  | "hidden"
  | "restored"
  | "flags_dismissed"
  | "deleted"
  | "reply_deleted";

export interface ReviewAuditEntry {
  id: string;
  reviewId?: string;
  replyId?: string;
  action: ReviewAuditAction;
  actorId?: string;
  actorRole?: string;
  oldValue?: Record<string, unknown>;
  newValue?: Record<string, unknown>;
  reason?: string;
  createdAt: string;
}

export interface Payment {
  id: string;
  bookingId: string;
  amount: number; // RWF
  method: PaymentMethod;
  point: PaymentPoint;
  confirmedByAdmin: boolean;
  createdAt: string;
}

export interface Dispute {
  id: string;
  bookingId: string;
  raisedBy: string;
  description: string;
  status: "open" | "investigating" | "resolved";
  resolution?: string;
  createdAt: string;
}

export interface AppNotification {
  id: string;
  userId: string;
  type: "booking" | "payment" | "kyc" | "system" | "promo" | "review";
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
}

export interface KycDocument {
  id: string;
  userId: string;
  type: "national_id" | "passport" | "drivers_license" | "vehicle_registration" | "insurance" | "inspection";
  url: string;
  status: KycStatus;
  createdAt: string;
}

export interface Testimonial {
  id: string;
  name: string;
  location: string;
  quote: string;
  rating: number;
  avatar?: string;
}

// ─── Feature types ───────────────────────────────────────────────────────────

export type LoyaltyTier = "bronze" | "silver" | "gold" | "platinum";

export interface LoyaltyAccount {
  userId: string;
  points: number;
  tier: LoyaltyTier;
  updatedAt: string;
}

export interface PointsTransaction {
  id: string;
  userId: string;
  bookingId?: string;
  delta: number; // +earned / -redeemed
  reason: string;
  createdAt: string;
}

export type ReferralStatus = "pending" | "completed" | "rewarded";

export interface Referral {
  id: string;
  referrerId: string;
  refereeId?: string;
  code: string;
  status: ReferralStatus;
  rewardAmount: number; // RWF
  createdAt: string;
}

export type InspectionType = "pickup" | "return";

export interface Inspection {
  id: string;
  bookingId: string;
  type: InspectionType;
  photos: string[];
  customerSignature?: string;
  ownerSignature?: string;
  notes?: string;
  fuelLevel?: number; // 0-100
  odometerKm?: number;
  createdBy?: string;
  createdAt: string;
}

export type SosType = "accident" | "breakdown" | "safety" | "other";
export type SosStatus = "open" | "acknowledged" | "resolved";

export interface SosAlert {
  id: string;
  userId: string;
  bookingId?: string;
  type: SosType;
  lat?: number;
  lng?: number;
  status: SosStatus;
  createdAt: string;
}

export interface TripLocation {
  id: string;
  bookingId: string;
  lat: number;
  lng: number;
  createdAt: string;
}

export type PostCategory = "travel" | "tips" | "news" | "destinations";

export interface Post {
  id: string;
  slug: string;
  title: string;
  excerpt?: string;
  content: string; // markdown-ish
  coverImage?: string;
  category: PostCategory;
  tags: string[];
  authorId?: string;
  publishedAt?: string;
  createdAt: string;
}

export type CreditTerms = "prepaid" | "net15" | "net30";
export type CorporateStatus = "pending" | "approved" | "suspended";

export interface CorporateAccount {
  id: string;
  companyName: string;
  tin?: string;
  contactName: string;
  contactEmail: string;
  contactPhone?: string;
  creditTerms: CreditTerms;
  status: CorporateStatus;
  createdAt: string;
}

export interface CorporateMember {
  id: string;
  accountId: string;
  userId: string;
  role: "admin" | "member";
  costCenter?: string;
}

export interface Invoice {
  id: string;
  accountId: string;
  periodStart: string;
  periodEnd: string;
  amount: number; // RWF
  status: "draft" | "sent" | "paid" | "overdue";
  createdAt: string;
}

export interface AirportBooking {
  id: string;
  bookingId: string;
  flightNumber: string;
  arrivalTime?: string;
  terminal?: string;
  meetGreet: boolean;
  createdAt: string;
}

export interface LocationEntry {
  id: string;
  name: string;
  province: string;
  lat?: number;
  lng?: number;
  isPopular: boolean;
}

export interface AvailabilityEntry {
  id: string;
  vehicleId: string;
  date: string; // ISO date
  status: "blocked" | "available";
}

export interface SearchQuery {
  id: string;
  userId?: string;
  rawQuery: string;
  parsed?: ParsedSearch;
  resultsCount: number;
  createdAt: string;
}

export interface ParsedSearch {
  type?: CarType;
  location?: string;
  days?: number;
  startDate?: string;
  endDate?: string;
  seats?: number;
  maxPrice?: number;
}

export type ConciergeMessageRole = "user" | "assistant";

export interface ConciergeMessage {
  role: ConciergeMessageRole;
  content: string;
}

export interface ConciergeRecommendation {
  carType: CarType;
  location: string;
  startDate?: string;
  endDate?: string;
  days?: number;
  passengers?: number;
  itinerary: string[];
  fuelEstimate: string;
  roadConditions: string;
  lodging: string[];
  routes: string[];
}

export interface ConciergeResponse {
  message: string;
  recommendation: ConciergeRecommendation;
  vehicles: Vehicle[];
  source: "llm" | "rules";
}

export type Locale = "en" | "rw" | "fr";
