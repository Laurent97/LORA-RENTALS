"use client";

import { useEffect, useState } from "react";
import { AlertCircle, BadgeCheck, CheckCircle2, Clock3, FileUp, Save, UploadCloud } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useApp } from "@/lib/store";
import { getSupabase } from "@/lib/supabase/client";
import { initials } from "@/lib/utils";
import type { KycStatus } from "@/types";

type DocumentType = "national_id" | "drivers_license" | "vehicle_registration";
type DocumentRow = { id: string; type: DocumentType; url: string; status: KycStatus; created_at: string };

const DOCUMENTS: { type: DocumentType; label: string; hint: string }[] = [
  { type: "national_id", label: "National ID or passport", hint: "Identity document, front and back if applicable" },
  { type: "drivers_license", label: "Driver's license", hint: "Valid Rwanda or international driving license" },
  { type: "vehicle_registration", label: "Vehicle registration", hint: "Registration card for each listed vehicle" },
];

const STATUS_META: Record<KycStatus, { label: string; variant: "success" | "warning" | "destructive" | "secondary"; icon: typeof CheckCircle2 }> = {
  verified: { label: "Verified", variant: "success", icon: CheckCircle2 },
  pending: { label: "Pending review", variant: "warning", icon: Clock3 },
  rejected: { label: "Needs replacement", variant: "destructive", icon: AlertCircle },
  none: { label: "Not submitted", variant: "secondary", icon: FileUp },
};

export default function OwnerProfilePage() {
  const { user } = useApp();
  const [name, setName] = useState(user?.name ?? "");
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [businessName, setBusinessName] = useState(user?.businessName ?? "");
  const [documents, setDocuments] = useState<DocumentRow[]>([]);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<DocumentType | null>(null);

  useEffect(() => {
    if (user) {
      setName(user.name);
      setPhone(user.phone);
      setBusinessName(user.businessName ?? "");
    }
  }, [user]);

  useEffect(() => {
    const sb = getSupabase();
    if (!sb || !user) return;
    sb.from("kyc_documents").select("id, type, url, status, created_at").eq("user_id", user.id).order("created_at", { ascending: false }).then(({ data }) => setDocuments((data ?? []) as DocumentRow[]));
  }, [user]);

  if (!user) return null;

  const saveProfile = async (event: React.FormEvent) => {
    event.preventDefault();
    const sb = getSupabase();
    if (!sb) return toast.error("Profile saving requires Supabase.");
    setSaving(true);
    const { error } = await sb.from("users").update({ name: name.trim(), phone: phone.trim(), business_name: businessName.trim() || null }).eq("id", user.id);
    setSaving(false);
    if (error) return toast.error("Could not save profile");
    useApp.setState({ user: { ...user, name: name.trim(), phone: phone.trim(), businessName: businessName.trim() || undefined } });
    toast.success("Profile saved");
  };

  const uploadDocument = async (type: DocumentType, file: File) => {
    const sb = getSupabase();
    if (!sb) return toast.error("Document uploads require Supabase.");
    if (!file.type.startsWith("image/") && file.type !== "application/pdf") return toast.error("Upload a PDF or image file.");
    if (file.size > 8 * 1024 * 1024) return toast.error("Files must be smaller than 8 MB.");
    setUploading(type);
    const extension = file.name.split(".").pop()?.toLowerCase() ?? "file";
    const path = `kyc/${user.id}/${type}-${Date.now()}.${extension}`;
    const upload = await sb.storage.from("lorarentals").upload(path, file, { contentType: file.type, upsert: false });
    if (upload.error) { setUploading(null); return toast.error("Could not upload document"); }
    const { data: publicFile } = sb.storage.from("lorarentals").getPublicUrl(path);
    const { data: row, error } = await sb.from("kyc_documents").insert({ user_id: user.id, type, url: publicFile.publicUrl, status: "pending" }).select("id, type, url, status, created_at").single();
    if (error || !row) { setUploading(null); return toast.error("Document uploaded but could not be submitted"); }
    await sb.from("users").update({ kyc_status: "pending" }).eq("id", user.id);
    setDocuments((current) => [row as DocumentRow, ...current]);
    useApp.setState({ user: { ...user, kycStatus: "pending" } });
    setUploading(null);
    toast.success("Document submitted for review");
  };

  return <div className="mx-auto max-w-3xl space-y-6"><div><h1 className="font-display text-2xl font-extrabold tracking-tight">Profile &amp; KYC</h1><p className="text-sm text-muted-foreground">Keep your owner details current and submit the documents needed to activate your fleet.</p></div><Card><CardContent className="flex items-center gap-4 p-6"><span className="flex h-16 w-16 items-center justify-center rounded-full bg-navy-800 text-lg font-bold text-gold dark:bg-gold dark:text-navy-900">{initials(user.name)}</span><div><p className="font-display text-lg font-bold">{user.name}</p><p className="text-sm text-muted-foreground">{user.email}</p><Badge variant={user.kycStatus === "verified" ? "success" : user.kycStatus === "rejected" ? "destructive" : "warning"} className="mt-2">{user.kycStatus === "verified" ? <><BadgeCheck className="h-3 w-3" /> KYC verified</> : user.kycStatus === "rejected" ? "KYC needs attention" : "KYC pending"}</Badge></div></CardContent></Card><Card><CardHeader><CardTitle>Owner details</CardTitle></CardHeader><CardContent><form onSubmit={saveProfile} className="grid gap-4 sm:grid-cols-2"><div><Label className="mb-1.5 block">Full name</Label><Input value={name} onChange={(event) => setName(event.target.value)} required /></div><div><Label className="mb-1.5 block">Phone</Label><Input value={phone} onChange={(event) => setPhone(event.target.value)} inputMode="tel" required /></div><div className="sm:col-span-2"><Label className="mb-1.5 block">Business or fleet name</Label><Input value={businessName} onChange={(event) => setBusinessName(event.target.value)} placeholder="Optional" /></div><div className="sm:col-span-2"><Button type="submit" variant="gold" disabled={saving}><Save className="h-4 w-4" /> {saving ? "Saving…" : "Save details"}</Button></div></form></CardContent></Card><Card><CardHeader><CardTitle>Verification documents</CardTitle><p className="text-sm text-muted-foreground">PDF, JPG, PNG or WEBP · maximum 8 MB per file. Documents are reviewed by LORA administrators.</p></CardHeader><CardContent className="space-y-3">{DOCUMENTS.map((document) => { const latest = documents.find((item) => item.type === document.type); const meta = STATUS_META[latest?.status ?? "none"]; const Icon = meta.icon; return <div key={document.type} className="flex flex-col gap-4 rounded-xl border border-border p-4 sm:flex-row sm:items-center"><div className="flex flex-1 items-start gap-3"><Icon className={`mt-0.5 h-5 w-5 ${latest?.status === "verified" ? "text-emerald-500" : latest?.status === "rejected" ? "text-destructive" : "text-gold"}`} /><div><p className="text-sm font-semibold">{document.label}</p><p className="text-xs text-muted-foreground">{document.hint}</p><Badge variant={meta.variant} className="mt-2">{meta.label}</Badge></div></div><label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-border px-3 py-2 text-xs font-semibold hover:bg-secondary"><UploadCloud className="h-4 w-4" /> {uploading === document.type ? "Uploading…" : latest ? "Replace document" : "Upload document"}<input type="file" accept="image/*,.pdf" className="sr-only" disabled={uploading !== null} onChange={(event) => { const file = event.target.files?.[0]; if (file) void uploadDocument(document.type, file); event.currentTarget.value = ""; }} /></label></div>; })}</CardContent></Card></div>;
}