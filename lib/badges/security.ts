import "server-only";
import { createHash, randomUUID } from "crypto";
import jwt from "jsonwebtoken";
import type { DriverBadge } from "./types";

export interface BadgeTokenPayload {
  jti: string;
  badgeNumber: string;
  driverId: string;
  ownerId: string;
}

function getSecret(): string {
  const explicit = process.env.BADGE_SECRET_KEY;
  if (explicit) return explicit;
  const fallback = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!fallback) throw new Error("Missing BADGE_SECRET_KEY and SUPABASE_SERVICE_ROLE_KEY");
  return createHash("sha256").update(fallback).digest("hex");
}

export function signBadgeToken(
  badge: Pick<DriverBadge, "badge_number" | "driver_id" | "owner_id">
): string {
  const secret = getSecret();
  const payload: BadgeTokenPayload = {
    jti: randomUUID(),
    badgeNumber: badge.badge_number,
    driverId: badge.driver_id,
    ownerId: badge.owner_id,
  };
  return jwt.sign(payload, secret, { expiresIn: "365d", issuer: "lorarentals.org" });
}

export function verifyBadgeToken(token: string): BadgeTokenPayload {
  const secret = getSecret();
  const decoded = jwt.verify(token, secret, { issuer: "lorarentals.org" }) as BadgeTokenPayload;
  if (!decoded || typeof decoded !== "object" || !decoded.badgeNumber || !decoded.driverId) {
    throw new Error("Invalid badge token payload");
  }
  return decoded;
}
