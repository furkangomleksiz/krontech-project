/**
 * Dynamic sitemap.
 *
 * Emits one entry per locale per URL. Each entry carries `alternateRefs`
 * listing all locale variants (including x-default) so search engines
 * can build a complete hreflang cross-reference from the sitemap alone —
 * this supplements the <link rel="alternate"> tags already emitted by
 * each page's metadata.alternates.languages.
 *
 * Priority scale:
 *   1.0  Homepage
 *   0.9  Product pages
 *   0.8  Blog list
 *   0.7  Blog posts, Resources
 *   0.6  Contact
 */

import type { MetadataRoute } from "next";
import { getSupportedLocales, siteUrl, publicRoutes, productSlugs } from "@/lib/i18n";
import { mockBlogList } from "@/lib/api/mock-content";

const locales = getSupportedLocales();

function alternateRefs(path: string): Array<{ href: string; hreflang: string }> {
  const refs: Array<{ href: string; hreflang: string }> = locales.map((l) => ({
    href: `${siteUrl}/${l}${path}`,
    hreflang: l as string,
  }));
  // x-default points to the Turkish (default) locale
  refs.push({ href: `${siteUrl}/tr${path}`, hreflang: "x-default" });
  return refs;
}

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  // Static routes (homepage, blog list, resources, contact)
  const staticEntries: MetadataRoute.Sitemap = locales.flatMap((locale) =>
    publicRoutes.map((route) => ({
      url: `${siteUrl}/${locale}${route.path}`,
      lastModified: now,
      changeFrequency: route.changeFrequency,
      priority: route.priority,
      alternateRefs: alternateRefs(route.path),
    }))
  );

  // Product entries — one per locale per slug
  const productEntries: MetadataRoute.Sitemap = locales.flatMap((locale) =>
    productSlugs.map((slug) => ({
      url: `${siteUrl}/${locale}/products/${slug}`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.9,
      alternateRefs: alternateRefs(`/products/${slug}`),
    }))
  );

  // Blog post entries.
  // In production these come from the API; for now we use mock data so the
  // sitemap is non-empty and structurally correct. The mock list is
  // English-only — Turkish equivalents will appear once the CMS is populated.
  const blogEntries: MetadataRoute.Sitemap = mockBlogList.map((post) => ({
    url: `${siteUrl}/en/blog/${post.slug}`,
    lastModified: new Date(post.publishedAt),
    changeFrequency: "monthly" as const,
    priority: 0.7,
    alternateRefs: alternateRefs(`/blog/${post.slug}`),
  }));

  return [...staticEntries, ...productEntries, ...blogEntries];
}
