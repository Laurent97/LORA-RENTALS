// Thin Postmark REST client (server-only). Uses fetch so it runs on Node and
// Edge runtimes with zero dependencies. https://postmarkapp.com/developer/api/email-api

const API = "https://api.postmarkapp.com";

export interface PostmarkMessage {
  From: string;
  To: string;
  Cc?: string;
  Bcc?: string;
  ReplyTo?: string;
  Subject: string;
  HtmlBody: string;
  TextBody: string;
  MessageStream: string;
  Tag?: string;
  TrackOpens?: boolean;
  TrackLinks?: "None" | "HtmlAndText" | "HtmlOnly" | "TextOnly";
  Metadata?: Record<string, string>;
  Headers?: { Name: string; Value: string }[];
  Attachments?: { Name: string; Content: string; ContentType: string }[];
}

export interface PostmarkResponse {
  To: string;
  SubmittedAt: string;
  MessageID: string;
  ErrorCode: number;
  Message: string;
}

export class PostmarkError extends Error {
  constructor(public status: number, public code: number, message: string) {
    super(message);
    this.name = "PostmarkError";
  }
  /** 5xx and 429 are retryable; Postmark 4xx API error codes are not. */
  get retryable() {
    return this.status >= 500 || this.status === 429;
  }
}

export function getPostmarkToken(): string | null {
  return process.env.POSTMARK_SERVER_TOKEN || null;
}

export async function postmarkSend(msg: PostmarkMessage): Promise<PostmarkResponse> {
  const token = getPostmarkToken();
  if (!token) throw new PostmarkError(0, 0, "POSTMARK_SERVER_TOKEN is not set");
  const res = await fetch(`${API}/email`, {
    method: "POST",
    headers: { Accept: "application/json", "Content-Type": "application/json", "X-Postmark-Server-Token": token },
    body: JSON.stringify(msg),
  });
  const json = (await res.json().catch(() => ({}))) as Partial<PostmarkResponse>;
  if (!res.ok || (json.ErrorCode ?? 0) !== 0) {
    throw new PostmarkError(res.status, json.ErrorCode ?? -1, json.Message ?? `Postmark HTTP ${res.status}`);
  }
  return json as PostmarkResponse;
}
