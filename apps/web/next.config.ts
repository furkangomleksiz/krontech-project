import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,

  /**
   * Image optimization.
   *
   * Allows next/image to proxy and optimize images from:
   *   - MinIO (local dev, port 9000)
   *   - Any host configured via S3_PUBLIC_ENDPOINT (production CDN / S3 bucket URL)
   *
   * Using next/image for CMS images:
   *   1. Swap <img src={url}> with <Image src={url} alt="..." width={W} height={H}>
   *   2. Add width/height to MediaAsset in the content model for correct layout reservation
   *   3. Use `sizes` prop for responsive images to generate a srcset
   *
   * For now, plain <img> is used in content components because hero image dimensions
   * are not yet consistently stored in MediaAsset. The config is in place so migration
   * to next/image requires only the component change, not a config change.
   *
   * `unoptimized: false` (default) — next/image optimization is ON.
   * Only images from the listed remote patterns are allowed; all others 400.
   */
  images: {
    remotePatterns: [
      // MinIO local dev (docker-compose port 9000)
      {
        protocol: "http",
        hostname: "localhost",
        port: "9000",
        pathname: "/**",
      },
      // MinIO accessed via Docker host bridge (API container → host MinIO)
      {
        protocol: "http",
        hostname: "host.docker.internal",
        port: "9000",
        pathname: "/**",
      },
      // Production: allow any HTTPS hostname so CDN domains work without config changes.
      // Scope this to your specific CDN hostname in production for tighter security:
      //   { protocol: "https", hostname: "cdn.krontech.com.tr" }
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },

  /**
   * Security and caching response headers.
   *
   * Applied to all routes. These are baseline headers that should be set on every
   * response regardless of content type.
   *
   * Cache-Control on API routes (/_next/static) is managed by Next.js automatically.
   * We set headers only for HTML pages and non-Next.js paths here.
   */
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          // Prevent MIME type sniffing
          { key: "X-Content-Type-Options", value: "nosniff" },
          // Disallow embedding in iframes (clickjacking protection)
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          // Enable XSS filter in older browsers
          { key: "X-XSS-Protection", value: "1; mode=block" },
          // Referrer policy — send origin only on same-site, full URL for same-origin
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          // Permissions policy — restrict access to sensitive browser features
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
      {
        // Static assets from Next.js are content-addressed (hashed filenames).
        // Cache them aggressively — they are immutable until the next deploy.
        source: "/_next/static/(.*)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
    ];
  },

  experimental: {},
};

export default nextConfig;
