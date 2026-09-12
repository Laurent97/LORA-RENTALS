"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Eye, FileText, Pencil, Plus, Send, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { EmptyState } from "@/components/empty-state";
import { useApp } from "@/lib/store";
import { fmtDate } from "@/lib/utils";
import type { Post, PostCategory } from "@/types";

const slugify = (s: string) =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

const EMPTY: Omit<Post, "id" | "createdAt"> = {
  slug: "",
  title: "",
  excerpt: "",
  content: "",
  coverImage: "",
  category: "travel",
  tags: [],
};

export default function AdminBlogPage() {
  const { posts, addPost, updatePost } = useApp();
  const [editing, setEditing] = useState<Post | null>(null);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY);

  const openNew = () => {
    setEditing(null);
    setForm(EMPTY);
    setOpen(true);
  };

  const openEdit = (p: Post) => {
    setEditing(p);
    setForm({ slug: p.slug, title: p.title, excerpt: p.excerpt ?? "", content: p.content, coverImage: p.coverImage ?? "", category: p.category, tags: p.tags });
    setOpen(true);
  };

  const save = (publish: boolean) => {
    if (!form.title.trim() || !form.content.trim()) {
      toast.error("Title and content are required");
      return;
    }
    const post: Post = {
      id: editing?.id ?? crypto.randomUUID(),
      slug: form.slug || slugify(form.title),
      title: form.title.trim(),
      excerpt: form.excerpt?.trim() || undefined,
      content: form.content,
      coverImage: form.coverImage?.trim() || undefined,
      category: form.category,
      tags: form.tags,
      publishedAt: publish ? (editing?.publishedAt ?? new Date().toISOString()) : undefined,
      createdAt: editing?.createdAt ?? new Date().toISOString(),
    };
    if (editing) updatePost(post);
    else addPost(post);
    setOpen(false);
    toast.success(publish ? "Post published" : "Draft saved");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-extrabold tracking-tight">Blog CMS</h1>
          <p className="text-sm text-muted-foreground">{posts.length} posts · {posts.filter((p) => p.publishedAt).length} published</p>
        </div>
        <Button variant="gold" onClick={openNew}><Plus className="h-4 w-4" /> New post</Button>
      </div>

      {posts.length === 0 ? (
        <EmptyState icon={FileText} title="No posts" description="Create your first article." />
      ) : (
        <Card>
          <CardContent className="divide-y divide-border p-0">
            {posts.map((p) => (
              <div key={p.id} className="flex flex-wrap items-center gap-3 px-5 py-4">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">{p.title}</p>
                  <p className="text-xs text-muted-foreground">
                    /{p.slug} · {p.category} · {p.publishedAt ? `published ${fmtDate(p.publishedAt)}` : "draft"}
                  </p>
                </div>
                <Badge variant={p.publishedAt ? "success" : "secondary"}>
                  {p.publishedAt ? "Published" : "Draft"}
                </Badge>
                <div className="flex gap-1">
                  {p.publishedAt && (
                    <a href={`/blog/${p.slug}`} target="_blank" rel="noreferrer">
                      <Button variant="ghost" size="icon" aria-label="View"><Eye className="h-4 w-4" /></Button>
                    </a>
                  )}
                  <Button variant="ghost" size="icon" onClick={() => openEdit(p)} aria-label="Edit">
                    <Pencil className="h-4 w-4" />
                  </Button>
                  {!p.publishedAt && (
                    <Button variant="ghost" size="icon" onClick={() => { updatePost({ ...p, publishedAt: new Date().toISOString() }); toast.success("Published"); }} aria-label="Publish">
                      <Send className="h-4 w-4 text-emerald-500" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent onClose={() => setOpen(false)}>
          <DialogHeader>
            <DialogTitle>{editing ? "Edit post" : "New post"}</DialogTitle>
            <DialogDescription>Markdown-lite: ## headings, **bold**, - bullet lists.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="mb-1.5 block">Title</Label>
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label className="mb-1.5 block">Slug</Label>
                <Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder={slugify(form.title) || "auto"} />
              </div>
              <div>
                <Label className="mb-1.5 block">Category</Label>
                <Select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value as PostCategory })}>
                  <option value="travel">Travel</option>
                  <option value="tips">Tips</option>
                  <option value="news">News</option>
                  <option value="destinations">Destinations</option>
                </Select>
              </div>
            </div>
            <div>
              <Label className="mb-1.5 block">Excerpt</Label>
              <Input value={form.excerpt} onChange={(e) => setForm({ ...form, excerpt: e.target.value })} />
            </div>
            <div>
              <Label className="mb-1.5 block">Cover image URL</Label>
              <Input value={form.coverImage} onChange={(e) => setForm({ ...form, coverImage: e.target.value })} placeholder="https://…" />
            </div>
            <div>
              <Label className="mb-1.5 block">Content</Label>
              <Textarea rows={10} value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} />
            </div>
            <div>
              <Label className="mb-1.5 block">Tags (comma separated)</Label>
              <Input
                value={form.tags.join(", ")}
                onChange={(e) => setForm({ ...form, tags: e.target.value.split(",").map((t) => t.trim()).filter(Boolean) })}
              />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => save(false)}>Save draft</Button>
              <Button variant="gold" className="flex-1" onClick={() => save(true)}>
                <Send className="h-4 w-4" /> Publish
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
