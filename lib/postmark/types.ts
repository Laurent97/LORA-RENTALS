import type { EmailLocale, Tx } from "./i18n";

export type Scalar = string | number | boolean | null | undefined;
export type TemplateData = Record<string, Scalar>;

export type Stream = "outbound" | "broadcast";

export interface EmailTemplate<D extends TemplateData = TemplateData> {
  /** Human label for the admin gallery */
  name: string;
  category: TemplateCategory;
  stream?: Stream;
  subject: (d: D) => string;
  preheader: (d: D) => string;
  /** Body fragment injected into the base layout */
  html: (d: D, t: Tx) => string;
  /** Optional hand-written plain text; defaults to htmlToText(html) */
  text?: (d: D, t: Tx) => string;
  /** Sample data for previews / test sends */
  sample: D;
}

export type TemplateCategory =
  | "auth"
  | "bookings"
  | "payments"
  | "owner"
  | "loyalty"
  | "admin"
  | "disputes"
  | "inspections"
  | "corporate"
  | "marketing";

// Identity helper that preserves the concrete data type of each template.
export const defineTemplate = <D extends TemplateData>(t: EmailTemplate<D>) => t;

export interface RenderedEmail {
  subject: string;
  preheader: string;
  html: string;
  text: string;
  stream: Stream;
}

export interface SendOptions<D extends TemplateData = TemplateData> {
  to: string;
  templateSlug: string;
  data: D;
  userId?: string;
  locale?: EmailLocale;
  /** Dedupe key — the same key is never sent twice */
  idempotencyKey?: string;
  cc?: string;
  bcc?: string;
  tag?: string;
  attachments?: { Name: string; Content: string; ContentType: string }[];
}

export type EmailStatus = "queued" | "sent" | "delivered" | "opened" | "clicked" | "bounced" | "spam" | "failed" | "skipped";

export interface EmailLogRow {
  id: string;
  user_id: string | null;
  template_slug: string;
  to_email: string;
  subject: string;
  status: EmailStatus;
  locale: string;
  idempotency_key: string | null;
  postmark_message_id: string | null;
  error: string | null;
  data: TemplateData | null;
  opened_at: string | null;
  clicked_at: string | null;
  created_at: string;
  updated_at: string;
}
