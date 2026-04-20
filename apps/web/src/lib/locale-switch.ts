import type { Locale } from "@/types/content";
import { isValidLocale } from "@/lib/i18n";

/**
 * Locale-prefixed paths that exist for every supported locale with the same suffix
 * (no per-locale slug mapping required).
 */
const STATIC_REST_PATHS = new Set([
  "",
  "/contact",
  "/resources",
  "/resources/case-studies",
  "/resources/datasheets",
  "/blog",
  "/products",
]);

export function parseLocalePrefix(pathname: string): { locale: Locale; rest: string } | null {
  const normalized = pathname.startsWith("/") ? pathname : `/${pathname}`;
  const segments = normalized.split("/").filter(Boolean);
  if (segments.length === 0) return null;
  const loc = segments[0];
  if (!isValidLocale(loc)) return null;
  const restSegments = segments.slice(1);
  const rest = restSegments.length > 0 ? `/${restSegments.join("/")}` : "";
  return { locale: loc, rest };
}

export function buildLocaleHref(targetLocale: Locale, rest: string): string {
  return `/${targetLocale}${rest}`;
}

async function fetchBlogCounterpartSlug(
  apiBase: string,
  fromLocale: Locale,
  slug: string,
  toLocale: Locale,
): Promise<string | null> {
  try {
    const res = await fetch(
      `${apiBase}/public/blog/${encodeURIComponent(slug)}/counterpart?fromLocale=${encodeURIComponent(fromLocale)}&toLocale=${encodeURIComponent(toLocale)}`,
      { cache: "no-store" },
    );
    if (!res.ok) return null;
    const data = (await res.json()) as { slug?: string };
    return typeof data.slug === "string" && data.slug.length > 0 ? data.slug : null;
  } catch {
    return null;
  }
}

function safeDecodeURIComponent(segment: string): string {
  try {
    return decodeURIComponent(segment);
  } catch {
    return segment;
  }
}

function hasNonEmptyPublishedAt(value: unknown): boolean {
  if (value == null || value === "") return false;
  if (typeof value === "string") return value.length > 0;
  if (typeof value === "number") return Number.isFinite(value);
  return Array.isArray(value) && value.length > 0;
}

async function blogPostExistsInLocale(apiBase: string, locale: Locale, slug: string): Promise<boolean | null> {
  try {
    const res = await fetch(
      `${apiBase}/public/blog/${encodeURIComponent(slug)}?locale=${encodeURIComponent(locale)}`,
      { cache: "no-store" },
    );
    if (!res.ok) return null;
    const data = (await res.json()) as {
      excerpt?: string;
      body?: string;
      publishedAt?: unknown;
    };
    /**
     * Matches `PublicContentService.buildFallbackPost` in the API — keep in sync so we
     * can tell synthetic “not found” payloads from real published posts.
     */
    if (typeof data.excerpt === "string" && data.excerpt === "Fallback excerpt.") {
      return false;
    }
    if (typeof data.body === "string" && data.body.includes("No published post found")) {
      return false;
    }
    /** Synthetic fallback has no publishedAt; real public posts are always published with a timestamp. */
    if (!hasNonEmptyPublishedAt(data.publishedAt)) {
      return false;
    }
    return true;
  } catch {
    return null;
  }
}

async function fetchProductCounterpartSlug(
  apiBase: string,
  fromLocale: Locale,
  slug: string,
  toLocale: Locale,
): Promise<string | null> {
  try {
    const res = await fetch(
      `${apiBase}/public/products/${encodeURIComponent(slug)}/counterpart?fromLocale=${encodeURIComponent(fromLocale)}&toLocale=${encodeURIComponent(toLocale)}`,
      { cache: "no-store" },
    );
    if (!res.ok) return null;
    const data = (await res.json()) as { slug?: string };
    return typeof data.slug === "string" && data.slug.length > 0 ? data.slug : null;
  } catch {
    return null;
  }
}

async function productExistsInLocale(apiBase: string, locale: Locale, slug: string): Promise<boolean | null> {
  try {
    const res = await fetch(`${apiBase}/public/products?locale=${encodeURIComponent(locale)}`, {
      cache: "no-store",
    });
    if (!res.ok) return null;
    const rows = (await res.json()) as unknown;
    if (!Array.isArray(rows)) return null;
    return rows.some((row) => {
      if (!row || typeof row !== "object") return false;
      const s = (row as { slug?: string }).slug;
      return typeof s === "string" && s === slug;
    });
  } catch {
    return null;
  }
}

/**
 * Resolves the URL to use when switching UI language.
 *
 * - Known static routes keep the same path under the target locale.
 * - Blog and product detail URLs are kept only when the API reports a real
 *   published entry for that locale (not the Spring synthetic fallback).
 * - Blog detail: try GET /public/blog/{slug}/counterpart first so linked translations win even if the
 *   target locale has another post at the same slug (rare) or the “exists” probe mis-classifies JSON.
 * - Product detail: same pattern via GET /public/products/{slug}/counterpart.
 * - Same-slug unlinked posts fall back after counterpart returns 404.
 * - Any other path falls back to the locale home page.
 */
export async function resolveLocaleTargetHref(options: {
  fromPathname: string;
  targetLocale: Locale;
  apiBase: string;
}): Promise<string> {
  const { fromPathname, targetLocale, apiBase } = options;
  const parsed = parseLocalePrefix(fromPathname);
  if (!parsed) {
    return `/${targetLocale}`;
  }
  if (parsed.locale === targetLocale) {
    return buildLocaleHref(targetLocale, parsed.rest);
  }

  const { rest } = parsed;

  if (STATIC_REST_PATHS.has(rest)) {
    return buildLocaleHref(targetLocale, rest);
  }

  const blogMatch = /^\/blog\/([^/]+)$/.exec(rest);
  if (blogMatch) {
    const slug = safeDecodeURIComponent(blogMatch[1]);
    const counterpartSlug = await fetchBlogCounterpartSlug(apiBase, parsed.locale, slug, targetLocale);
    if (counterpartSlug) {
      return buildLocaleHref(targetLocale, `/blog/${counterpartSlug}`);
    }
    const exists = await blogPostExistsInLocale(apiBase, targetLocale, slug);
    if (exists === true) {
      return buildLocaleHref(targetLocale, rest);
    }
    if (exists === null) {
      return buildLocaleHref(targetLocale, rest);
    }
    return buildLocaleHref(targetLocale, "");
  }

  const productMatch = /^\/products\/([^/]+)$/.exec(rest);
  if (productMatch) {
    const slug = safeDecodeURIComponent(productMatch[1]);
    const counterpartSlug = await fetchProductCounterpartSlug(apiBase, parsed.locale, slug, targetLocale);
    if (counterpartSlug) {
      return buildLocaleHref(targetLocale, `/products/${counterpartSlug}`);
    }
    const exists = await productExistsInLocale(apiBase, targetLocale, slug);
    if (exists === true || exists === null) {
      return buildLocaleHref(targetLocale, rest);
    }
    return buildLocaleHref(targetLocale, "");
  }

  return `/${targetLocale}`;
}
