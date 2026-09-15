import type { Driver } from "@/types";

export type DriverBadgeStatus = "active" | "suspended" | "revoked" | "expired";

export interface DriverBadge {
  id: string;
  driver_id: string;
  owner_id: string;
  badge_number: string;
  verification_token: string;
  qr_url: string | null;
  status: DriverBadgeStatus;
  issued_at: string;
  expires_at: string;
  revoked_at: string | null;
  revoked_by: string | null;
  revoke_reason: string | null;
  pdf_url: string | null;
  pdf_generated_at: string | null;
  verify_count: number;
  last_verified_at: string | null;
  last_verified_ip: string | null;
  created_at: string;
  updated_at: string;
}

export interface BadgeVerification {
  id: string;
  badge_id: string | null;
  driver_id: string;
  badge_number: string;
  token: string;
  status: "success" | "failed" | "expired" | "revoked";
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

export interface BadgeField {
  label: string;
  value: string;
}

export interface DriverWithBadge {
  driver: Driver;
  badge: DriverBadge;
}
