# SEO Migration Guide

## Context

This guide explains how the Krontech.com rebuild handles URL continuity and SEO
preservation during the transition from the existing site to the new Next.js + Spring Boot
platform. The goal is to minimize ranking loss by keeping every indexed URL either
accessible at the same path or covered by a 301 redirect.

---

## The primary SEO risk: locale-prefixed routing

The new site uses locale-prefixed paths (`/tr/...`, `/en/...`).
The existing site likely serves Turkish content at non-prefixed paths (e.g. `/urunler/kron-pam`).

If a search engine has indexed `https://www.krontech.com.tr/urunler/kron-pam` and the new
site responds with a 404 at that URL, the indexed ranking is lost.

**Solution:** Add a redirect rule for every previously indexed URL that has changed.

---

## Redirect infrastructure

### Data model

`redirect_rules` table (PostgreSQL):

| Column | Type | Notes |
|---|---|---|
| `id` | UUID | Primary key |
| `source_path` | VARCHAR(500) | Old path, e.g. `/urunler/kron-pam`. Unique. |
| `target_path` | VARCHAR(500) | New path or full URL |
| `status_code` | INT | 301 (permanent) or 302 (temporary) |
| `active` | BOOLEAN | Inactive rules are kept but not evaluated |
| `notes` | VARCHAR(1000) | Free-text: migration context, ticket, date |
| `created_at` | TIMESTAMPTZ | |
| `updated_at` | TIMESTAMPTZ | |

### Resolution flow

```
Browser request
  │
  ▼
Next.js Edge Middleware (src/middleware.ts)
  ├─ "/"  →  301 → "/tr"  (root → default locale, always)
  ├─ Check in-memory cache (5-min TTL)
  │      │
  │      └─ On cold start or cache miss:
  │           GET /api/v1/public/redirects  →  list of all active rules
  │           Store in module-level cache
  │
  ├─ sourcePath match found  →  301/302 → targetPath  (before any page rendering)
  └─ No match  →  set x-locale header, continue to Next.js routing
```

**Why Edge Middleware?**
Redirects issued at the Edge (before rendering) return the correct HTTP status code
to both browsers and search engine crawlers. A JavaScript-level redirect from a
React component cannot set a proper 301 — the crawler sees a 200 with a redirect hint,
which is not SEO-safe.

---

## Canonical URL strategy

### Default canonical
Every content page sets `<link rel="canonical" href="https://www.krontech.com.tr/{locale}{path}">`.
This is driven by `SeoMetadata.canonicalPath` on the content record and resolved in `lib/seo.ts`.

### When to override the canonical
Set `SeoMetadata.canonicalPath` explicitly when:
- A page is accessible at more than one path (e.g. a paginated list page where all pages
  should point to the base `/blog` canonical)
- A third-party syndicated article should point to the original publisher's URL
- During migration, a legacy page that receives traffic via a redirect should have its
  canonical set to the new preferred URL

### Thin duplicate-URL protection
The `(slug, locale)` unique constraint on the `pages` table prevents two active records
from sharing the same URL. The SEO layer still emits explicit canonical tags because
canonicalization is a separate concern from uniqueness.

---

## Migration playbook

### Step 1 — Crawl the existing site

Before launch, crawl `https://www.krontech.com.tr/` with a tool like Screaming Frog or
`wget --spider`. Export every 200-status URL. This is your **baseline indexed URL list**.

### Step 2 — Map old URLs to new URLs

For each old URL, identify the corresponding new URL in the new system:

| Old URL pattern | New URL pattern | Notes |
|---|---|---|
| `/` | `/tr` | Root → default locale |
| `/urunler/{slug}` | `/tr/products/{slug}` | Turkish product URL |
| `/products/{slug}` | `/en/products/{slug}` | If old site had English |
| `/blog/{slug}` | `/tr/blog/{slug}` or `/en/blog/{slug}` | Depends on locale of post |
| `/kaynaklar/{slug}` | `/tr/resources/{slug}` | Resources |
| `/iletisim` | `/tr/contact` | Contact page |

### Step 3 — Enter redirect rules in the CMS

1. Open the admin at `/admin/redirects`.
2. For each mapping, create a redirect rule:
   - **Source path:** the old URL (e.g. `/urunler/kron-pam`)
   - **Target path:** the new URL (e.g. `/tr/products/kron-pam`)
   - **Status code:** `301` for permanent moves
   - **Notes:** include the migration date and a reference to the URL mapping spreadsheet
3. Keep **active = false** until migration day; flip all to active on cutover.

### Step 4 — DNS / CDN cutover

When the new site goes live:
1. Deploy the new Next.js + Spring Boot stack.
2. Activate the redirect rules via the admin UI.
3. Update DNS to point to the new host.
4. Verify redirects with `curl -I https://www.krontech.com.tr/urunler/kron-pam`.

### Step 5 — Request reindexing

After launch:
- Submit the updated `sitemap.xml` to Google Search Console.
- Use the URL inspection tool to request crawling of high-value pages.
- Monitor coverage and redirect reports for the first 30 days.

### Step 6 — Post-migration cleanup

After 6–12 months when redirects are consistently indexed:
- Verify in Search Console that the new URLs are indexed and the old URLs are no longer.
- Deactivate (do not delete) redirect rules that are no longer needed.
- Keep the rules in the database as an audit trail.

---

## Canonical URL consolidation examples

### Homepage

```
Old: https://www.krontech.com.tr/
New: https://www.krontech.com.tr/tr
Redirect rule: / → /tr (301)
Canonical on new page: /tr
```

### Product page

```
Old: https://www.krontech.com.tr/urunler/kron-pam
New: https://www.krontech.com.tr/tr/products/kron-pam
Redirect rule: /urunler/kron-pam → /tr/products/kron-pam (301)
Canonical on new page: /tr/products/kron-pam
SeoMetadata.canonicalPath = /tr/products/kron-pam
```

### hreflang pairing

When both TR and EN variants exist, the canonical is locale-specific and
`hreflangAlternates()` (in `lib/i18n.ts`) emits:

```html
<link rel="alternate" hreflang="tr" href="https://www.krontech.com.tr/tr/products/kron-pam">
<link rel="alternate" hreflang="en" href="https://www.krontech.com.tr/en/products/kron-pam">
<link rel="alternate" hreflang="x-default" href="https://www.krontech.com.tr/tr/products/kron-pam">
```

Search engines treat these as linked locale variants, not duplicate content.

---

## What is intentionally out of scope

- **Wildcard redirect patterns** (`/blog/*` → `/tr/blog/*`): The current model requires
  explicit per-URL rules. Wildcard support can be added by scanning `sourcePath` with
  a prefix match, but this adds complexity and risks over-matching. For a typical B2B
  site with a bounded URL set, explicit rules are safer.

- **Server-side redirect caching at the CDN layer**: This is the ideal long-term
  architecture (Nginx / CloudFront redirects before hitting Next.js at all). The
  middleware approach is correct for the current stage and can be replaced with a CDN
  rule set once the redirect list stabilizes.

- **410 Gone**: The current model supports 301/302 only. If a page is removed with no
  replacement, add a `noIndex: true` flag to the content record and set the canonical
  to the closest topical parent. True 410 responses require a catch-all Next.js page
  that calls the resolve endpoint.

---

## Environment variables

No new environment variables are needed. Redirect rules are stored in PostgreSQL and
served through the existing API stack.

The middleware reads `NEXT_PUBLIC_API_BASE_URL` (already required) to call the redirect
bulk-load endpoint.
