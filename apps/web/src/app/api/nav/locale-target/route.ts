import { NextResponse } from "next/server";
import { getApiBaseUrl } from "@/lib/api/base-url";
import { getDefaultLocale, isValidLocale } from "@/lib/i18n";
import { resolveLocaleTargetHref } from "@/lib/locale-switch";
import type { Locale } from "@/types/content";

/** Always resolve against live API state — never serve a stale locale mapping from the Data Cache. */
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const toRaw = searchParams.get("to");
  const fromRaw = searchParams.get("from") ?? "";

  if (!toRaw || !isValidLocale(toRaw)) {
    const fallback = getDefaultLocale();
    return NextResponse.json({ href: `/${fallback}` }, { status: 400 });
  }

  const targetLocale = toRaw as Locale;
  const fromPathname = fromRaw.startsWith("/") ? fromRaw : fromRaw ? `/${fromRaw}` : `/${targetLocale}`;

  const href = await resolveLocaleTargetHref({
    fromPathname,
    targetLocale,
    apiBase: getApiBaseUrl(),
  });

  return NextResponse.json({ href });
}
