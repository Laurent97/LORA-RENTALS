import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

export function Rating({
  value,
  count,
  className,
  size = "sm",
}: {
  value: number;
  count?: number;
  className?: string;
  size?: "sm" | "md";
}) {
  const s = size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4";
  return (
    <div className={cn("flex items-center gap-1", className)}>
      <Star className={cn(s, "fill-gold text-gold")} />
      <span className={cn("font-semibold", size === "sm" ? "text-xs" : "text-sm")}>
        {value > 0 ? value.toFixed(1) : "New"}
      </span>
      {count !== undefined && count > 0 && (
        <span className="text-xs text-muted-foreground">({count})</span>
      )}
    </div>
  );
}
