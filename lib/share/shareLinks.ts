import type { ShareListing } from "./types";

export function buildShareLinks(listing: ShareListing, origin = "https://lorarentals.org") {
  const url = listing.url.startsWith("http") ? listing.url : `${origin}${listing.url}`;
  const text = `${listing.title} — ${listing.price ? listing.price + " · " : ""}${listing.description}`.trim();
  const encodedUrl = encodeURIComponent(url);
  const encodedText = encodeURIComponent(text);

  return {
    url,
    text,
    whatsapp: `https://wa.me/?text=${encodedText}%20${encodedUrl}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    twitter: `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`,
    telegram: `https://t.me/share/url?url=${encodedUrl}&text=${encodedText}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
    email: `mailto:?subject=${encodeURIComponent(listing.title)}&body=${encodedText}%0A%0A${encodedUrl}`,
  };
}

export async function copyToClipboard(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const ta = document.createElement("textarea");
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(ta);
    return ok;
  }
}

export function shareNatively(listing: ShareListing, origin = "https://lorarentals.org") {
  const url = listing.url.startsWith("http") ? listing.url : `${origin}${listing.url}`;
  if (navigator.share) {
    return navigator.share({
      title: listing.title,
      text: listing.description,
      url,
    });
  }
  return Promise.reject(new Error("Native share not supported"));
}
