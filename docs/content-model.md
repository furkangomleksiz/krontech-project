# Content Model — First-Pass Reference

> Reference for the JPA model and API DTOs. Reconcile with `apps/api` entities when in doubt.

---

## Principles

1. **Relational first, JSON only where justified.** Every field that needs filtering, sorting, or joining lives as a typed column or FK. Flexible block props use JSON (see `ContentBlock.payloadJson`), because block schemas are variable and not queried field-by-field.
2. **One row per locale variant.** Each language version of a page is a separate row. Locale variants are linked by `contentGroupId` for `hreflang` rendering and locale switching.
3. **Single extensible base type.** All content pages extend `Page` using JPA JOINED inheritance. Adding a new page type is one new entity and one new table — no schema changes to existing tables.
4. **SEO metadata is shared and structured.** `SeoMetadata` is an `@Embeddable` embedded into every `Page` subclass. It is never duplicated or stored separately. OG fields live alongside standard meta fields in the same embedded block.
5. **Publishing state is explicit.** `Page.status` is an enum (`DRAFT`, `SCHEDULED`, `PUBLISHED`). The transition timestamps are separate fields — `publishedAt` records when the page actually went live; `scheduledAt` records a desired future publish time.
6. **Media is stored by objectKey, not URL.** `MediaAsset` records file metadata. URLs are built at serve time via `ObjectStorageClient.buildPublicUrl(objectKey)`. This allows the storage endpoint to change without a data migration.

---

## Entity Map

### `Page` (table: `pages`)

Base record for every content page. Subclasses add type-specific fields via JOINED inheritance.

| Column | Type | Notes |
|---|---|---|
| `id` | UUID PK | Inherited from `BaseEntity` |
| `dtype` | VARCHAR | JPA discriminator (set by ORM) |
| `pageType` | VARCHAR | CMS label, e.g. `"homepage"`, `"landing-page"` |
| `slug` | VARCHAR | URL segment (e.g. `"kronpam"`) |
| `locale` | ENUM(TR, EN) | Each locale variant is a separate row |
| `contentGroupId` | UUID | Links locale variants; nullable for standalone pages |
| `status` | ENUM | `DRAFT`, `SCHEDULED`, `PUBLISHED` |
| `publishedAt` | TIMESTAMP | Set when status transitions to PUBLISHED |
| `scheduledAt` | TIMESTAMP | Desired future publish time; only relevant when `SCHEDULED` |
| `previewToken` | UUID UNIQUE | Token-gated preview access; null until requested |
| `title` | VARCHAR(1000) | Render title |
| `summary` | TEXT | Excerpt / intro paragraph |
| `heroImageKey` | VARCHAR(500) | S3 objectKey for hero/cover image |
| `seo.*` | Embedded | See `SeoMetadata` fields below |
| `createdAt` | TIMESTAMP | Inherited |
| `updatedAt` | TIMESTAMP | Inherited |

**Unique constraint:** `(slug, locale)` — enforces one active record per URL per locale.

---

### `SeoMetadata` (`@Embeddable` into `Page`)

Embedded block — no separate table. All fields are nullable.

| Field | Type | Notes |
|---|---|---|
| `metaTitle` | VARCHAR(180) | `<title>` tag |
| `metaDescription` | VARCHAR(300) | `<meta name="description">` |
| `canonicalPath` | VARCHAR(255) | `<link rel="canonical">` |
| `noIndex` | BOOLEAN | Defaults to `false` |
| `ogTitle` | VARCHAR(180) | Falls back to `metaTitle` at render time |
| `ogDescription` | VARCHAR(300) | Falls back to `metaDescription` at render time |
| `ogImageKey` | VARCHAR(500) | S3 objectKey; URL resolved via `ObjectStorageClient` |
| `structuredDataJson` | TEXT | Verbatim JSON-LD block for schema.org markup |

---

### `BlogPost` (table: `blog_posts`)

Extends `Page`. Discriminator value: `BLOG_POST`.

| Column | Type | Notes |
|---|---|---|
| `body` | TEXT | Full article content; unbounded |
| `readTimeMinutes` | INT | Shown in list/detail view; defaults to 0 |
| `tags` | VARCHAR(500) | Comma-separated labels; simple for this pass |

---

### `Product` (table: `products`)

Extends `Page`. Discriminator value: `PRODUCT`.

| Column | Type | Notes |
|---|---|---|
| `highlights` | TEXT | Free-form feature list; parsed into `featureBullets` (max 3) for the listing card |
| `resourcesIntroTitle` | VARCHAR(500) | Heading for the wide intro card on the Resources tab; nullable |
| `resourcesIntroBody` | TEXT | Body text for the Resources tab intro card; nullable |
| `resourcesIntroImageKey` | VARCHAR(500) | S3 objectKey for the Resources tab intro image; nullable |
| `resourcesIntroImageAlt` | VARCHAR(500) | Alt text for the Resources tab intro image; nullable |

Tab-specific card content (Solution, How It Works, Key Benefits, Resources) lives in `product_tab_cards`, not in this table.

---

### `ProductTabCard` (table: `product_tab_cards`)

Cards displayed inside the four fixed tabs on a product detail page. Not a `Page` subclass — extends `BaseEntity` directly and links to `products` via FK.

| Column | Type | Notes |
|---|---|---|
| `id` | UUID PK | Inherited from `BaseEntity` |
| `product_id` | UUID FK → `products.id` | `@ManyToOne`, not nullable |
| `tab` | ENUM | `SOLUTION`, `HOW_IT_WORKS`, `KEY_BENEFITS`, `RESOURCES` |
| `sort_order` | INT | Display order within the tab |
| `title` | VARCHAR(500) | Card heading; not nullable |
| `body` | TEXT | Card body text; not nullable |
| `imageObjectKey` | VARCHAR(500) | S3 objectKey for card image; nullable |
| `imageAlt` | VARCHAR(500) | Alt text; nullable (falls back to catalog alt on the `MediaAsset`) |

**Unique constraint:** `(product_id, tab, sort_order)` — enforces one card per position per tab.

**Index:** `product_id` for fast per-product lookups.

The `RESOURCES` tab cards are managed separately from `resourcesIntroTitle/Body/ImageKey` — the intro card is a wide banner stored on the `products` row; the tab cards below it are rows here.

API value mapping for `tab`: `SOLUTION → "solution"`, `HOW_IT_WORKS → "how_it_works"`, `KEY_BENEFITS → "key_benefits"`, `RESOURCES → "resources"`.

---

### `ResourceItem` (table: `resources`)

Extends `Page`. Discriminator value: `RESOURCE`.

| Column | Type | Notes |
|---|---|---|
| `resourceType` | ENUM | `DATASHEET`, `WHITEPAPER`, `CASE_STUDY`, `VIDEO`, `OTHER` |
| `fileKey` | VARCHAR(500) | S3 objectKey; nullable if resource is external |
| `externalUrl` | VARCHAR(1000) | External link; nullable if file is S3-stored |
| `filePreviewImageKey` | VARCHAR(500) | Optional JPEG preview of a PDF; URL resolved via `ObjectStorageClient` |

At least one of `fileKey` or `externalUrl` must be non-null. This is enforced at the service layer, not the database level, to allow partial admin saves.

---

### `ContentBlock` (table: `content_blocks`)

Reusable content blocks attached to any page. All page section composition uses blocks.

| Column | Type | Notes |
|---|---|---|
| `id` | UUID PK | |
| `page_id` | UUID FK → `pages.id` | `@ManyToOne`, not nullable |
| `blockType` | VARCHAR | E.g. `"hero"`, `"feature-grid"`, `"cta-band"` |
| `sortOrder` | INT | Render order within the page |
| `payloadJson` | VARCHAR(12000) | Block-type-specific data; JSON because block schemas vary |

`payloadJson` is the justified use of JSON in this model. Block props differ per type and are never individually queried by the database — the frontend deserialises the full payload. A typed columns approach would require a schema migration per new block type.

---

### `MediaAsset` (table: `media_assets`)

Central file catalog. Every uploaded file gets one row.

| Column | Type | Notes |
|---|---|---|
| `objectKey` | VARCHAR UNIQUE | Path within the S3 bucket |
| `fileName` | VARCHAR | Original filename as uploaded |
| `mimeType` | VARCHAR | MIME type |
| `sizeBytes` | BIGINT | |
| `altText` | VARCHAR(500) | Accessibility alt text; nullable for non-images |
| `width` | INT | Pixel width; nullable for non-images |
| `height` | INT | Pixel height; nullable for non-images |

Content pieces reference media by `objectKey` string, not by FK. This avoids JOINs for URL resolution and is consistent with the `ObjectStorageClient` pattern. The trade-off is no referential integrity at the DB level — the admin UI should warn before deleting referenced assets.

---

### `FormSubmission` (table: `form_submissions`)

Lead/contact form captures.

| Column | Type | Notes |
|---|---|---|
| `formType` | ENUM | `CONTACT`, `DEMO_REQUEST` |
| `fullName` | VARCHAR | |
| `email` | VARCHAR | |
| `company` | VARCHAR | |
| `department` | VARCHAR(200) | Optional |
| `phone` | VARCHAR(200) | Optional |
| `jobTitle` | VARCHAR(200) | Optional |
| `message` | TEXT | |
| `consentAccepted` | BOOLEAN | Must be `true`; enforced at service layer |
| `sourcePage` | VARCHAR(500) | Which page triggered the form |
| `ipAddress` | VARCHAR(50) | Set from `HttpServletRequest.getRemoteAddr()` |
| `createdAt` | TIMESTAMP | Submission timestamp (via `BaseEntity`) |

---

### `RedirectRule` (table: `redirect_rules`)

HTTP redirects: rules are read from the API (`GET /api/v1/public/redirects`) and applied in Next.js Edge Middleware before rendering.

| Column | Type | Notes |
|---|---|---|
| `sourcePath` | VARCHAR UNIQUE | Incoming path to match |
| `targetPath` | VARCHAR | Destination path |
| `statusCode` | INT | `301` (permanent) or `302` (temporary) |
| `active` | BOOLEAN | Inactive rules are preserved but not applied |
| `notes` | VARCHAR(1000) | Optional migration/audit text |

---

### `UserAccount` (table: `user_accounts`)

CMS users. Not part of the public content model.

| Column | Notes |
|---|---|
| `email` | Case-insensitive unique |
| `passwordHash` | BCrypt |
| `role` | `ADMIN`, `EDITOR` |
| `active` | Soft-disable without deletion |

---

## Localization Strategy

Each locale variant of a page is a **separate row** in `pages`. This means:

- `slug=home, locale=EN` and `slug=ana-sayfa, locale=TR` are two independent rows
- They share the same `contentGroupId` UUID so the frontend can render `<link rel="alternate" hreflang="tr">` headers and power the locale switcher
- Content blocks are **per page row** — blocks are not shared across locales; each variant has its own block set

This design avoids a complex `content_translations` join table while remaining simple to query. The trade-off is that updating both locales requires two writes.

---

## Publishing Lifecycle

```
DRAFT ──publish()──▶ PUBLISHED
DRAFT ──schedule()─▶ SCHEDULED ──publish()──▶ PUBLISHED
```

- `PublishingService.publish()` accepts both `DRAFT` and `SCHEDULED` pages
- `publishedAt` is set to `Instant.now()` at the transition point
- `scheduledAt` is set by the editor when choosing a future publish time; `ScheduledPublishingService` (fixed-delay scheduler) promotes `SCHEDULED` rows to `PUBLISHED` when `scheduledAt` is in the past
- On every publish, unpublish, or successful scheduled promotion, `CacheService` evicts the relevant Spring/Redis public caches and (when configured) triggers Next.js on-demand revalidation

---

## Preview Support

- `Page.previewToken` is a UUID that grants read access to a page regardless of `status`
- Token is null until an authenticated editor calls `POST /api/v1/admin/pages/{id}/preview-token`
- The public preview endpoint `GET /api/v1/preview?token={uuid}` returns full page content including blocks
- Tokens can be rotated by calling the token endpoint again — the old token is immediately invalidated

---

## API Response Shape

Public endpoints return typed DTOs, never raw entities.

**`PublicPageResponse`** (generic pages):
```
{ slug, locale, title, summary, heroImageUrl,
  seo: { title, description, canonicalPath, noIndex, ogTitle, ogDescription, ogImageUrl, structuredDataJson },
  blocks: [ { blockType, sortOrder, payloadJson } ]
}
```

**`BlogDetailResponse`** (blog post):
```
{ slug, locale, title, excerpt, body, heroImageUrl, tags, readTimeMinutes, publishedAt,
  seo: { ... }
}
```

Blog detail does not include blocks — the `body` field carries the full article. Blocks are reserved for composite landing/product pages.

**`ProductResponse`** (product detail):
```
{ slug, locale, title, summary, highlights, heroImageUrl,
  seo: { ... },
  detailTabs: [
    { tab: "solution"|"how_it_works"|"key_benefits"|"resources",
      cards: [ { sortOrder, title, body, imageUrl, imageAlt } ] }
  ],
  resourcesIntro: { title, body, imageUrl, imageAlt } | null,
  linkedResources: [ ResourceResponse, ... ],
  blocks: [ { blockType, sortOrder, payloadJson } ]
}
```

`detailTabs` always contains all four tabs in declaration order; tabs with no cards return an empty `cards` array. `blocks` carries generic layout blocks (hero, text, split-cta, etc.) that compose the page around the tab section. `imageUrl` values in `detailTabs` and `resourcesIntro` are resolved at serve time via `ObjectStorageClient`.

**`ResourceResponse`** (resource list item):
```
{ slug, locale, title, summary, resourceType, heroImageUrl, downloadUrl }
```

`downloadUrl` is resolved at serve time: if `fileKey` is set it is built via `ObjectStorageClient`; otherwise `externalUrl` is used.

---

## What this model does not yet cover

| Concern | Notes |
|---|---|
| Content versioning | No version history; a future `page_versions` snapshot table would support rollback |
| Tag taxonomy | `BlogPost.tags` is comma-separated; a `tags` + `page_tags` join table would help if faceted blog filtering is required |
| Public sitemap for all blog URLs | The Next.js sitemap still includes blog post URLs from mock data for structural coverage; wiring it to `GET /api/v1/public/blog` (both locales) is the follow-up for production accuracy |
| Redis cache on resource list | `ResourceService.list` is not `@Cacheable`; `resource-list` is registered in cache config and evicted on publish for forward compatibility |
| Wildcard redirect rules | Only exact `sourcePath` matches; prefix/wildcard rules are out of scope (see `docs/seo-migration.md`) |
