"use client";

import { useState } from "react";
import { Megaphone, Send } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAllUsers, useHydrated } from "@/lib/lookup";
import { useApp } from "@/lib/store";
import { cn } from "@/lib/utils";

const audiences = [
  { value: "all", label: "All users" },
  { value: "customers", label: "Customers" },
  { value: "owners", label: "Vehicle owners" },
  { value: "drivers", label: "Drivers" },
  { value: "admins", label: "Admins" },
  { value: "corporates", label: "Corporate accounts" },
];

export default function AdminMessagesPage() {
  const { user } = useApp();
  const users = useAllUsers();
  const hydrated = useHydrated();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [audience, setAudience] = useState("all");
  const [channels, setChannels] = useState<string[]>(["in_app"]);
  const [ctaUrl, setCtaUrl] = useState("");
  const [ctaLabel, setCtaLabel] = useState("");
  const [sending, setSending] = useState(false);

  if (!hydrated || !user) {
    return <p className="p-8 text-center text-muted-foreground">Loading…</p>;
  }
  if (user.role !== "admin") {
    return <p className="p-8 text-center text-muted-foreground">Admin access only.</p>;
  }

  const estimated = users.filter((u) => {
    if (u.deletedAt) return false;
    if (audience === "all") return true;
    const target =
      audience === "corporates"
        ? ["corporate_admin", "corporate_manager", "corporate_member"]
        : [audience.replace(/s$/, "")];
    return target.includes(u.role);
  }).length;

  const toggleChannel = (c: string) => {
    setChannels((prev) => (prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]));
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !body.trim()) return toast.error("Title and message body are required.");
    if (channels.length === 0) return toast.error("Select at least one delivery channel.");
    if (!confirm(`Send this broadcast to ~${estimated} ${audience}?`)) return;

    setSending(true);
    try {
      const sb = user ? null : null; // placeholder
      const res = await fetch("/api/broadcast/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          body,
          audience,
          channels,
          ctaUrl: ctaUrl.trim() || undefined,
          ctaLabel: ctaLabel.trim() || undefined,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { ok?: boolean; recipients?: number; error?: string };
      if (res.ok && data.ok) {
        toast.success(`Broadcast sent to ${data.recipients ?? estimated} recipients.`);
        setTitle("");
        setBody("");
        setCtaUrl("");
        setCtaLabel("");
      } else {
        toast.error(data.error ?? "Broadcast failed.");
      }
    } finally {
      setSending(false);
    }
  };

  return (
    <main className="container py-8">
      <div className="mb-6 flex items-center gap-3">
        <Megaphone className="h-7 w-7 text-gold" />
        <h1 className="font-display text-2xl font-extrabold">Broadcast Center</h1>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        <form onSubmit={submit} className="space-y-6">
          <Card>
            <CardContent className="space-y-4 p-6">
              <div>
                <Label>Audience</Label>
                <div className="mt-2 grid gap-2 sm:grid-cols-2">
                  {audiences.map((a) => (
                    <button
                      key={a.value}
                      type="button"
                      onClick={() => setAudience(a.value)}
                      className={cn(
                        "rounded-xl border px-4 py-3 text-left text-sm transition",
                        audience === a.value ? "border-gold bg-gold/10" : "border-border hover:bg-muted"
                      )}
                    >
                      {a.label}
                    </button>
                  ))}
                </div>
                <p className="mt-2 text-sm text-muted-foreground">Estimated reach: {estimated} users</p>
              </div>

              <div>
                <Label>Channels</Label>
                <div className="mt-2 flex flex-wrap gap-3">
                  {[
                    { id: "in_app", label: "In-app notification" },
                    { id: "email", label: "Postmark email" },
                  ].map((c) => (
                    <label
                      key={c.id}
                      className={cn(
                        "flex cursor-pointer items-center gap-2 rounded-xl border px-4 py-2 text-sm transition",
                        channels.includes(c.id) ? "border-gold bg-gold/10" : "border-border"
                      )}
                    >
                      <input
                        type="checkbox"
                        checked={channels.includes(c.id)}
                        onChange={() => toggleChannel(c.id)}
                        className="h-4 w-4 accent-gold"
                      />
                      {c.label}
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <Label htmlFor="title">Title</Label>
                <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="🔴 We're LIVE on TikTok now!" />
              </div>

              <div>
                <Label htmlFor="body">Message</Label>
                <Textarea
                  id="body"
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  rows={5}
                  placeholder="Write the broadcast message here..."
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="ctaLabel">CTA button label (optional)</Label>
                  <Input id="ctaLabel" value={ctaLabel} onChange={(e) => setCtaLabel(e.target.value)} placeholder="Join Live" />
                </div>
                <div>
                  <Label htmlFor="ctaUrl">CTA URL (optional)</Label>
                  <Input id="ctaUrl" value={ctaUrl} onChange={(e) => setCtaUrl(e.target.value)} placeholder="https://..." />
                </div>
              </div>

              <Button
                type="submit"
                disabled={sending}
                className="w-full gap-2 bg-navy-800 text-gold hover:bg-navy-700"
              >
                {sending ? "Sending…" : "Send broadcast"}
                <Send className="h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        </form>

        <Card>
          <CardContent className="space-y-3 p-6">
            <h2 className="font-display text-lg font-bold">In-app preview</h2>
            <div className="rounded-2xl border bg-muted/40 p-4">
              <p className="text-sm font-semibold">{title || "Message title"}</p>
              <p className="mt-1 text-sm text-muted-foreground">{body || "Message body will appear here."}</p>
              {ctaUrl && ctaLabel && (
                <div className="mt-3 inline-block rounded-lg bg-gold px-4 py-2 text-sm font-semibold text-navy-800">
                  {ctaLabel} →
                </div>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Web push and scheduling are coming next. For now this sends in-app + email immediately.
            </p>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
