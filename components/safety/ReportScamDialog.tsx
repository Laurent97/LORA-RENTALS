"use client";

import { useState } from "react";
import { Siren, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { BRAND } from "@/lib/constants";
import { getSupabase } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const TYPES = [
  { value: "advance_payment", label: "Someone asked for advance payment" },
  { value: "fake_account", label: "Fake LORA account on social media" },
  { value: "fake_booking", label: "Fake booking confirmation" },
  { value: "fake_badge", label: "Fake driver badge" },
  { value: "other", label: "Other" },
];

interface ReportScamDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bookingId?: string;
}

export function ReportScamDialog({
  open,
  onOpenChange,
  bookingId,
}: ReportScamDialogProps) {
  const [type, setType] = useState("advance_payment");
  const [description, setDescription] = useState("");
  const [contact, setContact] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    if (!description.trim()) {
      toast.error("Please describe what happened");
      return;
    }
    setSubmitting(true);
    try {
      const sb = getSupabase();
      const session = sb ? (await sb.auth.getSession()).data.session : null;
      const res = await fetch("/api/scam-reports", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(session?.access_token
            ? { Authorization: `Bearer ${session.access_token}` }
            : {}),
        },
        body: JSON.stringify({
          booking_id: bookingId ?? null,
          scam_type: type,
          description: description.trim(),
          contact_phone: contact.trim() || null,
          contact_email: contact.trim().includes("@") ? contact.trim() : null,
        }),
      });
      const json = (await res.json().catch(() => ({}))) as {
        report?: { id: string };
        error?: string;
      };
      if (!res.ok) throw new Error(json.error ?? "Could not submit report");
      toast.success(
        `Report received — ${json.report?.id ? `Case #${json.report.id.slice(0, 8)}` : "we'll investigate within 24 hours"}`
      );
      setDescription("");
      setContact("");
      setType("advance_payment");
      onOpenChange(false);
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            <span className="flex items-center gap-2">
              <Siren className="h-5 w-5 text-destructive" /> Report a Scam
            </span>
          </DialogTitle>
          <DialogDescription>
            Tell us what happened. Every report helps protect the LORA
            community.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div>
            <Label className="mb-1.5 block">What type of scam?</Label>
            <div className="space-y-2">
              {TYPES.map((t) => (
                <label
                  key={t.value}
                  className="flex cursor-pointer items-center gap-2 rounded-lg border border-border p-2 text-sm hover:bg-secondary"
                >
                  <input
                    type="radio"
                    name="scam-type"
                    value={t.value}
                    checked={type === t.value}
                    onChange={(e) => setType(e.target.value)}
                    className="h-4 w-4 accent-gold"
                  />
                  {t.label}
                </label>
              ))}
            </div>
          </div>

          <div>
            <Label htmlFor="scam-desc" className="mb-1.5 block">
              Describe what happened
            </Label>
            <Textarea
              id="scam-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Include phone numbers, names, screenshots, or any other details..."
              rows={4}
            />
          </div>

          <div>
            <Label htmlFor="scam-contact" className="mb-1.5 block">
              Your contact (optional)
            </Label>
            <Input
              id="scam-contact"
              value={contact}
              onChange={(e) => setContact(e.target.value)}
              placeholder="Phone or email so we can follow up"
            />
          </div>

          <div className="rounded-xl bg-navy-50 p-3 text-xs text-muted-foreground dark:bg-navy-900/30">
            For immediate help, call {BRAND.phone} or email{" "}
            {BRAND.supportEmail}. In an emergency, call Rwanda Police 112.
          </div>
        </div>

        <div className="flex flex-col gap-2 pt-2 sm:flex-row sm:justify-end">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button variant="gold" onClick={submit} disabled={submitting}>
            {submitting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Siren className="mr-2 h-4 w-4" />
            )}
            Submit Report
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
