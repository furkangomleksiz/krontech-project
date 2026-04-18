# Architecture

## Monorepo layout

- `apps/web`: Next.js App Router frontend for public pages
- `apps/api`: Spring Boot modular monolith API
- `docs`: technical decisions and operating notes
- root `docker-compose.yml`: PostgreSQL, Redis, S3-compatible storage (MinIO)

## Backend style: modular monolith

Single deployable Spring Boot app. Each module owns its domain logic and holds:
- `entity` — JPA-mapped domain objects
- `repository` — Spring Data interfaces
- `service` — business logic
- `controller` — REST entry point
- `dto` — request/response contracts

Modules and their current status:

| Module | Status | Description |
|---|---|---|
| `auth` | Active | JWT login, BCrypt, default user bootstrap; `GET /auth/me` |
| `users` | Active | `UserAccount` entity; admin CRUD (list, create, role change, deactivate) |
| `pages` | Active | Base `Page` entity; public + admin CRUD + content block management |
| `components` | Active | `ContentBlock` entity; admin replace-all endpoint |
| `blog` | Active | `BlogPost extends Page`; public + admin CRUD |
| `products` | Active | `Product extends Page`; public + admin CRUD |
| `resources` | Active | `ResourceItem extends Page`; public + admin CRUD |
| `forms` | Active | `FormSubmission` entity/service/controller + validation, rate limit, webhook event |
| `publishing` | Active | Full state machine (DRAFT/SCHEDULED/PUBLISHED); `CacheService` Redis invalidation; `ScheduledPublishingService` auto-promotion; preview token rotation |
| `media` | Active | `MediaAsset` entity + `ObjectStorageClient`; admin metadata CRUD (upload deferred) |
| `redirects` | Partial | `RedirectRule` entity + repository; serving middleware deferred |
| `audit` | Active | `AuditLog` entity + `AuditService` (auto-resolves actor); `GET /admin/audit` (ADMIN only) |
| `seo` | Shared type | `SeoMetadata` `@Embeddable` + `SeoMapper` + `SeoRequest`/`SeoResponse` DTOs |
| `localization` | Shared type | `LocaleCode` enum used across modules |

## JPA inheritance

`Page` uses `JOINED` inheritance strategy. `BlogPost`, `Product`, and `ResourceItem` each map to their own
joined table (`blog_posts`, `products`, `resources`), with FKs back to the `pages` table.

## Frontend style: content-driven composition

- Locale-aware public routing (`/tr`, `/en`)
- Pages fetch a `PublicPageModel` from the API; sections are rendered from the model's `sections[]` array
- Known section types: `feature-grid`, `article-list` — rendered via `CardGridSection`
- API client falls back to mock data when the API is not available (local dev bootstrap)
- SEO metadata pipeline via `lib/seo.ts` utility
- Dynamic `sitemap.xml` and `robots.txt` wired at root

## Admin / CMS UI

The admin interface lives inside `apps/web` at the `/admin/**` route segment.

**Why co-located in `apps/web`, not a separate app:**

- No duplication of `next.config.ts`, `tsconfig.json`, `package.json`, or Docker service configuration
- Next.js App Router naturally isolates admin from the public site: `/admin/**` uses only the root `layout.tsx` (HTML shell + font), not the public `[locale]/layout.tsx` (no site header, footer, or announcement bar)
- The existing API base-URL env var (`NEXT_PUBLIC_API_BASE_URL`) is reused by the admin API client
- A separate `apps/admin` Next.js app would add operational overhead (extra port, extra build step, extra Docker service) with no meaningful isolation benefit at this stage

**Auth strategy:**

JWT stored in `localStorage` after login. `AdminShell` (a client component wrapping all `/admin/**` pages) reads the token on mount and redirects to `/admin/login` if it is absent. The API server enforces JWT validation on all `/admin/**` backend routes regardless of UI behavior — client-side auth is convenience, not the security boundary.

**Admin routes:**

| Route | Description |
|---|---|
| `/admin/login` | Login form; calls `POST /api/v1/auth/login` |
| `/admin` | Dashboard — content counts + quick-action links |
| `/admin/pages` | Page list with locale / status filters |
| `/admin/pages/new` | Create page form |
| `/admin/pages/[id]` | Edit page + publish / schedule / unpublish actions |
| `/admin/blog` | Blog post list |
| `/admin/blog/new` | Create blog post |
| `/admin/blog/[id]` | Edit blog post + publishing actions |
| `/admin/products` | Product list |
| `/admin/products/new` | Create product |
| `/admin/products/[id]` | Edit product + publishing actions |
| `/admin/resources` | Resource list with type filter |
| `/admin/resources/new` | Create resource (file key or external URL) |
| `/admin/resources/[id]` | Edit resource + publishing actions |
| `/admin/media` | Media library (grid + table view) |
| `/admin/media/new` | Register asset metadata (post S3 upload) |
| `/admin/media/[id]` | Edit asset metadata + preview |
| `/admin/forms` | Form submission list + detail modal + status workflow |
| `/admin/users` | User management — ADMIN role only |

**Key components:**

- `src/components/admin/AdminShell.tsx` — auth guard + `AdminAuthContext` provider + layout chrome
- `src/components/admin/AdminSidebar.tsx` — role-aware navigation
- `src/components/admin/AdminTopbar.tsx` — breadcrumb + user info + sign-out
- `src/components/admin/ui.tsx` — `StatusBadge`, `PublishBar`, `ScheduleModal`, `SeoFieldset`, `Pagination`, `EmptyState`, `ErrorBanner`, `LoadingState`
- `src/lib/api/admin.ts` — typed API client covering all admin endpoints

**All admin pages are dynamic (`ƒ`)** — server-renders the client shell on demand; no build-time static generation. Role-conditional rendering (e.g. delete buttons, user management page) is applied client-side after token is read.

## Runtime boundaries

| Path prefix | Access | Purpose |
|---|---|---|
| `/api/v1/public/**` | Open | Public content reads |
| `/api/v1/preview/**` | Open | Token-gated draft preview |
| `/api/v1/forms/**` | Open | Form submission ingest |
| `/api/v1/auth/login` | Open | JWT issue |
| `/api/v1/auth/me` | ADMIN or EDITOR | Current user profile |
| `/api/v1/admin/users/**` | **ADMIN only** | User management |
| `/api/v1/admin/**` (other) | ADMIN or EDITOR | Content management, publishing |
| `/swagger-ui`, `/api-docs` | Open | API documentation |

Role boundaries enforced via `@PreAuthorize` at method level:
- `DELETE` on any content type: ADMIN only
- `GET/POST/PUT/PATCH` on content: ADMIN or EDITOR
- All `/admin/users/**`: ADMIN only
- Form submission list/export: ADMIN only

## Why Spring Boot for backend

Spring Boot was selected over NestJS because:
- Mature ecosystem for JPA, security, and validation with little configuration surface
- Straightforward modular monolith support with clear package boundaries
- Progression from scaffold to production hardening is well-understood
