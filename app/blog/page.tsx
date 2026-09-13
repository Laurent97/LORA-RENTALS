"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { ArrowRight, Clock, Newspaper } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/empty-state";
import { useApp } from "@/lib/store";
import { cn, fmtDate } from "@/lib/utils";
import type { PostCategory } from "@/types";

const CATEGORIES: { value: PostCategory | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "travel", label: "Travel" },
  { value: "tips", label: "Tips" },
  { value: "news", label: "News" },
  { value: "destinations", label: "Destinations" },
];

const readTime = (content: string) => Math.max(1, Math.round(content.split(/\s+/).length / 200));

export default function BlogPage() {
  const posts = useApp((s) => s.posts).filter((p) => p.publishedAt);
  const [cat, setCat] = useState<PostCategory | "all">("all");
  const list = posts
    .filter((p) => cat === "all" || p.category === cat)
    .sort((a, b) => (b.publishedAt ?? "").localeCompare(a.publishedAt ?? ""));

  return (
    <main className="container py-12">
      <div className="mx-auto max-w-2xl text-center">
        <Badge variant="gold" className="mb-4">LORA Journal</Badge>
        <h1 className="font-display text-3xl font-extrabold tracking-tight md:text-4xl">Travel guides & news</h1>
        <p className="mt-3 text-muted-foreground">
          Road trips, driving tips and destination guides for exploring Rwanda by car.
        </p>
      </div>

      <div className="mt-8 flex flex-wrap justify-center gap-2">
        {CATEGORIES.map((c) => (
          <button
            key={c.value}
            onClick={() => setCat(c.value)}
            className={cn(
              "rounded-full px-4 py-2 text-sm font-semibold transition-colors",
              cat === c.value ? "bg-navy-800 text-gold dark:bg-gold dark:text-navy-900" : "bg-secondary text-muted-foreground hover:text-foreground"
            )}
          >
            {c.label}
          </button>
        ))}
      </div>

      {list.length === 0 ? (
        <div className="mt-12">
          <EmptyState icon={Newspaper} title="No articles yet" description="Check back soon — new guides are published regularly." />
        </div>
      ) : (
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((p) => (
            <Link
              key={p.id}
              href={`/blog/${p.slug}`}
              className="group overflow-hidden rounded-2xl border border-border bg-card transition-shadow hover:shadow-xl"
            >
              <div className="relative aspect-[16/9] overflow-hidden">
                {p.coverImage ? (
                  <Image src={p.coverImage} alt={p.title} fill sizes="(max-width: 768px) 100vw, 50vw" className="object-cover transition-transform duration-500 group-hover:scale-105" />
                ) : (
                  <div className="h-full bg-navy-800" />
                )}
                <Badge variant="gold" className="absolute left-3 top-3 capitalize">{p.category}</Badge>
              </div>
              <div className="p-5">
                <h2 className="font-display text-lg font-bold leading-snug group-hover:text-gold-600 dark:group-hover:text-gold">
                  {p.title}
                </h2>
                {p.excerpt && (
                  <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{p.excerpt}</p>
                )}
                <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
                  <span>{p.publishedAt ? fmtDate(p.publishedAt) : ""} · <Clock className="inline h-3 w-3" /> {readTime(p.content)} min</span>
                  <span className="flex items-center gap-1 font-semibold text-gold-600 dark:text-gold">
                    Read <ArrowRight className="h-3 w-3" />
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
