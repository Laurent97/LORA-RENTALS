"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Award, CalendarDays, Languages, MapPin, Phone, Shield, Star, User } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/empty-state";
import { BRAND } from "@/lib/constants";
import { cn } from "@/lib/utils";

type Driver = {
  id: string;
  fullName: string;
  photoUrl: string | null;
  phone: string | null;
  email: string | null;
  bio: string | null;
  languages: string[];
  yearsOfExperience: number;
  licenseNumber: string | null;
  licenseVerified: boolean;
  isAvailable: boolean;
  specialties: string[];
  rating: number;
  reviewCount: number;
  ownerName: string | null;
};

export default function ToursPage() {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void fetch("/api/drivers")
      .then((r) => r.json())
      .then((data) => {
        setDrivers(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <main className="mx-auto max-w-6xl space-y-8 p-6 lg:p-12">
      <div className="text-center">
        <h1 className="font-display text-3xl font-extrabold tracking-tight text-navy-800">Our Chauffeurs</h1>
        <p className="mt-2 text-muted-foreground">
          Every professional driver on the LORA platform — vetted, licensed, and ready.
        </p>
      </div>

      {loading ? (
        <div className="py-20 text-center text-sm text-muted-foreground">Loading chauffeurs…</div>
      ) : drivers.length === 0 ? (
        <EmptyState icon={User} title="No chauffeurs yet" description="Drivers will appear here once owners add them to the platform." />
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {drivers.map((d) => (
            <Card key={d.id} className="overflow-hidden">
              <CardContent className="p-0">
                <div className="bg-navy-800 p-5 text-white">
                  <div className="flex items-center gap-4">
                    <div className="relative h-16 w-16 overflow-hidden rounded-full border-2 border-gold bg-muted">
                      {d.photoUrl ? (
                        <Image src={d.photoUrl} alt="" fill className="object-cover" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-navy-900 text-silver">
                          <User className="h-6 w-6" />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-display text-lg font-bold text-gold truncate">{d.fullName}</p>
                      <p className="text-xs text-silver flex items-center gap-1">
                        <Star className="h-3 w-3" /> {d.rating.toFixed(1)} · {d.reviewCount} reviews
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-5">
                  <div className="mb-4 flex flex-wrap gap-2">
                    {d.licenseVerified ? (
                      <Badge variant="success" className="capitalize"><Shield className="mr-1 h-3 w-3" /> Verified</Badge>
                    ) : (
                      <Badge variant="warning" className="capitalize"><Shield className="mr-1 h-3 w-3" /> Pending</Badge>
                    )}
                    {d.isAvailable ? (
                      <Badge variant="success" className="capitalize">Available</Badge>
                    ) : (
                      <Badge variant="secondary" className="capitalize">Unavailable</Badge>
                    )}
                  </div>

                  {d.bio && <p className="mb-4 text-sm text-muted-foreground line-clamp-3">{d.bio}</p>}

                  <div className="space-y-2 text-sm text-muted-foreground">
                    {d.languages.length > 0 && (
                      <p className="flex items-center gap-2">
                        <Languages className="h-4 w-4 text-gold" />
                        {d.languages.join(" · ")}
                      </p>
                    )}
                    <p className="flex items-center gap-2">
                      <CalendarDays className="h-4 w-4 text-gold" />
                      {d.yearsOfExperience} years experience
                    </p>
                    {d.licenseNumber && (
                      <p className="flex items-center gap-2">
                        <Award className="h-4 w-4 text-gold" />
                        License: {d.licenseNumber}
                      </p>
                    )}
                    {d.specialties.length > 0 && (
                      <p className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-gold" />
                        {d.specialties.join(" · ")}
                      </p>
                    )}
                  </div>

                  {d.phone && (
                    <a
                      href={`tel:${d.phone.replace(/\s/g, "")}`}
                      className={cn(
                        "mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-gold px-4 py-2.5 text-sm font-semibold text-navy-900 transition hover:bg-gold-300"
                      )}
                    >
                      <Phone className="h-4 w-4" /> Call {d.fullName.split(" ")[0]}
                    </a>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </main>
  );
}
