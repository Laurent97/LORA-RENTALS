"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { getSupabase } from "@/lib/supabase/client";
import { fmtDate } from "@/lib/utils";

const STATUSES = ["pending", "investigating", "resolved", "dismissed"];

const statusColor: Record<string, "default" | "warning" | "success" | "secondary" | "destructive"> = {
  pending: "warning",
  investigating: "warning",
  resolved: "success",
  dismissed: "secondary",
};

type Report = {
  id: string;
  scam_type: string;
  description: string;
  status: string;
  resolution: string | null;
  created_at: string;
  contact_phone: string | null;
  contact_email: string | null;
  user?: { name: string; email: string; phone?: string } | null;
  booking?: { id: string; status: string } | null;
};

export default function ScamReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const fetchReports = async () => {
    const sb = getSupabase();
    const session = await sb?.auth.getSession();
    const token = session?.data.session?.access_token;
    if (!token) return;
    setLoading(true);
    const url = statusFilter
      ? `/api/admin/scam-reports?status=${statusFilter}`
      : "/api/admin/scam-reports";
    const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    const json = (await res.json().catch(() => ({}))) as { reports?: Report[]; error?: string };
    setReports(json.reports ?? []);
    setLoading(false);
  };

  useEffect(() => {
    void fetchReports();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  const update = async (id: string, status: string, resolution: string) => {
    const sb = getSupabase();
    const session = await sb?.auth.getSession();
    const token = session?.data.session?.access_token;
    if (!token) return;
    const res = await fetch("/api/admin/scam-reports", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ id, status, resolution }),
    });
    if (!res.ok) {
      toast.error("Could not update report");
      return;
    }
    toast.success("Report updated");
    void fetchReports();
  };

  const filtered = reports.filter((r) =>
    `${r.description} ${r.user?.name ?? ""} ${r.contact_email ?? ""} ${r.contact_phone ?? ""}`
      .toLowerCase()
      .includes(filter.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-extrabold tracking-tight">
          Scam Reports
        </h1>
        <p className="text-sm text-muted-foreground">
          Customer fraud reports and investigation queue
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
        <Input
          placeholder="Search reports…"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="min-w-[240px] flex-1"
        />
        <Select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="w-full sm:w-44"
        >
          <option value="">All statuses</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="p-4">Date</th>
                  <th className="p-4">Reporter</th>
                  <th className="p-4">Type</th>
                  <th className="p-4 min-w-[280px]">Description</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Action</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-muted-foreground">
                      Loading…
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-muted-foreground">
                      No scam reports yet.
                    </td>
                  </tr>
                ) : (
                  filtered.map((r) => (
                    <ReportRow key={r.id} report={r} onUpdate={update} />
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function ReportRow({
  report,
  onUpdate,
}: {
  report: Report;
  onUpdate: (id: string, status: string, resolution: string) => void;
}) {
  const [status, setStatus] = useState(report.status);
  const [resolution, setResolution] = useState(report.resolution ?? "");

  return (
    <tr className="border-b border-border last:border-0">
      <td className="p-4 align-top text-xs text-muted-foreground">
        {fmtDate(report.created_at)}
      </td>
      <td className="p-4 align-top">
        <p className="font-medium">{report.user?.name ?? "Anonymous"}</p>
        <p className="text-xs text-muted-foreground">
          {report.user?.email ?? report.contact_email ?? report.contact_phone ?? "—"}
        </p>
        {report.booking && (
          <p className="text-xs text-muted-foreground">
            Booking: {report.booking.id.slice(0, 8)} · {report.booking.status}
          </p>
        )}
      </td>
      <td className="p-4 align-top capitalize">{report.scam_type.replace("_", " ")}</td>
      <td className="p-4 align-top text-sm">{report.description}</td>
      <td className="p-4 align-top">
        <Badge variant={statusColor[report.status] ?? "default"}>{report.status}</Badge>
      </td>
      <td className="p-4 align-top min-w-[260px]">
        <div className="space-y-2">
          <Select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="w-full"
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </Select>
          <Textarea
            placeholder="Resolution notes"
            value={resolution}
            onChange={(e) => setResolution(e.target.value)}
            rows={2}
          />
          <Button
            size="sm"
            variant="gold"
            className="w-full"
            onClick={() => onUpdate(report.id, status, resolution)}
          >
            Save
          </Button>
        </div>
      </td>
    </tr>
  );
}
