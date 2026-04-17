# Caching Strategy

## Cache layers

1. **CDN/Edge cache**
   - Public route HTML and static assets
   - Controlled by cache headers from frontend edge/runtime layer

2. **Next.js ISR cache**
   - `fetch(..., { next: { revalidate: N } })` for API-driven public content
   - Per-content-type TTLs set in `lib/api/public-content.ts` (see table below)
   - `sitemap.xml` and `robots.txt` are generated statically at build time

3. **Application cache (Redis)**
   - API-level response fragments and rate-limit counters
   - Publish-trigger invalidation keys

## ISR revalidation TTLs

TTLs are set per content type based on expected update cadence. They are passed
to `apiFetch()` as `revalidateSeconds`:

| Content             | TTL   | Source constant   | Rationale                          |
|---------------------|-------|-------------------|------------------------------------|
| Generic pages       | 1 h   | `PAGE_TTL`        | Low editorial update frequency     |
| Blog list           | 1 h   | `BLOG_LIST_TTL`   | New posts infrequent               |
| Blog detail         | 1 h   | `BLOG_POST_TTL`   | Published articles rarely change   |

### SEO implications of TTLs

When a page is published, the stale ISR cache means search engines may see the
old version for up to 1 h. For time-sensitive SEO changes (e.g., fixing a
canonical URL or OG title), on-demand revalidation via `revalidatePath()` should
be triggered from the admin panel — this is not yet implemented and is deferred
to the admin panel pass.

## Publish invalidation flow

When page content moves from `DRAFT` to `PUBLISHED`:

1. API marks content status and publish timestamp (`publishedAt`)
2. Redis keys for the affected `{locale}:{slug}` are deleted
3. Frontend: on the next request after the TTL (or on-demand revalidation), Next.js
   fetches fresh content from the API and repopulates the ISR cache
4. CDN receives refreshed HTML under the same SEO-friendly canonical URL

## Sitemap freshness

`sitemap.xml` is generated at build time. Blog post `lastModified` values reflect
actual `publishedAt` dates so search engine crawlers can prioritise recently
published content. When on-demand revalidation is added, `sitemap.xml` should be
included in the `revalidatePath()` call set after each content publish.

## First-pass limits

- Fine-grained cache tag invalidation and queue-driven CDN purge orchestration are deferred
- On-demand `revalidatePath()` endpoint is deferred to the admin panel pass
- This first pass keeps invalidation explicit and reviewable, avoiding hidden complexity
