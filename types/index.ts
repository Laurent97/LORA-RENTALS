// ─── LORA RENTALS LTD — Core Domain Types (Supabase-ready) ───────────────────

export type UserRole = "customer" | "owner" | "driver" | "admin" | "corporate_admin" | "corporate_manager" | "corporate_member";
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
  whatsappNumber?: string;
  whatsappVerified?: boolean;
  whatsappOptIn?: boolean;
  avatar?: string;
  kycStatus: KycStatus;
  country?: string;
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

export interface WhatsAppTap {
  id: string;
  carId?: string;
  ownerId?: string;
  customerId?: string;
  source: string;
  userAgent?: string;
  ipAddress?: string;
  createdAt: string;
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
  country?: string;
  featured?: boolean;
  redFlaggedAt?: string;
  deletedAt?: string;
  rentalMode?: "self_drive" | "with_driver" | "both";
  driverId?: string;
  priceSelfDriveRwf?: number;
  priceWithDriverRwf?: number;
  driverIncludedDailyFee?: number;
  driver?: Driver;
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
  corporateId?: string;
  costCenterId?: string;
  costCenter?: string;
  poNumber?: string;
  bookedByUserId?: string;
  approvalStatus?: "not_required" | "pending" | "approved" | "rejected";
  approvedBy?: string;
  approvedAt?: string;
  paymentType?: "on_pickup" | "invoice";
  rentalMode?: "self_drive" | "with_driver";
  country?: string;
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

export type TrustTier = "bronze" | "silver" | "gold" | "platinum" | "diamond";

export interface TrustScore {
  userId: string;
  total: number;
  kyc: number;
  response: number;
  cancellation: number;
  rating: number;
  damage: number;
  punctuality: number;
  repeatCustomer: number;
  dispute: number;
  tier: TrustTier;
  updatedAt: string;
}

export interface PricingRules {
  vehicleId: string;
  weekendSurchargePct: number;
  longRental7DiscountPct: number;
  longRental30DiscountPct: number;
  lastMinuteDiscountPct: number;
  earlyBirdDiscountPct: number;
  earlyBirdDays: number;
  highDemandBumpPct: number;
  highDemandDates: string[];
  enabled: boolean;
  updatedAt: string;
}

export interface PricingAdjustment {
  label: string;
  amount: number;
}

export interface PricingEstimate {
  basePrice: number;
  days: number;
  dayRate: number;
  adjustments: PricingAdjustment[];
  total: number;
  marketSuggestion?: string;
}

export type WalletTransactionType = "topup" | "refund" | "referral" | "promo" | "payment" | "payout";
export type WalletTransactionStatus = "pending" | "completed" | "cancelled";

export interface WalletTransaction {
  id: string;
  userId: string;
  amount: number;
  type: WalletTransactionType;
  bookingId?: string;
  status: WalletTransactionStatus;
  method?: string;
  notes?: string;
  createdAt: string;
}

export interface Wallet {
  userId: string;
  balance: number;
  updatedAt: string;
}

export interface CorporatePolicies {
  accountId: string;
  maxDailyRate?: number;
  requireApproval: boolean;
  approverEmails: string[];
  costCenters: string[];
  bulkBookingEnabled: boolean;
  updatedAt: string;
}

export interface CorporateBookingApproval {
  id: string;
  bookingId: string;
  accountId: string;
  requestedBy: string;
  status: "pending" | "approved" | "rejected";
  approverNote?: string;
  createdAt: string;
  updatedAt: string;
}

export type LongTermLeaseStatus = "draft" | "pending" | "active" | "paused" | "cancelled" | "completed";

export interface LongTermLease {
  id: string;
  vehicleId: string;
  customerId?: string;
  ownerId: string;
  startDate: string;
  endDate: string;
  monthlyPrice: number;
  maintenanceIncluded: boolean;
  swapAllowed: boolean;
  autoRenewal: boolean;
  status: LongTermLeaseStatus;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Tour {
  id: string;
  driverId: string;
  title: string;
  description?: string;
  price: number;
  durationHours: number;
  languages: string[];
  itinerary: string[];
  status: "available" | "unavailable";
  createdAt: string;
}

export interface InsuranceAddon {
  id: string;
  vehicleId: string;
  tier: "basic" | "standard" | "premium";
  dailyPrice: number;
  liabilityCap: number;
  deductible: number;
  coverage: string[];
  status: "available" | "unavailable";
  createdAt: string;
}

export interface RoadsidePlan {
  id: string;
  vehicleId: string;
  providerName: string;
  dailyPrice: number;
  services: string[];
  responseMinutes?: number;
  status: "available" | "unavailable";
  createdAt: string;
}

export interface Badge {
  id: string;
  slug: string;
  label: string;
  description?: string;
  icon?: string;
  pointsBonus: number;
  createdAt: string;
}

export interface UserBadge {
  userId: string;
  badgeId: string;
  awardedAt: string;
}

export interface Challenge {
  id: string;
  slug: string;
  label: string;
  description?: string;
  points: number;
  condition: Record<string, unknown>;
  startAt?: string;
  endAt?: string;
  createdAt: string;
}

export interface UserChallenge {
  userId: string;
  challengeId: string;
  status: "in_progress" | "completed" | "rewarded";
  progress: number;
  completedAt?: string;
  createdAt: string;
}

export type ReferralRewardType = "team" | "corporate" | "owner" | "social" | "influencer";
export type ReferralRewardStatus = "pending" | "credited" | "cancelled";

export interface ReferralReward {
  id: string;
  userId: string;
  referralId: string;
  rewardType: ReferralRewardType;
  amount: number;
  status: ReferralRewardStatus;
  notes?: string;
  createdAt: string;
}

export interface AnalyticsSummary {
  totalUsers: number;
  totalOwners: number;
  totalCustomers: number;
  totalVehicles: number;
  availableVehicles: number;
  pendingApprovalVehicles: number;
  totalBookings: number;
  completedBookings: number;
  cancelledBookings: number;
  totalRevenue: number;
  topLocations: { location: string; count: number }[];
  topVehicles: { id: string; make: string; model: string; trips: number; revenue: number }[];
  recentSignups: { month: string; count: number }[];
}

export interface CountrySetting {
  country: string;
  name: string;
  currency: string;
  phonePrefix: string;
  vatRate: number;
  bookingFee: number;
  paymentRails: string[];
  updatedAt: string;
}

export interface ApiKey {
  id: string;
  userId: string;
  name: string;
  key: string;
  scopes: string[];
  lastUsed?: string;
  createdAt: string;
}

export interface WhatsAppTemplate {
  id: string;
  slug: string;
  label: string;
  language: string;
  category: "transactional" | "marketing" | "utility" | "authentication";
  body: string;
  variables: string[];
  status: "draft" | "approved" | "rejected";
  createdAt: string;
}

export interface WhatsAppConversation {
  id: string;
  userId: string;
  phone: string;
  direction: "inbound" | "outbound";
  templateSlug?: string;
  body: string;
  messageId?: string;
  status: "sent" | "delivered" | "read" | "failed";
  createdAt: string;
}

export interface EVVehicle {
  vehicleId: string;
  batteryCapacityKwh?: number;
  rangeKm?: number;
  chargeType: string[];
  greenRebatePct: number;
  co2SavedKg: number;
  energyCostPerKm?: number;
  createdAt: string;
}

export interface ChargingStation {
  id: string;
  name: string;
  location: string;
  lat?: number;
  lng?: number;
  connectorTypes: string[];
  powerKw?: number;
  available: boolean;
  createdAt: string;
}

export interface CarSharingCircle {
  id: string;
  name: string;
  ownerId: string;
  location: string;
  rules?: string;
  status: "active" | "paused" | "archived";
  createdAt: string;
}

export interface CarSharingRequest {
  id: string;
  circleId: string;
  requesterId: string;
  startAt: string;
  endAt: string;
  status: "pending" | "approved" | "rejected" | "completed" | "cancelled";
  createdAt: string;
}

export interface VideoKycSession {
  id: string;
  userId: string;
  status: "pending" | "submitted" | "approved" | "rejected";
  recordingUrl?: string;
  selfieUrl?: string;
  documentFrontUrl?: string;
  documentBackUrl?: string;
  livenessScore?: number;
  reviewerNotes?: string;
  submittedAt?: string;
  reviewedAt?: string;
  createdAt: string;
}

export interface RewardCatalogItem {
  id: string;
  slug: string;
  label: string;
  description?: string;
  partnerName?: string;
  pointsCost: number;
  stock?: number;
  status: "available" | "out_of_stock" | "discontinued";
  createdAt: string;
}

export interface UserReward {
  id: string;
  userId: string;
  rewardId: string;
  status: "pending" | "redeemed" | "cancelled";
  code?: string;
  createdAt: string;
}

export interface VehicleEmission {
  vehicleId: string;
  co2GPerKm?: number;
  fuelConsumptionLPer100km?: number;
  offsetProgram?: string;
  verified: boolean;
  updatedAt: string;
}

export interface CarbonOffset {
  id: string;
  userId: string;
  bookingId?: string;
  km: number;
  co2Kg: number;
  offsetRwf: number;
  partner?: string;
  status: "pending" | "verified" | "rejected";
  createdAt: string;
}

export type Locale = "en" | "rw" | "fr";

export type RentalMode = "self_drive" | "with_driver" | "both";
export type DriverGender = "male" | "female" | "other";
export type DriverBackgroundCheckStatus = "pending" | "approved" | "rejected";

export type DriverType = "owner_attached" | "independent";
export type DriverKycStatus = "pending" | "submitted" | "approved" | "rejected";
export type DriverBookingStatus =
  | "pending"
  | "accepted"
  | "declined"
  | "confirmed"
  | "in_progress"
  | "completed"
  | "cancelled"
  | "no_show";
export type DriverBookingServiceType =
  | "full_day"
  | "half_day"
  | "hourly"
  | "airport_pickup"
  | "tour"
  | "long_distance";
export type DriverEarningType = "trip" | "bonus" | "tip" | "penalty";
export type DriverEarningStatus = "pending" | "available" | "paid" | "withdrawn";

export interface Driver {
  id: string;
  ownerId: string;
  userId?: string;
  fullName: string;
  phone?: string;
  whatsapp?: string;
  email?: string;
  dateOfBirth?: string;
  gender?: DriverGender;
  nationality?: string;
  city?: string;
  district?: string;
  languages: string[];
  photoUrl?: string;
  passportPhotoUrl?: string;
  licenseNumber?: string;
  licensePhotoUrl?: string;
  licenseExpiry?: string;
  nationalIdUrl?: string;
  criminalRecordUrl?: string;
  backgroundCheckStatus: DriverBackgroundCheckStatus;
  yearsOfExperience: number;
  bio?: string;
  specialties: string[];
  vehicleTypes: string[];
  driverType: DriverType;
  isIndependent: boolean;
  dailyRateRwf?: number;
  hourlyRateRwf?: number;
  halfDayRateRwf?: number;
  airportPickupRateRwf?: number;
  minHours: number;
  serviceRadiusKm: number;
  homeCity?: string;
  servesCities: string[];
  maxPassengers: number;
  acceptsLongDistance: boolean;
  acceptsAirportPickup: boolean;
  acceptsNightDriving: boolean;
  acceptsOutsideKigali: boolean;
  availableFrom: string;
  availableUntil: string;
  unavailableDates: string[];
  totalTrips: number;
  totalEarningsRwf: number;
  outstandingBalanceRwf: number;
  kycStatus: DriverKycStatus;
  isAvailable: boolean;
  isVerified: boolean;
  approvedBy?: string;
  approvedAt?: string;
  verifiedAt?: string;
  verifiedBy?: string;
  ratingAvg: number;
  ratingCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface DriverBooking {
  id: string;
  bookingId: string;
  driverId: string;
  customerId?: string;
  ownerId?: string;
  serviceType: DriverBookingServiceType;
  startAt: string;
  endAt?: string;
  pickupLocation?: string;
  dropoffLocation?: string;
  passengers?: number;
  rateRwf: number;
  hours?: number;
  days?: number;
  subtotalRwf: number;
  platformCommissionRwf?: number;
  driverNetRwf?: number;
  depositRwf?: number;
  status: DriverBookingStatus;
  contactRevealedAt?: string;
  acceptedAt?: string;
  startedAt?: string;
  completedAt?: string;
  cancelledAt?: string;
  cancelledBy?: string;
  cancellationReason?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DriverAvailability {
  id: string;
  driverId: string;
  date: string;
  isAvailable: boolean;
  availableFrom?: string;
  availableUntil?: string;
  reason?: string;
  createdAt: string;
}

export interface DriverEarning {
  id: string;
  driverId: string;
  driverBookingId?: string;
  amountRwf: number;
  type: DriverEarningType;
  status: DriverEarningStatus;
  paidAt?: string;
  paidMethod?: string;
  paidReference?: string;
  createdAt: string;
}

export interface DriverReview {
  id: string;
  driverId: string;
  bookingId?: string;
  customerId?: string;
  rating: number;
  comment?: string;
  tags: string[];
  status: "published" | "hidden" | "removed";
  createdAt: string;
}
