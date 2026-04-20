import { NextResponse } from "next/server";
import { getDefaultLocale, isValidLocale } from "@/lib/i18n";
import { resolveLocaleTargetHref } from "@/lib/locale-switch";
import type { Locale } from "@/types/content";

/** Always resolve against live API state — never serve a stale locale mapping from the Data Cache. */
export const dynamic = "force-dynamic";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080/api/v1";

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
    apiBase: API_BASE_URL.replace(/\/$/, ""),
  });

  return NextResponse.json({ href });
}
