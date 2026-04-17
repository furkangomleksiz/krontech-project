# Krontech Monorepo Bootstrap

This repository is a first-pass, buildable foundation for a production-oriented, content-driven Krontech.com rebuild.

## Repository Structure

```text
.
├─ apps/
│  ├─ web/   # Next.js + TypeScript frontend
│  └─ api/   # Spring Boot modular monolith backend
├─ docs/     # architecture/content/API/caching/publishing decisions
├─ specs/    # assignment references (screenshots)
├─ docker-compose.yml
└─ .env.example
```

## Stack

- Frontend: Next.js + TypeScript (strict)
- Backend: Spring Boot 3 + Java 17
- Database: PostgreSQL
- Cache / rate-limiting base: Redis
- Object storage abstraction: S3-compatible (MinIO in local)
- Local orchestration: Docker Compose

## Quick Start

1. Copy environment values:
   ```
   cp .env.example .env
   ```
2. Start backing services (Postgres, Redis, MinIO):
   ```
   docker compose up -d
   ```
   The compose file intentionally only starts infrastructure. The frontend and backend run on the host for hot-reload during development.
3. Run the backend:
   ```
   cd apps/api
   mvn spring-boot:run
   ```
   API available at `http://localhost:8080`
4. Run the frontend:
   ```
   cd apps/web
   npm install
   npm run dev
   ```
   Frontend available at `http://localhost:3000`

## Public Routes

- `/tr` and `/en` locale roots
- `/[locale]/products/[slug]`
- `/[locale]/blog`
- `/[locale]/blog/[slug]`
- `/[locale]/resources`
- `/[locale]/contact`

## API and Docs

- API base: `http://localhost:8080/api/v1`
- Swagger UI: `http://localhost:8080/swagger-ui`
- OpenAPI docs: `http://localhost:8080/api-docs`

## Auth Scaffold Users

- Admin: `admin@krontech.local` / `Admin123!`
- Editor: `editor@krontech.local` / `Editor123!`

These users are auto-created at startup for bootstrap only.

## Additional Technical Decisions

See:

- `docs/architecture.md`
- `docs/content-model.md`
- `docs/api-overview.md`
- `docs/caching-strategy.md`
- `docs/publishing-flow.md`
- `docs/frontend-decisions.md`
