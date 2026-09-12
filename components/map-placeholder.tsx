import { MapPin } from "lucide-react";

// Swap this for Mapbox GL / Leaflet when wiring real maps.
// Set NEXT_PUBLIC_MAPBOX_TOKEN and render an interactive map here.
export function MapPlaceholder({
  location,
  coordinates,
}: {
  location: string;
  coordinates?: { lat: number; lng: number };
}) {
  return (
    <div className="relative flex h-56 items-center justify-center overflow-hidden rounded-2xl border border-border bg-navy-50 dark:bg-navy-900/50">
      {/* stylised grid */}
      <div
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage:
            "linear-gradient(hsl(var(--border)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--border)) 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }}
      />
      <div className="relative flex flex-col items-center gap-2 text-center">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-navy-800 shadow-lg dark:bg-gold">
          <MapPin className="h-6 w-6 text-gold dark:text-navy-900" />
        </span>
        <p className="font-display text-sm font-bold">{location}</p>
        {coordinates && (
          <p className="text-xs text-muted-foreground">
            {coordinates.lat.toFixed(4)}, {coordinates.lng.toFixed(4)}
          </p>
        )}
        <p className="text-[11px] text-muted-foreground">Interactive map loads with Mapbox token</p>
      </div>
    </div>
  );
}
