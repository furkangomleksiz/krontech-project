import type { ProductListItem } from "@/types/content";

/** Normalizes list rows from the API (camelCase) and any legacy/snake_case variants. */
export function normalizeProductListItem(raw: unknown): ProductListItem {
  if (!raw || typeof raw !== "object") {
    return { slug: "", title: "", summary: "", heroImageUrl: null, featureBullets: [] };
  }
  const r = raw as Record<string, unknown>;
  const heroRaw =
    (typeof r.heroImageUrl === "string" && r.heroImageUrl.trim()) ||
    (typeof r.hero_image_url === "string" && (r.hero_image_url as string).trim()) ||
    "";
  const bulletsRaw = r.featureBullets ?? r.feature_bullets;
  const featureBullets = Array.isArray(bulletsRaw)
    ? bulletsRaw.filter((b): b is string => typeof b === "string")
    : [];

  return {
    slug: String(r.slug ?? ""),
    title: String(r.title ?? ""),
    summary: String(r.summary ?? ""),
    heroImageUrl: heroRaw.length > 0 ? heroRaw : null,
    featureBullets,
  };
}
