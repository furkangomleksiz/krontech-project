import { apiFetch } from "@/lib/api/client";
import { publicResourcesTag } from "@/lib/api/public-cache-tags";
import type { Locale, PublicResourceItem } from "@/types/content";

/** Matches ISR TTL rationale for generic resource content in public-content.ts. */
const RESOURCE_LIST_TTL = 3600;

function devRevalidate(): number {
  return process.env.NODE_ENV === "development" ? 0 : RESOURCE_LIST_TTL;
}

export function normalizePublicResourceItem(raw: unknown): PublicResourceItem | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const downloadUrl =
    (typeof r.downloadUrl === "string" && r.downloadUrl.trim()) ||
    (typeof r.download_url === "string" && (r.download_url as string).trim()) ||
    "";
  if (!downloadUrl) return null;
  const hero =
    (typeof r.heroImageUrl === "string" && r.heroImageUrl.trim()) ||
    (typeof r.hero_image_url === "string" && (r.hero_image_url as string).trim()) ||
    "";
  const preview =
    (typeof r.previewImageUrl === "string" && r.previewImageUrl.trim()) ||
    (typeof r.preview_image_url === "string" && (r.preview_image_url as string).trim()) ||
    "";
  return {
    slug: String(r.slug ?? ""),
    locale: String(r.locale ?? "").toLowerCase(),
    title: String(r.title ?? ""),
    summary: r.summary != null ? String(r.summary) : "",
    resourceType: String(r.resourceType ?? r.resource_type ?? ""),
    heroImageUrl: hero.length > 0 ? hero : null,
    previewImageUrl: preview.length > 0 ? preview : null,
    downloadUrl,
  };
}

export type PublicResourceKind = "CASE_STUDY" | "DATASHEET";

/**
 * Single published resource by slug (public detail page + prefetch targets).
 */
export async function getPublicResourceBySlug(
  locale: Locale,
  slug: string,
): Promise<PublicResourceItem | null> {
  const enc = encodeURIComponent(slug);
  try {
    const rev = devRevalidate();
    const raw = await apiFetch<unknown>(`/public/resources/${enc}?locale=${locale}`, {
      revalidateSeconds: rev,
      nextTags: rev > 0 ? [publicResourcesTag(locale)] : undefined,
    });
    return normalizePublicResourceItem(raw);
  } catch (e) {
    if (process.env.NODE_ENV === "development") {
      console.error(
        "[getPublicResourceBySlug] API request failed — returning null. " +
          "Check NEXT_PUBLIC_API_BASE_URL and that the Spring API is running.",
        e,
      );
    }
    return null;
  }
}

/**
 * Published resources for a locale, optionally filtered by type (case study or datasheet).
 */
export async function getPublicResources(
  locale: Locale,
  resourceType: PublicResourceKind,
): Promise<PublicResourceItem[]> {
  const q = new URLSearchParams({
    locale,
    resourceType,
    page: "0",
    size: "100",
  });
  try {
    const rev = devRevalidate();
    const raw = await apiFetch<unknown[]>(`/public/resources?${q.toString()}`, {
      revalidateSeconds: rev,
      nextTags: rev > 0 ? [publicResourcesTag(locale)] : undefined,
    });
    if (!Array.isArray(raw)) return [];
    return raw.map(normalizePublicResourceItem).filter((x): x is PublicResourceItem => x !== null);
  } catch (e) {
    if (process.env.NODE_ENV === "development") {
      console.error(
        "[getPublicResources] API request failed — list will be empty. " +
          "Check NEXT_PUBLIC_API_BASE_URL and that the Spring API is running.",
        e,
      );
    }
    return [];
  }
}
