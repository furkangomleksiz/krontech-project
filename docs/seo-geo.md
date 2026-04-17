# SEO & GEO Strategy

> SEO = Search Engine Optimization — making pages discoverable and rankable by search crawlers.
> GEO = Generative Engine Optimization — making content correctly attributable, segmentable, and retrievable by AI/LLM-based systems (ChatGPT, Perplexity, Google AI Overviews, etc.).

---

## Architecture overview

All SEO logic lives in two modules and one component:

```
apps/web/src/
  lib/
    i18n.ts          — locale helpers, siteUrl, hreflangAlternates, publicRoutes
    seo.ts           — metadata factory (buildMetadata, buildBlogMetadata)
    schema.ts        — JSON-LD schema.org builders
  components/seo/
    JsonLd.tsx       — server component that injects <script type="application/ld+json">
  middleware.ts      — sets x-locale response header for html lang attribute
  app/
    sitemap.ts       — dynamic sitemap with alternateRefs
    robots.ts        — robots.txt with bot-specific rules
```

No page file builds a `Metadata` object directly or writes inline JSON-LD strings.
All metadata and structured data flows through the shared modules above.

---

## Locale-aware routing

Supported locales: `tr` (default), `en`.

URL structure: `/{locale}/{path}` — e.g. `/tr/products/kron-pam`.

The root `/` redirects to `/tr` (the default locale). Locale detection is purely path-based; no cookies or `Accept-Language` header negotiation.

### `html lang` attribute

`middleware.ts` runs on every request and sets the `x-locale` response header by reading the URL prefix. `app/layout.tsx` reads this header (`headers()`) to emit the correct `<html lang="tr">` or `<html lang="en">`. This is the standard approach for dynamic `lang` in Next.js App Router where `app/layout.tsx` cannot receive route segment params.

---

## Canonical URLs

Each locale version of a page has its own canonical URL:

```
https://krontech.com/tr/products/kron-pam   (canonical for the Turkish version)
https://krontech.com/en/products/kron-pam   (canonical for the English version)
```

There is no language-neutral canonical. The canonical is always the current locale's URL. The `x-default` hreflang points to the Turkish (`/tr`) locale, designating it the default for undetermined-language users.

Canonical URLs are absolute (include the full domain). `metadataBase` is set in `app/layout.tsx` so that relative image paths in OG tags also resolve to absolute URLs correctly.

---

## hreflang

hreflang is emitted in **two places** — both are required by Google:

1. **Page `<head>`** — via `metadata.alternates.languages` in `buildMetadata()` and `buildBlogMetadata()`. Next.js renders these as `<link rel="alternate" hreflang="..." href="...">` tags.

2. **`sitemap.xml`** — each entry carries `alternateRefs` listing all locale variants:

```xml
<url>
  <loc>https://krontech.com/tr/products/kron-pam</loc>
  <xhtml:link rel="alternate" hreflang="tr" href="https://krontech.com/tr/products/kron-pam"/>
  <xhtml:link rel="alternate" hreflang="en" href="https://krontech.com/en/products/kron-pam"/>
  <xhtml:link rel="alternate" hreflang="x-default" href="https://krontech.com/tr/products/kron-pam"/>
</url>
```

The `hreflangAlternates(path)` helper in `lib/i18n.ts` is the single function that computes both sets — page metadata and sitemap use the same function, so they stay in sync.

---

## Open Graph

OG tags are set per content type:

| Page type      | OG type   | Extra fields                                      |
|----------------|-----------|---------------------------------------------------|
| Homepage       | website   |                                                   |
| Product detail | website   |                                                   |
| Blog list      | website   |                                                   |
| Resources      | website   |                                                   |
| Contact        | website   |                                                   |
| Blog detail    | article   | publishedTime, authors, section, tags             |

The `openGraph.locale` field uses IETF BCP 47 format (`tr_TR`, `en_US`). `alternateLocale` lists the other locale so social scrapers know alternate versions exist.

---

## Twitter Card

All pages emit `twitter:card: summary_large_image` with title, description, and image. The image falls back to `/og-default.jpg` when no content-specific OG image is available.

---

## JSON-LD / schema.org

All structured data is built by typed factory functions in `lib/schema.ts` and injected by the `<JsonLd>` server component (zero client-side JS cost).

### Schemas deployed

| Schema type         | Location                          | Rationale |
|---------------------|-----------------------------------|-----------|
| `Organization`      | Every page (via locale layout)    | Company identity available on all pages — required for knowledge panel candidacy and LLM attribution |
| `WebSite`           | Homepage only                     | Enables potential sitelinks search box in Google; SearchAction targets the blog list |
| `BlogPosting`       | Blog detail pages                 | Enables article rich snippets; makes authorship and publish date attributable |
| `SoftwareApplication` | Product detail pages             | PAM is a software product; this is the most specific applicable type for the product catalogue |
| `FAQPage`           | Blog detail pages with FAQ section | Eligible for FAQ rich snippets in Google Search; makes Q&A content directly accessible to LLMs |
| `BreadcrumbList`    | All content pages                 | Enables breadcrumb rich snippets; helps search engines understand site structure |

### Organization schema placement

The `Organization` schema is injected in `app/[locale]/layout.tsx` rather than individual pages. This ensures every URL on the site carries company identity data without requiring each page to know about it.

### JSON-LD injection pattern

```tsx
// In page.tsx:
import { JsonLd } from "@/components/seo/JsonLd";
import { articleSchema, faqSchema, breadcrumbSchema } from "@/lib/schema";

<JsonLd data={[
  articleSchema(post, postUrl),
  breadcrumbSchema(breadcrumbs),
  ...(post.faq.length > 0 ? [faqSchema(post.faq)] : []),
]} />
```

---

## GEO (Generative Engine Optimization)

LLMs (ChatGPT, Perplexity, Claude, Google AI Overviews) retrieve and summarise content by parsing semantic structure, not just keywords. The following practices make Kron content correctly attributable and retrievable by these systems:

### 1. Semantic section labelling

Every `<section>` element carries an `aria-label` that names the content context:
```html
<section aria-label="Product features">
<section aria-label="Frequently asked questions">
<section aria-label="Blog posts">
```
LLMs use element roles and labels to segment content during ingestion — a labelled section is more likely to be attributed to its actual topic.

### 2. FAQ as visible structured text

FAQ content is rendered as visible `<p>` text inside `<FaqAccordion>`. The accordion toggle controls display, but the text is in the DOM and indexable. The `FAQPage` JSON-LD schema provides an exact machine-readable copy of the same Q&A pairs.

### 3. Organization facts in schema.org

The `Organization` schema on every page contains:
- Company name, URL, founding date
- Physical address (Istanbul HQ)
- Contact telephone and service languages
- Social profile links (`sameAs`)
- A human-readable description of what the company does

This makes the company's identity inferable from any URL on the site — not just the homepage.

### 4. Article authorship

Every `BlogPosting` schema includes:
- `author` → `Organization` (Kron Technologies)
- `publisher` → `Organization` with logo
- `datePublished`, `dateModified`
- `articleSection` (category)

This makes blog posts attributable to Kron in AI citation systems.

### 5. Heading hierarchy

All pages maintain a strict h1 → h2 → h3 hierarchy. h1 is always the primary page title; h2 marks major sections; h3 marks sub-items. LLMs use heading structure to understand content nesting.

### 6. Product terminology

Product descriptions use explicit technical terminology: "Privileged Access Management (PAM)", "Password Vault", "Session Manager", "Multi-Factor Authentication". This ensures the content appears in retrieval results for these known industry terms.

### 7. `robots.txt` — LLM crawler rules

The `robots.txt` explicitly permits both `GPTBot` (OpenAI) and `Google-Extended` (Google AI Overviews) to crawl all public content. Backend API routes are blocked from all bots.

---

## Sitemap

`/sitemap.xml` is generated by `app/sitemap.ts`. It includes:

- All static routes for both locales (homepage, blog list, resources, contact)
- All product slugs for both locales
- All blog posts (from mock data; will come from API in production)

Each entry carries:
- `lastModified` — set to build time for static routes, post publish date for blog posts
- `changeFrequency` — calibrated per content type (blog list: daily, products: monthly)
- `priority` — homepage 1.0, products 0.9, blog list 0.8, blog/resources 0.7, contact 0.6
- `alternateRefs` — full hreflang cross-reference for all locales

---

## robots.txt

`/robots.txt` is generated by `app/robots.ts`:

- All crawlers: `Allow: /`, `Disallow: /api/`, `/swagger-ui/`, `/api-docs/`
- `GPTBot`: same rules as above (explicitly permitted for AI training)
- `Google-Extended`: same rules (explicitly permitted for AI Overviews)

---

## ISR revalidation

Content is cached by Next.js with per-type TTLs passed through `apiFetch()`:

| Content type | TTL    | Rationale                          |
|--------------|--------|------------------------------------|
| Generic pages | 1 h   | Low update frequency               |
| Blog list    | 1 h    | New posts infrequent               |
| Blog detail  | 1 h    | Published posts rarely change      |

When the backend publishes content (via `PublishingService`), it deletes the Redis cache key for the affected page. The Next.js ISR cache then revalidates on the next request, within the TTL window.

For time-critical updates, `revalidatePath()` can be called from a server action or a dedicated revalidation endpoint (not yet implemented — deferred to the admin panel pass).

---

## What is NOT yet implemented

| Feature                        | Notes |
|-------------------------------|-------|
| Blog sitemap from API          | Currently uses mock data; wire to `GET /api/v1/public/blog` when the API is running |
| On-demand ISR revalidation    | `revalidatePath()` endpoint — to be added with the admin panel |
| Locale-equivalent slug mapping | The locale switcher links to `/tr` and `/en` roots; deep-link equivalence requires `contentGroupId` lookup |
| Structured data for datasheets | `DigitalDocument` schema for downloadable PDFs — deferred until real file URLs are available |
