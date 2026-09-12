import type { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  trend,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  sub?: string;
  trend?: "up" | "down";
}) {
  return (
    <Card>
      <CardContent className="flex items-start justify-between p-5">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
          <p className="mt-1.5 font-display text-2xl font-extrabold tracking-tight">{value}</p>
          {sub && (
            <p
              className={cn(
                "mt-1 text-xs font-medium",
                trend === "up" ? "text-emerald-500" : trend === "down" ? "text-red-500" : "text-muted-foreground"
              )}
            >
              {sub}
            </p>
          )}
        </div>
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-navy-800/5 dark:bg-gold/10">
          <Icon className="h-5 w-5 text-navy-800 dark:text-gold" />
        </div>
      </CardContent>
    </Card>
  );
}
