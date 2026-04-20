# Technical Decisions and Tradeoffs

Concise reasoning for the significant technical choices. Each entry states the decision,
the alternatives considered, and why the choice fits this specific context.

---

## Architecture: Modular Monolith

**Decision:** Single deployable Spring Boot application with domain-isolated packages.

**Alternatives considered:** Microservices, separate Node.js BFF + Java service.

**Why:**

A B2B marketing site with a small editorial team has no traffic pattern that requires
independently scalable services. Microservices would introduce distributed systems
complexity — separate deployments, service mesh, distributed tracing, inter-service
auth, and eventual consistency — with no practical benefit.

The module structure gives the same conceptual isolation as microservices at the package
level. Each module owns its own `entity`, `repository`, `service`, `controller`, and `dto`
subtree and does not reach into another module's internals. If a module must be extracted
to a service later, its bounded context is already drawn and its data is in its own tables.

**Tradeoff accepted:** A shared PostgreSQL instance is a coupling point. Mitigated by the
convention that no module issues JPA queries across module-owned tables. The only
cross-module dependencies are shared types (`SeoMetadata`, `LocaleCode`, `PublishStatus`,
`BaseEntity`) which carry no business logic.

---

## Backend: Spring Boot 3 + Java 17

**Decision:** Spring Boot over NestJS, Quarkus, or Micronaut.

**Why:**

- **JPA + Hibernate** provides the cleanest mapping for the joined-inheritance content
  hierarchy (`Page → BlogPost / Product / ResourceItem`). The `@Inheritance(JOINED)` +
  `@Table` pattern is battle-tested and generates exactly the schema we want.
- **Spring Security** handles JWT validation, stateless session, CORS, and
  method-level role enforcement with minimal wiring (`@EnableMethodSecurity`,
  `@PreAuthorize`). No framework-specific "gotchas" around security configuration.
- **Bean Validation** with Java records and `@AssertTrue` for compound rules
  (e.g. `statusCode must be 301 or 302`) is concise and co-located with the DTO.
- **Spring ecosystem breadth:** a single framework handles web, security, data, caching
  (`@Cacheable`), scheduling (`@Scheduled`), events (`ApplicationEventPublisher`), and
  S3 integration — no library stitching required.

**Tradeoff accepted:** Higher JVM memory footprint and cold start vs. Node.js or native
Quarkus. Irrelevant for a long-lived API process; the frontend ISR layer absorbs almost
all public traffic before it reaches the API.

---

## API Protocol: REST

**Decision:** REST over HTTPS with JSON bodies, HTTP verbs, and resource-shaped URLs.

**Alternatives considered:** GraphQL, tRPC, gRPC.

**Why REST:**

The content model is well-defined and stable. Each content type has a fixed response
shape — a blog post response is always the same fields regardless of which view requests
it. GraphQL's value proposition (flexible field selection, composable queries across
types) would go unused.

Operational advantages of REST for this project:
- **Rate limiting** is per-endpoint (different limits for public reads vs. form
  submission vs. admin writes), which maps naturally to URL prefixes.
- **ISR caching** in Next.js works with URL-shaped resources. `fetch("/public/blog/my-post")`
  can carry `next: { revalidate: 7200 }` cleanly. A `/graphql` POST cannot be
  reliably cached by URL.
- **HTTP semantics are the error contract.** 404 for missing content, 409 for duplicate
  slug, 429 for rate limit exceeded — these map directly to frontend handling with no
  custom error envelope needed.

**Tradeoff accepted:** A flexible admin reporting or dashboard might benefit from
GraphQL (e.g. "all published posts and their linked media assets, grouped by locale").
That use case is explicitly out of scope for this assignment.

---

## Frontend: Next.js App Router

**Decision:** Next.js 15, TypeScript strict, App Router segment architecture.

**Alternatives considered:** Next.js Pages Router, Remix, Astro.

**Why:**

- **ISR** (`next: { revalidate: N }` on fetch calls) is the correct caching primitive for a
  CMS-driven site: pre-rendered HTML is served from cache, regenerated either on TTL expiry
  or on-demand (publish-triggered via `POST /api/revalidate`). ISR does not exist in
  Remix or Astro without custom infra.
- **Server Components** eliminate client JavaScript for content-only pages (homepage,
  product pages, blog posts). Better LCP, smaller First Load JS.
- **App Router segment hierarchy** cleanly separates concerns: `[locale]/layout.tsx`
  injects the public site chrome (header, footer) for all public pages; `admin/**` pages
  use a different layout (admin shell) with no code sharing between the two segments.
- **Edge Middleware** (`middleware.ts`) resolves redirect rules before any rendering.
  Redirect resolution at the edge means no client-visible URL flicker and no wasted
  server rendering for redirected URLs.

**Tradeoff accepted:** App Router's Server vs. Client component boundary adds mental
overhead. Mitigated by making all admin pages Client Components (all state-heavy) and
keeping public pages as Server Components (stateless content display).

---

## Database: PostgreSQL

**Decision:** PostgreSQL 16 (relational).

**Alternatives considered:** MongoDB (document store), DynamoDB + ElastiCache.

**Why relational:**

The data is genuinely relational:
- Pages have an ordered list of content blocks (1:N with `sortOrder`)
- Content types share a base record (`pages` table) via joined-table inheritance
- Locale variants are grouped by a nullable `contentGroupId` — a group of related rows
  with a referential relationship
- Redirect rules require a `UNIQUE` constraint on `sourcePath` — trivial in SQL,
  non-trivial to enforce correctly in a document store

Cross-locale queries ("show me all published pages, both locales, sorted by slug") are a
single indexed query. In a document store these would require a scan or a secondary index
managed by application code.

**Tradeoff accepted:** Schema evolution requires migrations. `ddl-auto: update` for
development; Flyway is the planned migration path for production (not yet added).

---

## Multilingual: Per-row locale variants linked by contentGroupId

**Decision:** Each `(slug, locale)` pair is its own row; related locale variants share a
nullable `contentGroupId` UUID.

**Alternatives considered:** JSON locale map embedded in a single row (`{"tr": {...}, "en": {...}}`),
separate table of translations keyed by a master record ID.

**Why:**

- A row-per-locale lets each locale variant have an independent `PublishStatus`. The Turkish
  version of a product page can be PUBLISHED while the English version is still DRAFT —
  a genuine editorial workflow requirement.
- `contentGroupId` is optional. A page with no translation simply has no group ID. When anıujkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkj
  editor later creates the translation, they can link it by setting the same UUID.
- Locale-prefixed canonical URLs (`/tr/products/kron-pam`, `/en/products/kron-pam`) are
  required for `hreflang` to signal locale equivalents to search engines. These URLs map
  directly to `(slug=kron-pam, locale=TR)` and `(slug=kron-pam, locale=EN)` rows.

**Tradeoff accepted:** A shared text correction (e.g. fixing a company name) requires
editing both locale rows. Mitigated by `contentGroupId` linking making the sibling locale
discoverable in the CMS edit form (`LocaleLinker` component).

---

## Caching: Three layers, all fail-open

**Decision:** Static pre-render → ISR → Redis → PostgreSQL.

**Why each layer:**

| Layer | What it caches | TTL / mechanism |
|---|---|---|
| Static pre-render | Known product pages | Built once at deploy; zero TTFB |
| Next.js ISR | All public page HTML | 30 min (homepage/blog list) to 24 h (contact) |
| Redis (`@Cacheable`) | API response objects | 10 min (lists) to 20 min (detail) |
| PostgreSQL | Source of truth | No query cache |

Redis TTL is deliberately shorter than ISR TTL. When ISR fires a re-fetch, the API
should return data that is at most 10–20 min old, not 30 min–2 h old.

**On-demand revalidation** (`CacheService → POST /api/revalidate`) links the publish
workflow to the ISR layer: publishing calls Redis eviction (synchronous) and Next.js
path revalidation (async, fire-and-forget). If the revalidation call fails, the ISR TTL
is the fallback — never more than 30 minutes for homepage and blog.

**Fail-open everywhere:** Redis unavailability → Spring `@Cacheable` falls through to
PostgreSQL. On-demand revalidation failure → ISR TTL governs. Publishing always succeeds
regardless of cache layer health.

---

## Publishing and Preview

**Decision:** Explicit state machine (`DRAFT → PUBLISHED`, `DRAFT → SCHEDULED → PUBLISHED`),
audit log per transition, preview via per-page UUID token.

**Alternatives considered:** Feature flag ("published" boolean), content versioning/event sourcing.

**Why a state machine:**

A boolean `published` flag cannot represent `SCHEDULED` (published at a future time) without
extra fields and service-layer logic that would need to be understood without a schema
guarantee. An explicit `PublishStatus` enum makes the state readable in a database query and
self-documenting in the API response.

Event sourcing would add an event store and projection infrastructure. The editorial workflow
for a marketing site (low-frequency transitions, no need for temporal queries or rollback
beyond "unpublish") does not justify that complexity.

**Preview tokens:** A `previewToken UUID` column on `Page`. Rotating the token invalidates any
previously shared preview link. The `/api/v1/preview?token=...` endpoint returns the full page
response regardless of `PublishStatus`, allowing editors and clients to review DRAFT and SCHEDULED
content without exposing it publicly.

---

## SEO and GEO

Two distinct concerns, handled at different layers.

**SEO (search engines):**

`SeoMetadata` is an `@Embeddable` type composed into every content entity. It carries
`metaTitle`, `metaDescription`, `canonicalPath`, `robots`, `ogTitle`, `ogDescription`,
and `ogImageKey`. A single `buildMetadata()` function in `lib/seo.ts` maps this to the
Next.js `Metadata` type — no SEO logic is in page files.

`hreflang` alternates are generated dynamically based on the supported locales. The
`x-default` alternate points to the Turkish locale (primary market). The dynamic sitemap
includes `alternateRefs` for each locale variant of each published page.

**GEO (generative / LLM engines):**

Structured data (JSON-LD via `<JsonLd>` component) is placed on pages where the schema is
accurate and non-empty: `Organization` (every page via layout), `SoftwareApplication`
(product pages), `Article` with `datePublished` (blog posts), `FAQPage` (blog posts with FAQ
items), `BreadcrumbList` (all pages with a navigation path), `WebSite` with `SearchAction`
(homepage only).

The key GEO principle: no schema is injected unless the data is real. `faqSchema` is only
added when `post.faq.length > 0`; `SoftwareApplication` only when a product URL is known.
Empty or placeholder schemas confuse LLM training data.

---

## Forms

**Decision:** Bean Validation + honeypot + per-IP rate limiting at the service layer.
Event-driven webhook extension via `ApplicationEventPublisher`.

**Why layered validation:**

| Layer | What it enforces |
|---|---|
| Bean Validation (`@AssertTrue`) | Consent required, `formType` non-null, email format |
| Honeypot (service) | Bot detection: silently succeed without persisting if `website` field is non-blank |
| Rate limit (service) | 5 submissions/IP/hour via Redis counter; throws `FormSubmissionLimitException → 429` |

The honeypot is silent: bots receive a `RECEIVED` response without their submission being
stored. This prevents both bot frustration (which may retry aggressively) and data pollution.

`FormSubmissionCreatedEvent` decouples persistence from downstream notifications. The
`WebhookNotificationService` listens to this event and calls the configured webhook URL
asynchronously. Adding a CRM integration (HubSpot, Salesforce) later requires only a new
`@EventListener` — no change to the form controller or service.

---

## Frontend Reconstruction from Screenshots

**Approach:** derive tokens → identify sections → build components → compose pages.

1. **Design tokens:** Colors, spacing, and type scale were extracted from screenshots and
   expressed as CSS custom properties in `globals.css`. No utility framework; all layout
   uses semantic CSS (`grid`, `flex`, custom properties for spacing).

2. **Section inventory:** Six recurring layout patterns were identified before writing any
   component: `PageHero`, `FeatureRow`, `CardGridSection`, `BlogCard`, `DatasheetGrid`,
   and the `ContactForm`. Each page is a composition of 3–5 of these sections.

3. **Interpretation principle:** When the screenshot was ambiguous (e.g. the exact hover
   state of a product card), the most consistent interpretation across all screenshots was
   chosen and noted in `docs/frontend-decisions.md`.

4. **No page-specific CSS.** Every style class is either a design-token-level utility
   (`.section-pad`, `.container`, `.bg-gray`) or a component-scoped class
   (`.blog-list`, `.article-layout`). Page files contain no `style={{}}` props for layout.
