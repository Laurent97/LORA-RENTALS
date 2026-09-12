"use client";

import Image from "next/image";
import Link from "next/link";
import { notFound, useParams } from "next/navigation";
import { ArrowLeft, Clock, Share2, Tag } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useApp } from "@/lib/store";
import { fmtDate } from "@/lib/utils";

const readTime = (content: string) => Math.max(1, Math.round(content.split(/\s+/).length / 200));

// Minimal markdown-ish renderer: ## headings, **bold**, - lists, paragraphs.
function renderContent(content: string) {
  return content.split(/\n\n+/).map((block, i) => {
    const b = block.trim();
    if (b.startsWith("## ")) {
      return <h2 key={i} className="mt-8 font-display text-xl font-bold">{b.slice(3)}</h2>;
    }
    if (b.startsWith("- ")) {
      return (
        <ul key={i} className="mt-3 list-disc space-y-1.5 pl-6 text-muted-foreground">
          {b.split("\n").map((li, j) => (
            <li key={j}>{inline(li.replace(/^-\s*/, ""))}</li>
          ))}
        </ul>
      );
    }
    return <p key={i} className="mt-4 leading-relaxed text-muted-foreground">{inline(b)}</p>;
  });
}

function inline(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((p, i) =>
    p.startsWith("**") && p.endsWith("**")
      ? <strong key={i} className="font-semibold text-foreground">{p.slice(2, -2)}</strong>
      : p
  );
}

export default function BlogPostPage() {
  const { slug } = useParams<{ slug: string }>();
  const posts = useApp((s) => s.posts);
  const hydrated = useApp((s) => s.hydrated);
  const post = posts.find((p) => p.slug === slug);

  if (!post) {
    if (!hydrated) return null;
    return notFound();
  }

  const share = async () => {
    const url = window.location.href;
    if (navigator.share) {
      await navigator.share({ title: post.title, url });
    } else {
      await navigator.clipboard.writeText(url);
      toast.success("Link copied");
    }
  };

  return (
    <main className="container max-w-3xl py-10">
      <Link href="/blog" className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> All articles
      </Link>

      <div className="mt-6 flex flex-wrap items-center gap-2">
        <Badge variant="gold" className="capitalize">{post.category}</Badge>
        {post.tags.map((t) => (
          <Badge key={t} variant="secondary"><Tag className="mr-1 h-2.5 w-2.5" />{t}</Badge>
        ))}
      </div>

      <h1 className="mt-4 font-display text-3xl font-extrabold tracking-tight md:text-4xl">
        {post.title}
      </h1>
      <div className="mt-3 flex items-center gap-4 text-sm text-muted-foreground">
        <span>{post.publishedAt ? fmtDate(post.publishedAt) : "Draft"}</span>
        <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {readTime(post.content)} min read</span>
        <button onClick={share} className="flex items-center gap-1 font-semibold text-gold-600 hover:underline dark:text-gold">
          <Share2 className="h-3.5 w-3.5" /> Share
        </button>
      </div>

      {post.coverImage && (
        <div className="relative mt-8 aspect-[16/8] overflow-hidden rounded-2xl">
          <Image src={post.coverImage} alt={post.title} fill className="object-cover" priority />
        </div>
      )}

      <article className="mt-8">{renderContent(post.content)}</article>

      <div className="mt-12 rounded-2xl border border-gold/40 bg-gradient-to-br from-navy-900 to-navy-950 p-6 text-center text-white">
        <p className="font-display text-xl font-bold">Ready to drive Rwanda?</p>
        <p className="mt-1 text-sm text-white/70">Verified cars, zero booking fees, pay at pickup.</p>
        <Link href="/browse" className="mt-4 inline-block">
          <Button variant="gold">Browse cars</Button>
        </Link>
      </div>
    </main>
  );
}
