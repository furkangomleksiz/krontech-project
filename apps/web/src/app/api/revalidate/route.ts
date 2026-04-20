/**
 * On-demand ISR revalidation endpoint.
 *
 * Called by the Spring Boot backend (CacheService) when content is published,
 * unpublished, or updated. Clears the Next.js ISR cache for the given path so
 * the next browser request regenerates a fresh HTML response from the API
 * rather than serving the stale cached version.
 *
 * Security: guarded by a shared secret (REVALIDATE_SECRET env var).
 * The endpoint is POST-only to prevent accidental cache purges via crawler.
 *
 * Usage (called internally by backend CacheService):
 *   POST /api/revalidate?secret={REVALIDATE_SECRET}&path=/tr/blog/my-post
 *
 * Response:
 *   200  { revalidated: true,  path: "/tr/blog/my-post" }
 *   400  { message: "path query parameter is required" }
 *   401  { message: "Invalid or missing revalidation secret" }
 *   500  { message: "Revalidation failed: ..." }
 *
 * Why POST and not GET?
 *   GET is often pre-fetched by browsers and crawlers. Using POST prevents
 *   unintentional cache purges from link pre-fetchers.
 */

import { allPublicDataTagsForLocale } from "@/lib/api/public-cache-tags";
import { isValidLocale } from "@/lib/i18n";
import type { Locale } from "@/types/content";
import { revalidatePath, revalidateTag } from "next/cache";
import { NextRequest, NextResponse } from "next/server";

const LOG = "[krontech-revalidate]";

/**
 * Spring's {@code URLEncoder} puts {@code /} as {@code %2F} in query values. Some stacks leave
 * that encoding visible on {@code searchParams.get("path")}, so we get {@code %2Fen%2Fproducts}
 * instead of {@code /en/products}. Without a leading slash, {@code split("/")} never yields a
 * real locale segment, {@code isValidLocale} fails, and we skip layout revalidation — leaving
 * nested {@code fetch()} caches (product lists, blog list/detail, etc.) stale while {@code revalidatePath} for
 * the page alone appears to succeed.
 */
function normalizeRevalidatePathParam(raw: string): string {
  let decoded = raw.trim();
  for (let i = 0; i < 4; i++) {
    if (!decoded.includes("%")) {
      break;
    }
    try {
      const next = decodeURIComponent(decoded);
      if (next === decoded) {
        break;
      }
      decoded = next;
    } catch {
      break;
    }
  }
  if (!decoded.startsWith("/")) {
    decoded = `/${decoded}`;
  }
  return decoded;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const secret = request.nextUrl.searchParams.get("secret")?.trim();
  const rawPath = request.nextUrl.searchParams.get("path");
  const path = rawPath != null ? normalizeRevalidatePathParam(rawPath) : null;
  const expectedConfigured = Boolean(process.env.REVALIDATE_SECRET?.trim());

  console.info(
    `${LOG} POST received rawPath=${rawPath ?? "(missing)"} normalizedPath=${path ?? "(missing)"} secretQueryPresent=${Boolean(secret)} envSecretConfigured=${expectedConfigured}`,
  );

  // Validate secret — fail early before any cache operations
  const expectedSecret = process.env.REVALIDATE_SECRET?.trim();
  if (!expectedSecret || !secret || secret !== expectedSecret) {
    console.warn(
      `${LOG} rejected status=401 reason=invalid_or_missing_secret envSecretConfigured=${expectedConfigured} querySecretPresent=${Boolean(secret)}`,
    );
    const body: { message: string; hint?: string } = {
      message: "Invalid or missing revalidation secret",
    };
    if (process.env.NODE_ENV === "development" && !expectedSecret) {
      body.hint =
        "Next.js has no REVALIDATE_SECRET in process.env. Add it to apps/web/.env.local and restart the dev server (env is read at startup).";
    }
    return NextResponse.json(body, { status: 401 });
  }

  if (!path) {
    console.warn(`${LOG} rejected status=400 reason=missing_path_query`);
    return NextResponse.json(
      { message: "path query parameter is required" },
      { status: 400 },
    );
  }

  try {
    revalidatePath(path, "page");

    // Also revalidate the `[locale]` layout so list pages and shared `fetch()` caches
    // under that locale refresh reliably (blog list vs detail can otherwise diverge).
    const segments = path.split("/").filter(Boolean);
    const firstSegment = segments[0];
    let layoutInvalidated = false;
    const revalidatedTags: string[] = [];
    if (firstSegment && isValidLocale(firstSegment)) {
      revalidatePath(`/${firstSegment}`, "layout");
      layoutInvalidated = true;
      // Bust fetch() Data Cache entries tagged in apiFetch — complements revalidatePath, which
      // does not always invalidate nested fetch() (pages, page strip, products, blog, resources).
      const locale = firstSegment as Locale;
      for (const tag of allPublicDataTagsForLocale(locale)) {
        try {
          revalidateTag(tag);
          revalidatedTags.push(tag);
        } catch (tagErr) {
          const msg = tagErr instanceof Error ? tagErr.message : String(tagErr);
          console.warn(`${LOG} revalidateTag_failed tag=${tag} message=${msg}`);
        }
      }
    }

    console.info(
      `${LOG} ok normalizedPath=${path} pageSegment=revalidated layoutInvalidated=${layoutInvalidated} revalidatedTags=${revalidatedTags.join(",") || "(none)"} localeSegment=${firstSegment ?? "(n/a)"}`,
    );
    return NextResponse.json({ revalidated: true, path });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`${LOG} failed status=500 path=${path} message=${message}`);
    return NextResponse.json(
      { message: `Revalidation failed: ${message}` },
      { status: 500 },
    );
  }
}

// Reject GET, PUT, DELETE, etc. — revalidation must be explicit POST
export async function GET(): Promise<NextResponse> {
  return NextResponse.json({ message: "Use POST to trigger revalidation" }, { status: 405 });
}
