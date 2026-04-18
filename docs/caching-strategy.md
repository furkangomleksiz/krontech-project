# Caching Strategy

## Overview

Three independent cache layers protect the public site. They are ordered from fastest
(closest to the user) to slowest, and each has a clear invalidation path.

```
Browser request
  │
  ├─ CDN/Reverse proxy (future — not in current stack)
  │     Cache-Control headers set by Next.js
  │
  ├─ Next.js ISR cache  (in-process, per worker)
  │     HTML pages cached per URL with stale-while-revalidate
  │     TTL: 30 min – 24 h depending on content type
  │     Invalidation: on-demand via POST /api/revalidate (triggered by backend on publish)
  │
  ├─ Redis application cache  (shared, in Docker / cloud)
  │     API response objects cached by content key
  │     TTL: 10–20 min
  │     Invalidation: Spring CacheManager.evict() called by CacheService on publish
  │
  └─ PostgreSQL  (source of truth)
```

---

## Layer 1 — Next.js ISR

Every public page uses `fetch(..., { next: { revalidate: N } })` via `apiFetch()` in
`lib/api/public-content.ts`.

### ISR TTLs

| Page | Constant | TTL | Rationale |
|---|---|---|---|
| Homepage | `HOMEPAGE_TTL` | 30 min | Shows recent blog highlights; short to stay current |
| Blog list | `BLOG_LIST_TTL` | 30 min | New posts should appear within half an hour |
| Blog post | `BLOG_POST_TTL` | 2 h | Published articles rarely change after initial publish |
| Product pages | `PRODUCT_TTL` | 2 h | Product copy is stable between releases |
| Resources | `RESOURCE_TTL` | 1 h | New datasheets added occasionally |
| Contact | `CONTACT_TTL` | 24 h | Nearly static — office addresses, form |

The TTL is the **fallback worst-case** staleness window. On-demand revalidation (see below)
supersedes the TTL for any content that is published or unpublished through the admin UI.

### On-demand revalidation

**Why it matters:** Without on-demand revalidation, publishing a blog post at 09:00
could still show the old content to users until the next ISR trigger — up to 30 minutes
later. With on-demand revalidation, the page is invalidated within seconds of publishing.

**How it works:**

```
Admin publishes content
  │
  ▼
PublishingService.publish()
  │
  ▼
CacheService.evictContent(locale, slug)
  ├─ Evict Redis caches (synchronous)
  └─ CompletableFuture.runAsync →  POST /api/revalidate?secret=…&path=/{locale}
                                    POST /api/revalidate?secret=…&path=/{locale}/blog
                                    POST /api/revalidate?secret=…&path=/{locale}/blog/{slug}
                                    POST /api/revalidate?secret=…&path=/{locale}/products/{slug}
                                    POST /api/revalidate?secret=…&path=/{locale}/resources
```

The Next.js route handler (`app/api/revalidate/route.ts`) validates the shared secret and
calls `revalidatePath(path, "page")`, marking the cached HTML for that path as stale.
The next browser request for that URL triggers a fresh server render.

**Async, fail-open:** The revalidation HTTP calls run in a daemon thread.  The publish
API response returns to the editor immediately.  If the Next.js server is unreachable,
the calls are logged as warnings and the ISR TTL governs staleness.

**Configuration:**

| Variable | Set in | Purpose |
|---|---|---|
| `REVALIDATE_SECRET` | API `.env` + `apps/web/.env.local` | Shared secret — must match on both sides |
| `WEB_APP_URL` | API `.env` | URL the backend uses to reach Next.js (default: `http://localhost:3000`) |

Both values default to blank, which disables on-demand revalidation without breaking anything.

### Static pre-rendering for known product slugs

`app/[locale]/products/[slug]/page.tsx` exports `generateStaticParams()` which returns all
combinations of `(locale, slug)` from `productSlugs` in `lib/i18n.ts`. These pages are
pre-rendered at build time — zero TTFB for crawlers and first visitors.

Unknown product slugs (not in `productSlugs`) fall back to ISR on first request.

---

## Layer 2 — Redis application cache

All three public content methods in `PublicContentService` are decorated with Spring's
`@Cacheable` annotation, backed by the `RedisCacheManager` configured in `CacheConfig.java`.

### Cache names and TTLs

| Cache name | Method | Key | Redis TTL |
|---|---|---|---|
| `pages` | `getPage(slug, locale)` | `slug:locale` | 10 min |
| `blog-list` | `getBlogList(locale, ...)` | `locale` (page 0 only) | 10 min |
| `blog-detail` | `getBlogDetail(slug, locale)` | `slug:locale` | 20 min |
| `resource-list` | _(reserved for resource service)_ | `locale` | 10 min |

**Why Redis TTL < ISR TTL?**  
When ISR triggers a re-fetch (e.g. after a cache miss), the Spring API must return fresh
data.  If the Redis cache has a 10-min TTL and ISR has a 30-min TTL, the worst case is:
- ISR triggers re-fetch at t+30 min
- Redis is still warm → API returns from Redis (slightly stale, up to 10 min old)
- True worst case: 30 + 10 = 40 min of total staleness **without on-demand revalidation**

With on-demand revalidation, both layers are flushed on publish, so this scenario is
avoided in normal operation.

### Serialization

Values are serialized to JSON using `GenericJackson2JsonRedisSerializer`.  This embeds a
`@class` type hint in each cached value, which is used for deserialization.  If a DTO
changes incompatibly (field renamed/removed), the old cached values will fail to
deserialize.  The Spring Cache abstraction catches this and falls through to the actual
method, so a DTO change is not a service-breaking event — but it will cause a cache miss
storm on the first deploy.  Flush Redis on deployment if DTOs change.

### Eviction on publish/unpublish

`CacheService.evictContent(locale, slug)` calls `cacheManager.getCache(cacheName).evict(key)`
for all four cache names.  If Redis is unavailable, the eviction is logged as a warning and
the publish succeeds anyway — the next API request will re-populate the cache from PostgreSQL.

---

## Layer 3 — PostgreSQL

Source of truth. Queried when:
- Redis cache is cold (first request, TTL expired, or cache was evicted)
- `@Cacheable` condition is false (e.g. blog list requests beyond page 0)
- Redis is unavailable

No additional query-level caching (e.g. Hibernate second-level cache) is implemented.
For a B2B site with moderate traffic, direct PostgreSQL queries are fast enough.

---

## What Redis is NOT used for in this project

- Session storage (stateless JWT)
- Job queues (no background jobs beyond scheduled publish)
- Rate limiting write operations — rate limits **are** stored in Redis via `RateLimitService`

---

## Image optimization

### next/image configuration

`next.config.ts` declares `images.remotePatterns` for:
- `http://localhost:9000/**` — MinIO local dev
- `http://host.docker.internal:9000/**` — MinIO accessed from within Docker
- `https://**` — any HTTPS host (production CDN / S3 bucket)

### Using next/image for CMS images

Current state: content components use plain `<img>` tags because `MediaAsset` does not
yet store width/height consistently, and `next/image` requires dimensions for layout
reservation.

To migrate a component:
1. Import `Image from "next/image"` instead of using `<img>`
2. Provide `width` and `height` (from `MediaAsset.width/height`) or use `fill` + a
   positioned wrapper
3. Add `loading="lazy"` (default for below-fold images) or `priority` for LCP images

LCP target: the hero image on product pages and the homepage should use `priority` to
avoid lazy-load delay on the largest contentful paint element.

### Native lazy loading

All `<img>` tags without an explicit `loading` attribute default to browser-native lazy
loading in modern browsers. For images that are likely in the initial viewport (hero,
above-fold), add `loading="eager"` to avoid unnecessary delay.

---

## Core Web Vitals considerations

| Metric | Current mitigations |
|---|---|
| **LCP** (Largest Contentful Paint) | Product pages are statically pre-rendered (no TTFB). Hero images should use `loading="eager"` + `fetchpriority="high"`. |
| **CLS** (Cumulative Layout Shift) | `<img>` tags without explicit width/height cause layout shift. Migrating hero images to `next/image` with dimensions is the fix. |
| **INP** (Interaction to Next Paint) | Public pages are Server Components — no client JS on first load. ContactForm is a Client Component but deferred until the section scrolls into view. |
| **TTFB** (Time to First Byte) | ISR means most requests are served from the in-process cache with no network hop to the API. Product pages are fully pre-rendered. |

---

## Redirect rule caching (middleware)

Active redirect rules are cached inside the Next.js Edge Middleware process:

| Layer | TTL | Mechanism |
|---|---|---|
| Module-level in-process cache | 5 min | Module variable with `cacheExpiresAt` timestamp |
| Next.js `fetch` cache | 5 min | `next: { revalidate: 300 }` on the bulk-load fetch |

**On cold start:** the middleware calls `GET /api/v1/public/redirects` synchronously.
If the API is unreachable, the cache stays empty and no redirect rules fire (fail-open).

**On network error:** stale rules are preserved and a 30-second retry penalty is applied
to avoid hammering an unavailable API.

**To flush immediately** (e.g. on migration cutover): restart the Next.js process.

---

## What invalidates what

| Event | Redis evicted | Next.js paths revalidated |
|---|---|---|
| Page published | `pages::slug:locale` | `/{locale}`, `/{locale}/blog`, `/{locale}/blog/{slug}`, `/{locale}/products/{slug}`, `/{locale}/resources` |
| Page unpublished | Same as above | Same as above |
| Blog post published | `pages::slug:locale`, `blog-list::locale`, `blog-detail::slug:locale` | Same as above |
| Scheduled publish (auto) | Same as blog published | Same as above |
| Redirect rule changed | N/A | Next.js restart or 5-min cache TTL |

---

## First-pass limits (acknowledged)

- **CDN integration** is not in the current stack. When a CDN (CloudFront, Cloudflare) is
  added, add `Cache-Control: s-maxage=3600, stale-while-revalidate` headers to public
  page routes and wire CDN cache invalidation (tag-based or URL purge) alongside
  `revalidatePath()`.
- **Fine-grained cache tag invalidation** — `revalidateTag()` would allow more targeted
  invalidation (e.g. only invalidate pages that embed a specific blog post). Deferred.
- **Redis cluster / sentinel** — single Redis instance is appropriate for this stage.
