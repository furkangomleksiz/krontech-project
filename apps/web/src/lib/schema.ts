/**
 * JSON-LD schema.org factory functions.
 *
 * Each function returns a plain object that serialises to valid JSON-LD.
 * Inject the output via the <JsonLd> component — never inline JSON-LD strings
 * directly in page files.
 *
 * Types in use:
 *   Organization   — company identity, contacts, social links
 *   WebSite        — site-level with SearchAction
 *   BlogPosting    — individual blog articles
 *   SoftwareApplication — product pages (PAM is a software product)
 *   FAQPage        — any page section with question/answer pairs
 *   BreadcrumbList — any page with breadcrumb navigation
 */

import { siteUrl } from "@/lib/i18n";
import type { BlogPostDetail, Locale } from "@/types/content";

/* ── Shared constants ───────────────────────────────────────────── */

const ORG_NAME = "Kron Technologies";
const ORG_URL = "https://www.krontech.com";
const ORG_LOGO = `${siteUrl}/logo.png`;

/* ── Organization ───────────────────────────────────────────────── */

/**
 * Describes the company itself. Place on every page — injected via
 * the locale layout so it is not duplicated per-page.
 */
export function organizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${ORG_URL}#organization`,
    name: ORG_NAME,
    url: ORG_URL,
    logo: {
      "@type": "ImageObject",
      url: ORG_LOGO,
      width: 200,
      height: 60,
    },
    sameAs: [
      "https://www.linkedin.com/company/krontech",
      "https://twitter.com/krontech",
    ],
    address: {
      "@type": "PostalAddress",
      streetAddress: "Anadolu Kurumları, YG Binası, K:3, No:B401",
      addressLocality: "Maslak-Sariyer, Istanbul",
      addressCountry: "TR",
    },
    contactPoint: {
      "@type": "ContactPoint",
      telephone: "+90-212-266-11-22",
      contactType: "customer service",
      areaServed: ["TR", "US", "DE", "FR", "GB"],
      availableLanguage: ["Turkish", "English"],
    },
    foundingDate: "2003",
    description:
      "Kron Technologies provides enterprise-grade Privileged Access Management (PAM) solutions, helping organizations secure privileged accounts, manage access governance, and comply with cybersecurity regulations.",
  };
}

/* ── WebSite ────────────────────────────────────────────────────── */

/**
 * Site-level schema with a SearchAction for potential sitelinks search box.
 * Use on the homepage only.
 */
export function websiteSchema(locale: Locale) {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${ORG_URL}#website`,
    name: ORG_NAME,
    url: `${siteUrl}/${locale}`,
    inLanguage: locale === "tr" ? "tr-TR" : "en-US",
    publisher: { "@id": `${ORG_URL}#organization` },
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${siteUrl}/${locale}/blog?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}

/* ── BlogPosting ────────────────────────────────────────────────── */

/**
 * Describes an individual blog article.
 * Pass the resolved canonical URL as the second argument.
 */
export function articleSchema(post: BlogPostDetail, canonicalUrl: string) {
  const tags = post.tags ? post.tags.split(",").map((t) => t.trim()) : undefined;

  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.excerpt,
    url: canonicalUrl,
    datePublished: post.publishedAt,
    dateModified: post.publishedAt,
    author: {
      "@type": "Organization",
      "@id": `${ORG_URL}#organization`,
      name: ORG_NAME,
    },
    publisher: {
      "@type": "Organization",
      "@id": `${ORG_URL}#organization`,
      name: ORG_NAME,
      logo: { "@type": "ImageObject", url: ORG_LOGO },
    },
    image: post.coverImageUrl ?? `${siteUrl}/og-default.jpg`,
    articleSection: post.category ?? "Cybersecurity",
    keywords: tags?.join(", "),
    inLanguage: post.locale === "tr" ? "tr-TR" : "en-US",
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": canonicalUrl,
    },
    ...(post.readTimeMinutes
      ? { timeRequired: `PT${post.readTimeMinutes}M` }
      : {}),
  };
}

/* ── SoftwareApplication ────────────────────────────────────────── */

/**
 * Describes a software product page.
 * PAM is a SaaS/enterprise software, so SoftwareApplication is the
 * most specific applicable type.
 */
export function softwareProductSchema(
  name: string,
  description: string,
  canonicalUrl: string
) {
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name,
    description,
    url: canonicalUrl,
    applicationCategory: "SecurityApplication",
    operatingSystem: "Web",
    offers: {
      "@type": "Offer",
      availability: "https://schema.org/InStock",
      seller: {
        "@type": "Organization",
        "@id": `${ORG_URL}#organization`,
        name: ORG_NAME,
      },
    },
    creator: {
      "@type": "Organization",
      "@id": `${ORG_URL}#organization`,
      name: ORG_NAME,
    },
  };
}

/* ── FAQPage ────────────────────────────────────────────────────── */

/**
 * Describes a page (or page section) that contains question/answer pairs.
 * Used on blog detail pages with a FAQ accordion.
 * Eligible for rich FAQ snippets in Google Search.
 */
export function faqSchema(items: Array<{ question: string; answer: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };
}

/* ── BreadcrumbList ─────────────────────────────────────────────── */

/**
 * Describes the breadcrumb trail for a page.
 * href values may be absolute or root-relative ("/tr/blog").
 * The last item (current page) should have no href.
 */
export function breadcrumbSchema(items: Array<{ label: string; href?: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => {
      const absoluteHref = item.href
        ? item.href.startsWith("http")
          ? item.href
          : `${siteUrl}${item.href}`
        : undefined;

      return {
        "@type": "ListItem",
        position: index + 1,
        name: item.label,
        ...(absoluteHref ? { item: absoluteHref } : {}),
      };
    }),
  };
}
