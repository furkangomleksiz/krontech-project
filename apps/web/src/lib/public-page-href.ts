import type { Locale } from "@/types/content";

/** Builds the public site path for a CMS page row (matches admin Pages / polymorphic routes). */
export function publicPageDetailHref(locale: Locale, pageType: string, slug: string): string {
  const enc = encodeURIComponent(slug);
  const t = pageType.trim().toLowerCase().replace(/_/g, "-");
  if (t === "blog-post" || t === "blogpost") return `/${locale}/blog/${enc}`;
  if (t === "product") return `/${locale}/products/${enc}`;
  /** CMS resources (datasheets, case studies, etc.) — matches {@code ResourceAdminService} pageType. */
  if (t === "resource") return `/${locale}/resources/${enc}`;
  return `/${locale}/${enc}`;
}
