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
| `auth` | Active | JWT login, BCrypt, default user bootstrap |
| `users` | Active | `UserAccount` entity + repository |
| `pages` | Active | Base `Page` entity, public content service + controller |
| `components` | Active | `ContentBlock` entity (reusable page blocks with FK to Page) |
| `blog` | Active | `BlogPost extends Page`, repository, responses |
| `products` | Active | `Product extends Page`, service + controller |
| `resources` | Active | `ResourceItem extends Page`, service + controller |
| `forms` | Active | `FormSubmission` entity/service/controller + validation |
| `publishing` | Active | Publish action with cache invalidation |
| `media` | Partial | `MediaAsset` entity + `ObjectStorageClient` interface; upload not yet wired |
| `redirects` | Partial | `RedirectRule` entity + repository; no serving middleware yet |
| `audit` | Partial | `AuditLog` entity + repository; recording not yet wired |
| `seo` | Shared type | `SeoMetadata` `@Embeddable` — embedded in `Page`, not a full module |
| `localization` | Shared type | `LocaleCode` enum — used across modules, not a full module |

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

## Runtime boundaries

| Path prefix | Access | Purpose |
|---|---|---|
| `/api/v1/public/**` | Open | Public content reads |
| `/api/v1/forms/submit` | Open | Form ingest |
| `/api/v1/auth/login` | Open | JWT issue |
| `/api/v1/admin/**` | ADMIN or EDITOR | Publishing and admin actions |
| `/swagger-ui`, `/api-docs` | Open | API documentation |

## Why Spring Boot for backend

Spring Boot was selected over NestJS because:
- Mature ecosystem for JPA, security, and validation with little configuration surface
- Straightforward modular monolith support with clear package boundaries
- Progression from scaffold to production hardening is well-understood
