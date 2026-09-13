/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "res.cloudinary.com" },
      { protocol: "https", hostname: "api.qrserver.com" },
      { protocol: "https", hostname: "*.supabase.co" },
    ],
  },
  async headers() {
    return [
      { source: "/manifest.json", headers: [{ key: "Content-Type", value: "application/manifest+json" }, { key: "Cache-Control", value: "public, max-age=3600" }] },
      { source: "/sw.js", headers: [{ key: "Cache-Control", value: "public, max-age=0, must-revalidate" }, { key: "Service-Worker-Allowed", value: "/" }] },
      { source: "/icons/:path*", headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }] },
      { source: "/screenshots/:path*", headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }] },
      { source: "/_next/static/:path*", headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }] },
    ];
  },
};

export default nextConfig;
