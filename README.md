# Krontech Monorepo

A production-oriented, content-driven website platform built as a modular monolith monorepo. It targets the **Krontech site rebuild** assignment (see `Unicorn Software Solutions Assignment.pdf` in the repository root for the full brief).

## Repository Structure

```text
.
├─ apps/
│  ├─ web/   # Next.js + TypeScript public site + admin CMS
│  └─ api/   # Spring Boot modular monolith REST API
├─ docs/     # Architecture, content model, API, caching, publishing, SEO/GEO decisions
├─ specs/    # Visual reference screenshots
├─ docker-compose.yml   # Full stack: Postgres, Redis, MinIO, API, web
└─ .env.example
```

## Architecture at a glance

```
Browser
  │
  ├─ Next.js Edge Middleware — redirect rules (cached 5 min) → 301/302
  │
  ├─ Next.js public pages  (/tr, /en)
  │      │  ISR cache (30 min – 2 h) + on-demand revalidation on publish
  │      └─ GET /api/v1/public/**  →  Spring Boot  →  Redis (10–20 min)  →  PostgreSQL
  │
  ├─ Next.js admin UI  (/admin/**)
  │      └─ /api/v1/admin/**  ←  JWT (60 min)  →  Spring Boot  →  PostgreSQL
  │
  └─ POST /api/v1/forms/submit  →  Spring Boot  →  PostgreSQL
                                        └─ ApplicationEvent → WebhookNotificationService
```

**Key choices:**
- **Modular monolith** (not microservices) — single deployable, domain-isolated packages, no distributed systems overhead for a B2B marketing site
- **REST** (not GraphQL) — fixed response shapes, ISR-friendly URL caching, per-endpoint rate limiting; rationale in [`docs/decisions.md`](docs/decisions.md)
- **Next.js ISR + on-demand revalidation** — publish in the admin → backend evicts Redis and calls `POST /api/revalidate` → stale HTML is immediately regenerated
- **Locale-per-row** (`slug, locale` unique pair) — TR and EN variants have independent publish states; linked by `contentGroupId`

See [`docs/decisions.md`](docs/decisions.md) for full tradeoff rationale. See [`REVIEW.md`](REVIEW.md) for a reviewer/demo walkthrough.

## Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 15 + TypeScript (strict) |
| Backend | Spring Boot 3 + Java 17 |
| Database | PostgreSQL 16 |
| Cache / rate limiting | Redis 7 |
| Object storage | S3-compatible — MinIO locally, AWS S3 in production |
| Schema migrations | Flyway (`ddl-auto: validate`) |
| Local orchestration | Docker Compose (full stack) |

## Quick start

### Prerequisites

- **Docker** and Docker Compose (for dependencies or full stack)
- For local hot-reload development: **JDK 17**, **Maven**, **Node.js 22+** (matches `apps/web/Dockerfile`)

### 1. Environment

```bash
cp .env.example .env
```

Edit `.env` for secrets (`JWT_SECRET`, `REVALIDATE_SECRET` in production). Defaults match local Compose and local API/Web on the host.

| Variable | Purpose | Typical local value |
|---|---|---|
| `DB_*` | PostgreSQL | `krontech` / `krontech` |
| `REDIS_*` | Redis | `localhost` + `6379` (host dev) |
| `S3_*` | MinIO or AWS | MinIO: `http://localhost:9000`, keys in `.env.example` |
| `JWT_SECRET` | **Change in production** | strong random string |
| `CORS_ALLOWED_ORIGINS` | API CORS | `http://localhost:3000` |
| `WEB_APP_URL` | Backend → Next.js (ISR revalidation) | Host dev: `http://localhost:3000`; see Compose note below |
| `REVALIDATE_SECRET` | Shared secret for `POST /api/revalidate` | Same value in `.env` and `apps/web/.env.local` when developing on the host |

**On-demand ISR:** When `REVALIDATE_SECRET` is set (and matches the web app), publishing invalidates Redis and triggers Next.js revalidation. If unset, ISR TTLs govern staleness (up to 2 h for some routes).

### 2a. Full stack with Docker Compose (recommended for demo / “single command” startup)

Builds and runs **PostgreSQL, Redis, MinIO (with bucket init), the Spring Boot API, and the Next.js web app**.

```bash
docker compose up -d --build
```

- **Site:** `http://localhost:3000` (override with `WEB_PORT`)
- **API:** `http://localhost:8080` (override with `API_PORT`)
- **Swagger UI:** `http://localhost:8080/swagger-ui`
- **MinIO console:** `http://localhost:9001` (credentials from `S3_ACCESS_KEY` / `S3_SECRET_KEY`)

Compose sets `WEB_APP_URL=http://web:3000` and a default `REVALIDATE_SECRET` so publish → revalidation works across containers. Override `REVALIDATE_SECRET` in `.env` for anything beyond local demos.

The web image bakes `NEXT_PUBLIC_API_BASE_URL` for the **browser** (defaults to `http://localhost:8080/api/v1`). If you publish the API on a non-default host port, set `DOCKER_NEXT_PUBLIC_API_BASE_URL` before `docker compose build web` (see comments in `.env.example`). Server-side requests from the web container use `API_INTERNAL_BASE_URL` (default `http://api:8080/api/v1`).

### 2b. Local development (hot reload)

Run only infrastructure in Docker, then API and web on the host:

```bash
docker compose up -d postgres redis minio minio-init
```

**Terminal 1 — API**

```bash
cd apps/api
mvn spring-boot:run
```

**Terminal 2 — Web**

```bash
cd apps/web
npm install
npm run dev
```

Ensure `.env` uses `DB_HOST=localhost`, `REDIS_HOST=localhost`, `S3_ENDPOINT=http://localhost:9000`, and `WEB_APP_URL=http://localhost:3000`. Set `REVALIDATE_SECRET` in both root `.env` and `apps/web/.env.local` if you want revalidation while developing on the host.

## Assignment requirements ↔ implementation

The table below maps the **Unicorn Software Solutions / Krontech** assignment (`Unicorn Software Solutions Assignment.pdf`) to what ships in this repo. Deeper rationale lives in `docs/` and [`REVIEW.md`](REVIEW.md).

| Assignment theme | Expectation (summary) | Where it is implemented |
|---|---|---|
| **Design & CMS** | Preserve visual design; all content manageable | Screenshots under `specs/`; composable blocks and page types — [`docs/content-model.md`](docs/content-model.md), [`docs/frontend-decisions.md`](docs/frontend-decisions.md) |
| **Technology** | Next.js + TypeScript; backend choice justified | This README + [`docs/decisions.md`](docs/decisions.md); Spring Boot modular monolith in `apps/api` |
| **Data & infra** | PostgreSQL, Redis, S3-compatible, Docker Compose | `docker-compose.yml`, [`docs/architecture.md`](docs/architecture.md) |
| **Public pages** | Home, product, blog list/detail, resources, contact/demo form | Locale routes under `apps/web/src/app/[locale]/` (see Public routes below) |
| **Frontend** | SSR/ISR, `/tr` / `/en`, SEO + GEO-oriented output, responsive, a11y, performance | ISR TTLs and middleware — [`docs/caching-strategy.md`](docs/caching-strategy.md), [`docs/seo-geo.md`](docs/seo-geo.md); middleware `apps/web/src/middleware.ts` |
| **Admin** | Pages + blocks, blog & products, media library, SEO fields, publishing | `/admin/**` in `apps/web`; REST under `/api/v1/admin/**` — [`docs/api-overview.md`](docs/api-overview.md) |
| **SEO** | Meta, canonical, robots, OG, sitemap, `hreflang`, redirects | Centralized metadata helpers, `sitemap.xml`, `robots.txt`, redirect admin — [`docs/seo-migration.md`](docs/seo-migration.md) |
| **GEO** | Structured data, semantic HTML, clear content blocks | JSON-LD helpers (`apps/web/src/lib/schema.ts`), block model — [`docs/seo-geo.md`](docs/seo-geo.md) |
| **Cache & performance** | ISR, Redis, invalidation on publish | [`docs/caching-strategy.md`](docs/caching-strategy.md); `CacheService` + `/api/revalidate` |
| **Forms & leads** | Validation, spam protection, consent (KVKK-style), admin visibility, export/webhook | Honeypot + rate limit + consent — [`docs/forms.md`](docs/forms.md); CSV export in admin UI; optional `FORM_WEBHOOK_URL` |
| **Publishing** | Draft / publish / schedule, preview link, audit | [`docs/publishing-flow.md`](docs/publishing-flow.md); preview token; `GET /api/v1/admin/audit` |
| **Auth** | Admin vs editor, JWT | Spring Security + JWT — [`docs/api-overview.md`](docs/api-overview.md); roles reflected in admin UI |
| **API** | REST or GraphQL + docs + rate limiting | REST + OpenAPI/Swagger; global and form-specific limits — [`docs/api-overview.md`](docs/api-overview.md) |
| **Tests** | Unit / integration coverage for critical paths | `cd apps/api && mvn test` — JUnit; frontend verified via `npm run build` |
| **Deliverables** | Runnable repo, README, `.env.example`, meaningful Git history | This file, `.env.example`, Compose |

**AI usage (assignment):** Development leaned on AI-assisted tooling for iteration; architectural choices and tradeoffs are documented in-repo (especially `docs/decisions.md` and `docs/frontend-decisions.md`) rather than treating generated output as final without review.

**Scope notes:** *Form definition* in the brief is met as **fixed form types** (contact, demo request) with server-side validation and admin listing/export — not a generic form-builder UI. *Basic versioning* is addressed through **publish states**, preview tokens, and the **audit log**, not a full revision history per content record.

## Admin CMS

The admin UI lives inside `apps/web` at `/admin/**`.

- **Login:** `http://localhost:3000/admin/login`
- **Dashboard:** `http://localhost:3000/admin`

All write operations are gated by the backend JWT. The client-side route guard is convenience only.

### Admin routes

| Route | Description |
|---|---|
| `/admin/login` | Sign in |
| `/admin` | Dashboard |
| `/admin/pages` | Pages — list, create, edit, manage content blocks |
| `/admin/blog` | Blog posts |
| `/admin/products` | Products |
| `/admin/resources` | Resources (whitepapers, datasheets) |
| `/admin/media` | Media library — upload and manage assets |
| `/admin/forms` | Form submissions (read-only) + CSV export |
| `/admin/redirects` | URL redirect rules — 301/302 management |
| `/admin/users` | User management (ADMIN role only) |

### Preview

In any content edit form, click **Get Preview Link** to rotate the preview token. The generated URL opens at `/preview?token={uuid}` and renders the page regardless of publish status. Tokens are invalidated when rotated.

### Local development — frontend ↔ API

All admin browser requests go from the dev server origin to the API (default `http://localhost:8080`). CORS is configured via `CORS_ALLOWED_ORIGINS` in `.env`.

If you run the frontend on a different port:

```bash
# .env (backend)
CORS_ALLOWED_ORIGINS=http://localhost:3001
```

```bash
# apps/web/.env.local (frontend)
NEXT_PUBLIC_API_BASE_URL=http://localhost:8080/api/v1
```

## Bootstrap credentials

| Role | Email | Password |
|---|---|---|
| Admin | `admin@krontech.local` | `Admin123!` |
| Editor | `editor@krontech.local` | `Editor123!` |

Auto-created on first startup. Change or remove these in production.

## Public routes

| Path | Description |
|---|---|
| `/tr`, `/en` | Locale-prefixed homepage |
| `/[locale]/products/[slug]` | Product detail (pre-rendered at build) |
| `/[locale]/blog` | Blog list (ISR 30 min) |
| `/[locale]/blog/[slug]` | Blog post detail (ISR 2 h) |
| `/[locale]/resources` | Resources and datasheets |
| `/[locale]/contact` | Contact / demo request form |

## Running tests

```bash
# Backend unit + integration tests (JUnit)
cd apps/api && mvn test

# Frontend type check + build validation
cd apps/web && npm run build
```

## Technical documentation

| Doc | Contents |
|---|---|
| `docs/architecture.md` | Module boundaries, deployment model |
| `docs/content-model.md` | Entity relationships, publishing lifecycle |
| `docs/api-overview.md` | All REST endpoints |
| `docs/caching-strategy.md` | ISR TTLs, Redis caches, on-demand revalidation |
| `docs/publishing-flow.md` | Draft → Scheduled → Published transitions |
| `docs/seo-migration.md` | Redirect strategy, canonical URL management |
| `docs/seo-geo.md` | SEO + GEO-oriented content and markup |
| `docs/forms.md` | Forms, validation, anti-spam, export, webhook |
| `docs/decisions.md` | Major technical tradeoffs |
| `docs/frontend-decisions.md` | Component inventory, visual interpretation decisions |
