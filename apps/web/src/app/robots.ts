import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/i18n";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        // Standard crawlers: allow all public content, block backend internals
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api/",          // Spring Boot API endpoints — not public web content
          "/swagger-ui/",   // API documentation — for developers only
          "/api-docs/",     // OpenAPI JSON
        ],
      },
      {
        // OpenAI GPTBot: allow all public content for AI training / retrieval
        userAgent: "GPTBot",
        allow: "/",
        disallow: ["/api/", "/swagger-ui/", "/api-docs/"],
      },
      {
        // Google's AI overviews crawler: allow all public content
        userAgent: "Google-Extended",
        allow: "/",
        disallow: ["/api/", "/swagger-ui/", "/api-docs/"],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
