import type { Driver } from "@/types";
import type { BadgeField, DriverBadge } from "./types";

export type { BadgeField };

export function renderBadgeFields(driver: Driver, badge: DriverBadge): BadgeField[] {
  return [
    { label: "Badge number", value: badge.badge_number },
    { label: "Driver", value: driver.fullName },
    { label: "License", value: driver.licenseNumber || "—" },
    { label: "Languages", value: driver.languages?.join(", ") || "—" },
    { label: "Experience", value: `${driver.yearsOfExperience} years` },
    { label: "Status", value: badge.status },
    { label: "Issued", value: new Date(badge.issued_at).toLocaleDateString("en-GB") },
    { label: "Expires", value: new Date(badge.expires_at).toLocaleDateString("en-GB") },
    { label: "Phone", value: driver.phone || "—" },
    { label: "Email", value: driver.email || "—" },
  ];
}
