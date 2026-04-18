import type { BlogPostDetail, BlogPostPreview, Locale, PublicPageModel } from "@/types/content";
import { apiFetch } from "@/lib/api/client";
import { mockBlogDetail, mockBlogList, mockPages } from "@/lib/api/mock-content";

function key(locale: Locale, slug: string): string {
  return `${locale}:${slug}`;
}

/**
 * ISR revalidation TTLs (seconds).
 *
 * These govern how long Next.js serves a cached HTML page before re-fetching
 * from the API on the next request. Lower = fresher but more API calls;
 * higher = fewer API calls but longer staleness window.
 *
 * On-demand revalidation (triggered by the backend on every publish) supersedes
 * these TTLs for immediate cache invalidation — the TTL is the fallback for
 * the worst case (backend revalidation call fails or REVALIDATE_SECRET is not set).
 *
 * Rationale per content type:
 *   HOMEPAGE_TTL    — 30 min: shows recent blog highlights; short enough to stay current
 *   BLOG_LIST_TTL   — 30 min: new posts should appear within half an hour at most
 *   BLOG_POST_TTL   — 2 h:   published articles rarely change after first publish
 *   PRODUCT_TTL     — 2 h:   product copy is stable between releases
 *   RESOURCE_TTL    — 1 h:   new datasheets are added occasionally
 *   CONTACT_TTL     — 24 h:  contact page is nearly static
 */
const HOMEPAGE_TTL  = 1800;   // 30 minutes
const BLOG_LIST_TTL = 1800;   // 30 minutes
const BLOG_POST_TTL = 7200;   // 2 hours
const PRODUCT_TTL   = 7200;   // 2 hours
const RESOURCE_TTL  = 3600;   // 1 hour
const CONTACT_TTL   = 86400;  // 24 hours

// ── Content type TTL selector ─────────────────────────────────────────────────

/**
 * Returns the appropriate ISR TTL for a given page slug.
 * Slug-based selection keeps all TTL decisions in one place.
 */
function ttlForSlug(slug: string): number {
  if (slug === "home")     return HOMEPAGE_TTL;
  if (slug === "contact")  return CONTACT_TTL;
  if (slug === "resources") return RESOURCE_TTL;
  // Products and other generic pages
  return PRODUCT_TTL;
}

// ── Public API ────────────────────────────────────────────────────────────────

export async function getPublicPage(locale: Locale, slug: string): Promise<PublicPageModel> {
  try {
    return await apiFetch<PublicPageModel>(`/public/pages/${slug}?locale=${locale}`, {
      revalidateSeconds: ttlForSlug(slug),
    });
  } catch {
    return mockPages[key(locale, slug)] ?? mockPages[key(locale, "home")];
  }
}

export async function getBlogList(locale: Locale): Promise<BlogPostPreview[]> {
  try {
    return await apiFetch<BlogPostPreview[]>(`/public/blog?locale=${locale}`, {
      revalidateSeconds: BLOG_LIST_TTL,
    });
  } catch {
    return mockBlogList.filter((post) => post.locale === locale);
  }
}

export async function getBlogPost(locale: Locale, slug: string): Promise<BlogPostDetail> {
  try {
    return await apiFetch<BlogPostDetail>(`/public/blog/${slug}?locale=${locale}`, {
      revalidateSeconds: BLOG_POST_TTL,
    });
  } catch {
    return { ...mockBlogDetail, locale, slug };
  }
}
