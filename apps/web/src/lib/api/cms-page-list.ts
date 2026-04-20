import type { PublicPageListItem } from "@/types/content";

export function normalizePublicPageListItem(raw: unknown): PublicPageListItem {
  if (!raw || typeof raw !== "object") {
    return {
      slug: "",
      locale: "en",
      title: "",
      summary: "",
      heroImageUrl: null,
      pageType: "",
      publishedAt: null,
    };
  }
  const r = raw as Record<string, unknown>;
  const heroRaw =
    (typeof r.heroImageUrl === "string" && r.heroImageUrl.trim()) ||
    (typeof r.hero_image_url === "string" && (r.hero_image_url as string).trim()) ||
    "";
  const pub =
    (typeof r.publishedAt === "string" && r.publishedAt) ||
    (typeof r.published_at === "string" && r.published_at) ||
    null;

  return {
    slug: String(r.slug ?? ""),
    locale: String(r.locale ?? "en"),
    title: String(r.title ?? ""),
    summary: String(r.summary ?? ""),
    heroImageUrl: heroRaw.length > 0 ? heroRaw : null,
    pageType: String(r.pageType ?? r.page_type ?? ""),
    publishedAt: pub,
  };
}
