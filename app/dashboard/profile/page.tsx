"use client";

import { useState } from "react";
import { toast } from "sonner";
import { BadgeCheck, FileUp, Save } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { useApp } from "@/lib/store";
import { initials } from "@/lib/utils";

export default function ProfilePage() {
  const { user } = useApp();
  const [saving, setSaving] = useState(false);
  if (!user) return null;

  const save = (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      toast.success("Profile saved");
    }, 600);
  };

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="font-display text-2xl font-extrabold tracking-tight">Profile</h1>
        <p className="text-sm text-muted-foreground">Your details and verification</p>
      </div>

      <Card>
        <CardContent className="flex items-center gap-4 p-6">
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-navy-800 text-lg font-bold text-gold dark:bg-gold dark:text-navy-900">
            {initials(user.name)}
          </span>
          <div>
            <p className="font-display text-lg font-bold">{user.name}</p>
            <p className="text-sm text-muted-foreground">{user.email}</p>
            <Badge
              variant={user.kycStatus === "verified" ? "success" : "warning"}
              className="mt-2"
            >
              {user.kycStatus === "verified" ? (
                <><BadgeCheck className="h-3 w-3" /> KYC verified</>
              ) : (
                "KYC pending"
              )}
            </Badge>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Personal information</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={save} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label className="mb-1.5 block">Full name</Label>
                <Input defaultValue={user.name} />
              </div>
              <div>
                <Label className="mb-1.5 block">Phone</Label>
                <Input defaultValue={user.phone} />
              </div>
            </div>
            <div>
              <Label className="mb-1.5 block">Email</Label>
              <Input type="email" defaultValue={user.email} />
            </div>
            <div>
              <Label className="mb-1.5 block">Preferred payment at pickup</Label>
              <Select defaultValue="momo">
                <option value="cash">Cash</option>
                <option value="momo">MTN MoMo</option>
                <option value="card">Card on-site</option>
              </Select>
            </div>
            <Button type="submit" variant="gold" disabled={saving}>
              <Save className="h-4 w-4" /> {saving ? "Saving…" : "Save changes"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>KYC documents</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {["National ID / Passport", "Driver's license"].map((doc) => (
            <div key={doc} className="flex items-center justify-between rounded-xl border border-dashed border-border p-4">
              <div className="flex items-center gap-3">
                <FileUp className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-semibold">{doc}</p>
                  <p className="text-xs text-muted-foreground">PDF or photo · verified by admin</p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => toast.info("Uploads will use Cloudinary — coming soon")}
              >
                Upload
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
