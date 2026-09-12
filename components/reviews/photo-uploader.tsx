"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { ImagePlus, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { REVIEW_RULES } from "@/lib/reviews/constants";
import { cloudinaryReady, uploadReviewPhoto } from "@/lib/reviews/service";
import { cn } from "@/lib/utils";

// ─── PhotoUploader — drag & drop + click, Cloudinary unsigned upload ────────
// When Cloudinary env vars aren't configured the uploader renders a disabled
// hint instead of a broken widget.

export function PhotoUploader({
  photos,
  onChange,
  max = REVIEW_RULES.maxPhotos,
}: {
  photos: string[];
  onChange: (urls: string[]) => void;
  max?: number;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState<number[]>([]); // progress per slot
  const [dragOver, setDragOver] = useState(false);
  const ready = cloudinaryReady();

  const addFiles = async (files: FileList | File[]) => {
    const list = Array.from(files).slice(0, max - photos.length);
    for (const file of list) {
      if (!(REVIEW_RULES.photoTypes as readonly string[]).includes(file.type)) {
        toast.error(`${file.name}: only JPG, PNG or WebP`);
        continue;
      }
      if (file.size > REVIEW_RULES.maxPhotoBytes) {
        toast.error(`${file.name}: max 5MB per photo`);
        continue;
      }
      setUploading((u) => [...u, 0]);
      try {
        const url = await uploadReviewPhoto(file, (pct) =>
          setUploading((u) => [...u.slice(0, -1), pct])
        );
        onChange([...photos, url]);
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Upload failed");
      } finally {
        setUploading((u) => u.slice(0, -1));
      }
    }
  };

  if (!ready) {
    return (
      <p className="rounded-xl border border-dashed border-border p-3 text-xs text-muted-foreground">
        Photo uploads need Cloudinary — set <code>NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME</code> and{" "}
        <code>NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET</code>.
      </p>
    );
  }

  const full = photos.length + uploading.length >= max;

  return (
    <div>
      <div className="flex flex-wrap gap-2.5">
        {photos.map((url) => (
          <div key={url} className="group relative h-20 w-20 overflow-hidden rounded-xl border border-border">
            <Image src={url} alt="Review photo" fill className="object-cover" />
            <button
              type="button"
              onClick={() => onChange(photos.filter((p) => p !== url))}
              aria-label="Remove photo"
              className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-navy-950/70 text-white opacity-0 transition-opacity group-hover:opacity-100"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ))}
        {uploading.map((pct, i) => (
          <div key={`up-${i}`} className="relative flex h-20 w-20 items-center justify-center overflow-hidden rounded-xl border border-border bg-secondary">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            <span className="absolute bottom-1 text-[10px] font-bold text-muted-foreground">{pct}%</span>
          </div>
        ))}
        {!full && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(false);
              void addFiles(e.dataTransfer.files);
            }}
            className={cn(
              "flex h-20 w-20 flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed text-muted-foreground transition-colors",
              dragOver ? "border-gold bg-gold/10 text-gold" : "border-border hover:border-gold/60 hover:text-gold"
            )}
          >
            <ImagePlus className="h-5 w-5" />
            <span className="text-[10px] font-semibold">Add photo</span>
          </button>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept={REVIEW_RULES.photoTypes.join(",")}
        multiple
        hidden
        onChange={(e) => {
          if (e.target.files) void addFiles(e.target.files);
          e.target.value = "";
        }}
      />
      <p className="mt-1.5 text-[11px] text-muted-foreground">
        Up to {max} photos · JPG/PNG/WebP · 5MB each · drag & drop works too
      </p>
    </div>
  );
}
