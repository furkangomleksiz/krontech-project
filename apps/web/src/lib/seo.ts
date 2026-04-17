/**
 * Central metadata factory for all public pages.
 *
 * Rules:
 * - No page file builds a Next.js Metadata object directly.
 * - All metadata flows through buildMetadata() or buildBlogMetadata().
 * - hreflang alternates and canonical URLs are always absolute.
 * - OG type is set per content type (website vs article).
 */

import type { Metadata } from "next";
import type { BlogPostPreview, Locale, SeoFields } from "@/types/content";
import { hreflangAlternates, siteUrl } from "@/lib/i18n";

const SITE_NAME = "Kron Technologies";
const DEFAULT_OG_IMAGE = `${siteUrl}/og-default.jpg`;

/**
 * Builds Next.js Metadata for generic pages (homepage, products, resources, contact).
 * OG type is always "website" for these pages.
 */
export function buildMetadata(seo: SeoFields, locale: Locale): Metadata {
  const canonical = `${siteUrl}/${locale}${seo.canonicalPath}`;
  const alternates = hreflangAlternates(seo.canonicalPath);
  const ogImage = seo.ogImage ?? DEFAULT_OG_IMAGE;
  const ogLocale = locale === "tr" ? "tr_TR" : "en_US";
  const altLocale = locale === "tr" ? "en_US" : "tr_TR";

  return {
    title: seo.title,
    description: seo.description,
    metadataBase: new URL(siteUrl),
    alternates: {
      canonical,
      languages: {
        "x-default": alternates["x-default"],
        tr: alternates.tr,
        en: alternates.en,
      },
    },
    robots: seo.noIndex
      ? { index: false, follow: false }
      : { index: true, follow: true },
    openGraph: {
      type: "website",
      siteName: SITE_NAME,
      title: seo.title,
      description: seo.description,
      url: canonical,
      locale: ogLocale,
      alternateLocale: altLocale,
      images: [{ url: ogImage, width: 1200, height: 630, alt: seo.title }],
    },
    twitter: {
      card: "summary_large_image",
      title: seo.title,
      description: seo.description,
      images: [ogImage],
    },
  };
}

/**
 * Builds Next.js Metadata specifically for blog/article pages.
 * OG type is "article" with publishedTime, section, and tags populated.
 */
export function buildBlogMetadata(post: BlogPostPreview, locale: Locale): Metadata {
  const canonicalPath = `/blog/${post.slug}`;
  const canonical = `${siteUrl}/${locale}${canonicalPath}`;
  const alternates = hreflangAlternates(canonicalPath);
  const ogImage = post.coverImageUrl ?? DEFAULT_OG_IMAGE;
  const ogLocale = locale === "tr" ? "tr_TR" : "en_US";
  const altLocale = locale === "tr" ? "en_US" : "tr_TR";
  const tags = post.tags ? post.tags.split(",").map((t) => t.trim()) : undefined;

  return {
    title: post.title,
    description: post.excerpt,
    metadataBase: new URL(siteUrl),
    alternates: {
      canonical,
      languages: {
        "x-default": alternates["x-default"],
        tr: alternates.tr,
        en: alternates.en,
      },
    },
    robots: { index: true, follow: true },
    openGraph: {
      type: "article",
      siteName: SITE_NAME,
      title: post.title,
      description: post.excerpt,
      url: canonical,
      locale: ogLocale,
      alternateLocale: altLocale,
      publishedTime: post.publishedAt,
      authors: [SITE_NAME],
      section: post.category,
      tags,
      images: [{ url: ogImage, width: 1200, height: 630, alt: post.title }],
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.excerpt,
      images: [ogImage],
    },
  };
}
