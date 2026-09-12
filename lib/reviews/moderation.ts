// ─── Moderation & anti-abuse ─────────────────────────────────────────────────
// Lightweight server-side screening. Runs inside the API routes before a
// review or reply is persisted; flagged content is stored with status
// 'flagged' so admins see it in the moderation queue.

const BANNED_WORDS = [
  // English profanity (kept short — extend via env or admin settings later)
  "fuck", "shit", "bitch", "asshole", "bastard", "cunt", "nigger", "whore",
  // Kinyarwanda / French slurs & insults commonly reported
  "umusazi", "indaya", "salopard", "connard", "pute",
];

const LINK_RE = /(https?:\/\/|www\.)\S+/i;
const PHONE_RE = /(\+?\d[\d\s().-]{7,}\d)/;
const REPEAT_RE = /(.{10,})\1{2,}/; // same 10+ char chunk repeated 3×

export interface ModerationResult {
  clean: boolean;
  reasons: string[];
}

export function moderateText(text: string): ModerationResult {
  const reasons: string[] = [];
  const lower = text.toLowerCase();
  for (const w of BANNED_WORDS) {
    if (new RegExp(`\\b${w}\\b`, "i").test(lower)) {
      reasons.push("profanity");
      break;
    }
  }
  if (LINK_RE.test(text)) reasons.push("contains_link");
  if (PHONE_RE.test(text)) reasons.push("contains_phone");
  if (REPEAT_RE.test(text)) reasons.push("repeated_text");
  return { clean: reasons.length === 0, reasons };
}
