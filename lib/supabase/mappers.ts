import type {
  AirportBooking,
  AvailabilityEntry,
  Booking,
  CorporateAccount,
  CorporateMember,
  Inspection,
  Invoice,
  LocationEntry,
  LoyaltyAccount,
  PointsTransaction,
  Post,
  Referral,
  Review,
  ReviewAuditEntry,
  ReviewReply,
  ReviewReport,
  SosAlert,
  TripLocation,
  User,
  Vehicle,
} from "@/types";

// ─── snake_case (Postgres) ↔ camelCase (app domain) ──────────────────────────

/* eslint-disable @typescript-eslint/no-explicit-any */

export const userFromRow = (r: any): User => ({
  id: r.id,
  role: r.role,
  name: r.name,
  email: r.email,
  phone: r.phone ?? "",
  whatsappNumber: r.whatsapp_number ?? undefined,
  whatsappVerified: r.whatsapp_verified ?? false,
  whatsappOptIn: r.whatsapp_opt_in ?? true,
  avatar: r.avatar ?? undefined,
  kycStatus: r.kyc_status ?? "none",
  createdAt: r.created_at,
  businessName: r.business_name ?? undefined,
  payoutMethod: r.payout_method ?? undefined,
  payoutDetails: r.payout_details ?? undefined,
  avgResponseMinutes: r.avg_response_minutes ?? undefined,
  referralCode: r.referral_code ?? undefined,
  referredBy: r.referred_by ?? undefined,
  preferredCurrency: r.preferred_currency ?? undefined,
  preferredLocale: r.preferred_locale ?? undefined,
  country: r.country ?? "RW",
  suspendedAt: r.suspended_at ?? undefined,
  deletedAt: r.deleted_at ?? undefined,
});

export const userToRow = (u: User) => ({
  id: u.id,
  role: u.role,
  name: u.name,
  email: u.email,
  phone: u.phone,
  avatar: u.avatar ?? null,
  kyc_status: u.kycStatus,
  business_name: u.businessName ?? null,
  payout_method: u.payoutMethod ?? null,
  payout_details: u.payoutDetails ?? null,
  avg_response_minutes: u.avgResponseMinutes ?? null,
  referral_code: u.referralCode ?? null,
  referred_by: u.referredBy ?? null,
  preferred_currency: u.preferredCurrency ?? "RWF",
  preferred_locale: u.preferredLocale ?? "en",
  country: u.country ?? "RW",
});

export const vehicleFromRow = (r: any): Vehicle => ({
  id: r.id,
  ownerId: r.owner_id,
  make: r.make,
  model: r.model,
  year: r.year,
  plate: r.plate,
  type: r.type,
  transmission: r.transmission,
  fuel: r.fuel,
  seats: r.seats,
  pricePerDay: r.price_per_day,
  location: r.location,
  district: r.district ?? undefined,
  coordinates:
    r.lat != null && r.lng != null ? { lat: r.lat, lng: r.lng } : undefined,
  images: r.images ?? [],
  features: r.features ?? [],
  description: r.description ?? "",
  status: r.status,
  verified: r.verified ?? false,
  rating: Number(r.rating ?? 0),
  reviewCount: r.review_count ?? 0,
  tripsCompleted: r.trips_completed ?? 0,
  paymentMethods: r.payment_methods ?? ["cash", "momo", "card"],
  airportApproved: r.airport_approved ?? false,
  country: r.country ?? "RW",
  createdAt: r.created_at,
});

export const vehicleToRow = (v: Vehicle) => ({
  id: v.id,
  owner_id: v.ownerId,
  make: v.make,
  model: v.model,
  year: v.year,
  plate: v.plate,
  type: v.type,
  transmission: v.transmission,
  fuel: v.fuel,
  seats: v.seats,
  price_per_day: v.pricePerDay,
  location: v.location,
  district: v.district ?? null,
  lat: v.coordinates?.lat ?? null,
  lng: v.coordinates?.lng ?? null,
  images: v.images,
  features: v.features,
  description: v.description,
  status: v.status,
  verified: v.verified,
  rating: v.rating,
  review_count: v.reviewCount,
  trips_completed: v.tripsCompleted,
  payment_methods: v.paymentMethods,
  airport_approved: v.airportApproved,
  country: v.country ?? "RW",
});

export const bookingFromRow = (r: any): Booking => ({
  id: r.id,
  customerId: r.customer_id,
  vehicleId: r.vehicle_id,
  ownerId: r.owner_id,
  startDate: r.start_date,
  endDate: r.end_date,
  pickupLocation: r.pickup_location,
  returnLocation: r.return_location,
  extras: r.extras ?? [],
  totalPrice: r.total_price,
  bookingFee: 0,
  status: r.status,
  paymentMethod: r.payment_method,
  paymentPoint: r.payment_point,
  paymentConfirmed: r.payment_confirmed ?? false,
  qrCode: r.qr_code,
  driverName: r.driver_name ?? undefined,
  driverLicense: r.driver_license ?? undefined,
  driverIdNumber: r.driver_id_number ?? undefined,
  qrToken: r.qr_token ?? undefined,
  pickedUpAt: r.picked_up_at ?? undefined,
  returnedAt: r.returned_at ?? undefined,
  ownerResponseDeadline: r.owner_response_deadline ?? undefined,
  ownerRespondedAt: r.owner_responded_at ?? undefined,
  pointsRedeemed: r.points_redeemed ?? 0,
  pointsEarned: r.points_earned ?? 0,
  corporateAccountId: r.corporate_account_id ?? undefined,
  costCenter: r.cost_center ?? undefined,
  poNumber: r.po_number ?? undefined,
  country: r.country ?? "RW",
  createdAt: r.created_at,
});

export const bookingToRow = (b: Booking) => ({
  id: b.id,
  customer_id: b.customerId,
  vehicle_id: b.vehicleId,
  owner_id: b.ownerId,
  start_date: b.startDate,
  end_date: b.endDate,
  pickup_location: b.pickupLocation,
  return_location: b.returnLocation,
  extras: b.extras,
  total_price: b.totalPrice,
  booking_fee: 0,
  status: b.status,
  payment_method: b.paymentMethod,
  payment_point: b.paymentPoint,
  payment_confirmed: b.paymentConfirmed,
  qr_code: b.qrCode,
  driver_name: b.driverName ?? null,
  driver_license: b.driverLicense ?? null,
  driver_id_number: b.driverIdNumber ?? null,
  qr_token: b.qrToken ?? null,
  picked_up_at: b.pickedUpAt ?? null,
  returned_at: b.returnedAt ?? null,
  owner_response_deadline: b.ownerResponseDeadline ?? null,
  owner_responded_at: b.ownerRespondedAt ?? null,
  points_redeemed: b.pointsRedeemed ?? 0,
  points_earned: b.pointsEarned ?? 0,
  corporate_account_id: b.corporateAccountId ?? null,
  cost_center: b.costCenter ?? null,
  po_number: b.poNumber ?? null,
  country: b.country ?? "RW",
});

export const replyFromRow = (r: any): ReviewReply => ({
  id: r.id,
  reviewId: r.review_id,
  ownerId: r.owner_id,
  ownerName: r.owner?.name ?? undefined,
  comment: r.comment,
  editedAt: r.edited_at ?? undefined,
  createdAt: r.created_at,
});

export const reviewFromRow = (r: any): Review => ({
  id: r.id,
  bookingId: r.booking_id,
  vehicleId: r.vehicle_id,
  customerId: r.customer_id,
  ownerId: r.owner_id ?? "",
  customerName: r.customer?.name ?? "Customer",
  rating: r.rating,
  title: r.title ?? undefined,
  comment: r.comment ?? "",
  photos: Array.isArray(r.photos) ? r.photos : [],
  tags: r.tags ?? [],
  status: r.status ?? "published",
  flagCount: Array.isArray(r.flagged_by) ? r.flagged_by.length : 0,
  flagReason: r.flag_reason ?? undefined,
  adminNote: r.admin_note ?? undefined,
  editedAt: r.edited_at ?? undefined,
  editCount: r.edit_count ?? 0,
  isVerifiedBooking: r.is_verified_booking ?? true,
  helpfulCount: r.helpful_count ?? 0,
  reply: r.reply ? replyFromRow(Array.isArray(r.reply) ? r.reply[0] : r.reply) : undefined,
  createdAt: r.created_at,
  updatedAt: r.updated_at ?? r.created_at,
});

export const reviewToRow = (r: Review) => ({
  id: r.id,
  booking_id: r.bookingId,
  vehicle_id: r.vehicleId,
  customer_id: r.customerId,
  owner_id: r.ownerId || null,
  rating: r.rating,
  title: r.title ?? null,
  comment: r.comment,
  photos: r.photos,
  tags: r.tags,
  status: r.status,
  is_verified_booking: r.isVerifiedBooking,
});

export const reviewReportFromRow = (r: any): ReviewReport => ({
  id: r.id,
  reviewId: r.review_id,
  reportedBy: r.reported_by,
  reason: r.reason,
  details: r.details ?? undefined,
  status: r.status,
  createdAt: r.created_at,
});

export const reviewAuditFromRow = (r: any): ReviewAuditEntry => ({
  id: r.id,
  reviewId: r.review_id ?? undefined,
  replyId: r.reply_id ?? undefined,
  action: r.action,
  actorId: r.actor_id ?? undefined,
  actorRole: r.actor_role ?? undefined,
  oldValue: r.old_value ?? undefined,
  newValue: r.new_value ?? undefined,
  reason: r.reason ?? undefined,
  createdAt: r.created_at,
});

// ─── Feature mappers ─────────────────────────────────────────────────────────

export const locationFromRow = (r: any): LocationEntry => ({
  id: r.id,
  name: r.name,
  province: r.province,
  lat: r.lat ?? undefined,
  lng: r.lng ?? undefined,
  isPopular: r.is_popular ?? false,
});

export const availabilityFromRow = (r: any): AvailabilityEntry => ({
  id: r.id,
  vehicleId: r.vehicle_id,
  date: r.date,
  status: r.status,
});

export const loyaltyFromRow = (r: any): LoyaltyAccount => ({
  userId: r.user_id,
  points: r.points ?? 0,
  tier: r.tier ?? "bronze",
  updatedAt: r.updated_at,
});

export const pointsTxFromRow = (r: any): PointsTransaction => ({
  id: r.id,
  userId: r.user_id,
  bookingId: r.booking_id ?? undefined,
  delta: r.delta,
  reason: r.reason,
  createdAt: r.created_at,
});

export const referralFromRow = (r: any): Referral => ({
  id: r.id,
  referrerId: r.referrer_id,
  refereeId: r.referee_id ?? undefined,
  code: r.code,
  status: r.status,
  rewardAmount: r.reward_amount ?? 0,
  createdAt: r.created_at,
});

export const inspectionFromRow = (r: any): Inspection => ({
  id: r.id,
  bookingId: r.booking_id,
  type: r.type,
  photos: r.photos ?? [],
  customerSignature: r.customer_signature ?? undefined,
  ownerSignature: r.owner_signature ?? undefined,
  notes: r.notes ?? undefined,
  fuelLevel: r.fuel_level ?? undefined,
  odometerKm: r.odometer_km ?? undefined,
  createdBy: r.created_by ?? undefined,
  createdAt: r.created_at,
});

export const inspectionToRow = (i: Inspection) => ({
  id: i.id,
  booking_id: i.bookingId,
  type: i.type,
  photos: i.photos,
  customer_signature: i.customerSignature ?? null,
  owner_signature: i.ownerSignature ?? null,
  notes: i.notes ?? null,
  fuel_level: i.fuelLevel ?? null,
  odometer_km: i.odometerKm ?? null,
  created_by: i.createdBy ?? null,
});

export const sosFromRow = (r: any): SosAlert => ({
  id: r.id,
  userId: r.user_id,
  bookingId: r.booking_id ?? undefined,
  type: r.type,
  lat: r.lat ?? undefined,
  lng: r.lng ?? undefined,
  status: r.status,
  createdAt: r.created_at,
});

export const sosToRow = (s: SosAlert) => ({
  id: s.id,
  user_id: s.userId,
  booking_id: s.bookingId ?? null,
  type: s.type,
  lat: s.lat ?? null,
  lng: s.lng ?? null,
  status: s.status,
});

export const postFromRow = (r: any): Post => ({
  id: r.id,
  slug: r.slug,
  title: r.title,
  excerpt: r.excerpt ?? undefined,
  content: r.content,
  coverImage: r.cover_image ?? undefined,
  category: r.category,
  tags: r.tags ?? [],
  authorId: r.author_id ?? undefined,
  publishedAt: r.published_at ?? undefined,
  createdAt: r.created_at,
});

export const postToRow = (p: Post) => ({
  id: p.id,
  slug: p.slug,
  title: p.title,
  excerpt: p.excerpt ?? null,
  content: p.content,
  cover_image: p.coverImage ?? null,
  category: p.category,
  tags: p.tags,
  author_id: p.authorId ?? null,
  published_at: p.publishedAt ?? null,
});

export const corporateFromRow = (r: any): CorporateAccount => ({
  id: r.id,
  companyName: r.company_name,
  tin: r.tin ?? undefined,
  contactName: r.contact_name,
  contactEmail: r.contact_email,
  contactPhone: r.contact_phone ?? undefined,
  creditTerms: r.credit_terms,
  status: r.status,
  createdAt: r.created_at,
});

export const corporateToRow = (c: CorporateAccount) => ({
  id: c.id,
  company_name: c.companyName,
  tin: c.tin ?? null,
  contact_name: c.contactName,
  contact_email: c.contactEmail,
  contact_phone: c.contactPhone ?? null,
  credit_terms: c.creditTerms,
  status: c.status,
});

export const corpMemberFromRow = (r: any): CorporateMember => ({
  id: r.id,
  accountId: r.account_id,
  userId: r.user_id,
  role: r.role,
  costCenter: r.cost_center ?? undefined,
});

export const invoiceFromRow = (r: any): Invoice => ({
  id: r.id,
  accountId: r.account_id,
  periodStart: r.period_start,
  periodEnd: r.period_end,
  amount: r.amount,
  status: r.status,
  createdAt: r.created_at,
});

export const airportFromRow = (r: any): AirportBooking => ({
  id: r.id,
  bookingId: r.booking_id,
  flightNumber: r.flight_number,
  arrivalTime: r.arrival_time ?? undefined,
  terminal: r.terminal ?? undefined,
  meetGreet: r.meet_greet ?? false,
  createdAt: r.created_at,
});

export const airportToRow = (a: AirportBooking) => ({
  id: a.id,
  booking_id: a.bookingId,
  flight_number: a.flightNumber,
  arrival_time: a.arrivalTime ?? null,
  terminal: a.terminal ?? null,
  meet_greet: a.meetGreet,
});

export const tripLocationFromRow = (r: any): TripLocation => ({
  id: r.id,
  bookingId: r.booking_id,
  lat: r.lat,
  lng: r.lng,
  createdAt: r.created_at,
});

export const tripLocationToRow = (t: TripLocation) => ({
  id: t.id,
  booking_id: t.bookingId,
  lat: t.lat,
  lng: t.lng,
  created_at: t.createdAt,
});
