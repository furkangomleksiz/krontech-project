import type {
  BlogListResult,
  BlogPostDetail,
  BlogPostPreview,
  Locale,
  ProductDetail,
  ProductListItem,
  ProductResourcesIntro,
  PublicPageListItem,
  PublicPageModel,
  PublicResourceItem,
  SeoFields,
} from "@/types/content";
import { ApiHttpError, apiFetch } from "@/lib/api/client";
import {
  publicBlogTag,
  publicPagesTag,
  publicProductsTag,
} from "@/lib/api/public-cache-tags";
import { normalizePublicPageListItem } from "@/lib/api/cms-page-list";
import { normalizeProductListItem } from "@/lib/api/product-list";
import { mockBlogDetail, mockBlogList, mockPages } from "@/lib/api/mock-content";
import { normalizeBlogHeroImageUrl } from "@/lib/blog-hero-image";
import { normalizeDetailTabs } from "@/lib/product-detail-tabs";
import { normalizePublicResourceItem } from "@/lib/api/public-resources";
import { cache } from "react";

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
 *   HOMEPAGE_TTL    — 30 min: homepage stays reasonably fresh (CMS page strip, products, etc.)
 *   BLOG_LIST_TTL   — 30 min: new posts should appear within half an hour at most
 *   BLOG_POST_TTL   — 2 h:   published articles rarely change after first publish
 *   PRODUCT_TTL     — 2 h:   product copy is stable between releases
 *   RESOURCE_TTL    — 1 h:   new datasheets are added occasionally
 *   CONTACT_TTL     — 24 h:  contact page is nearly static
 */
const HOMEPAGE_TTL  = 1800;   // 30 minutes
const BLOG_LIST_TTL = 1800;   // 30 minutes
const BLOG_POST_TTL = 7200;   // 2 hours
const PRODUCT_TTL       = 7200;   // 2 hours
const PRODUCT_LIST_TTL  = 1800;   // 30 minutes — listing should track CMS changes quickly
const PAGE_LIST_TTL     = 1800;   // 30 minutes — published CMS pages strip (admin Pages tab)
const RESOURCE_TTL  = 3600;   // 1 hour
const CONTACT_TTL   = 86400;  // 24 hours

/** In development, do not cache public blog fetches so list/detail match the API after edits. */
function blogFetchRevalidateSeconds(listOrDetailTtl: number): number {
  return process.env.NODE_ENV === "development" ? 0 : listOrDetailTtl;
}

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
    const revalidateSeconds = ttlForSlug(slug);
    return await apiFetch<PublicPageModel>(`/public/pages/${slug}?locale=${locale}`, {
      revalidateSeconds,
      nextTags: revalidateSeconds > 0 ? [publicPagesTag(locale)] : undefined,
    });
  } catch {
    return mockPages[key(locale, slug)] ?? mockPages[key(locale, "home")];
  }
}

function normalizeBlogPostPreview(raw: unknown): BlogPostPreview {
  if (!raw || typeof raw !== "object") {
    return {
      slug: "",
      locale: "en",
      title: "",
      excerpt: "",
      publishedAt: "",
    };
  }
  const r = raw as Record<string, unknown>;
  const heroRaw =
    (typeof r.heroImageUrl === "string" && r.heroImageUrl) ||
    (typeof r.coverImageUrl === "string" && r.coverImageUrl) ||
    "";
  const coverImageUrl = normalizeBlogHeroImageUrl(heroRaw);

  return {
    slug: String(r.slug ?? ""),
    locale: r.locale as BlogPostPreview["locale"],
    title: String(r.title ?? ""),
    excerpt: String(r.excerpt ?? r.summary ?? ""),
    coverImageUrl,
    category: typeof r.category === "string" ? r.category : undefined,
    tags: typeof r.tags === "string" ? r.tags : undefined,
    readTimeMinutes: typeof r.readTimeMinutes === "number" ? r.readTimeMinutes : undefined,
    publishedAt: String(r.publishedAt ?? ""),
  };
}

const DEFAULT_BLOG_LIST_PAGE_SIZE = 10;

function paginateMockBlogList(locale: Locale, page: number, size: number): BlogListResult {
  const all = mockBlogList.filter((post) => post.locale === locale);
  const totalElements = all.length;
  const totalPages = totalElements === 0 ? 0 : Math.ceil(totalElements / size);
  const lastIndex = totalPages === 0 ? 0 : totalPages - 1;
  const safePage = Math.min(Math.max(0, page), lastIndex);
  const start = safePage * size;
  const posts = all.slice(start, start + size);
  return {
    posts,
    page: safePage,
    size,
    totalElements,
    totalPages,
  };
}

function normalizeBlogListResponse(
  raw: unknown,
  locale: Locale,
  requestedPage: number,
  requestedSize: number,
): BlogListResult {
  if (Array.isArray(raw)) {
    const posts = raw.map((row) => normalizeBlogPostPreview(row));
    return {
      posts,
      page: 0,
      size: posts.length || requestedSize,
      totalElements: posts.length,
      totalPages: posts.length === 0 ? 0 : 1,
    };
  }
  if (!raw || typeof raw !== "object") {
    return paginateMockBlogList(locale, requestedPage, requestedSize);
  }
  const r = raw as Record<string, unknown>;
  const content = r.content;
  const rows = Array.isArray(content) ? content : [];
  const posts = rows.map((row) => normalizeBlogPostPreview(row));
  const page = typeof r.page === "number" ? r.page : requestedPage;
  const size = typeof r.size === "number" ? r.size : requestedSize;
  const totalElements = typeof r.totalElements === "number" ? r.totalElements : posts.length;
  const totalPages =
    typeof r.totalPages === "number" ? r.totalPages : totalElements === 0 ? 0 : 1;
  return { posts, page, size, totalElements, totalPages };
}

/**
 * Curated sidebar posts for the blog list and article pages (published only, max five).
 * GET /api/v1/public/blog/highlights
 */
export async function getBlogHighlights(locale: Locale): Promise<BlogPostPreview[]> {
  try {
    const rev = blogFetchRevalidateSeconds(BLOG_LIST_TTL);
    const raw = await apiFetch<unknown>(`/public/blog/highlights?locale=${locale}`, {
      revalidateSeconds: rev,
      nextTags: rev > 0 ? [publicBlogTag(locale)] : undefined,
    });
    if (!Array.isArray(raw)) return [];
    return raw.map((row) => normalizeBlogPostPreview(row));
  } catch (e) {
    if (process.env.NODE_ENV === "development") {
      console.error(
        "[getBlogHighlights] API request failed — sidebar highlights will be empty.",
        e,
      );
    }
    return [];
  }
}

/**
 * Published blog posts for a locale. Uses paginated API metadata when available.
 * Page indices are **zero-based** in `options.page` (same as the API query param).
 */
export async function getBlogList(
  locale: Locale,
  options?: { page?: number; size?: number },
): Promise<BlogListResult> {
  const page = options?.page ?? 0;
  const size = options?.size ?? DEFAULT_BLOG_LIST_PAGE_SIZE;
  try {
    const rev = blogFetchRevalidateSeconds(BLOG_LIST_TTL);
    const raw = await apiFetch<unknown>(`/public/blog?locale=${locale}&page=${page}&size=${size}`, {
      revalidateSeconds: rev,
      nextTags: rev > 0 ? [publicBlogTag(locale)] : undefined,
    });
    return normalizeBlogListResponse(raw, locale, page, size);
  } catch {
    return paginateMockBlogList(locale, page, size);
  }
}

/**
 * Public API returns `body` and `heroImageUrl`; the site uses `content` paragraphs and
 * `coverImageUrl`. FAQ is optional on the API — default to an empty list.
 */
function splitBlogBodyToParagraphs(body: string): string[] {
  const t = body.trim();
  if (!t) return [];
  return t
    .split(/\n\s*\n/)
    .map((p) => p.trim().replace(/\s+/g, " "))
    .filter(Boolean);
}

function normalizeBlogPostDetail(raw: unknown, locale: Locale, slug: string): BlogPostDetail {
  if (!raw || typeof raw !== "object") {
    return { ...mockBlogDetail, locale, slug };
  }
  const r = raw as Record<string, unknown>;
  const heroRaw =
    (typeof r.heroImageUrl === "string" && r.heroImageUrl) ||
    (typeof r.coverImageUrl === "string" && r.coverImageUrl) ||
    "";
  const hero = normalizeBlogHeroImageUrl(heroRaw || undefined);
  const body = typeof r.body === "string" ? r.body : "";
  const contentFromApi = r.content;
  const content: string[] = Array.isArray(contentFromApi)
    ? contentFromApi.filter((p): p is string => typeof p === "string")
    : splitBlogBodyToParagraphs(body);

  const faqRaw = r.faq;
  const faq = Array.isArray(faqRaw)
    ? (faqRaw as Array<{ question: string; answer: string }>).filter(
        (item) =>
          item &&
          typeof item.question === "string" &&
          typeof item.answer === "string",
      )
    : [];

  return {
    slug: String(r.slug ?? slug),
    locale: (typeof r.locale === "string" ? r.locale : locale) as Locale,
    title: String(r.title ?? ""),
    excerpt: String(r.excerpt ?? ""),
    coverImageUrl: hero,
    category: typeof r.category === "string" ? r.category : undefined,
    tags: typeof r.tags === "string" ? r.tags : undefined,
    readTimeMinutes: typeof r.readTimeMinutes === "number" ? r.readTimeMinutes : undefined,
    publishedAt: String(r.publishedAt ?? ""),
    content,
    faq,
  };
}

export async function getBlogPost(locale: Locale, slug: string): Promise<BlogPostDetail> {
  try {
    const rev = blogFetchRevalidateSeconds(BLOG_POST_TTL);
    const raw = await apiFetch<unknown>(`/public/blog/${slug}?locale=${locale}`, {
      revalidateSeconds: rev,
      nextTags: rev > 0 ? [publicBlogTag(locale)] : undefined,
    });
    return normalizeBlogPostDetail(raw, locale, slug);
  } catch {
    return { ...mockBlogDetail, locale, slug };
  }
}

export async function getPublicProductList(locale: Locale): Promise<ProductListItem[]> {
  try {
    // In dev, skip Next fetch cache so the listing (hero URLs, bullets) matches the API immediately.
    // Production relies on ISR TTL + on-demand revalidation (CacheService → POST /api/revalidate).
    const revalidateSeconds =
      process.env.NODE_ENV === "development" ? 0 : PRODUCT_LIST_TTL;
    const rows = await apiFetch<unknown[]>(`/public/products?locale=${locale}`, {
      revalidateSeconds,
      nextTags: revalidateSeconds > 0 ? [publicProductsTag(locale)] : undefined,
    });
    return Array.isArray(rows) ? rows.map(normalizeProductListItem) : [];
  } catch (e) {
    if (process.env.NODE_ENV === "development") {
      console.error(
        "[getPublicProductList] API request failed — products list will be empty. " +
          "Check that the Spring API is running and reachable at NEXT_PUBLIC_API_BASE_URL " +
          "(server-side fetch; you will not see this call in the browser Network tab).",
        e,
      );
    }
    return [];
  }
}

/**
 * Latest published CMS pages for a locale (same rows as the admin Pages list, excluding {@code home}).
 * GET /api/v1/public/pages?locale=…
 */
export async function getPublicPublishedPageList(
  locale: Locale,
  options?: { limit?: number },
): Promise<PublicPageListItem[]> {
  const limit = Math.min(Math.max(options?.limit ?? 24, 1), 50);
  try {
    const revalidateSeconds = process.env.NODE_ENV === "development" ? 0 : PAGE_LIST_TTL;
    const rows = await apiFetch<unknown[]>(`/public/pages?locale=${locale}&limit=${limit}`, {
      revalidateSeconds,
      nextTags: revalidateSeconds > 0 ? [publicPagesTag(locale)] : undefined,
    });
    return Array.isArray(rows) ? rows.map(normalizePublicPageListItem) : [];
  } catch (e) {
    if (process.env.NODE_ENV === "development") {
      console.error(
        "[getPublicPublishedPageList] API request failed — page strip will be empty. " +
          "Ensure the Spring API is running and NEXT_PUBLIC_API_BASE_URL is set.",
        e,
      );
    }
    return [];
  }
}

/** Maps product API SEO to the shape expected by {@link buildMetadata}. */
export function normalizeProductResourcesIntro(raw: unknown): ProductResourcesIntro | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const title = o.title != null && String(o.title).trim() ? String(o.title) : null;
  const body = o.body != null && String(o.body).trim() ? String(o.body) : null;
  const imageUrl =
    (o.imageUrl != null && String(o.imageUrl).trim() ? String(o.imageUrl) : null) ??
    (o.image_url != null && String(o.image_url).trim() ? String(o.image_url) : null);
  const imageAlt =
    (o.imageAlt != null && String(o.imageAlt).trim() ? String(o.imageAlt) : null) ??
    (o.image_alt != null && String(o.image_alt).trim() ? String(o.image_alt) : null);
  if (!title && !body && !imageUrl && !imageAlt) return null;
  return { title, body, imageUrl, imageAlt };
}

export function normalizeProductLinkedResources(raw: unknown): PublicResourceItem[] {
  if (!Array.isArray(raw)) return [];
  return raw.map(normalizePublicResourceItem).filter((x): x is PublicResourceItem => x !== null);
}

export function productPublicSeoToSeoFields(seo: ProductDetail["seo"]): SeoFields {
  return {
    title: seo.title,
    description: seo.description,
    canonicalPath: seo.canonicalPath,
    noIndex: seo.noIndex,
    ogImage: seo.ogImageUrl ?? undefined,
  };
}

export type PublicProductFetchResult =
  | { kind: "ok"; product: ProductDetail }
  | { kind: "not_found" }
  | { kind: "unavailable" };

/**
 * Published product for the product detail route.
 * - {@code not_found}: API returned 404 (unpublished or missing slug) — caller should {@code notFound()}.
 * - {@code unavailable}: network / 5xx — caller may fall back to generic page content.
 */
export async function getPublicProduct(locale: Locale, slug: string): Promise<PublicProductFetchResult> {
  try {
    const data = await apiFetch<ProductDetail>(`/public/products/${encodeURIComponent(slug)}?locale=${locale}`, {
      revalidateSeconds: PRODUCT_TTL,
      nextTags: [publicProductsTag(locale)],
    });
    const raw = data as unknown as Record<string, unknown>;
    const product: ProductDetail = {
      ...data,
      detailTabs: normalizeDetailTabs(data.detailTabs),
      resourcesIntro: normalizeProductResourcesIntro(raw.resourcesIntro ?? raw.resources_intro),
      linkedResources: normalizeProductLinkedResources(raw.linkedResources ?? raw.linked_resources),
      seo:
        data.seo ??
        ({
          title: data.title ?? "",
          description: data.summary ?? "",
          canonicalPath: `/products/${data.slug}`,
          noIndex: false,
          ogTitle: null,
          ogDescription: null,
          ogImageUrl: null,
          structuredDataJson: null,
        } satisfies ProductDetail["seo"]),
    };
    return { kind: "ok", product };
  } catch (e) {
    if (e instanceof ApiHttpError && e.status === 404) {
      return { kind: "not_found" };
    }
    if (process.env.NODE_ENV === "development") {
      console.error(
        "[getPublicProduct] API request failed — ensure Spring Boot is running and NEXT_PUBLIC_API_BASE_URL is set.",
        e,
      );
    }
    return { kind: "unavailable" };
  }
}

/** Dedupes product fetches between `generateMetadata` and the page component. */
export const getCachedPublicProduct = cache(getPublicProduct);
