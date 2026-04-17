import type { Locale } from "@/types/content";

export const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");

const supportedLocales: Locale[] = ["tr", "en"];
const defaultLocale: Locale = "tr";

export function getSupportedLocales(): Locale[] {
  return supportedLocales;
}

export function getDefaultLocale(): Locale {
  return defaultLocale;
}

export function isValidLocale(value: string): value is Locale {
  return supportedLocales.includes(value as Locale);
}

export function withLocalePath(locale: Locale, path: string): string {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `/${locale}${normalizedPath}`;
}

/**
 * Builds the absolute canonical URL for a given locale + path.
 * path should start with "/" (e.g. "/blog/my-post" or "" for the home page).
 */
export function canonicalUrl(locale: Locale, path: string): string {
  const normalized = path && !path.startsWith("/") ? `/${path}` : path;
  return `${siteUrl}/${locale}${normalized}`;
}

/**
 * Returns the full set of hreflang alternates for a given path.
 * The x-default always points to the Turkish (default) locale.
 * path is the locale-agnostic path segment, e.g. "/blog/my-post" or "" for home.
 */
export function hreflangAlternates(path: string): Record<string, string> {
  const normalized = path && !path.startsWith("/") ? `/${path}` : path;
  return {
    "x-default": `${siteUrl}/tr${normalized}`,
    tr: `${siteUrl}/tr${normalized}`,
    en: `${siteUrl}/en${normalized}`,
  };
}

/**
 * Static public route definitions used by the sitemap and structured data.
 */
export interface PublicRoute {
  path: string;
  priority: number;
  changeFrequency: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
}

export const publicRoutes: PublicRoute[] = [
  { path: "",               priority: 1.0, changeFrequency: "weekly"  },
  { path: "/blog",          priority: 0.8, changeFrequency: "daily"   },
  { path: "/resources",     priority: 0.7, changeFrequency: "weekly"  },
  { path: "/contact",       priority: 0.6, changeFrequency: "monthly" },
];

export const productSlugs: string[] = ["kron-pam"];
