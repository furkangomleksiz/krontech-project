# Krontech Monorepo

A production-oriented, content-driven website platform built as a modular monolith monorepo.

## Repository Structure

```text
.
├─ apps/
│  ├─ web/   # Next.js + TypeScript public site + admin CMS
│  └─ api/   # Spring Boot modular monolith REST API
├─ docs/     # Architecture, content model, API, caching, publishing, SEO decisions
├─ specs/    # Visual reference screenshots
├─ docker-compose.yml
└─ .env.example
```

## Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 15 + TypeScript (strict) |
| Backend | Spring Boot 3 + Java 17 |
| Database | PostgreSQL 16 |
| Cache / rate limiting | Redis 7 |
| Object storage | S3-compatible — MinIO locally, AWS S3 in production |
| Local orchestration | Docker Compose |

## Quick Start

### 1. Environment

```bash
cp .env.example .env
```

The defaults in `.env.example` work out of the box for local development. Key variables:

| Variable | Purpose | Default |
|---|---|---|
| `DB_*` | PostgreSQL connection | `krontech / krontech` |
| `REDIS_HOST` | Redis host | `localhost` |
| `S3_*` | MinIO connection + bucket | `minio / minio123 / media` |
| `JWT_SECRET` | **Change in production** | placeholder |
| `CORS_ALLOWED_ORIGINS` | API allowed origins | `http://localhost:3000` |
| `WEB_APP_URL` | Backend → Next.js URL (on-demand ISR) | `http://localhost:3000` |
| `REVALIDATE_SECRET` | Shared secret for `/api/revalidate` | _(blank = disabled)_ |

> **On-demand ISR revalidation:** Set `REVALIDATE_SECRET` to the same value in both `.env` (backend) and `apps/web/.env.local`. When set, publishing content immediately invalidates the frontend ISR cache. When blank, ISR TTLs govern staleness (max 2 h).

### 2. Start backing services

```bash
docker compose up -d
```

Starts PostgreSQL, Redis, MinIO, and a one-shot MinIO bucket initialisation container. The frontend and backend run on the host for hot-reload.

### 3. Run the backend

```bash
cd apps/api
mvn spring-boot:run
```

API available at `http://localhost:8080`  
Swagger UI: `http://localhost:8080/swagger-ui`

### 4. Run the frontend

```bash
cd apps/web
npm install
npm run dev
```

Frontend available at `http://localhost:3000`

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
| `/admin/forms` | Form submissions (read-only) |
| `/admin/redirects` | URL redirect rules — 301/302 management |
| `/admin/users` | User management (ADMIN role only) |

### Preview

In any content edit form, click **Get Preview Link** to rotate the preview token. The generated URL opens at `/preview?token={uuid}` and renders the page regardless of publish status. Tokens are invalidated when rotated.

### Local development — frontend ↔ API

All admin browser requests go from `http://localhost:3000` to `http://localhost:8080`. CORS is configured via `CORS_ALLOWED_ORIGINS` in `.env` (default: `http://localhost:3000`). The defaults work out of the box.

If you run the frontend on a different port:

```bash
# .env (backend)
CORS_ALLOWED_ORIGINS=http://localhost:3001
```

```bash
# apps/web/.env.local (frontend)
NEXT_PUBLIC_API_BASE_URL=http://localhost:8080/api/v1
```

## Bootstrap Credentials

| Role | Email | Password |
|---|---|---|
| Admin | `admin@krontech.local` | `Admin123!` |
| Editor | `editor@krontech.local` | `Editor123!` |

Auto-created on first startup. Change or remove these in production.

## Public Routes

| Path | Description |
|---|---|
| `/tr`, `/en` | Locale-prefixed homepage |
| `/[locale]/products/[slug]` | Product detail (pre-rendered at build) |
| `/[locale]/blog` | Blog list (ISR 30 min) |
| `/[locale]/blog/[slug]` | Blog post detail (ISR 2 h) |
| `/[locale]/resources` | Resources and datasheets |
| `/[locale]/contact` | Contact / demo request form |

## Running Tests

```bash
# Backend unit + integration tests
cd apps/api && mvn test

# Frontend type check + build validation
cd apps/web && npm run build
```

## Technical Documentation

| Doc | Contents |
|---|---|
| `docs/architecture.md` | Module boundaries, deployment model |
| `docs/content-model.md` | Entity relationships, publishing lifecycle |
| `docs/api-overview.md` | All REST endpoints |
| `docs/caching-strategy.md` | ISR TTLs, Redis caches, on-demand revalidation |
| `docs/publishing-flow.md` | Draft → Scheduled → Published transitions |
| `docs/seo-migration.md` | Redirect strategy, canonical URL management |
| `docs/frontend-decisions.md` | Component inventory, visual interpretation decisions |
