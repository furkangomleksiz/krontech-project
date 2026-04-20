/**
 * Edge middleware — runs before every request on matching paths.
 *
 * Responsibilities (in order):
 *
 *  1. Root redirect   — "/" → "/{defaultLocale}" (permanent 301).
 *     This keeps the root URL SEO-clean by always redirecting to the canonical
 *     locale-prefixed path.
 *
 *  2. Redirect rules  — checks the request path against active redirect rules
 *     fetched from the backend. Rules are cached in-process for REDIRECT_CACHE_TTL_MS.
 *     A 301/302 response is issued for matching paths before any page rendering occurs,
 *     ensuring search engines receive the correct redirect at the Edge.
 *
 *  3. Locale header   — sets the x-locale response header so the root layout can
 *     emit the correct <html lang="...">.
 *
 * Redirect rule cache:
 *   The middleware fetches GET /api/v1/public/redirects once and stores the result
 *   as module-level state within the Edge worker process. Within the same worker
 *   instance, subsequent requests reuse the cache until REDIRECT_CACHE_TTL_MS elapses
 *   or the worker is cold-started. On network errors, the stale cache is preserved.
 *
 *   TTL is 5 minutes by default — appropriate for infrequent rule changes.
 *   To purge immediately during a migration cutover, restart the Next.js process.
 *
 *   The HTTP fetch itself uses cache: "no-store" so Next.js does not persist API
 *   responses in its Data Cache — otherwise edited rules could appear "stuck"
 *   until the framework revalidate window expires.
 */

import { NextRequest, NextResponse } from "next/server";

/** Same-origin target: absolute path on this host. Off-site: full http(s) URL. */
function resolveRedirectTarget(request: NextRequest, targetPath: string): string {
  const t = targetPath.trim();
  if (t.startsWith("http://") || t.startsWith("https://")) return t;
  const path = t.startsWith("/") ? t : `/${t}`;
  return `${request.nextUrl.origin}${path}`;
}

// ── Redirect rule cache ───────────────────────────────────────────────────────

interface RedirectRule {
  sourcePath: string;
  targetPath: string;
  statusCode: number;
}

// Module-level state — shared across requests within the same Edge worker instance.
let cachedRules: RedirectRule[] = [];
let cacheExpiresAt = 0;

const REDIRECT_CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Fetches all active redirect rules from the backend and caches them.
 * Returns the cached list without a network call if the cache is still warm.
 * On error, returns the stale cache (or an empty array on first failure).
 */
async function getRedirectRules(): Promise<RedirectRule[]> {
  const now = Date.now();
  if (cacheExpiresAt > now) return cachedRules;

  const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL;
  if (!apiBase) return cachedRules;

  try {
    const res = await fetch(`${apiBase}/public/redirects`, { cache: "no-store" });
    if (res.ok) {
      const rules = (await res.json()) as RedirectRule[];
      cachedRules = rules;
      cacheExpiresAt = now + REDIRECT_CACHE_TTL_MS;
    }
    // On non-OK responses keep the stale cache — don't wipe it on transient errors.
  } catch {
    // Network error — keep stale cache, extend expiry slightly to avoid hammering.
    cacheExpiresAt = now + 30_000;
  }

  return cachedRules;
}

// ── Paths that should never be subject to redirect-rule processing ────────────

const SKIP_REDIRECT_PREFIXES = [
  "/admin",    // Admin UI routes — not public-facing
  "/_next",    // Next.js internal assets (also excluded by matcher, but be safe)
  "/preview",  // Preview page — token-gated, should not be accidentally redirected
];

// ── Middleware entry point ────────────────────────────────────────────────────

export async function middleware(request: NextRequest): Promise<NextResponse> {
  const { pathname } = request.nextUrl;

  // 1. Root → default locale (permanent, unconditional)
  if (pathname === "/" || pathname === "") {
    return NextResponse.redirect(
      new URL("/tr", request.url),
      { status: 301 },
    );
  }

  // 2. Redirect rules — skip admin, preview, and _next paths
  const skipRedirect = SKIP_REDIRECT_PREFIXES.some((prefix) =>
    pathname.startsWith(prefix),
  );

  if (!skipRedirect) {
    const rules = await getRedirectRules();
    const rule = rules.find((r) => r.sourcePath === pathname);

    if (rule) {
      const target = resolveRedirectTarget(request, rule.targetPath);
      return NextResponse.redirect(target, { status: rule.statusCode });
    }
  }

  // 3. Locale header — used by root layout to set <html lang="...">
  const locale = pathname.startsWith("/tr") ? "tr" : "en";
  const response = NextResponse.next();
  response.headers.set("x-locale", locale);
  return response;
}

export const config = {
  matcher: [
    // Run on all routes except Next.js internals and static metadata files.
    // The API path (/api/) is served by Spring Boot, not Next.js, so it never
    // reaches this middleware — but exclude it explicitly for clarity.
    "/((?!_next/static|_next/image|favicon\\.ico|sitemap\\.xml|robots\\.txt|api/).*)",
  ],
};
