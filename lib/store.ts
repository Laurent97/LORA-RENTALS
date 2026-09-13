"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  AirportBooking,
  AppNotification,
  AvailabilityEntry,
  Booking,
  CorporateAccount,
  CorporateMember,
  Inspection,
  Invoice,
  LocationEntry,
  LoyaltyAccount,
  LoyaltyTier,
  PointsTransaction,
  Post,
  Referral,
  Review,
  SosAlert,
  SosStatus,
  User,
  UserRole,
  Vehicle,
  VehicleStatus,
} from "@/types";
import {
  ALL_USERS,
  BOOKINGS as SEED_BOOKINGS,
  POSTS as SEED_POSTS,
  REVIEWS as SEED_REVIEWS,
  VEHICLES as SEED_VEHICLES,
} from "./data";
import { getSupabase } from "./supabase/client";
import { notifyEmail } from "./postmark/notify-client";
import {
  airportFromRow,
  airportToRow,
  availabilityFromRow,
  bookingFromRow,
  bookingToRow,
  corporateFromRow,
  corporateToRow,
  corpMemberFromRow,
  inspectionFromRow,
  inspectionToRow,
  invoiceFromRow,
  locationFromRow,
  loyaltyFromRow,
  pointsTxFromRow,
  postFromRow,
  postToRow,
  referralFromRow,
  reviewFromRow,
  sosFromRow,
  sosToRow,
  userFromRow,
  vehicleFromRow,
  vehicleToRow,
} from "./supabase/mappers";

// ─── Auth: Supabase Auth first, mock fallback for offline/demo ───────────────
// Demo logins (password "demo1234"): customer@lora.rw / owner@lora.rw / admin@lora.rw
// NOTE: the mock fallback accepts any password for known emails — remove it in production.

export type OtpType = "signup" | "email" | "recovery";
export type VerifyType = OtpType | "magiclink";
export interface PendingProfile {
  name: string;
  phone: string;
  role: UserRole;
  refCode?: string;
  whatsappNumber?: string;
}
export type RegisterResult =
  | { status: "done"; user: User }
  | { status: "verify"; email: string }
  | { status: "error"; error: string };
export type LoginResult =
  | { status: "ok"; user: User }
  | { status: "unconfirmed"; email: string }
  | { status: "error"; error: string };

// Build the public profile row for a freshly authenticated Supabase user.
const profileFor = (id: string, email: string, p: PendingProfile): User => ({
  id,
  role: p.role,
  name: p.name,
  email,
  phone: p.phone,
  whatsappNumber: p.whatsappNumber,
  whatsappVerified: false,
  whatsappOptIn: true,
  kycStatus: "pending",
  referralCode: `LORA-${id.slice(0, 5).toUpperCase()}`,
  createdAt: new Date().toISOString(),
});

interface AppState {
  // auth
  user: User | null;
  authReady: boolean;
  syncAuthSession: () => Promise<void>;
  login: (email: string, password?: string) => Promise<LoginResult>;
  register: (
    name: string,
    email: string,
    phone: string,
    password: string,
    role: UserRole,
    whatsappNumber?: string
  ) => Promise<RegisterResult>;
  /** Profile captured at signup, finalised after the email code is verified */
  pendingProfile: PendingProfile | null;
  /** Verify an 8-digit code (signup confirmation, passwordless login or recovery) */
  verifyOtp: (email: string, token: string, type: VerifyType) => Promise<{ ok: true; user: User } | { ok: false; error: string }>;
  resendOtp: (email: string, type: OtpType) => Promise<{ ok: boolean; error?: string; verifyType?: VerifyType }>;
  /** Passwordless: email a login code to an existing account */
  sendLoginCode: (email: string) => Promise<{ ok: boolean; error?: string }>;
  sendPasswordReset: (email: string) => Promise<{ ok: boolean; error?: string }>;
  updatePassword: (password: string) => Promise<{ ok: boolean; error?: string }>;
  logout: () => Promise<void>;
  _loadOrCreateProfile: (id: string, email: string) => Promise<User | null>;
  impersonate: (userId: string) => void;

  // currency
  currency: "RWF" | "USD";
  setCurrency: (c: "RWF" | "USD") => void;

  // favorites
  favorites: string[];
  toggleFavorite: (vehicleId: string) => void;

  // data — hydrated from Supabase, falls back to bundled mocks
  hydrated: boolean;
  vehicles: Vehicle[];
  users: User[];
  reviews: Review[];
  notifications: AppNotification[];
  bookings: Booking[];
  hydrate: () => Promise<void>;
  addVehicle: (v: Vehicle) => void;
  updateVehicleStatus: (id: string, status: VehicleStatus) => void;
  addBooking: (b: Booking) => void;
  updateBookingStatus: (id: string, status: Booking["status"]) => void;
  confirmPickup: (id: string) => void;

  // feature data
  locations: LocationEntry[];
  availability: AvailabilityEntry[];
  loyalty: LoyaltyAccount[];
  pointsTx: PointsTransaction[];
  referrals: Referral[];
  inspections: Inspection[];
  sosAlerts: SosAlert[];
  posts: Post[];
  corporateAccounts: CorporateAccount[];
  corporateMembers: CorporateMember[];
  invoices: Invoice[];
  airportBookings: AirportBooking[];

  // feature actions
  setAvailability: (vehicleId: string, dates: string[], status: "blocked" | "available") => void;
  earnPoints: (userId: string, points: number, reason: string, bookingId?: string) => void;
  redeemPoints: (userId: string, points: number, bookingId?: string) => boolean;
  addReferral: (r: Referral) => void;
  addInspection: (i: Inspection) => void;
  addSos: (s: SosAlert) => void;
  updateSosStatus: (id: string, status: SosStatus) => void;
  addPost: (p: Post) => void;
  updatePost: (p: Post) => void;
  addCorporateAccount: (c: CorporateAccount, memberUserId: string) => void;
  updateCorporateStatus: (id: string, status: CorporateAccount["status"]) => void;
  addAirportBooking: (a: AirportBooking) => void;
  updateUserKyc: (userId: string, status: User["kycStatus"]) => void;

  // reviews — local mutations; server routes handle persistence + emails
  upsertReviewLocal: (r: Review) => void;
  flagReviewLocal: (reviewId: string) => void;
  removeReviewLocal: (reviewId: string, replyOnly?: boolean) => void;
  setReviewStatusLocal: (reviewId: string, status: Review["status"]) => void;
  markNotificationRead: (id: string) => void;
}

export const LOYALTY_TIERS: { tier: LoyaltyTier; min: number; label: string }[] = [
  { tier: "bronze", min: 0, label: "Bronze" },
  { tier: "silver", min: 500, label: "Silver" },
  { tier: "gold", min: 1500, label: "Gold" },
  { tier: "platinum", min: 4000, label: "Platinum" },
];

export const tierFor = (points: number): LoyaltyTier =>
  [...LOYALTY_TIERS].reverse().find((t) => points >= t.min)?.tier ?? "bronze";

export const useApp = create<AppState>()(
  persist(
    (set, get) => ({
      user: null,
      authReady: false,

      syncAuthSession: async () => {
        const sb = getSupabase();
        if (!sb) {
          set({ authReady: true });
          return;
        }
        try {
          const { data } = await sb.auth.getSession();
          if (data.session?.user) {
            await get()._loadOrCreateProfile(data.session.user.id, data.session.user.email ?? "");
          } else {
            set({ user: null });
          }
        } finally {
          set({ authReady: true });
        }
      },

      login: async (email, password) => {
        const sb = getSupabase();
        if (sb) {
          if (!password) return { status: "error", error: "Password required" };
          const { data, error } = await sb.auth.signInWithPassword({ email, password });
          if (error) {
            if (/not confirmed/i.test(error.message)) return { status: "unconfirmed", email };
            return { status: "error", error: "Incorrect email or password." };
          }
          const u = await get()._loadOrCreateProfile(data.user.id, email);
          if (!u) return { status: "error", error: "Account profile missing. Contact support." };
          set({ authReady: true });
          return { status: "ok", user: u };
        }
        // Mock fallback — ONLY when Supabase isn't configured (offline demo)
        const found =
          get().users.find((u) => u.email.toLowerCase() === email.toLowerCase()) ??
          ALL_USERS.find((u) => u.email.toLowerCase() === email.toLowerCase());
        if (!found) return { status: "error", error: "No account found for that email. Try a demo account below." };
        set({ user: found });
        void get().hydrate();
        return { status: "ok", user: found };
      },

      pendingProfile: null,

      register: async (name, email, phone, password, role, whatsappNumber) => {
        const sb = getSupabase();
        const pending: PendingProfile = { name, phone, role, whatsappNumber };
        if (sb) {
          // Server creates the auth user and emails the code via Postmark —
          // Supabase's own mailer is never used and verification is always required.
          const res = await fetch("/api/auth/otp", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ kind: "signup", email, password, name, phone, role, whatsappNumber }),
          });
          const json = await res.json().catch(() => ({}));
          if (!res.ok || !json.ok) return { status: "error", error: json.error ?? "Sign-up failed. Please try again." };
          set({ pendingProfile: pending });
          // Project has autoconfirm on — no code needed, sign in directly.
          if (json.confirmed) {
            const { data: signIn, error: signInErr } = await sb.auth.signInWithPassword({ email, password });
            if (signInErr || !signIn.user) return { status: "verify", email };
            const u = await get()._loadOrCreateProfile(signIn.user.id, email);
            if (!u) return { status: "error", error: "Account profile missing. Contact support." };
            return { status: "done", user: u };
          }
          return { status: "verify", email };
        }
        // mock fallback
        const user: User = {
          ...profileFor(`usr-${Date.now()}`, email, pending),
          referralCode: `LORA-${Date.now().toString(36).toUpperCase().slice(-5)}`,
        };
        set({ user });
        return { status: "done", user };
      },

      verifyOtp: async (email, token, type) => {
        const sb = getSupabase();
        if (!sb) return { ok: false, error: "Verification requires Supabase." };
        const types: VerifyType[] = type === "email" ? ["email", "signup", "magiclink"] : [type];
        let lastError: string | undefined;
        for (const verifyType of types) {
          const { data, error } = await sb.auth.verifyOtp({ email, token, type: verifyType });
          if (!error && data.user) {
            const u = await get()._loadOrCreateProfile(data.user.id, email);
            if (!u) return { ok: false, error: "Could not create your profile. Contact support." };
            return { ok: true, user: u };
          }
          lastError = error?.message;
        }
        return { ok: false, error: lastError ?? "Invalid or expired code." };
      },

      resendOtp: async (email, type) => {
        const sb = getSupabase();
        if (!sb) return { ok: false, error: "Requires Supabase." };
        const res = await fetch("/api/auth/otp", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ kind: "resend", resendType: type === "email" ? "login" : type, email }),
        });
        const json = await res.json().catch(() => ({}));
        return res.ok && json.ok
          ? { ok: true, verifyType: json.verifyType as VerifyType | undefined }
          : { ok: false, error: json.error ?? "Could not resend" };
      },

      sendLoginCode: async (email) => {
        const sb = getSupabase();
        if (!sb) return { ok: false, error: "Passwordless login requires Supabase." };
        const res = await fetch("/api/auth/otp", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ kind: "login", email }),
        });
        const json = await res.json().catch(() => ({}));
        return res.ok && json.ok ? { ok: true } : { ok: false, error: json.error ?? "Could not send code" };
      },

      sendPasswordReset: async (email) => {
        const sb = getSupabase();
        if (!sb) return { ok: false, error: "Password reset requires Supabase." };
        const res = await fetch("/api/auth/otp", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ kind: "recovery", email }),
        });
        const json = await res.json().catch(() => ({}));
        return res.ok && json.ok ? { ok: true } : { ok: false, error: json.error ?? "Could not send reset code" };
      },

      updatePassword: async (password) => {
        const sb = getSupabase();
        if (!sb) return { ok: false, error: "Requires Supabase." };
        const { error } = await sb.auth.updateUser({ password });
        return error ? { ok: false, error: error.message } : { ok: true };
      },

      // Load the public profile for an authenticated auth.user; create it from the
      // pending signup profile (or auth metadata) on first verified login.
      _loadOrCreateProfile: async (id, email) => {
        const sb = getSupabase();
        if (!sb) return null;
        const { data: profile } = await sb.from("users").select("*").eq("id", id).maybeSingle();
        if (profile) {
          const u = userFromRow(profile);
          set({ user: u, pendingProfile: null });
          void get().hydrate(); // refetch with the user's RLS scope
          return u;
        }
        const meta = (await sb.auth.getUser()).data.user?.user_metadata ?? {};
        const pending: PendingProfile = get().pendingProfile ?? {
          name: String(meta.name ?? email.split("@")[0]),
          phone: String(meta.phone ?? ""),
          whatsappNumber: String(meta.whatsapp_number ?? ""),
          role: meta.role === "owner" ? "owner" : "customer",
        };
        const user = profileFor(id, email, pending);
        const session = (await sb.auth.getSession()).data.session;
        if (!session?.access_token) return null;
        const response = await fetch("/api/auth/profile", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
          body: JSON.stringify({
            name: user.name,
            phone: user.phone,
            role: user.role,
            whatsappNumber: user.whatsappNumber,
          }),
        });
        if (!response.ok) {
          console.warn("profile create failed:", await response.text().catch(() => ""));
          return null;
        }
        set({ user, pendingProfile: null });
        void get().hydrate();
        void notifyEmail("user.registered", user.id);
        return user;
      },

      logout: async () => {
        const sb = getSupabase();
        if (sb) await sb.auth.signOut();
        set({ user: null, bookings: [] });
        void get().hydrate();
      },

      impersonate: (userId) => {
        const u = get().users.find((x) => x.id === userId);
        if (u) set({ user: u });
      },

      currency: "RWF",
      setCurrency: (c) => {
        set({ currency: c });
        // persist preference to the user's profile when logged in
        const sb = getSupabase();
        const uid = get().user?.id;
        if (sb && uid) {
          sb.from("currency_preferences")
            .upsert({ user_id: uid, preferred_currency: c, updated_at: new Date().toISOString() })
            .then(({ error }) => error && console.warn("currency pref sync failed:", error.message));
        }
      },

      favorites: [],
      toggleFavorite: (vehicleId) =>
        set((s) => ({
          favorites: s.favorites.includes(vehicleId)
            ? s.favorites.filter((f) => f !== vehicleId)
            : [...s.favorites, vehicleId],
        })),

      hydrated: false,
      vehicles: SEED_VEHICLES,
      users: ALL_USERS,
      reviews: SEED_REVIEWS,
      notifications: [],
      bookings: SEED_BOOKINGS,
      locations: [],
      availability: [],
      loyalty: [],
      pointsTx: [],
      referrals: [],
      inspections: [],
      sosAlerts: [],
      posts: SEED_POSTS,
      corporateAccounts: [],
      corporateMembers: [],
      invoices: [],
      airportBookings: [],

      hydrate: async () => {
        const sb = getSupabase();
        if (!sb) {
          set({ hydrated: true });
          return;
        }
        try {
          // Embedded reply join needs review_replies — fall back to a plain
          // select if the migration hasn't been run on this project yet.
          let reviewsRes = await sb
            .from("reviews")
            .select("*, customer:users!customer_id(name), reply:review_replies(*, owner:users!owner_id(name))");
          if (reviewsRes.error) {
            console.warn("[hydrate] reviews join failed, retrying plain:", reviewsRes.error.message);
            reviewsRes = await sb.from("reviews").select("*, customer:users!customer_id(name)");
          }
          const uid = get().user?.id;
          const [u, v, b, n, loc, av, loy, pts, ref, insp, sos, posts, corp, cm, inv, ap, fx] =
            await Promise.all([
              sb.from("users").select("*"),
              sb.from("vehicles").select("*"),
              sb.from("bookings").select("*"),
              sb.from("notifications").select("*").order("created_at", { ascending: false }).limit(50),
              sb.from("locations").select("*"),
              sb.from("vehicle_availability").select("*"),
              sb.from("loyalty_points").select("*"),
              sb.from("points_transactions").select("*"),
              sb.from("referrals").select("*"),
              sb.from("inspections").select("*"),
              sb.from("sos_alerts").select("*"),
              sb.from("posts").select("*"),
              sb.from("corporate_accounts").select("*"),
              sb.from("corporate_members").select("*"),
              sb.from("invoices").select("*"),
              sb.from("airport_bookings").select("*"),
              uid
                ? sb.from("currency_preferences").select("*").eq("user_id", uid).maybeSingle()
                : Promise.resolve({ data: null, error: null }),
            ]);
          const dbBookings = (b.data ?? []).map(bookingFromRow);
          // On re-hydration keep locally-created bookings not yet synced to
          // the DB. On the first hydrate the store still holds seed bookings —
          // drop those entirely so mock ids never mix with real rows.
          const localOnly = get().hydrated
            ? get().bookings.filter((x) => !dbBookings.some((d) => d.id === x.id))
            : [];
          set({
            users: u.data?.length ? u.data.map(userFromRow) : get().users,
            vehicles: v.data?.length ? v.data.map(vehicleFromRow) : get().vehicles,
            reviews: (reviewsRes.data ?? []).map(reviewFromRow),
            notifications: (n.data ?? []).map((x: Record<string, unknown>) => ({
              id: x.id as string,
              userId: x.user_id as string,
              type: x.type as AppNotification["type"],
              title: x.title as string,
              message: x.message as string,
              read: (x.read as boolean) ?? false,
              createdAt: x.created_at as string,
            })),
            bookings: [...localOnly, ...dbBookings],
            locations: (loc.data ?? []).map(locationFromRow),
            availability: (av.data ?? []).map(availabilityFromRow),
            loyalty: (loy.data ?? []).map(loyaltyFromRow),
            pointsTx: (pts.data ?? []).map(pointsTxFromRow),
            referrals: (ref.data ?? []).map(referralFromRow),
            inspections: (insp.data ?? []).map(inspectionFromRow),
            sosAlerts: (sos.data ?? []).map(sosFromRow),
            posts: posts.data?.length ? posts.data.map(postFromRow) : get().posts,
            corporateAccounts: (corp.data ?? []).map(corporateFromRow),
            corporateMembers: (cm.data ?? []).map(corpMemberFromRow),
            invoices: (inv.data ?? []).map(invoiceFromRow),
            airportBookings: (ap.data ?? []).map(airportFromRow),
            currency: (fx.data?.preferred_currency as "RWF" | "USD" | undefined) ?? get().currency,
            hydrated: true,
          });
        } catch {
          set({ hydrated: true }); // stay on bundled mock data
        }
      },

      addVehicle: (v) => {
        const currentUser = get().user;
        if (currentUser?.role === "owner" && currentUser.kycStatus !== "verified") return;
        set((s) => ({ vehicles: [v, ...s.vehicles] }));
        const sb = getSupabase();
        if (sb) {
          sb.from("vehicles")
            .insert(vehicleToRow(v))
            .then(({ error }) => {
              if (error) console.warn("vehicle sync failed:", error.message);
            });
        }
      },

      addBooking: (b) => {
        set((s) => ({ bookings: [b, ...s.bookings] }));
        const sb = getSupabase();
        if (sb) {
          sb.from("bookings")
            .insert(bookingToRow(b))
            .then(({ error }) => {
              if (error) console.warn("booking sync failed:", error.message);
              else void notifyEmail("booking.requested", b.id);
            });
        }
      },

      updateVehicleStatus: (id, status) => {
        const wasPending = get().vehicles.find((v) => v.id === id)?.status === "pending_approval";
        set((s) => ({
          vehicles: s.vehicles.map((v) => (v.id === id ? { ...v, status } : v)),
        }));
        const sb = getSupabase();
        if (sb) {
          sb.from("vehicles")
            .update({ status })
            .eq("id", id)
            .then(({ error }) => {
              if (error) console.warn("vehicle status sync failed:", error.message);
              else if (wasPending && status === "available") void notifyEmail("vehicle.approved", id);
            });
        }
      },

      updateBookingStatus: (id, status) => {
        const patch: Partial<Booking> = { status };
        if (status === "picked_up") patch.pickedUpAt = new Date().toISOString();
        if (status === "returned") patch.returnedAt = new Date().toISOString();
        if (status === "confirmed" || status === "declined")
          patch.ownerRespondedAt = new Date().toISOString();
        set((s) => ({
          bookings: s.bookings.map((b) => (b.id === id ? { ...b, ...patch } : b)),
        }));
        // Loyalty: award 1 pt per RWF 1,000 on completion
        if (status === "completed") {
          const b = get().bookings.find((x) => x.id === id);
          if (b) get().earnPoints(b.customerId, Math.floor(b.totalPrice / 1000), "Rental completed", b.id);
        }
        const sb = getSupabase();
        if (sb) {
          const row: Record<string, unknown> = { status };
          if (patch.pickedUpAt) row.picked_up_at = patch.pickedUpAt;
          if (patch.returnedAt) row.returned_at = patch.returnedAt;
          if (patch.ownerRespondedAt) row.owner_responded_at = patch.ownerRespondedAt;
          const event = (
            {
              confirmed: "booking.confirmed",
              declined: "booking.declined",
              cancelled: "booking.cancelled",
              picked_up: "booking.picked_up",
              returned: "booking.returned",
              completed: "booking.completed",
            } as const
          )[status as string];
          sb.from("bookings")
            .update(row)
            .eq("id", id)
            .then(({ error }) => {
              if (error) console.warn("status sync failed:", error.message);
              else if (event) void notifyEmail(event, id);
            });
        }
      },

      confirmPickup: (id) => {
        get().updateBookingStatus(id, "picked_up");
      },

      // ── Feature actions ──────────────────────────────────────────────────

      setAvailability: (vehicleId, dates, status) => {
        const rows: AvailabilityEntry[] = dates.map((d) => ({
          id: `${vehicleId}-${d}`,
          vehicleId,
          date: d,
          status,
        }));
        set((s) => ({
          availability: [
            ...s.availability.filter(
              (a) => !(a.vehicleId === vehicleId && dates.includes(a.date))
            ),
            ...rows,
          ],
        }));
        const sb = getSupabase();
        if (sb) {
          sb.from("vehicle_availability")
            .upsert(
              dates.map((d) => ({ vehicle_id: vehicleId, date: d, status })),
              { onConflict: "vehicle_id,date" }
            )
            .then(({ error }) => {
              if (error) console.warn("availability sync failed:", error.message);
            });
        }
      },

      earnPoints: (userId, points, reason, bookingId) => {
        const tx: PointsTransaction = {
          id: crypto.randomUUID(),
          userId,
          bookingId,
          delta: points,
          reason,
          createdAt: new Date().toISOString(),
        };
        set((s) => {
          const existing = s.loyalty.find((l) => l.userId === userId);
          const next = existing
            ? s.loyalty.map((l) =>
                l.userId === userId
                  ? { ...l, points: l.points + points, tier: tierFor(l.points + points), updatedAt: new Date().toISOString() }
                  : l
              )
            : [...s.loyalty, { userId, points, tier: tierFor(points), updatedAt: new Date().toISOString() }];
          return { loyalty: next, pointsTx: [tx, ...s.pointsTx] };
        });
        const sb = getSupabase();
        if (sb) {
          const acct = get().loyalty.find((l) => l.userId === userId);
          sb.from("points_transactions")
            .insert({ id: tx.id, user_id: userId, booking_id: bookingId ?? null, delta: points, reason })
            .then(({ error }) => error && console.warn("points tx sync failed:", error.message));
          if (acct) {
            sb.from("loyalty_points")
              .upsert({ user_id: userId, points: acct.points, tier: acct.tier, updated_at: acct.updatedAt })
              .then(({ error }) => error && console.warn("loyalty sync failed:", error.message));
          }
        }
      },

      redeemPoints: (userId, points, bookingId) => {
        const acct = get().loyalty.find((l) => l.userId === userId);
        if (!acct || acct.points < points) return false;
        const tx: PointsTransaction = {
          id: crypto.randomUUID(),
          userId,
          bookingId,
          delta: -points,
          reason: "Redeemed at checkout",
          createdAt: new Date().toISOString(),
        };
        set((s) => ({
          pointsTx: [tx, ...s.pointsTx],
          loyalty: s.loyalty.map((l) =>
            l.userId === userId
              ? { ...l, points: l.points - points, tier: tierFor(l.points - points), updatedAt: new Date().toISOString() }
              : l
          ),
        }));
        const sb = getSupabase();
        if (sb) {
          const next = get().loyalty.find((l) => l.userId === userId);
          sb.from("points_transactions")
            .insert({ id: tx.id, user_id: userId, booking_id: bookingId ?? null, delta: -points, reason: tx.reason })
            .then(({ error }) => error && console.warn("redeem tx sync failed:", error.message));
          if (next) {
            sb.from("loyalty_points")
              .upsert({ user_id: userId, points: next.points, tier: next.tier, updated_at: next.updatedAt })
              .then(({ error }) => error && console.warn("loyalty sync failed:", error.message));
          }
        }
        return true;
      },

      addReferral: (r) => {
        set((s) => ({ referrals: [r, ...s.referrals] }));
        const sb = getSupabase();
        if (sb) {
          sb.from("referrals")
            .insert({
              id: r.id,
              referrer_id: r.referrerId,
              referee_id: r.refereeId ?? null,
              code: r.code,
              status: r.status,
              reward_amount: r.rewardAmount,
            })
            .then(({ error }) => error && console.warn("referral sync failed:", error.message));
        }
      },

      addInspection: (i) => {
        set((s) => ({ inspections: [i, ...s.inspections] }));
        const sb = getSupabase();
        if (sb) {
          sb.from("inspections")
            .insert(inspectionToRow(i))
            .then(({ error }) => {
              if (error) console.warn("inspection sync failed:", error.message);
              else void notifyEmail("inspection.created", i.id);
            });
        }
      },

      addSos: (s2) => {
        set((s) => ({ sosAlerts: [s2, ...s.sosAlerts] }));
        const sb = getSupabase();
        if (sb) {
          sb.from("sos_alerts")
            .insert(sosToRow(s2))
            .then(({ error }) => {
              if (error) console.warn("sos sync failed:", error.message);
              else void notifyEmail("sos.created", s2.id);
            });
        }
      },

      updateSosStatus: (id, status) => {
        set((s) => ({
          sosAlerts: s.sosAlerts.map((a) => (a.id === id ? { ...a, status } : a)),
        }));
        const sb = getSupabase();
        if (sb) {
          sb.from("sos_alerts")
            .update({ status })
            .eq("id", id)
            .then(({ error }) => error && console.warn("sos status sync failed:", error.message));
        }
      },

      addPost: (p) => {
        set((s) => ({ posts: [p, ...s.posts] }));
        const sb = getSupabase();
        if (sb) {
          sb.from("posts")
            .insert(postToRow(p))
            .then(({ error }) => error && console.warn("post sync failed:", error.message));
        }
      },

      updatePost: (p) => {
        set((s) => ({ posts: s.posts.map((x) => (x.id === p.id ? p : x)) }));
        const sb = getSupabase();
        if (sb) {
          sb.from("posts")
            .update(postToRow(p))
            .eq("id", p.id)
            .then(({ error }) => error && console.warn("post update failed:", error.message));
        }
      },

      addCorporateAccount: (c, memberUserId) => {
        const member: CorporateMember = {
          id: crypto.randomUUID(),
          accountId: c.id,
          userId: memberUserId,
          role: "admin",
        };
        set((s) => ({
          corporateAccounts: [c, ...s.corporateAccounts],
          corporateMembers: [member, ...s.corporateMembers],
        }));
        const sb = getSupabase();
        if (sb) {
          sb.from("corporate_accounts")
            .insert(corporateToRow(c))
            .then(({ error }) => error && console.warn("corp sync failed:", error.message));
          sb.from("corporate_members")
            .insert({ id: member.id, account_id: c.id, user_id: memberUserId, role: "admin" })
            .then(({ error }) => error && console.warn("corp member sync failed:", error.message));
        }
      },

      updateCorporateStatus: (id, status) => {
        set((s) => ({
          corporateAccounts: s.corporateAccounts.map((c) => (c.id === id ? { ...c, status } : c)),
        }));
        const sb = getSupabase();
        if (sb) {
          sb.from("corporate_accounts")
            .update({ status })
            .eq("id", id)
            .then(({ error }) => {
              if (error) console.warn("corp status sync failed:", error.message);
              else if (status === "approved") void notifyEmail("corporate.approved", id);
            });
        }
      },

      addAirportBooking: (a) => {
        set((s) => ({ airportBookings: [a, ...s.airportBookings] }));
        const sb = getSupabase();
        if (sb) {
          sb.from("airport_bookings")
            .insert(airportToRow(a))
            .then(({ error }) => error && console.warn("airport booking sync failed:", error.message));
        }
      },

      // ── Reviews (local mutations — API routes own persistence) ─────────────

      upsertReviewLocal: (r) =>
        set((s) => ({
          reviews: s.reviews.some((x) => x.id === r.id)
            ? s.reviews.map((x) => (x.id === r.id ? r : x))
            : [r, ...s.reviews],
        })),

      flagReviewLocal: (reviewId) =>
        set((s) => ({
          reviews: s.reviews.map((x) =>
            x.id === reviewId ? { ...x, flagCount: x.flagCount + 1, status: x.flagCount + 1 >= 3 ? "hidden" : "flagged" } : x
          ),
        })),

      removeReviewLocal: (reviewId, replyOnly) =>
        set((s) => ({
          reviews: replyOnly
            ? s.reviews.map((x) => (x.id === reviewId ? { ...x, reply: undefined } : x))
            : s.reviews.filter((x) => x.id !== reviewId),
        })),

      setReviewStatusLocal: (reviewId, status) =>
        set((s) => ({
          reviews: s.reviews.map((x) => (x.id === reviewId ? { ...x, status } : x)),
        })),

      markNotificationRead: (id) => {
        set((s) => ({
          notifications: s.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)),
        }));
        const sb = getSupabase();
        if (sb) {
          sb.from("notifications")
            .update({ read: true })
            .eq("id", id)
            .then(({ error }) => error && console.warn("notification sync failed:", error.message));
        }
      },

      updateUserKyc: (userId, status) => {
        set((s) => ({
          users: s.users.map((u) => (u.id === userId ? { ...u, kycStatus: status } : u)),
        }));
        const sb = getSupabase();
        if (sb) {
          sb.from("users")
            .update({ kyc_status: status })
            .eq("id", userId)
            .then(({ error }) => {
              if (error) console.warn("kyc sync failed:", error.message);
              else if (status === "verified") void notifyEmail("user.kyc_approved", userId);
              else if (status === "rejected") void notifyEmail("user.kyc_rejected", userId);
            });
        }
      },
    }),
    {
      name: "lora-app",
      // bookings are NOT persisted — they come from Supabase (or seeds) so
      // stale mock ids never linger after the DB is seeded.
      partialize: (s) => ({
        user: s.user,
        pendingProfile: s.pendingProfile,
        currency: s.currency,
        favorites: s.favorites,
      }),
    }
  )
);

export const useCurrency = () => useApp((s) => s.currency);
export const useUser = () => useApp((s) => s.user);
