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

import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest): Promise<NextResponse> {
  const secret = request.nextUrl.searchParams.get("secret");
  const path = request.nextUrl.searchParams.get("path");

  // Validate secret — fail early before any cache operations
  const expectedSecret = process.env.REVALIDATE_SECRET;
  if (!expectedSecret || !secret || secret !== expectedSecret) {
    return NextResponse.json(
      { message: "Invalid or missing revalidation secret" },
      { status: 401 },
    );
  }

  if (!path) {
    return NextResponse.json(
      { message: "path query parameter is required" },
      { status: 400 },
    );
  }

  try {
    // Revalidate the specific page path.
    // "page" type invalidates only this exact URL; "layout" would invalidate all
    // pages using the matching layout (more aggressive — not needed here).
    revalidatePath(path, "page");

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
