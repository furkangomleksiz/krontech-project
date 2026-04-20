# Review and Demo Guide

This document is written for a technical reviewer or interviewer.
It covers what to run, what to look at, the strongest architectural arguments, and known gaps.

---

## 1. Start the project in 4 commands

```bash
cp .env.example .env                    # defaults work out of the box
docker compose up -d                    # Postgres, Redis, MinIO, MinIO bucket init

# Terminal 1 — backend
cd apps/api && mvn spring-boot:run      # API at http://localhost:8080

# Terminal 2 — frontend
cd apps/web && npm install && npm run dev  # Site at http://localhost:3000
```

**Verify it's running:**
- Public site: `http://localhost:3000/tr`
- Admin login: `http://localhost:3000/admin/login` → `admin@krontech.local` / `Admin123!`
- Swagger UI: `http://localhost:8080/swagger-ui`
- MinIO console: `http://localhost:9001` → `minio` / `minio123`

---

## 2. The 30-minute reviewer's tour

### Public site (5 min)

| URL | What to observe |
|---|---|
| `http://localhost:3000/tr` | Homepage — hero, product cards, stats, blog highlights |
| `http://localhost:3000/tr/products/kron-pam` | Product page — feature rows, tab nav |
| `http://localhost:3000/tr/blog` | Blog list with sidebar |
| `http://localhost:3000/tr/blog/kron-pam-blog-1` | Blog detail with schema.org markup (View Source) |
| `http://localhost:3000/tr/resources` | Resources grid with datasheet cards |
| `http://localhost:3000/tr/contact` | Contact form — submit with a missing field to see validation |
| `http://localhost:3000/sitemap.xml` | Dynamic sitemap with hreflang alternates |
| `http://localhost:3000/robots.txt` | Allows public, blocks admin and API |

Switching `/tr` to `/en` in any URL shows the English locale variant.

### Admin CMS (10 min)

1. Log in as `admin@krontech.local` / `Admin123!`
2. **Pages** → Create a new page → Publish it → observe the status badge change
3. **Blog** → Edit a post → click "Get Preview Link" → open the preview URL in an incognito tab (shows DRAFT content without auth)
4. **Media** → Upload a JPEG — it lands in MinIO; the response shows `objectKey` and `publicUrl`
5. **Forms** → Submit the contact form from `/tr/contact` → it appears here with IP and consent recorded
6. **Redirects** → Create a rule: `sourcePath=/old`, `targetPath=/tr`, `statusCode=301` → visit `http://localhost:3000/old` and observe the redirect
7. **Log in as Editor** (`editor@krontech.local` / `Editor123!`) → observe that "Delete" buttons and the Users menu are absent

### API (5 min)

Open `http://localhost:8080/swagger-ui` and try:

| Endpoint | What to show |
|---|---|
| `POST /api/v1/auth/login` | Returns JWT with `role`, `email`, `expiresAt` |
| `GET /api/v1/public/blog?locale=tr` | Paginated blog list (no auth required) |
| `POST /api/v1/forms/submit` | Submit with `consentAccepted: false` → 400 with validation message |
| `POST /api/v1/forms/submit` | Submit with `website: "http://spam.com"` (honeypot) → 200 RECEIVED without DB write |
| `GET /api/v1/admin/audit` | Audit log of all content transitions (requires Bearer token from login) |

### Tests (5 min)

```bash
cd apps/api && mvn test
```

Expected: **43 tests, 0 failures** across 7 test classes covering:
- Publishing state machine (14 tests — all valid and invalid transitions)
- Form submission anti-spam (4 tests — honeypot, rate limit, valid submissions)
- Redirect service business logic (8 tests — conflict detection, toggle, resolve)
- JWT token generation and verification (5 tests)
- Auth service login flow (6 tests — valid credentials, wrong password, inactive user)
- Cache eviction logic (6 tests — all four cache names, skip-when-blank, null-safe)

### Caching and invalidation (5 min)

1. Publish a page in the admin
2. Check the Spring Boot logs — you should see `cache_evicted` lines and `frontend_revalidated` lines (if `REVALIDATE_SECRET` is set in `.env`)
3. Check Redis: `docker exec krontech-redis redis-cli keys "*"` — the cache key for that page is absent (evicted)

---

## 3. Architectural talking points

These are the choices most likely to be asked about in a review.

### "Why a modular monolith instead of microservices?"

A B2B marketing site has a small, predictable traffic pattern and a small editorial team.
Microservices would introduce distributed systems complexity (service mesh, inter-service auth,
distributed tracing, eventual consistency) with no practical benefit. The module structure
(`entity/repository/service/controller/dto` per domain) gives the same conceptual isolation
at the package level. Each module can be extracted if a scaling need emerges — its bounded
context is already drawn.

### "Why Spring Boot and not NestJS?"

Spring Data JPA maps our joined-inheritance content hierarchy cleanly. Spring Security's
JWT + `@PreAuthorize` is battle-tested. A single Spring framework handles web, security,
data, caching, scheduling, and events — no library stitching. The JVM startup cost is
irrelevant for a long-lived API process; the ISR layer absorbs ~99% of public traffic.

### "Why REST and not GraphQL?"

Every content type has a fixed response shape — a blog post is always the same fields.
GraphQL's flexible field selection is not needed. More practically: ISR cache keys are
URLs; you can't revalidate a GraphQL POST by path. Rate limiting per endpoint (different
limits for public reads vs. form submissions vs. admin writes) maps directly to URL prefixes.

### "How does multilingual content work?"

Each `(slug, locale)` pair is its own database row, so TR and EN can be at different
publish states independently. A nullable `contentGroupId` UUID links the two rows when
a translation exists. Locale-prefixed URLs (`/tr/...`, `/en/...`) are required by
`hreflang` to signal locale equivalents to search engines — the URL is the key.

### "How does cache invalidation work on publish?"

Publishing calls `CacheService.evictContent(locale, slug)`:
1. Evicts the Spring `@Cacheable` Redis entries synchronously
2. Asynchronously calls `POST /api/revalidate?secret=...&path=...` for each affected frontend URL

Next.js marks those ISR paths as stale; the next browser request regenerates them. If the
revalidation call fails, the ISR TTL (max 30 min for blog) is the fallback. Publishing never
blocks on cache health.

### "How does the preview system work?"

Every `Page` entity has a `previewToken UUID` column. Rotating the token invalidates the
previous preview link. `GET /api/v1/preview?token=...` returns the full page response
regardless of `PublishStatus`. The frontend `/preview?token=...` page renders this with a
visible "Preview mode" banner. No session cookie or admin auth is required to view a preview — 
just the token.

### "How is form anti-spam handled?"

Three layers, applied in sequence:
1. **Honeypot** (`website` field, hidden by CSS): if non-blank, return fake success without persisting.
   Bots don't know their submission was rejected.
2. **Per-IP rate limit** (5 submissions/IP/hour via Redis): throws 429 if exceeded.
3. **Consent flag** (`consentAccepted: true` required): enforced by `@AssertTrue` in the DTO —
   rejected at the Bean Validation layer before the service is called.

### "How was the frontend built from screenshots?"

Design tokens (colors, spacing, type scale) were extracted from the screenshots and expressed as
CSS custom properties. Six recurring layout sections were identified before writing any component.
All six public pages are composed from those sections — no page-specific layout CSS.
`docs/frontend-decisions.md` records every ambiguous interpretation.

---

## 4. Test coverage summary

| Test class | Tests | What is covered |
|---|---|---|
| `PublishingWorkflowTest` | 10 | schedule, unpublish, preview token, audit, scheduled promotion |
| `PublishingServiceTest` | 4 | publish DRAFT, publish SCHEDULED, conflict, 404 |
| `RedirectServiceTest` | 8 | create, conflict detection, update same/different rule, toggle, resolve |
| `AuthServiceTest` | 6 | valid login, wrong password, inactive user, 404 me, bootstrap skip |
| `JwtServiceTest` | 5 | token claims, role embedding, expiry assertion, wrong-secret rejection |
| `CacheServiceTest` | 6 | all four eviction keys, skip-when-blank (URL / secret), null-cache safe |
| `FormSubmissionServiceTest` | 4 | valid contact, valid demo request, honeypot, rate limit |
| **Total** | **43** | |

Frontend: no unit tests. Public pages are Server Components with no interactive logic; build-time type checking via `npm run build` serves as the integration gate.

---

## 5. Known limitations and honest gaps

| Area | Status |
|---|---|
| **Database migrations** | `ddl-auto: update` in dev. Flyway is the right production path — not yet added. |
| **Image optimization** | `<img>` tags used instead of `next/image` because `MediaAsset` does not consistently store `width`/`height`. `next.config.ts` has `remotePatterns` configured; migration to `<Image>` requires only component changes. |
| **CDN layer** | Not in the current stack. When added, `Cache-Control: s-maxage=...` headers should be set on public routes and CDN cache purge wired to publish events. |
| **Multi-instance publishing scheduler** | `@Scheduled` on a single node. Add a distributed lock (Redisson) if multiple API instances are deployed. |
| **Admin pagination** | Most admin list pages have client-side pagination. For large datasets, server-side pagination is already implemented in the API. |
| **No refresh token** | JWT is 60 min, no refresh flow. Sufficient for an admin audience; a production system should add refresh tokens. |
| **Rate limit in-memory fallback** | `RateLimitService` falls back to a `ConcurrentHashMap` when Redis is unavailable. Counters never expire in this mode. Acceptable for dev; Redis should be required in production. |
| **`content-type` validation on upload** | MIME type is validated from the `Content-Type` header of the multipart part. A hardened implementation should also inspect the file magic bytes. |

---

## 6. Key files for a reviewer

| File | Why it matters |
|---|---|
| `apps/api/src/main/java/.../publishing/service/PublishingService.java` | State machine — all transitions in one place |
| `apps/api/src/main/java/.../publishing/service/CacheService.java` | Two-layer cache invalidation (Redis + ISR revalidation) |
| `apps/api/src/main/java/.../pages/service/PublicContentService.java` | `@Cacheable` + public content assembly |
| `apps/api/src/main/java/.../config/SecurityConfig.java` | Security chain — permit list + JWT filter order |
| `apps/api/src/main/java/.../config/CacheConfig.java` | Redis cache manager with per-cache TTLs |
| `apps/web/src/middleware.ts` | Edge redirect resolution + locale routing |
| `apps/web/src/lib/api/public-content.ts` | ISR TTL choices per content type |
| `apps/web/src/app/api/revalidate/route.ts` | On-demand ISR invalidation endpoint |
| `apps/web/src/lib/seo.ts` | Central metadata builder — all SEO logic in one place |
| `apps/web/src/lib/schema.ts` | JSON-LD schemas — schema.org structured data |
| `docs/decisions.md` | Tradeoffs behind every major choice |
| `docs/content-model.md` | Entity relationships, locale linking, publishing states |
| `docs/caching-strategy.md` | Three cache layers and what each invalidates |
