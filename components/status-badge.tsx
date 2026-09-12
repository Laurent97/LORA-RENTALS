import { Badge } from "@/components/ui/badge";
import { BOOKING_STATUS_LABELS } from "@/lib/constants";
import type { BookingStatus } from "@/types";

const VARIANT: Record<BookingStatus, "info" | "success" | "warning" | "destructive" | "secondary" | "gold"> = {
  requested: "warning",
  confirmed: "info",
  picked_up: "gold",
  returned: "secondary",
  completed: "success",
  cancelled: "secondary",
  declined: "destructive",
};

export function StatusBadge({ status }: { status: BookingStatus }) {
  return <Badge variant={VARIANT[status]}>{BOOKING_STATUS_LABELS[status]}</Badge>;
}
