"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const BOOKINGS_TREND = [
  { m: "Apr", bookings: 18, revenue: 4.2 },
  { m: "May", bookings: 26, revenue: 6.1 },
  { m: "Jun", bookings: 34, revenue: 8.4 },
  { m: "Jul", bookings: 41, revenue: 10.2 },
  { m: "Aug", bookings: 52, revenue: 13.8 },
  { m: "Sep", bookings: 47, revenue: 12.5 },
];

const TOP_LOCATIONS = [
  { location: "Kigali — Gasabo", bookings: 96 },
  { location: "Kigali — Kicukiro", bookings: 71 },
  { location: "Musanze", bookings: 54 },
  { location: "Kigali — Nyarugenge", bookings: 48 },
  { location: "Rubavu", bookings: 33 },
  { location: "Huye", bookings: 21 },
];

export function AdminCharts() {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader><CardTitle>Bookings trend</CardTitle></CardHeader>
        <CardContent className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={BOOKINGS_TREND}>
              <defs>
                <linearGradient id="gBook" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#D4AF37" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="#D4AF37" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="m" fontSize={12} stroke="hsl(var(--muted-foreground))" />
              <YAxis fontSize={12} stroke="hsl(var(--muted-foreground))" />
              <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid hsl(var(--border))", background: "hsl(var(--card))" }} />
              <Area type="monotone" dataKey="bookings" stroke="#D4AF37" strokeWidth={2.5} fill="url(#gBook)" />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Top locations</CardTitle></CardHeader>
        <CardContent className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={TOP_LOCATIONS} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis type="number" fontSize={12} stroke="hsl(var(--muted-foreground))" />
              <YAxis type="category" dataKey="location" fontSize={11} width={130} stroke="hsl(var(--muted-foreground))" />
              <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid hsl(var(--border))", background: "hsl(var(--card))" }} />
              <Bar dataKey="bookings" fill="#0A1F44" radius={[0, 6, 6, 0]} className="dark:fill-gold" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
