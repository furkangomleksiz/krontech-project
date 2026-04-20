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

import { isValidLocale } from "@/lib/i18n";
import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest): Promise<NextResponse> {
  const secret = request.nextUrl.searchParams.get("secret")?.trim();
  const path = request.nextUrl.searchParams.get("path");

  // Validate secret — fail early before any cache operations
  const expectedSecret = process.env.REVALIDATE_SECRET?.trim();
  if (!expectedSecret || !secret || secret !== expectedSecret) {
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
    return NextResponse.json(
      { message: "path query parameter is required" },
      { status: 400 },
    );
  }

  try {
    revalidatePath(path, "page");

    // Also revalidate the `[locale]` layout so list pages and shared `fetch()` caches
    // under that locale refresh reliably (blog list vs detail can otherwise diverge).
    const firstSegment = path.split("/").filter(Boolean)[0];
    if (firstSegment && isValidLocale(firstSegment)) {
      revalidatePath(`/${firstSegment}`, "layout");
    }

    return NextResponse.json({ revalidated: true, path });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
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
