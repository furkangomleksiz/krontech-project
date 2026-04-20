import type { Locale } from "@/types/content";

/**
 * Next.js {@code fetch} cache tags for public Spring API reads.
 * {@code /api/revalidate} calls {@code revalidateTag} for each tag in {@link allPublicDataTagsForLocale}
 * when the backend publishes/unpublishes (see {@code CacheService}), so nested RSC {@code fetch()}
 * entries refresh even when {@code revalidatePath} alone misses them.
 */
export function publicProductsTag(locale: Locale): string {
  return `public-products-${locale}`;
}

export function publicBlogTag(locale: Locale): string {
  return `public-blog-${locale}`;
}

export function publicResourcesTag(locale: Locale): string {
  return `public-resources-${locale}`;
}

/** CMS pages ({@code /public/pages/...}) and published page strip ({@code /public/pages?...}). */
export function publicPagesTag(locale: Locale): string {
  return `public-pages-${locale}`;
}

export function allPublicDataTagsForLocale(locale: Locale): string[] {
  return [
    publicProductsTag(locale),
    publicBlogTag(locale),
    publicResourcesTag(locale),
    publicPagesTag(locale),
  ];
}
