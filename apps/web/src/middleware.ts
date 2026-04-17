/**
 * Edge middleware — runs before every request.
 *
 * Responsibility: set the `x-locale` response header so the root layout
 * can read the active locale and emit the correct `<html lang="...">`.
 *
 * We derive locale from the URL prefix only (no cookie / Accept-Language
 * negotiation here — locale selection is handled by the [locale] segment).
 */

import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest): NextResponse {
  const { pathname } = request.nextUrl;

  // Extract locale from the leading path segment
  const locale = pathname.startsWith("/tr") ? "tr" : "en";

  const response = NextResponse.next();
  response.headers.set("x-locale", locale);
  return response;
}

export const config = {
  // Run on all routes except static files, _next internals, and known
  // metadata routes that don't need the locale header.
  matcher: [
    "/((?!_next/static|_next/image|favicon\\.ico|sitemap\\.xml|robots\\.txt).*)",
  ],
};
