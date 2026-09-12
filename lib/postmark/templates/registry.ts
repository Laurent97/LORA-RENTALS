import { auth } from "./auth";
import { bookings } from "./bookings";
import { payments } from "./payments";
import { owner } from "./owner";
import { loyalty } from "./loyalty";
import { admin } from "./admin";
import { disputes } from "./disputes";
import { inspections } from "./inspections";
import { corporate } from "./corporate";
import { marketing } from "./marketing";
import type { EmailTemplate, TemplateData } from "../types";

export const templates = {
  ...auth,
  ...bookings,
  ...payments,
  ...owner,
  ...loyalty,
  ...admin,
  ...disputes,
  ...inspections,
  ...corporate,
  ...marketing,
} as const;

export type TemplateSlug = keyof typeof templates;
export type TemplateDataFor<K extends TemplateSlug> = (typeof templates)[K]["sample"];

export const templateSlugs = Object.keys(templates) as TemplateSlug[];

export function getTemplate(slug: string): EmailTemplate<TemplateData> | null {
  // Erase per-template data types for dynamic (slug-string) lookups.
  return (templates as unknown as Record<string, EmailTemplate<TemplateData>>)[slug] ?? null;
}

export const isTemplateSlug = (s: string): s is TemplateSlug => s in templates;
